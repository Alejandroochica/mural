import { createApp } from './app.js';
import { connectDatabase } from './db.js';
import { catalogFromEnvironment, SandboxPayments } from './payments.js';
import { pruneAuthenticationRecords } from './auth.js';
import { readFile } from 'node:fs/promises';
import { AppleTokenRevoker } from './apple-revocation.js';
import { HostedVoice } from './hosted-voice.js';
import { OpenAILiveProvider } from './live-provider.js';
import { AccessRequests, accessRequestConfig, pruneAccessRequests } from './access-requests.js';
import { AuthAdmission, accountAdmissionConfig } from './auth-admission.js';

const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) { console.error('DATABASE_URL is required.'); process.exit(1); }
const db = connectDatabase(databaseURL);
let hosted: HostedVoice | undefined;
try {
  const origin = new URL(process.env.PUBLIC_ORIGIN ?? 'http://localhost:8080');
  if (origin.username || origin.password || (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && origin.hostname === 'localhost')))
    throw new Error();
  const key = process.env.STRIPE_TEST_SECRET_KEY, secret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
  const payments = key && secret ? new SandboxPayments(key, secret, catalogFromEnvironment(process.env), origin.origin) : undefined;
  const appleClient = process.env.APPLE_CLIENT_ID, appleTeam = process.env.APPLE_TEAM_ID,
    appleKey = process.env.APPLE_KEY_ID, appleFile = process.env.APPLE_PRIVATE_KEY_PATH;
  const appleRevoker = appleClient && appleTeam && appleKey && appleFile ? new AppleTokenRevoker(db,
    { clientID: appleClient, teamID: appleTeam, keyID: appleKey, privateKeyPEM: await readFile(appleFile, 'utf8') }) : undefined;
  await appleRevoker?.validateConfiguration();
  if (process.env.HOSTED_VOICE_EXPERIMENTAL === 'true') {
    const accounts = new Set((process.env.HOSTED_VOICE_ACCOUNT_ALLOWLIST ?? '').split(',').filter(Boolean));
    if ([...accounts].some(account => !/^[a-f0-9-]{36}$/.test(account))) throw new Error();
    hosted = new HostedVoice(db, new OpenAILiveProvider(process.env.OPENAI_API_KEY ?? ''),
      { accountAllowlist: accounts, lifetimeFundingCapNano: BigInt(process.env.HOSTED_VOICE_LIFETIME_CAP_NANO ?? '0') });
    await hosted.start();
  }
  const accessConfig = accessRequestConfig(process.env);
  const accessRequests = accessConfig ? new AccessRequests(db, accessConfig) : undefined;
  const accountsConfig = accountAdmissionConfig(process.env);
  const accounts = accountsConfig ? { admission: new AuthAdmission(db, accountsConfig) } : undefined;
  if (accounts && !process.env.GOOGLE_CLIENT_ID && !(appleClient && appleRevoker)) throw new Error('No account identity provider configured.');
  await pruneAccessRequests(db);
  await pruneAuthenticationRecords(db);
  const app = createApp({ db, auth: { googleClientID: process.env.GOOGLE_CLIENT_ID, appleClientID: appleClient }, payments, appleRevoker, hosted, accessRequests, accounts });
  const cleanup = setInterval(() => {
    void pruneAuthenticationRecords(db).catch(() => { console.error('Account retention cleanup failed.'); });
    void pruneAccessRequests(db).catch(() => { console.error('Access request retention cleanup failed.'); });
  }, 15 * 60_000);
  cleanup.unref();
  const close = async () => { clearInterval(cleanup); await app.close(); await hosted?.stop(); await db.end(); process.exit(0); };
  process.on('SIGTERM', close); process.on('SIGINT', close);
  await app.listen({ port: Number(process.env.PORT ?? 8080), host: '0.0.0.0' });
  console.info('Mural foundation running. Public hosted voice and live payments remain unavailable.');
} catch {
  console.error('Mural could not start. Check configuration; no secret values are logged.');
  await hosted?.stop(); await db.end(); process.exitCode = 1;
}
