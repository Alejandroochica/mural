# Combined validation — September 16, 2026

The combined source includes #41/#48/#49/#57/#61, the main-branch #50/#53/#54 fixes, and #62 with #32 excluded.

| Check | Result |
| --- | --- |
| Server suite with isolated PostgreSQL | 362 passed; none skipped |
| TypeScript check | Passed |
| Swift core | 98 passed |
| Android unit | 338 passed; none skipped |
| Android lint and app/test builds | Passed |
| Android native UI suite | 71 passed; none skipped |
| Repository Python checks | 53 passed |
| Cross-platform parity and Android content export | Passed |
| Live iPhone audio | Two calls passed: captions, speaker output, closure and audio release |
| iPhone UI | Final rerun pending after correcting the status accessibility trait |
| Release candidate packaging and update | Pending final artifact |

Server tests use an isolated UTF-8 PostgreSQL database and fake provider transports. They cover sanitized diagnostics, reference isolation, logging failures, provider rejection, closure and settlement alongside existing account, purchase and recovery tests. No production deployment was performed.

Core tests cover quiet-session boundaries, one check-in, bounded speech/typing/helper grace, temporary delivery adaptation, stale/duplicate/assisted evidence, Help during pending assessment, caption joining and learning evidence, complete translations, and safe error categories.

The full Android UI run includes retained typed drafts and retry without duplicate transcript rows, authentication recovery, long multilingual captions, oversized hosted-caption guidance with no dispatch/retry, recovery on the next reply, countdown/report geometry, navigation and existing account flows. Offline HTTP fixtures are used.

The iPhone's two live Spanish calls used the existing key and an in-memory learning store. The owner explicitly approved microphone audio being sent to OpenAI. Both returned captions and measurable output through the built-in speaker, retained the speaker preference, closed and released the audio session. The report contains no transcript, recorded audio or key. Bluetooth, cellular handoff and pronunciation quality were not measured. The simulator transport test drives real WebRTC delegate callbacks through disconnect, reconnect, close, teardown, stale callbacks and subsequent peers without making network calls.

## Reproduction

- `swift test --package-path apps/ios`
- `python3 scripts/check_cross_platform.py`
- `python3 scripts/export_android_content.py --check`
- `python3 -m unittest discover -s scripts/tests`
- In `services/api`: `npm run check` and `TEST_DATABASE_URL=<isolated UTF-8 test database> npm test`
- In `apps/android`, with JDK 17 and the Android SDK: `./gradlew :app:testDebugUnitTest :app:lintDebug :app:connectedUiTestAndroidTest`
- iPhone simulator: `xcodebuild ... ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO test`

The initial combined iPhone run exposed a lost static-text accessibility trait in the revised countdown container. It was corrected before the final rerun; the failed run is not reported as passing. Android's first build exposed a duplicate style import, also fixed before the passing build and UI run.
