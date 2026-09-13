# Android release progress

Updated 13 September 2026. This branch integrates the Android contribution from PR #9 and prepares it for Mural's public service. It is not a published Play Store release.

## Verified foundation

- Backend: 98 tests pass against an isolated PostgreSQL database, with no skips. Tests cover guest allowance transfer, duplicate claims, concurrent budget limits, grant previews, interrupted bulk grants, minute reservations, account deletion and the existing account/payment boundaries.
- Android: 68 JVM tests pass; the debug APK builds; Android Lint reports no errors. Seven instrumented tests pass on an ARM64 Pixel 9 emulator running Android 16/API 36. These include native library checks, secure credential storage, onboarding, consent across Activity recreation, settings and test-data isolation.
- Shared behavior: 24 Python tests pass. Generated language content and the cross-platform compatibility checks agree.
- iOS: the integrated baseline passes 73 Swift core tests. The prior iPhone language release's live checks remain documented in [validation](validation.md); those checks were not repeated on an Android phone.

The Mac setup uses Java 17, Gradle 8.11.1, AGP 8.10.1 and Android SDK 36. The emulator needed software graphics after the host graphics path stalled. The successful instrumented run used software graphics; no paid AI requests were made by these tests.

## Implemented changes

Android now uses the warm cream/orange theme and the existing Mural icon, includes all eight language modules, keeps ordinary conversation captions within the main screen, and preserves the pending consent action across rotation. Final assessment scheduling handles immediate callbacks; interrupted local sessions keep a stable recovery time.

The API has an immutable minute journal, configurable welcome offers, grant previews for selected or all registered users, and exact remaining-time transfer from guest to member. Trial verification defaults to unavailable. No public admin endpoint was added. See [minute controls](../docs/conversation-minutes.md).

The repository separates the two apps, API and shared fixtures. After relocation, all 73 Swift tests and 68 Android JVM tests pass, the APK builds, Android Lint has no errors, and the 24 Python checks pass. An API 36 emulator job has been added to GitHub Actions; its hosted run remains unverified until the branch is pushed.

## Required before release

- Complete visual and motion parity, accessibility and Mandarin reading aids on Android.
- Finish native audio threading, headset changes, interruptions and durable assessment recovery.
- Connect Android sign-in, account restoration/deletion and the guest allowance to the existing account service.
- Implement and verify device eligibility, hosted voice cutoff, helper budgets and recovery after server interruption.
- Finish minute packs, Stripe and Google Play fulfillment, refunds and purchase restoration. Agree final prices before activating sales.
- Produce a signed Android App Bundle, review real store screenshots and copy, complete Play declarations and test the internal release.
- Test microphone, speaker and Bluetooth on a physical Android phone. Emulator tests cannot establish real audio quality.
- Add the website's Play Store CTA after a public listing exists.

The public hosted service and paid minute purchases remain disabled. Passing local tests does not establish live payment, provider or Play Store readiness.
