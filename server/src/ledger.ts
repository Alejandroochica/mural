import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { transaction, type Database } from './db.js';
import { ServiceError } from './errors.js';
import { RATE_VERSION } from './pricing.js';

type Kind = 'purchase' | 'reversal' | 'reserve' | 'settle' | 'release';
export async function lockWallet(sql: PoolClient, account: string, requireActive = false) {
  // Every account mutation uses this lock order, including deletion and reconciliation.
  const owner = (await sql.query('SELECT deleted_at FROM accounts WHERE id=$1 FOR UPDATE', [account])).rows[0];
  if (!owner || (requireActive && owner.deleted_at)) throw new ServiceError('account_not_found', 404);
  const result = await sql.query('SELECT * FROM wallets WHERE account_id=$1 FOR UPDATE', [account]);
  const wallet = result.rows[0];
  if (!wallet) throw new ServiceError('account_not_found', 404);
  return { balance: BigInt(wallet.balance_nano), reserved: BigInt(wallet.reserved_nano) };
}
// Internal only. There is deliberately no HTTP endpoint that creates journal entries.
export async function appendEntry(sql: PoolClient, account: string, reference: string, kind: Kind,
  balanceDelta: bigint, reservedDelta: bigint, version: string | null = null): Promise<boolean> {
  const wallet = await lockWallet(sql, account);
  const existing = (await sql.query('SELECT * FROM ledger WHERE reference=$1', [reference])).rows[0];
  if (existing) {
    if (existing.account_id !== account || existing.kind !== kind || BigInt(existing.balance_delta_nano) !== balanceDelta ||
        BigInt(existing.reserved_delta_nano) !== reservedDelta || existing.rate_version !== version)
      throw new ServiceError('idempotency_conflict', 409);
    return false;
  }
  if (wallet.reserved + reservedDelta < 0n) throw new ServiceError('invalid_reservation', 409);
  await sql.query(`INSERT INTO ledger(id,account_id,reference,kind,balance_delta_nano,reserved_delta_nano,rate_version)
    VALUES($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(), account, reference, kind, balanceDelta.toString(), reservedDelta.toString(), version]);
  await sql.query('UPDATE wallets SET balance_nano=balance_nano+$2, reserved_nano=reserved_nano+$3 WHERE account_id=$1',
    [account, balanceDelta.toString(), reservedDelta.toString()]);
  return true;
}
export async function reserve(db: Database, account: string, key: string, amount: bigint): Promise<string> {
  if (amount <= 0n || !key || key.length > 128) throw new ServiceError('invalid_reservation');
  return transaction(db, async sql => {
    const wallet = await lockWallet(sql, account, true);
    const previous = (await sql.query('SELECT * FROM reservations WHERE account_id=$1 AND idempotency_key=$2', [account, key])).rows[0];
    if (previous) {
      if (BigInt(previous.reserved_nano) !== amount) throw new ServiceError('idempotency_conflict', 409);
      return previous.id;
    }
    if (wallet.balance - wallet.reserved < amount) throw new ServiceError('insufficient_credit', 402);
    const id = randomUUID();
    await sql.query('INSERT INTO reservations(id,account_id,idempotency_key,reserved_nano,rate_version) VALUES($1,$2,$3,$4,$5)',
      [id, account, key, amount.toString(), RATE_VERSION]);
    await appendEntry(sql, account, `reservation:${id}`, 'reserve', 0n, amount, RATE_VERSION);
    return id;
  });
}
export async function settle(db: Database, id: string, actual: bigint): Promise<void> {
  if (actual < 0n) throw new ServiceError('invalid_usage');
  await transaction(db, async sql => {
    const owner = (await sql.query('SELECT account_id FROM reservations WHERE id=$1', [id])).rows[0];
    if (!owner) throw new ServiceError('reservation_not_found', 404);
    await lockWallet(sql, owner.account_id);
    const hold = (await sql.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (hold.state === 'settled' && BigInt(hold.actual_nano) === actual) return;
    if (hold.state !== 'open') throw new ServiceError('reservation_closed', 409);
    const reserved = BigInt(hold.reserved_nano);
    if (actual > reserved) throw new ServiceError('usage_exceeds_reservation', 409);
    await appendEntry(sql, hold.account_id, `settlement:${id}`, 'settle', -actual, -reserved, hold.rate_version);
    await sql.query("UPDATE reservations SET state='settled',actual_nano=$2 WHERE id=$1", [id, actual.toString()]);
  });
}
export async function release(db: Database, id: string): Promise<void> {
  await transaction(db, async sql => {
    const owner = (await sql.query('SELECT account_id FROM reservations WHERE id=$1', [id])).rows[0];
    if (!owner) throw new ServiceError('reservation_not_found', 404);
    await lockWallet(sql, owner.account_id);
    const hold = (await sql.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (hold.state === 'released') return;
    if (hold.state !== 'open') throw new ServiceError('reservation_closed', 409);
    await appendEntry(sql, hold.account_id, `release:${id}`, 'release', 0n, -BigInt(hold.reserved_nano), hold.rate_version);
    await sql.query("UPDATE reservations SET state='released' WHERE id=$1", [id]);
  });
}
