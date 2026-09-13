# Android release progress

Updated 13 September 2026. This branch integrates the Android contribution from PR #9. Mural is not yet published on Google Play; public hosted conversations and minute sales remain disabled.

## Verified work

The latest Android sources pass 205 JVM tests and all 31 isolated emulator UI tests, with no skips or failures. Android Lint reports zero errors, 42 warnings and two hints. The UI tests cover onboarding, consent, settings, concurrent credential storage, account screens, activity recreation, purchases, local learning data and reporting. Spanish purchase controls also passed with the emulator set to 160% text size. Tests use a separate application ID and preserve the personal debug installation and its data.

Settings now follows the iOS grouping, with language and meaning controls, account access, a collapsed Advanced section, conversation length, data actions and support. The purchase sheet uses the same warm background, orb and rounded typography. Its prices come from Google Play and are checked against the server quote; sales are disabled by default. [Design captures](android-design/README.md) include settings at large text sizes and synthetic purchase states. The review prices are fixtures, not launch prices.

Hosted conversations retain their original provider and helper session through completion. Account changes settle known or interrupted hosted sessions before discarding their credentials. Reauthentication can renew only the original account while a conversation remains unresolved. Personal-key assessment recovery stays separate from the shorter hosted assessment window.

Confirmed sign-out and deletion survive activity recreation. Account changes invalidate delayed readiness results, and checkout rechecks the current account, transition state and original activity immediately before opening Play. Encrypted session reads, writes and deletion are serialized across the account, voice and purchase owners.

The complete backend suite passes 238 tests against local PostgreSQL, with no skips. It includes minute purchases and refunds, guest transfer, the approved 15-second conversation minimum, earned teaching budgets, safe pre-provider cancellation, uncertain requests and same-account reauthentication. Real Stripe sandbox checkout and partial/full refunds passed separately. One synthetic OpenAI voice session confirmed server-side closure; this was not an Android microphone test. See [commerce and voice evidence](android-commerce-and-voice.md).

Backend commit `b0fbc88` is deployed with migrations through 014 and restricted database grants. Health, database readiness and Google sign-in capabilities remain available. Public hosted, trial, reporting and minute-sale routes remain gated. The working Android and API secret scans found no credentials. The unsigned bundle inspection also found no matches for its known secret patterns; those scans do not establish that no vulnerability exists.

Shared content remains consistent across the two native apps. The earlier baseline passed 24 Python checks and 73 Swift core tests; the latest unchanged shared-content and Swift CI jobs pass. The launcher artwork is byte-identical to the canonical iOS icon. The Play icon uses the same artwork, converted to the required 512-pixel RGBA format without changing its RGB pixels.

## Packaging and decisions

An unsigned candidate bundle builds with package `chat.mural.android`, version 0.1, minimum API 26 and target API 36. Its manifest disables backups, cleartext traffic and debugging. Native LOAD segments and bundle packaging declare 16 KB alignment, and generated ARM64 splits pass alignment and local test-signature checks. This candidate predates the final account fixes and must be rebuilt. A confirmed 16 KB runtime remains a separate check. Candidate evidence records the source snapshot and artifact hashes under [release evidence](../release/android/evidence/).

The owner selected password-manager custody for the upload-key recovery backup, with a private working copy on this Mac. The working key is created; the password manager and backup import remain unconfirmed. Nothing has been uploaded to Play. Category, support details and several app declarations are saved as drafts; audience, content rating, Data safety, reviewer access and final artwork remain unfinished.

The owner requested an explanation before further funding changes. Per-entitlement funding implementation is paused. The intended behavior is to stop new free grants at the campaign budget while keeping signup, purchases and previously issued minutes usable. Graceful trial exhaustion, funded-provider admission and the replacement of prototype account/voice ceilings are not yet implemented for public use.

## Required before public release

- Complete guest eligibility and guest-to-account transfer in the native flow; verify the intended zero-free-offer experience.
- Finish and review funding controls without changing the approved $25/day and $100 total new-grant commitments. Approve final minute prices, markets and controlled live-payment testing.
- Verify Google sign-in using the Play signing certificate, real Play purchases/refunds/restoration, account deletion and optional AI-report delivery.
- Complete 16 KB runtime and oldest-supported Android checks, then test microphone, speaker, Bluetooth and interruptions on a physical Android phone.
- Back up the upload key, sign the reviewed bundle, finish listing assets/declarations and test the internal Play installation. Resolve pre-launch report findings before a public rollout.
- Add the website’s Play Store link after the listing and installation are public.

The full candidate-specific checklist is in [release gates](../release/android/release-gates.md). Emulator and local provider tests do not certify physical audio quality, live commerce or public release readiness.
