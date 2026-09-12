# How to build and test Mural

Run commands from the directory containing `Package.swift` and `Mural.xcodeproj`. Core tests need Swift 6. Native builds need Xcode 26 or later.

## Run offline checks

```sh
swift test
xcodebuild -project Mural.xcodeproj -scheme Mural \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath .build/DerivedData \
  CODE_SIGNING_ALLOWED=NO ARCHS=arm64 ONLY_ACTIVE_ARCH=YES build
```

Create an iPhone 17 simulator in Xcode’s **Devices and Simulators** window. If you name it `iPhone 17`, run UI tests with:

```sh
xcodebuild -project Mural.xcodeproj -scheme Mural \
  -destination 'platform=iOS Simulator,name=iPhone 17,arch=arm64' \
  -derivedDataPath .build/DerivedData \
  CODE_SIGNING_ALLOWED=NO ARCHS=arm64 ONLY_ACTIVE_ARCH=YES \
  -parallel-testing-enabled NO test
```

The core suite covers evidence validation, transcript revisions, language isolation, recall spacing, archive validation, translation cancellation, and managed-account configuration and security parsing. Native UI tests exercise the screens with in-memory data. Neither suite needs an API key. Configured provider sign-in and account deletion need the separate device checks in [managed accounts](managed-accounts.md).

## Preview without saving learning data

In **Product → Scheme → Edit Scheme → Run → Arguments**, add `--preview`. The app opens with temporary storage and skips onboarding. In a Debug build, add `--ended-conversation` to exercise the ended-conversation state. Preview fixtures make no API calls.

Remove preview arguments before testing normal persistence. For actual speech, [install on an iPhone](run-on-iphone.md) and use the key saved through Settings.

## Update the generated project

After adding or removing files under `App/`, run:

```sh
python3 scripts/generate_project.py
```

The generator moves a team selected in Xcode into the ignored `Config/Local.xcconfig`. The public `Config/Signing.xcconfig` includes that file when present. You can also copy `Config/Local.example.xcconfig` to `Config/Local.xcconfig` and enter your team ID there. Keep repeatable project settings in the generator; other manual project edits can be replaced on the next run. Swift Package Manager discovers files under `Core/` automatically.

## Verify live changes

After changing audio, prompts or a language module, check a short conversation on a real iPhone: greeting, learner reply, correction, subtitles, interruption, mute and final closure. Check speaker and headphones separately. Try cellular with the Mac disconnected.

Debug-only `--verify-audio --verify-language=<language ID>` starts two real voice sessions using the phone’s saved key. `--verify-meaning` adds the translation/reset check. These flags incur API usage, use temporary learning data, and write content-free diagnostics in the app container. Run them only when live testing is intended; they are excluded from Release builds.

Record the build, checks and remaining limitations in `verification/validation.md`. Successful API transport does not establish pronunciation quality or teaching effectiveness.
