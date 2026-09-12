import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { transaction, type Database } from './db.js';
import { appendEntry, lockWallet } from './ledger.js';
import { ServiceError } from './errors.js';
import { VoiceMeter } from './meter.js';
import { cost, RATE_VERSION, TRIAL_MS } from './pricing.js';
import { supportsLanguage, type LiveProvider, type Sideband, type VoiceUsage } from './live-provider.js';

const voiceCost = (milliseconds: number) => cost({ milliseconds, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, searchCalls: 0 }).voice;
const HOLD = voiceCost(TRIAL_MS);
const unresolved = "state<>'closed'";
interface Slot { providerID: string; connection?: Sideband; queue: Promise<void>; pending: number; lastHangup: number }
export interface HostedConfig {
  /** An explicit operator allowlist prevents sandbox purchases from funding public voice. */
  accountAllowlist: ReadonlySet<string>;
  lifetimeFundingCapNano: bigint;
  now?: () => number;
  closeGraceMilliseconds?: number;
}

/** Experimental, voice-only controller. No client-supplied usage or delegated Responses charges. */
export class HostedVoice {
  private leader?: PoolClient;
  private accepting = false;
  private timer?: NodeJS.Timeout;
  private ticking = false;
  private readonly slots = new Map<string, Slot>();
  private readonly now: () => number;
  private readonly grace: number;
  constructor(private readonly db: Database, private readonly provider: LiveProvider, private readonly config: HostedConfig) {
    if (config.lifetimeFundingCapNano < HOLD || config.lifetimeFundingCapNano > 25_000_000_000n || !config.accountAllowlist.size)
      throw new ServiceError('invalid_hosted_funding_configuration', 503);
    this.now = config.now ?? Date.now; this.grace = config.closeGraceMilliseconds ?? 5_000;
  }
  get available() { return this.accepting; }
  async start(): Promise<void> {
    if (this.leader) throw new ServiceError('voice_worker_already_started', 503);
    const leader = await this.db.connect();
    try {
      const lock = await leader.query("SELECT pg_try_advisory_lock(hashtext('mural-hosted-voice-worker')) AS acquired");
      if (!lock.rows[0].acquired) throw new ServiceError('voice_worker_already_running', 503);
      this.leader = leader;
      leader.on('error', () => { this.accepting = false; void this.emergencyClose(); });
      // Recovery prioritizes stopping billed sessions; it never opens a replacement session automatically.
      const rows = (await this.db.query(`SELECT * FROM hosted_sessions WHERE ${unresolved}`)).rows;
      for (const row of rows) {
        if (!row.provider_session_id) {
          await this.db.query("UPDATE hosted_sessions SET state='incomplete',close_reason='create_uncertain' WHERE id=$1", [row.id]);
          continue;
        }
        try { await this.attach(row.id, row.provider_session_id); } catch { /* The watchdog retries. */ }
        await this.requestClose(row.id, 'worker_recovery');
      }
      this.accepting = true;
      this.timer = setInterval(() => { void this.tick().catch(() => { this.accepting = false; void this.emergencyClose(); }); }, 1_000);
      this.timer.unref();
    } catch (error) {
      if (this.leader) { await leader.query("SELECT pg_advisory_unlock(hashtext('mural-hosted-voice-worker'))").catch(() => {}); this.leader = undefined; }
      leader.release(); throw error;
    }
  }
  async create(account: string, key: string, sdp: string, language: string) {
    if (!this.accepting || !this.config.accountAllowlist.has(account)) throw new ServiceError('hosted_voice_not_ready', 503);
    if (!key || key.length < 8 || key.length > 128 || !supportsLanguage(language) || !sdp.startsWith('v=0') || Buffer.byteLength(sdp) > 65_536)
      throw new ServiceError('invalid_live_offer');
    const id = randomUUID(), reservation = randomUUID(), deadline = new Date(this.now() + TRIAL_MS);
    await transaction(this.db, async sql => {
      await sql.query("SELECT pg_advisory_xact_lock(hashtext('mural-hosted-funding-cap'))");
      const wallet = await lockWallet(sql, account, true);
      const previous = (await sql.query('SELECT id FROM hosted_sessions WHERE account_id=$1 AND idempotency_key=$2', [account, key])).rows[0];
      // SDP is not persisted. Retrying an offer never starts a second billed call.
      if (previous) throw new ServiceError('live_request_already_created', 409);
      if ((await sql.query(`SELECT id FROM hosted_sessions WHERE account_id=$1 AND ${unresolved}`, [account])).rowCount)
        throw new ServiceError('live_session_unresolved', 409);
      if ((await sql.query("SELECT id FROM hosted_sessions WHERE state='incomplete' LIMIT 1")).rowCount)
        throw new ServiceError('provider_reconciliation_required', 503);
      const exposure = BigInt((await sql.query('SELECT COALESCE(sum(funding_exposure_nano),0) AS total FROM hosted_sessions')).rows[0].total);
      if (exposure + HOLD > this.config.lifetimeFundingCapNano) throw new ServiceError('hosted_funding_cap_reached', 503);
      if (wallet.balance - wallet.reserved < HOLD) throw new ServiceError('insufficient_credit', 402);
      await sql.query('INSERT INTO reservations(id,account_id,idempotency_key,reserved_nano,rate_version) VALUES($1,$2,$3,$4,$5)',
        [reservation, account, `hosted:${key}`, HOLD.toString(), RATE_VERSION]);
      await appendEntry(sql, account, `reservation:${reservation}`, 'reserve', 0n, HOLD, RATE_VERSION);
      await sql.query(`INSERT INTO hosted_sessions(id,account_id,idempotency_key,reservation_id,rate_version,state,deadline,funding_exposure_nano)
        VALUES($1,$2,$3,$4,$5,'creating',$6,$7)`, [id, account, key, reservation, RATE_VERSION, deadline, HOLD.toString()]);
    });
    let created: { sessionID: string; sdp: string } | undefined;
    try {
      created = await this.provider.create(sdp, language);
      await this.db.query("UPDATE hosted_sessions SET provider_session_id=$2,state='active' WHERE id=$1", [id, created.sessionID]);
      await this.attach(id, created.sessionID);
      const row = (await this.db.query('SELECT state FROM hosted_sessions WHERE id=$1', [id])).rows[0];
      if (row.state !== 'active' || !this.accepting) throw new ServiceError('provider_connection_lost', 502);
      return { sessionID: id, providerSessionID: created.sessionID, sdp: created.sdp,
        deadline: deadline.toISOString(), reservedNanoUSD: HOLD.toString(), rateVersion: RATE_VERSION, experimental: true };
    } catch {
      if (created) await this.provider.hangup(created.sessionID).catch(() => {});
      await this.db.query(`UPDATE hosted_sessions SET state='incomplete',close_reason='create_or_attach_uncertain'
        WHERE id=$1 AND state<>'closed'`, [id]).catch(() => {});
      // Never guess a final bill or release this hold before a trusted final event/reconciliation.
      throw new ServiceError('provider_session_unconfirmed', 502);
    }
  }
  private async attach(id: string, providerID: string) {
    if (this.slots.has(id)) return;
    const slot: Slot = { providerID, queue: Promise.resolve(), pending: 0, lastHangup: 0 };
    this.slots.set(id, slot);
    try {
      slot.connection = await this.provider.attach(providerID, event => {
        if (++slot.pending > 100) { void this.connectionLost(id); return; }
        slot.queue = slot.queue.then(() => this.recordUsage(id, providerID, event))
          .catch(() => this.connectionLost(id)).finally(() => { slot.pending--; });
      }, () => { void this.connectionLost(id); });
      await slot.queue;
      if (!this.slots.has(id)) slot.connection.disconnect();
    } catch { this.slots.delete(id); throw new ServiceError('provider_attach_failed', 502); }
  }
  private async recordUsage(id: string, providerID: string, event: VoiceUsage) {
    const state = await transaction(this.db, async sql => {
      const owner = (await sql.query('SELECT account_id FROM hosted_sessions WHERE id=$1', [id])).rows[0];
      if (!owner) throw new ServiceError('unknown_hosted_session');
      await lockWallet(sql, owner.account_id);
      const row = (await sql.query('SELECT * FROM hosted_sessions WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (row.provider_session_id !== providerID || row.rate_version !== RATE_VERSION) throw new ServiceError('provider_session_mismatch');
      const meter = new VoiceMeter(providerID);
      meter.milliseconds = Number(row.observed_ms); meter.finalized = row.state === 'closed';
      meter.receive(providerID, event);
      if (row.state === 'closed') return { finalized: true, close: false };
      await sql.query('UPDATE hosted_sessions SET observed_ms=$2,funding_exposure_nano=GREATEST(funding_exposure_nano,$3) WHERE id=$1',
        [id, meter.milliseconds, voiceCost(meter.milliseconds).toString()]);
      if (meter.finalized) {
        // WebRTC creation has a 15-second minimum; it is credited against active duration.
        const providerCost = voiceCost(Math.max(15_000, meter.milliseconds));
        const hold = (await sql.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [row.reservation_id])).rows[0];
        if (hold.state !== 'open') throw new ServiceError('reservation_closed', 409);
        const maximum = BigInt(hold.reserved_nano), charged = providerCost > maximum ? maximum : providerCost;
        await appendEntry(sql, row.account_id, `settlement:${hold.id}`, 'settle', -charged, -maximum, row.rate_version);
        await sql.query("UPDATE reservations SET state='settled',actual_nano=$2 WHERE id=$1", [hold.id, charged.toString()]);
        await sql.query(`UPDATE hosted_sessions SET state='closed',provider_cost_nano=$2,charged_nano=$3,funding_exposure_nano=$2 WHERE id=$1`,
          [id, providerCost.toString(), charged.toString()]);
      }
      return { finalized: meter.finalized, close: meter.closeRequested };
    });
    if (state.finalized) { this.slots.get(id)?.connection?.disconnect(); this.slots.delete(id); }
    else if (state.close) await this.requestClose(id, 'usage_limit');
  }
  private async connectionLost(id: string) {
    const slot = this.slots.get(id); slot?.connection?.disconnect(); this.slots.delete(id);
    await this.db.query(`UPDATE hosted_sessions SET state='incomplete',close_requested_at=COALESCE(close_requested_at,$2),close_reason='sideband_lost'
      WHERE id=$1 AND state<>'closed'`, [id, new Date(this.now())]).catch(() => { this.accepting = false; });
    const row = (await this.db.query('SELECT provider_session_id,state FROM hosted_sessions WHERE id=$1', [id]).catch(() => ({ rows: [] }))).rows[0];
    if (row?.provider_session_id && row.state !== 'closed') await this.provider.hangup(row.provider_session_id).catch(() => {});
  }
  async requestClose(id: string, reason: 'user_requested' | 'worker_recovery' | 'usage_limit' | 'deadline' | 'funding_reversed' | 'worker_shutdown') {
    await this.db.query(`UPDATE hosted_sessions SET state=CASE WHEN state='incomplete' THEN state ELSE 'closing' END,
      close_requested_at=COALESCE(close_requested_at,$2),close_reason=COALESCE(close_reason,$3) WHERE id=$1 AND state<>'closed'`, [id, new Date(this.now()), reason]);
    try { this.slots.get(id)?.connection?.closeSession(); } catch { await this.connectionLost(id); }
  }
  async status(account: string, id: string) {
    const row = (await this.db.query('SELECT id,state,deadline,observed_ms,charged_nano,provider_cost_nano FROM hosted_sessions WHERE id=$1 AND account_id=$2', [id, account])).rows[0];
    if (!row) throw new ServiceError('live_session_not_found', 404);
    return { sessionID: row.id, state: row.state, deadline: row.deadline, observedMilliseconds: Number(row.observed_ms),
      chargedNanoUSD: row.charged_nano, providerCostNanoUSD: row.provider_cost_nano };
  }
  async close(account: string, id: string) { await this.status(account, id); await this.requestClose(id, 'user_requested'); return this.status(account, id); }
  async tick(): Promise<void> {
    if (this.ticking || !this.leader) return; this.ticking = true;
    try {
      await this.leader.query('SELECT 1');
      const rows = (await this.db.query(`SELECT h.*,w.balance_nano,w.reserved_nano FROM hosted_sessions h
        JOIN wallets w ON w.account_id=h.account_id WHERE h.state<>'closed'`)).rows;
      for (const row of rows) {
        if (!row.provider_session_id) continue;
        if (row.state === 'incomplete' && !this.slots.has(row.id)) {
          try { await this.attach(row.id, row.provider_session_id); } catch { /* Keep the hold and retry closure. */ }
        }
        if (BigInt(row.balance_nano) < BigInt(row.reserved_nano)) await this.requestClose(row.id, 'funding_reversed');
        else if (this.now() >= new Date(row.deadline).getTime()) await this.requestClose(row.id, 'deadline');
        if (row.close_requested_at && this.now() - new Date(row.close_requested_at).getTime() >= this.grace) {
          const slot = this.slots.get(row.id);
          if (!slot || this.now() - slot.lastHangup >= this.grace) {
            if (slot) slot.lastHangup = this.now();
            await this.provider.hangup(row.provider_session_id).catch(() => {});
          }
          // An HTTP 2xx hangup is not a final usage event. Keep the reservation unresolved.
          await this.db.query("UPDATE hosted_sessions SET state='incomplete' WHERE id=$1 AND state<>'closed'", [row.id]);
        }
      }
    } finally { this.ticking = false; }
  }
  private async emergencyClose() {
    for (const slot of this.slots.values()) { try { slot.connection?.closeSession(); } catch { /* Try the HTTP control below. */ } }
    // These IDs remain available even when PostgreSQL is unreachable.
    await Promise.allSettled([...this.slots.values()].map(slot => this.provider.hangup(slot.providerID)));
    const rows = (await this.db.query(`SELECT provider_session_id FROM hosted_sessions WHERE ${unresolved}`).catch(() => ({ rows: [] }))).rows;
    await Promise.allSettled(rows.filter(row => row.provider_session_id).map(row => this.provider.hangup(row.provider_session_id)));
  }
  /** Stops accepting first, requests closure, and leaves unfinished records recoverable. */
  async stop(): Promise<void> {
    this.accepting = false; if (this.timer) clearInterval(this.timer);
    await this.emergencyClose();
    await Promise.all([...this.slots.values()].map(slot => slot.queue));
    for (const slot of this.slots.values()) slot.connection?.disconnect();
    this.slots.clear();
    if (this.leader) {
      await this.leader.query("SELECT pg_advisory_unlock(hashtext('mural-hosted-voice-worker'))").catch(() => {});
      this.leader.release(); this.leader = undefined;
    }
  }
}
