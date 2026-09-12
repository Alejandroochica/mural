# Release preparation

Status: **source prepared; Apple distribution pending**. This directory contains drafts for the first public release of [Chuloo/mural](https://github.com/Chuloo/mural). It does not record an App Store submission or a live TestFlight link.

| Document | Purpose |
| --- | --- |
| [Apple release checklist](apple-release.md) | TestFlight and App Store steps, owners and blocking requirements |
| [Listing draft](app-store-metadata.md) | Store copy, review notes and missing submission fields |
| [Privacy inventory](app-privacy.md) | Source-based data-flow inventory and draft App Privacy answers |
| [Source release audit](source-audit.md) | Publication scope, exclusions and audit findings |

The current app uses the device owner’s OpenAI key. The native account client and server foundations are present in source but disabled. Accounts, managed free minutes and purchased credits need their own release review before activation. Do not advertise those features until the uploaded build contains and supports them.

## Prepared build and assets

An unsigned **0.1.0 (1)** iOS Release archive was refreshed successfully on September 12, 2026 at `.build/ReleasePrep/Mural-0.1.0-unsigned.xcarchive`. It contains the final consent and onboarding changes and the disabled account foundation, plus the app and WebRTC privacy manifests, third-party notices and debug symbols. Four 6.9-inch screenshots are prepared under [screenshots/en-US](screenshots/en-US/README.md).

The archive is a compilation check, not a TestFlight upload. Apple Developer Program membership is not active yet, so distribution signing and upload remain pending. Once membership is active, archive with the distribution team and validate through Xcode before uploading. Store metadata and review-access requirements remain listed in [the checklist](apple-release.md).
