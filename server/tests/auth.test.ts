import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { digest, verifyIdentity } from '../src/auth.js';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey); jwk.kid = 'test-key';
const keys = createLocalJWKSet({ keys: [jwk] });
const nonce = 'server-bound-test-nonce';
async function token(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ nonce, email: 'learner@example.test', email_verified: true, ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setSubject('subject-123')
    .setAudience('mural-test-client').setIssuer('https://accounts.google.com')
    .setIssuedAt().setExpirationTime('5m').sign(privateKey);
}
test('Google ID token signature, audience, issuer and nonce are verified', async () => {
  const identity = await verifyIdentity('google', await token(), digest(nonce), { googleClientID: 'mural-test-client' }, keys);
  assert.deepEqual(identity, { provider: 'google', subject: 'subject-123', email: 'learner@example.test' });
});
test('signed tokens for another client or nonce are rejected', async () => {
  const value = await token();
  await assert.rejects(verifyIdentity('google', value, digest('other-nonce'), { googleClientID: 'mural-test-client' }, keys));
  await assert.rejects(verifyIdentity('google', value, digest(nonce), { googleClientID: 'another-client' }, keys));
});
test('missing nonce and untrusted signatures are rejected', async () => {
  await assert.rejects(verifyIdentity('google', await token({ nonce: null }), digest(nonce), { googleClientID: 'mural-test-client' }, keys));
  const value = await token();
  const other = await generateKeyPair('RS256');
  const otherJWK = await exportJWK(other.publicKey); otherJWK.kid = 'test-key';
  await assert.rejects(verifyIdentity('google', value, digest(nonce), { googleClientID: 'mural-test-client' }, createLocalJWKSet({ keys: [otherJWK] })));
});
test('Apple issuer is separate and email can use a private relay address', async () => {
  const value = await new SignJWT({ nonce, email: 'private@privaterelay.appleid.com', email_verified: 'true' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setSubject('apple-subject')
    .setAudience('mural-test-client').setIssuer('https://appleid.apple.com').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  const identity = await verifyIdentity('apple', value, digest(nonce), { appleClientID: 'mural-test-client' }, keys);
  assert.equal(identity.email, 'private@privaterelay.appleid.com');
  await assert.rejects(verifyIdentity('google', value, digest(nonce), { googleClientID: 'mural-test-client' }, keys));
});
test('unverified email is not persisted as verified identity data', async () => {
  const identity = await verifyIdentity('google', await token({ email_verified: false }), digest(nonce), { googleClientID: 'mural-test-client' }, keys);
  assert.equal(identity.email, null);
});
test('expired and stale identity tokens are rejected', async () => {
  const value = await new SignJWT({ nonce }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setSubject('expired').setAudience('mural-test-client').setIssuer('https://accounts.google.com')
    .setIssuedAt(1).setExpirationTime(2).sign(privateKey);
  await assert.rejects(verifyIdentity('google', value, digest(nonce), { googleClientID: 'mural-test-client' }, keys));
});
