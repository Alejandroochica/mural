# Validation record — September 16, 2026

Review scope: `codex/conversation-reliability` against `codex/conversation-foundation`. The baseline includes the published #57 and #61; neither was merged to main by this task.

| Check | Result |
| --- | --- |
| API TypeScript check | Passed |
| API full suite with PostgreSQL integration | 362 passed, 0 skipped |
| Swift core suite | 93 passed |
| Android unit suite | 334 passed, 0 skipped |
| Android lint and app/test builds | Passed |
| Cross-platform prompt/constants/archive parity | Passed |
| Repository Python checks | 53 passed |
| Full iPhone UI suite | 25 passed |
| Android final focused native UI suite | 8 passed, including retry and authentication recovery |
| Android Spanish UI at 2× text | 4 passed; repeated after final integration |

The final iPhone build passed all four affected-flow UI tests after the Help-versus-assessment race guard. The final Android run passed eight English UI tests and four Spanish tests at 2× text, including the countdown/report-button geometry assertion.

## Coverage

Server tests cover concurrent reference isolation, safe SQLSTATE categories, omitted private bodies/headers/query strings, malformed requests, 404 references, provider rejection without retry, logger failure isolation, and closure requested versus confirmed settlement. Existing ledger, authentication, purchases, voice recovery and helper-budget tests ran against an isolated UTF-8 PostgreSQL database on port 55491. Fake provider HTTP and WebSocket servers were used; no real charges or accounts were created.

Both native cores cover exact 15/30-second thresholds; one check-in; check-in audio not extending the timer; actual answers restarting it; muted/noisy input; bounded assistant output, typing and helper waits; abandoned drafts; early pace adaptation; duplicate/stale/assisted/typed/other-language evidence; Help winning over an assessment in flight; and pronunciation guidance in all eight language modules. Error tests distinguish quota from rate limits and reject unsafe references and provider text.

Native UI checks exercise the existing alerts, reference display, countdown text, actual quiet-session closure, preserved end explanation, typing clearing the warning, retained retry drafts, and existing account/key recovery. Screenshots were inspected at normal and accessibility text sizes. A geometry assertion checks that the Android countdown leaves room for the report control.

The full iPhone suite ran before the final Help-versus-assessment race guard. The core suite and affected-flow UI rerun cover that final source change. Android’s final authentication-recovery follow-up from #57 is included.

## Reproduction

From `services/api`, run `npm run check` and `TEST_DATABASE_URL=<isolated UTF-8 database ending in _test> npm test`. Use the source test runner: running emitted JavaScript directly omits the migration SQL fixtures.

From the repository root:

```sh
swift test --package-path apps/ios
python3 scripts/check_cross_platform.py
python3 -m unittest discover -s scripts/tests
```

Android uses JDK 17 and the installed Android SDK. From `apps/android`, run `./gradlew :app:testDebugUnitTest :app:lintDebug :app:assembleUiTest :app:assembleUiTestAndroidTest`. UI tests run in `chat.mural.android.uitest`, separately from a learner’s app. Focused classes are `ConversationPolicyTest`, `StartupErrorTest` and `TypedReplySheetTest`; #57’s authentication regression is in `CaptionParityTest`.

The iPhone run used Xcode 26.4.1, an isolated iPhone 17 Pro simulator, and `xcodebuild ... ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO test`. The first invocation attempted an x86 simulator app with an ARM-only package output; selecting the native architecture fixed the build. Neither that invocation nor the earlier SQL-fixture setup failure is counted as a passing check.

## Remaining validation

No live provider voice call, physical microphone capture, pronunciation rating, speaker/headphone test or cellular conversation was performed by this task. A connected iPhone was detected but its installed app was not replaced. These checks remain necessary before recommending a merge of the changed audio behavior. Prompt assertions do not prove that a model will use the intended pace or accent consistently.

Kore/Aoede comparison is pending Gemini provider support (#30). The current OpenAI voice remains `marin`. Server logging was tested locally; no production deployment or production-log verification was performed. Docker rotation configuration was reviewed, but a running Docker daemon was unavailable for an end-to-end rotation check.
