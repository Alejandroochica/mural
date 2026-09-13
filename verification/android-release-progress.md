# Android release progress

Updated 14 September 2026. This branch integrates the Android contribution from PR #9. Mural is not yet published on Google Play; hosted guest conversations are enabled for the preview; paid checkout remains disabled.

## Verified work

The latest Android sources pass 235 JVM tests, with no skips or failures, and Android Lint reports zero errors. The complete isolated emulator suite passed 44 UI tests, including the added purchase disclosure and compact-layout checks. After removing a legacy cap from AI-value offers, all 235 JVM tests and the five purchase-screen checks passed again. The UI tests cover onboarding, consent, settings, concurrent credential storage, account screens, activity recreation, purchases, local learning data and reporting. Spanish purchase controls also passed with the emulator set to 160% text size. Tests use a separate application ID and preserve the personal debug installation and its data.

Settings now follows the iOS grouping, with language and meaning controls, account access, a collapsed Advanced section, conversation length, data actions and support. The purchase sheet uses the same warm background, orb and rounded typography. Its prices come from Google Play and are checked against the server quote; sales are disabled by default. [Design captures](android-design/README.md) include settings at large text sizes and synthetic purchase states. The review prices are fixtures, not launch prices.

Hosted conversations retain their original provider and helper session through completion. Account changes settle known or interrupted hosted sessions before discarding their credentials. Reauthentication can renew only the original account while a conversation remains unresolved. Personal-key assessment recovery stays separate from the shorter hosted assessment window.

Confirmed sign-out and deletion survive activity recreation. Account changes invalidate delayed readiness results, and checkout rechecks the current account, transition state and original activity immediately before opening Play. Encrypted session reads, writes and deletion are serialized across the account, voice and purchase owners.

The complete backend suite passes 292 tests against local PostgreSQL, with no skips. It includes minute purchases and refunds, guest transfer, the approved 15-second conversation minimum, earned teaching budgets, safe pre-provider cancellation, uncertain requests and same-account reauthentication. The actual-AI-value Stripe sandbox checkout, signed event replay, proportional partial/full refunds and encrypted receipts passed separately. Only AI value was credited, and sandbox value remained unavailable to public paid conversations. One synthetic OpenAI voice session confirmed server-side closure; this was not an Android microphone test. See [commerce and voice evidence](android-commerce-and-voice.md).

Backend commit `334ad89` is deployed with migrations through 016 and restricted database grants. Health, database readiness and Google sign-in capabilities pass. Hosted guest voice and teaching are enabled. Reporting and paid checkout remain gated. The latest public-source scan found no credentials. The unsigned bundle inspection also found no matches for its known secret patterns; those scans do not establish that no vulnerability exists.

Shared content remains consistent across the two native apps. The earlier baseline passed 24 Python checks and 73 Swift core tests; the latest unchanged shared-content and Swift CI jobs pass. The launcher artwork is byte-identical to the canonical iOS icon. The Play icon uses the same artwork, converted to the required 512-pixel RGBA format without changing its RGB pixels.

## Packaging and decisions

An unsigned candidate bundle builds with package `chat.mural.android`, version 0.1, minimum API 26 and target API 36. Its manifest disables backups, cleartext traffic and debugging. Native LOAD segments and bundle packaging declare 16 KB alignment, and generated ARM64 splits pass alignment and local test-signature checks. The historical unsigned bundle predates guest onboarding and must be rebuilt for release. A separate signed debug APK was built, installed and used for the live guest test below. The isolated Android 15 ARM64 emulator reported a 16,384-byte page size and passed both native compatibility tests. Its tested libraries match the current debug APK. This confirms native loading and offline offer creation; the final Play-signed bundle still needs its own installation check. Candidate evidence records the source snapshot and artifact hashes under [release evidence](../release/android/evidence/).

The owner requested a Documents-folder backup instead of password-manager setup. The key, password, public certificate and instructions were copied and byte-verified with owner-only file permissions. This is a second copy on the same Mac; no off-device recovery backup is claimed. Nothing has been uploaded to Play. An internal release draft now contains the preview name and release notes. Console now shows 10 of 11 setup tasks complete, including content rating, target audience and Data safety; the current saved answers still need a candidate-specific review. English listing text, including the title “Mural: Language Practice,” is saved as a draft. Six final screenshots and the feature graphic are ready, but the browser file picker has not completed an upload. The owner approved adults 18+ for the first release.

The live free-trial policy is $200 per UTC day and $2,000 total, with $1.50 reserved for each ten-minute grant. That funds 133 full new trials per day and 1,333 in total before accounting for grants already issued. The USD grant policy is the only campaign ceiling; the former signup-count and restricted-test voice ceilings do not govern public funded users. Pausing new grants preserves existing balances.

The approved paid model is exact AI cost, a configurable 15% Mural fee, and separately quoted processing costs/buffer. Database policy and quote calculations are implemented. The owner confirmed that paid minutes are estimates and balances deduct actual provider charges. Verified purchase fulfillment, separate voice/teaching settlement, proportional refunds and Android estimated-minute screens are implemented and locally tested. The new implementation remains undeployed and live payments stay disabled pending fee configuration and channel verification; fixed-minute purchases stay disabled. [Pricing decision and current scope](../services/api/docs/actual-cost-pricing.md).

## Live guest verification

A temporary Android emulator profile completed Spanish (Spain) onboarding, selected English meanings, accepted the adult/AI consent and received a ten-minute allowance without signing in or entering a provider key. Mural produced a Spanish greeting and its English meaning. A synthetic typed reply through the voice screen's fallback produced a Spanish follow-up with gentle teaching.

The server confirmed closure after 125 seconds, charged 125,000 milliseconds, released the reservation and retained 475,000 milliseconds. Android displayed 7.9 minutes available and returned to its idle screen. Recorded voice cost was $0.104166667; teaching costs are separate. The emulator used no host microphone or speaker, so this does not verify acoustic quality or spoken-input recognition. Google guest-to-member transfer has local integration coverage but was not completed in this fresh live profile.

A brief live policy-pause check returned HTTP 200 with the normal unavailable state, created no extra account and preserved existing wallet balances. The welcome policy was restored immediately. This verifies the deployed pause path; concurrent budget exhaustion is covered by PostgreSQL tests.

The installed APK's known-pattern credential scan found no credentials. Source/history scans also passed after reviewing nine false positives: exact SHA-256 file digests in two historical build manifests. The scanner exception is restricted to those exact values and paths; changed values and matches in another file still trigger detection.

## Required before public release

- Complete live Google guest-to-member transfer and verify the preserved allowance after login, token renewal and restart.
- Deploy the tested actual-cost wallet and Android updates with live sales disabled. Verify channel fees, taxes, launch markets and controlled live-payment tests before enabling sales.
- Verify Google sign-in using the Play signing certificate, real Play purchases/refunds/restoration and optional AI-report delivery. Before enabling paid checkout, resolve account deletion after an abandoned Play order: the current conservative billing check retains an unresolved order even when no purchase token was returned.
- Complete oldest-supported Android checks and verify the final signed bundle on 16 KB Android. Test microphone, speaker, Bluetooth and interruptions on a physical Android phone.
- Sign the reviewed bundle, upload final listing assets, review declarations and test the internal Play installation. Resolve pre-launch report findings before a public rollout.
- Add the website’s Play Store link after the listing and installation are public.

The full candidate-specific checklist is in [release gates](../release/android/release-gates.md). Emulator and local provider tests do not certify physical audio quality, live commerce or public release readiness.
