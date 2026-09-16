# Conversation reliability review

This change addresses issues #29, #35, #36, #37 and #38, plus the persona/accent instructions in #32. It is a draft for review. Live listening and device checks remain outstanding.

## Review scope and coordination

The review baseline is `codex/conversation-foundation`: current main plus the other task’s published #57 (`b9defbc`) and #61 (`698cf7d`). The local review compares against that baseline so its diff contains only this task’s work. William approved publishing the review branches and draft PR; merge and deployment are not authorized. Those two PRs still need their own approval. After they merge, retarget this draft to main and verify the resulting diff and checks before considering a merge.

The other task owns #41/#48, #49, #57 and #61. Its already merged #56/#58/#59 are included from main. The 30-second cutoff and accent direction build on Boris’s #43 and #44; his contribution is credited in the implementation commit. No PR or issue was closed by this task.

## Every new UI and UX change

| Area | Before | New behavior |
| --- | --- | --- |
| Quiet voice sessions | Closed after about 120 seconds without transcript activity. | One gentle check-in after 15 seconds of silence; closure at 30 seconds. The check-in’s own audio and transcript cannot restart that clock. |
| Countdown | The usual listening/speaking status remained visible until closure. | The existing status line shows “Ending in 5s · reply to continue”, counting down through the final five seconds. Android has a Spanish translation. This can wrap at large text sizes. |
| Typing and delayed responses | Activity depended on transcripts. | Opening/editing a typed reply clears the warning. Active editing gets up to 60 seconds from the first edit; edits must remain recent. A pending typed response or delegated answer gets up to 45 seconds from when waiting starts. Sending a reply or asking for help restarts the quiet window. |
| Speech arriving before captions | Audio levels did not protect against idle closure. | Recent microphone activity can extend the quiet deadline by up to 15 seconds while waiting for transcripts. Muted microphone activity does not count. Repeated noise cannot extend the deadline indefinitely. |
| Assistant output | Late output could keep extending transcript activity. | Ordinary assistant speech postpones silence counting. Unanswered assistant output is capped at 60 seconds of extension; a check-in adds no extension. |
| Conversation direction | General guidance to converse and teach. | After a completed answer, respond to its meaning and ask one relevant follow-up or offer a concrete choice. Follow topic changes and leave thinking time. Silence check-ins are initiated by the app. |
| Early speaking pace | Delivery primarily followed the saved challenge and general prompt. | Start with short, unhurried speech. The first validated, successful independent spoken passage can enable a natural pace; two distinct higher-level successes can enable connected sentences. Help or a breakdown immediately restores short, slower replies. An assessment already in progress cannot undo Help. |
| Regional persona | Regional guidance was strongest in the opening voice prompt. | Explicit warm, patient persona and consistent pronunciation in the base prompt, greeting, check-in, help, redirect, delegated answer, typed reply and sourced topic. All eight languages retain their existing regional guidance. |
| Error advice | Several unrelated failures shared a generic explanation. | Distinct messages for API credit, temporary request limits, service unavailability, invalid requests, Android connection/timeout failures, helper concurrency, exhausted helper allowance and unresolved balance checks. Existing account/key recovery actions remain available. |
| Error references | Mural references covered selected startup failures. | All server error responses carry a safe Mural reference. Direct OpenAI errors can display an “OpenAI reference” below the message. Provider response text is never shown. |

Typing grace ends if editing stops for ten seconds. Microphone grace depends on recent audio-level samples and is bounded; it cannot guarantee protection for a long utterance whose transcript never arrives. Maximum session duration and hosted billing deadlines still take priority. A closure request is not confirmation that provider billing has stopped.

The pace profile lives only in the current conversation. It neither raises saved learning progress nor awards a proficiency level. Typed answers, visible-meaning-assisted answers, uncertain evidence, other-language vocabulary and stale assessments cannot raise it. The model receives delivery instructions; these are not a numeric audio-speed control.

The only new visual element is the countdown text in the existing status location. Error text and reference lines also change. The retry sheet layout, preserved drafts, end-notice handling and iPhone reconnect grace come from the other task’s #57/#61, not this diff.

## Voice preset limitation

The current provider remains OpenAI `gpt-live-1` with `marin`. Kore and Aoede are Gemini presets and cannot be selected through this provider. The persona portion of #32 is implemented; its voice comparison remains open with the Gemini work in #30. No listening comparison or pronunciation-quality result is claimed.

## Verification

Final results and reproduction commands are recorded in [validation.md](validation.md). Screenshots use synthetic content in isolated test apps; they do not show a learner’s data or a live conversation.

- [Android countdown, Spanish large text](android-countdown-large-es.png)
- [Android API-credit error, Spanish large text](android-quota-large-es.png)
- [Android typing during the quiet window](android-typing-large-es.png)

Before merge consideration: review these UX changes; complete a short live conversation covering greeting, learner speech, Help, interruption, silence, mute, subtitles and confirmed closure; listen to target-language accent and pace; check speaker/headphone routing and cellular behavior. Simulator and fake-provider results cannot establish those outcomes.

The Android countdown reserves space beside the existing report button and centers wrapped text. This small spacing change applies to the warning, preventing large text from sharing the report button’s area. At iPhone’s largest accessibility size, the existing page scrolls to reach captions and controls below the warning.

- [iPhone countdown, largest accessibility text](ios-countdown-largest-text.png)
- [iPhone API-credit error](ios-quota-error.png)
