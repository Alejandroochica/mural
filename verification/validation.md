# Build verification

11 September 2026

- iOS simulator build succeeded with Xcode 26.4.1.
- The signed device build succeeded and was installed on the connected iPhone 16 Pro running iOS 26.6.1. The app bundle passed strict code-signature verification.
- After the owner trusted the developer profile, Mural launched successfully on the iPhone at 22:00 CEST.
- 18 learning-policy tests passed: duplicate events and word proposals, late transcript fragments, overlapping speakers, exact transcript concatenation, supported and typed production, English input, evidence provenance, transcript corrections, recall spacing and decay, archive integrity, and source URL validation.
- 3 native UI tests passed on an iPhone 16 Pro simulator running iOS 26.4: greeting and subtitle toggle; secure key settings; theme persistence across Talk and Words.
- The Talk screen was inspected from a simulator capture. The initial clipped toolbar wordmark and crowded footer were corrected.
- WebRTC is pinned to 152.0.0 with the package checksum verified by Swift Package Manager. License notices are bundled in the app.

The owner entered an API key and confirmed live speech playback, but reported that speech through the iPhone was too quiet. Cellular connectivity, pronunciation and teaching quality still need the pilot below.

## Speaker-volume correction

Mural originally set the speaker preference directly on the active audio session. WebRTC then applied its own default configuration when its audio unit started, removing that preference. The fix sets `defaultToSpeaker` in `RTCAudioSessionConfiguration` before creating the connection. This follows [WebRTC's configuration mechanism](https://webrtc.googlesource.com/src/+/refs/heads/main/sdk/objc/components/audio/RTCAudioSession.mm) and [Apple's speaker routing option](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/defaulttospeaker), which preserves connected headset routes.

The fix also balances app-owned audio activation and deactivation. Calling cleanup before the first connection or after an already-closed connection no longer decrements WebRTC's activation count.

