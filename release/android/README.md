# Android release package

This directory prepares an internal **BYOK preview**. It does not authorize an upload or represent the completed hosted, paid Play release. The English listing copy describes the current voice and learning features and states that an OpenAI API key is required. Change that copy only when the candidate actually offers hosted conversations and minute purchases.

| File | Purpose |
| --- | --- |
| [candidate-audit-8768c86-2026-09-13.md](candidate-audit-8768c86-2026-09-13.md) | Historical unsigned candidate after the account lifecycle fixes; rebuild after later native changes |
| [candidate-audit-2026-09-13.md](candidate-audit-2026-09-13.md) | Historical candidate before the account lifecycle fixes |
| [release-spec.json](release-spec.json) | Candidate identity, version, metadata locale, expected assets and bundled notices |
| [metadata/en-US](metadata/en-US) | Copyable listing text and preview release notes |
| [declarations.md](declarations.md) | Data flows, permissions, Console declarations and unresolved answers |
| [build-and-verify.md](build-and-verify.md) | Build and evidence procedure for an approved candidate |
| [release-gates.md](release-gates.md) | Minimum internal-preview and public-release acceptance checks |

The owner-approved permanent package is `chat.mural.android`. Play registration and signing are separate release steps. `versionCode` starts at 1; each later upload must use a higher value. A debug installation is not a Play-signed release.

## Assets

The 512-pixel Play icon is prepared in `assets/icon.png`. Its encoding was normalized to opaque RGBA without changing any RGB pixel, and its sRGB setting matches the canonical iOS source. The feature graphic and six final screenshot paths remain reserved. [Android design captures](../../verification/android-design/README.md) are review evidence and must not be uploaded as finished store assets. Their 1080 × 2424 dimensions exceed Play's maximum screenshot ratio.

Capture six actual screens from the final candidate at **1080 × 1920**, with synthetic learning content and no personal account details: greeting, Spanish conversation with meanings, themes, vocabulary, language selection and settings. Replace the settings image with account/minute clarity only after that flow works in the uploaded build. Use a dedicated emulator or isolated capture build; do not change a learner's settings or data to stage a screenshot.

The store icon must be a 512 × 512, 32-bit sRGB PNG, at most 1024 KB. [Google’s icon specification](https://developer.android.com/distribute/google-play/resources/icon-design-specifications) The feature graphic must be a 1024 × 500, 24-bit PNG without alpha. This repository's validator also requires opaque 24-bit PNG screenshots, between 320 and 3840 pixels on each side, with the longer side no more than twice the shorter. Play accepts JPEG screenshots too; this workflow uses PNG to make review consistent. Keep the Mural artwork intact, with no price, rating or award claims. [Google's asset specification](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en-GB)

The iOS `AppIcon.appiconset/MuralIcon.png` is the canonical launcher artwork. Android must use the identical image bytes. The validator checks both images and follows the iOS catalog, Android manifest and adaptive foreground references so a resource change cannot silently select different artwork. It records the current iOS and Android design-source hashes for visual review. The current Android adaptive foreground has a 10% inset; identical source bytes alone do not prove the same visible scale after a launcher's mask is applied.

Derive the 512-pixel Play icon from the canonical image without redrawing, recoloring or substituting another orb. Use the same approved Mural mark in the feature graphic. Compare the installed launcher, in-app wordmark and final listing artwork with iOS before upload. Android's current wordmark uses Nunito; iOS uses its system rounded font, so their letterforms still need an explicit parity review. Store format checks do not establish brand parity.

The copy checker enforces Play's 30-character name, 80-character short description and 4,000-character full description limits. Release notes use a conservative 500-character limit. It also rejects unfinished placeholders. A passing check does not establish that the wording matches an untested feature. [Store metadata reference](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)
