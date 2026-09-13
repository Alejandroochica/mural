# Android visual review

These are full-display captures from the actual Android interface on a Pixel 9 emulator running API 36. They use the separate `chat.mural.android.uitest` installation, no account or API credentials, and disabled continuous motion. They are design-review evidence, not final Play Store listing assets.

- [Learning language](01-onboarding.png)
- [Subtitle language](02-meaning.png)
- [Talk](03-talk.png)
- [Themes](04-themes.png)
- [Words](05-words.png)

To refresh them, start an emulator, configure Java 17 and `ANDROID_HOME`, then run from the repository root:

```sh
python3 scripts/capture_android_design.py --serial emulator-5554
```

The script builds and retains the isolated test installation. It refuses physical-device identifiers, does not modify a personal Mural installation, and does not call an AI or account provider. The test checks both dropdowns, the consent gate, primary action visibility and the floating navigation geometry before saving captures.