- Signed device build passed and the update was installed.
- All 3 native UI regression tests passed.
- An explicit debug-only `--verify-audio` run tests two real Live connections using the device's saved key. It uses an in-memory learning store and writes only connection, route, volume and cleanup results to `Documents/audio-verification.json`. It incurs API usage and is never part of automatic offline tests.
- A real Live session received both speech and transcript. During playback, the output route was `Speaker`, the system volume was 100%, and the speaker preference remained set. Audio was released after closure. The owner confirmed: “Yes, the volume is good now”.
- The first repeat test muted input before the greeting was complete. Its second connection opened and closed correctly but had no caption during the 12-second observation window. The test now keeps input running, as required by [OpenAI's greeting flow](https://developers.openai.com/api/docs/guides/live-conversations#greet-before-the-caller-speaks).
- The corrected test build was installed. Its repeat run could not start because the phone had locked again. The speaker fix is confirmed by the first live playback and the owner's listening check; the corrected two-greeting test remains unverified.

## Personal pilot

Use the phone on cellular, with the Mac disconnected. Confirm:

1. Start requests microphone permission, connects and greets in Norwegian.
2. English replies produce Norwegian speech, with optional meaning subtitles.
3. A meaningful error receives a gentle correction without breaking the exchange.
4. Mute prevents microphone audio reaching the conversation; End releases the connection.
5. A theme persists when opening Words, and saved progress survives relaunch.
6. Current-topic lookup displays sources and declines to invent facts when unavailable.
7. Backgrounding, calls, a network drop and the session time limit close or recover clearly.
8. Speaker and AirPods audio are intelligible and yield promptly to interruption.

Record incorrect corrections, misheard speech, English leakage and unsupported claims. The recall thresholds and model judgments remain provisional until this pilot provides enough evidence to refine them.

## Spanish and language modules

Spanish targets the Spain variety. Language modules now supply the greeting, pronunciation and writing guidance, grammar focus, lemma rules and cultural themes. Shared prompts cover voice, subtitles, teaching, help, typed replies, lookup and sourced topics.

- 28 core tests passed, including version-1 migration, bilingual archive round trips, language-specific vocabulary and challenge levels, hidden cognates, source-language validation, topic-language consistency and Spanish prompt isolation.
- All 4 native UI tests passed. The language-switch test selects Spanish, checks its greeting and themes, opens Spanish Words, and switches back to Norwegian.
- The signed iPhone build passed and was installed over the existing app.
- A protected pre-migration learning payload is retained in Application Support/Mural/before-language-modules.json inside the app container. It contains no API key.
- Both Spanish live checks passed on the iPhone using its saved key. Each received speech and captions through the `Speaker` route at 100% system volume, retained the speaker preference and released audio after closing. Non-content results are in `spanish-live-verification.json`.
- Mural was relaunched normally with the persistent learning store after testing.

The first UI attempt ran a stale simulator test runner. Removing only that generated runner loaded the new tests; a later text assertion was corrected to account for uppercase section labels. The final suite passed with no failures.

## Conversation reset and Meaning

Ended conversations return to the ready screen after 15 seconds, or immediately through **New conversation**. This clears the current dialogue and theme while preserving preferences, saved conversations and learning progress. A transcript opened before the reset retains its content.

Meaning previously required an active session, so tapping it after ending could do nothing. Its label also sat outside the button's hit area. Streaming transcript fragments repeatedly cancelled translation requests, and cancelled requests could overwrite newer UI state. The new translation controller coalesces incoming fragments, validates request generations, retains a usable translation during updates, separates caches by subtitle language and exposes errors with an explicit retry.

- 35 core tests passed. Seven new tests cover continuous speech, coalescing, late cancelled responses, corrected transcripts, passage changes, retry behavior and subtitle-language changes.
- All 7 native UI tests passed. New checks tap the Meaning label after ending, verify immediate reset and retained history, wait for the actual 15-second reset, and keep a transcript open across that reset.
- The signed build succeeded and was installed over the existing iPhone app.
- A live Spanish session verified an English translation while active, immediate cached Meaning after ending, a new French translation requested after ending, automatic reset after 15 seconds, retained session history and released audio. Every check passed. The report is in `meaning-live-verification.json`; it contains no key, transcript or audio.
- The explicit debug invocation `--verify-audio --verify-meaning --verify-language=es` uses an in-memory learning store and the device's saved API key. It incurs API usage and is not run by the offline suite. Mural was reopened normally afterward with its persistent store.

The live test verifies that translations arrive and the controls respond. It does not establish translation accuracy across extended conversations or all supported subtitle languages.

## English, French, onboarding and AI consent

12 September 2026

The English module requests broadly intelligible pronunciation and accepts regional variants in its teaching policy. French targets France and accepts valid Francophone variants. Both modules have six teaching-focus levels, lemma guidance, cultural themes and a spoken fallback for unavailable lookups. Shared prompts now treat English as a possible learning language, and the speech-language check follows the selected target.

The welcome flow has two screens: learning language, then subtitle language. Greetings cycle across the installed languages, with a static alternative when Reduce Motion is enabled. The final screen identifies OpenAI as the processor, explains the audio and text transfer, links the privacy policy and requires **Agree and continue**.

Consent is recorded as a versioned preference. Older archives without a consent version keep their prior language choices and require agreement. Before the next live session, an existing user can agree in one consent sheet or choose **Not now** and continue reading saved material. Word lookup, current-topic search and meaning translation also check consent before making a provider request. New onboarding records the same consent version. The privacy-policy URL is `https://mural.chat/privacy/`; public availability depends on deploying the website.

- **41 core tests passed**, including separate progress across four languages, English as target-language evidence, French accents and elisions, language recovery, and old-archive consent decoding.
- **All 11 native UI tests passed** on the iPhone 16 Pro simulator running iOS 26.4. The suite covers target/subtitle selection, an explicit subtitle choice surviving Back, English and French settings, existing-user consent decline/accept/no-repeat, the Advanced API-key disclosure, and the prior conversation/Meaning regressions.
- The completed UI result is `Test-Mural-2026.09.12_13-37-03-+0200.xcresult`, ending at 13:40 CEST. The two failures in the earlier 13:06 run were accessibility-selector issues: the privacy link's element type and an identifier inherited from the key disclosure. Both were corrected and passed in this full run.
- The welcome screens were captured from native UI tests for visual review. After reducing the subtitle step's decorative header to leave room for the example and consent footer, its targeted onboarding test passed again at 13:45 CEST in `Test-Mural-2026.09.12_13-45-06-+0200.xcresult`. That targeted check also compiled the then-current combined app source; it did not exercise the account flows.
- UI fixtures use in-memory records. Preview starts do not connect to OpenAI. No API key was added, replaced or removed by these tests.

These results cover the language modules, onboarding, consent and existing conversation controls. They do not verify the separate account or billing work. English and French live pronunciation and teaching quality still need listening checks; the earlier Spanish speaker and Meaning results above remain historical evidence for their tested builds.

## Native account foundation

12 September 2026

The source now includes Google sign-in through the system authentication browser with OAuth authorization code and PKCE S256, native Sign in with Apple, a separate Keychain record for Mural sessions, and the server's challenge, exchange, wallet, sign-out and deletion contracts. The Settings destination is hidden unless explicit deployment and provider configuration passes the account gate. The default app remains BYOK and does not offer hosted trial minutes or purchases.

- **48 core tests passed** in the combined source, including seven new account tests. The new checks cover HTTPS configuration and provider capability gates, the RFC 7636 S256 test vector, raw nonce binding, callback origin/state/duplicate-parameter rejection, form encoding, expiry and backend scoping, exact wallet arithmetic and cancelled-operation invalidation.
- The combined iOS Simulator build passed at 13:45 CEST, including the account view and conditional Settings link.
- The unsigned **0.1.0 (1)** Release archive was refreshed successfully at 13:46 CEST with the final onboarding, consent and account source. It includes both privacy manifests and third-party notices. This is a build artifact, not a distribution-signed upload.
- The seven new account source, test and documentation files were scanned for secret-shaped keys, signing material, private local paths and device identifiers; no matches were found. Fixtures use synthetic values. Google's button artwork is the unmodified provider asset with its source and branding notice recorded.

No Google or Apple account was signed in, no provider credentials were configured, and no live Mural account or payment was created during this verification. Keychain persistence, configured provider callbacks and Apple authorization revocation still require device checks against the deployed server. See [managed-account setup](../docs/managed-accounts.md) for configuration and the remaining checks.
