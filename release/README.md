# Release status

**The source is public. Apple distribution and the managed service are pending.** This checklist separates the current BYOK app from future accounts, free minutes and credit purchases. No TestFlight invitation or App Store submission has been completed.

## Completed

- [x] Publish [the iPhone app repository](https://github.com/Chuloo/mural) under MIT. Verified commit `f2f1a78` passed the Swift core and server CI jobs; native iOS build and UI checks are recorded separately below.
- [x] Publish [the separate website repository](https://github.com/Chuloo/mural-website), including the request-access update `f9b1de1`, and make [mural.chat](https://mural.chat/) available over HTTPS.
- [x] Enable the website's email access list with private database storage, consent, duplicate handling, admission limits and retention. A live browser submission and repeat request produced one database row; the synthetic test address was removed afterward. No invitations are sent automatically.
- [x] Verify the privacy, terms and support pages on the custom domain return HTTP 200 without login. Confirm the operator as **Hackmamba Inc., incorporated in the United States**, with support at hi@hackmamba.io.
- [x] Implement Norwegian, Spanish, English and French modules, language/subtitle onboarding, versioned AI consent, local backups and the existing conversation controls.
- [x] Pass 53 core tests and five focused UI checks for the final native update, including new-user onboarding, consent and conversation controls. The earlier 11-test language/onboarding suite is historical coverage. The updated personal build was installed and launched on the iPhone. See [the verification record](../verification/validation.md) for the tested builds and limits.
- [x] Prepare four **1320 × 2868** [App Store screenshots](screenshots/en-US/README.md), app icons, first-party and WebRTC privacy manifests, and third-party notices.
- [x] Prepare [listing and review-note drafts](app-store-metadata.md) and a [BYOK privacy inventory](app-privacy.md). These have not been entered or approved in App Store Connect.
- [x] Compile an unsigned **0.1.0 (1)** iOS Release archive with both privacy manifests and debug symbols. This is a local compilation check; Apple distribution signing, upload validation and review remain pending.

The local archive is `.build/ReleasePrep/Mural-0.1.0-unsigned.xcarchive`, refreshed at 14:44 CEST on September 12 with the permanent Settings links. The simulator build and existing Settings navigation check passed before archiving. Publication scope and exclusions are recorded in [the source audit](source-audit.md).

## Finish the BYOK release

| Remaining item | What is needed |
| --- | --- |
| Apple membership and seller | Activate paid Apple Developer Program membership and confirm the enrolled App Store seller matches the intended entity. The operator is Hackmamba Inc., incorporated in the United States. William Imoh and hi@hackmamba.io are confirmed contacts; the private App Review telephone is still needed. |
| Apple app record and signing | Register the app identifier, create the App Store Connect record and SKU, accept agreements, and produce a distribution-signed archive. Preserve the personal installation’s signing identity until a migration is planned. |
| Review access | Provision working review access so the reviewer can use speech without purchasing OpenAI access. Supply credentials privately; do not bundle or commit a shared key. |
| Final device checks | Test the candidate on an iPhone: microphone denial, offline/failing API requests, interruptions, cellular use, reset, meanings, export/import and deletion. Review pronunciation and corrections for all four languages; earlier Spanish checks do not establish English or French quality. |
| Store declarations | Finalize privacy, age rating, accessibility claims, export compliance, regions and pricing against the uploaded build. Resolve remaining fields in the listing draft. |
| Distribution | Validate and upload through Xcode, verify an internal TestFlight installation, complete external beta review, then enable and check a public invitation. App Store review is a separate submission. |

Language and subtitle selection, followed by AI consent, are active for new installations. Existing users retain their settings. Managed-account signup remains disabled. The app’s onboarding and AI-consent screens link to the privacy policy. Settings includes all three release pages; the disabled account view also links to privacy and terms.

| Page | Canonical URL | Availability |
| --- | --- | --- |
| Privacy | https://mural.chat/privacy/ | Live; HTTPS 200 verified September 12, 2026 |
| Terms | https://mural.chat/terms/ | Live; HTTPS 200 verified September 12, 2026 |
| Support | https://mural.chat/support/ | Live; HTTPS 200 verified September 12, 2026 |

Use [the Apple release checklist](apple-release.md) for the upload sequence and official requirements. Keep final candidate verification distinct from the historical results above.

## Finish before enabling the managed service

These items do not block a correctly disclosed BYOK build. They do block promising free minutes, accounts or purchased credits to users.

- [x] Deploy the gated API foundation, PostgreSQL and HTTPS proxy with separate migration and restricted runtime database roles. Public health, readiness and pricing checks pass. Commercial routes return `503 commercial_features_not_ready`; provider credentials have not been deployed, and account creation, trial, checkout and hosted voice remain unavailable.
- [x] Verify a real Stripe sandbox purchase and full refund with signed webhooks. Credit was added and reversed once despite repeated events. Fixed-USD Checkout was verified against Stripe; 57 backend tests passed with PostgreSQL and no skips. These checks used no real money and do not validate a native purchase flow or enable live payments.
- [x] Configure daily encrypted local database backups and verify one backup by restoring it into a separate temporary database. The first encrypted copy was also retained off the server.
- [ ] Configure recurring encrypted off-server backup storage, verify scheduled recovery and add operational alerts without conversation content. A daily local backup and one off-server copy do not complete this work.
- [ ] Configure Google’s native OAuth client and Apple’s identity credentials/capability. Verify sign-in, secure session restore, expiry, sign-out and Apple authorization revocation on a real device. Complete deletion with unresolved balances/payments and recovery after device loss.
- [ ] Verify the hosted voice adapter against a bounded real provider call, including cutoff, hangup, final usage, network failure and reconciliation. Implement budgets for hosted teaching, subtitles and search.
- [ ] Implement App Attest/DeviceCheck verification, durable trial claims, the ten-minute allowance and a global free-use budget. The current trial attestor rejects requests.
- [ ] Complete StoreKit verification and storefront routing for in-app sales, plus live payment activation, refunds, dispute resolution, taxes and transparent receipts. Stripe sandbox tests alone do not enable App Store purchases.
- [ ] Update privacy, terms, App Privacy answers and review access for the actual account, billing and usage records before activation.

The native account client and server foundation are implemented but disabled. Their offline tests used synthetic identities and provider responses. See [native setup](../docs/managed-accounts.md) and [the server runbook](../server/README.md) for exact configuration and implementation gaps.
