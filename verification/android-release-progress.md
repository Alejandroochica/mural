# Android release progress

Updated 13 September 2026. This branch integrates the Android contribution from PR #9 and prepares it for Mural's public service. It is not a published Play Store release.

## Verified foundation

- Backend: 105 tests pass against an isolated PostgreSQL database, with no skips. Tests cover guest allowance transfer, duplicate claims, concurrent minute and dollar budget limits, UTC budget rollover, grant previews, interrupted bulk grants, minute reservations, account deletion and the existing account/payment boundaries.
- Android: 84 JVM tests pass; the debug APK builds; Android Lint reports no errors. Twelve instrumented tests pass together on an ARM64 Pixel 9 emulator running Android 16/API 36. These include native library checks, secure credential storage, onboarding, consent across Activity recreation, settings, account sessions, reply entry, dropdowns, floating navigation and test-data isolation. A thirteenth test, run separately, completes both onboarding steps at twice the normal text size.
- Shared behavior: 24 Python tests pass. Generated language content and the cross-platform compatibility checks agree.
- iOS: the integrated baseline passes 73 Swift core tests. The prior iPhone language release's live checks remain documented in [validation](validation.md); those checks were not repeated on an Android phone.

The Mac setup uses Java 17, Gradle 8.11.1, AGP 8.10.1 and Android SDK 36. The emulator needed software graphics after the host graphics path stalled. The successful instrumented run used software graphics; no paid AI requests were made by these tests.

## Implemented changes

Android now uses rounded Nunito typography, original vector icons, a softly shaded animated orb, floating three-tab navigation and a top-right Settings sheet. Both onboarding steps use dropdowns over a gently moving warm background. Theme cards use an adaptive grid; text inputs share rounded surfaces. It retains the existing Mural icon, includes all eight language modules, keeps ordinary conversation captions within the main screen, and preserves the pending consent action across rotation. Final assessment scheduling handles immediate callbacks; interrupted local sessions keep a stable recovery time.

[Five emulator screenshots](android-design/README.md) document the visual rebuild. The updated debug app is installed on the emulator, and separate live captures confirm that the orb changes shape and shading. The static review captures disable continuous motion; they do not establish frame-rate performance or physical-device audio quality.

The API has an immutable minute journal, configurable welcome offers, grant previews for selected or all registered users, and exact remaining-time transfer from guest to member. Trial verification defaults to unavailable. No public admin endpoint was added. See [minute controls](../docs/conversation-minutes.md).

The repository separates the two apps, API and shared fixtures. After relocation, all 73 Swift tests and 68 Android JVM tests pass, the APK builds, Android Lint has no errors, and the 24 Python checks pass. An API 36 emulator job has been added to GitHub Actions; its hosted run remains unverified until the branch is pushed.

## Required before release

- Complete visual and motion parity, accessibility and Mandarin reading aids on Android.
- Finish native audio threading, headset changes, interruptions and durable assessment recovery.
- Complete live Android Google verification and deploy the reviewed account update; wire verified guest eligibility and transfer into the native flow. Native account restoration, sign-out, deletion and exact-minute display now have offline tests. Apple web sign-in remains pending.
- Implement and verify device eligibility, hosted voice cutoff, helper budgets and recovery after server interruption.
- Finish minute packs, Stripe and Google Play fulfillment, refunds and purchase restoration. Agree final prices before activating sales.
- Produce a signed Android App Bundle, review real store screenshots and copy, complete Play declarations and test the internal release.
- Test microphone, speaker and Bluetooth on a physical Android phone. Emulator tests cannot establish real audio quality.
- Add the website's Play Store CTA after a public listing exists.

The public hosted service and paid minute purchases remain disabled. Passing local tests does not establish live payment, provider or Play Store readiness.
