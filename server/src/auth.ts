import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { transaction, type Database } from './db.js';
import { ServiceError } from './errors.js';
import { lockWallet } from './ledger.js';

export type Provider = 'google' | 'apple';
export type Identity = { provider: Provider; subject: string; email: string | null };
export type AuthConfig = { googleClientID?: string; appleClientID?: string };
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
export const digest = (text: string) => createHash('sha256').update(text).digest('hex');

export async function verifyIdentity(provider: Provider, token: string, nonceHash: string,
  config: AuthConfig, getKey?: JWTVerifyGetKey): Promise<Identity> {
  const audience = provider === 'google' ? config.googleClientID : config.appleClientID;
  if (!audience) throw new ServiceError('identity_provider_not_configured', 503);
  try {
    const { payload } = await jwtVerify(token, getKey ?? (provider === 'google' ? googleKeys : appleKeys), {
      algorithms: ['RS256'], audience, issuer: provider === 'google' ? ['https://accounts.google.com', 'accounts.google.com'] : 'https://appleid.apple.com',
      maxTokenAge: '10 minutes', clockTolerance: 5, requiredClaims: ['exp', 'iat', 'sub', 'nonce']
    });
    if (typeof payload.nonce !== 'string' || !/^[a-f0-9]{64}$/.test(nonceHash)) throw new Error();
    if (!timingSafeEqual(Buffer.from(digest(payload.nonce)), Buffer.from(nonceHash))) throw new Error();
    if (!payload.sub || payload.sub.length > 255) throw new Error();
    const verified = payload.email_verified === true || payload.email_verified === 'true';
    const email = typeof payload.email === 'string' && verified ? payload.email : null;
    return { provider, subject: payload.sub, email };
  } catch { throw new ServiceError('invalid_identity_token', 401); }
}

export async function createChallenge(db: Database) {
  const id = randomUUID(), nonce = randomBytes(32).toString('hex');
  await db.query("INSERT INTO auth_challenges(id,nonce_hash,expires_at) VALUES($1,$2,now()+interval '5 minutes')", [id, digest(nonce)]);
  return { challengeID: id, nonce, expiresInSeconds: 300 };
}
export async function exchangeIdentity(db: Database, provider: Provider, token: string, challengeID: string, config: AuthConfig,
  verify: typeof verifyIdentity = verifyIdentity) {
  const challenge = (await db.query('SELECT nonce_hash FROM auth_challenges WHERE id=$1 AND expires_at>now() AND used_at IS NULL', [challengeID])).rows[0];
  if (!challenge) throw new ServiceError('invalid_challenge', 401);
  const identity = await verify(provider, token, challenge.nonce_hash, config);
  const bearer = randomBytes(32).toString('base64url');
  return transaction(db, async sql => {
    const claimed = await sql.query('UPDATE auth_challenges SET used_at=now() WHERE id=$1 AND used_at IS NULL AND expires_at>now() RETURNING id', [challengeID]);
    if (!claimed.rowCount) throw new ServiceError('invalid_challenge', 401);
    // Serialize signup for one provider subject; never merge accounts by email.
    await sql.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${identity.provider}:${identity.subject}`]);
    let account = (await sql.query('SELECT account_id FROM identities WHERE provider=$1 AND subject=$2', [identity.provider, identity.subject])).rows[0]?.account_id;
    if (!account) {
      account = randomUUID();
      await sql.query('INSERT INTO accounts(id,email) VALUES($1,$2)', [account, identity.email]);
      await sql.query('INSERT INTO identities(provider,subject,account_id) VALUES($1,$2,$3)', [identity.provider, identity.subject, account]);
      await sql.query('INSERT INTO wallets(account_id) VALUES($1)', [account]);
    }
    await lockWallet(sql, account, true);
    await sql.query("INSERT INTO auth_sessions(id,account_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')", [randomUUID(), account, digest(bearer)]);
    return { accountID: account as string, accessToken: bearer, expiresInSeconds: 86_400 };
  });
}
export async function authenticate(db: Database, authorization?: string): Promise<string> {
  if (!authorization?.startsWith('Bearer ') || authorization.length > 128) throw new ServiceError('sign_in_required', 401);
  const result = await db.query(`SELECT s.account_id FROM auth_sessions s JOIN accounts a ON a.id=s.account_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND a.deleted_at IS NULL`, [digest(authorization.slice(7))]);
  const id = result.rows[0]?.account_id;
  if (!id) throw new ServiceError('sign_in_required', 401);
  return id;
}

export async function pruneAuthenticationRecords(db: Database): Promise<void> {
  await db.query('DELETE FROM auth_challenges WHERE expires_at<now()');
  await db.query('DELETE FROM auth_sessions WHERE expires_at<now() OR revoked_at IS NOT NULL');
}

export interface AppleRevoker { revoke(accountID: string, freshAuthorizationCode: string, lockedAppleSubject?: string): Promise<void> }
export async function deleteAccount(db: Database, account: string, appleRevoker?: AppleRevoker, authorizationCode?: string) {
  await transaction(db, async sql => {
    const wallet = await lockWallet(sql, account, true);
    const pending = (await sql.query("SELECT id FROM checkout_orders WHERE account_id=$1 AND state='created' LIMIT 1", [account])).rowCount;
    // The foundation has no refund/checkout-expiry workflow yet. Do not orphan paid value.
    if (pending || wallet.balance !== 0n || wallet.reserved !== 0n) throw new ServiceError('unresolved_billing', 409);
    const apple = (await sql.query("SELECT subject FROM identities WHERE account_id=$1 AND provider='apple'", [account])).rows[0];
    if (apple) {
      if (!appleRevoker || !authorizationCode) throw new ServiceError('apple_revocation_not_configured', 503);
      await appleRevoker.revoke(account, authorizationCode, apple.subject);
    }
    await sql.query('UPDATE accounts SET email=NULL,deleted_at=now() WHERE id=$1', [account]);
    await sql.query('DELETE FROM identities WHERE account_id=$1', [account]);
    await sql.query('DELETE FROM auth_sessions WHERE account_id=$1', [account]);
    // Keep the opaque account ID only for the financial records retained under the published policy.
  });
}
