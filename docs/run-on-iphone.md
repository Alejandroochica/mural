# How to run Mural on your iPhone

Use this guide to install a personal build from source. After installation, the phone connects directly to OpenAI and works away from your Mac.

## Before you start

- A Mac with Xcode 26 or later, downloaded from Apple.
- An iPhone running iOS 26.1 or later and a USB cable for initial setup.
- An Apple Account added to **Xcode → Settings → Accounts**.
- An OpenAI project with API billing enabled and access to the models configured in `apps/ios/App/APIClient.swift` and `apps/ios/App/LiveTransport.swift`.

OpenAI API usage is paid separately from ChatGPT. Use your own key for this personal build. Never add a key to source code, an Xcode build setting, a screenshot or a GitHub issue.

## Install

1. Download the [repository ZIP](https://github.com/Chuloo/mural/archive/refs/heads/main.zip) and extract it, or clone [Chuloo/mural](https://github.com/Chuloo/mural). Open `apps/ios/Mural.xcodeproj`. Allow Xcode to resolve the pinned WebRTC package.
2. Select the blue **Mural** project in the navigator. Under **Targets**, choose **Mural**, then open **Signing & Capabilities**.
3. Enable **Automatically manage signing** and choose your Apple team. For a fork, set a unique bundle identifier, such as `com.yourname.mural`. Do not change an existing installation’s identifier when refreshing it.
4. Connect the iPhone, unlock it, and accept **Trust This Computer** if shown. In Xcode’s **Window → Devices and Simulators**, wait for the phone to finish preparing.
5. On the iPhone, enable **Settings → Privacy & Security → Developer Mode**. Restart and confirm **Turn On** when prompted.
6. In Xcode’s toolbar, select the **Mural** scheme and your iPhone as the destination. Click **Run** or press **⌘R**. If macOS requests access to the signing key, allow Xcode to use it.
7. If iOS blocks the first launch because the developer is untrusted, open **Settings → General → VPN & Device Management**, select your developer profile, and tap **Trust**. Return to Xcode and run again.
8. Choose your learning and subtitle languages in the welcome screens. In **Settings → Advanced → Use your own API key**, save your OpenAI project key. Tap the main conversation button and allow microphone access.

Mural should greet you aloud. Disconnect the cable and confirm a short conversation over Wi-Fi or cellular.

## Refresh a free installation

A free Personal Team provisioning profile expires after seven days. Reconnect your phone and run the same project with the same team and bundle identifier. Keep the app installed while refreshing it. [Apple’s account and membership guidance](https://developer.apple.com/support/compare-memberships/)

Use **Settings → Export learning backup** before changing your bundle identifier, signing team or device. On a new installation, choose **Import learning backup** and enter your API key again. The key is never included in the backup.

## Fix setup problems

| Problem | Action |
| --- | --- |
| Xcode cannot register the bundle identifier | Choose a unique identifier for your fork and reselect your team. |
| The phone does not appear as a destination | Unlock it, check the cable, and open Devices and Simulators to finish pairing. |
| Developer Mode is missing | Pair with Xcode first, then check Privacy & Security again. |
| The app will not launch after a week | Refresh the build through Xcode without uninstalling. |
| Key rejected or model unavailable | Check the key’s project, API billing, permissions and model access in OpenAI. |
| No microphone input | Enable Mural under iPhone Settings → Privacy & Security → Microphone. |
| Sound uses the wrong output | Check iOS’s current audio destination; disconnect an unwanted Bluetooth route. |
| A connection fails on cellular | Confirm Mural is allowed to use cellular data and retry with a stable connection. |

For simulator previews and automated checks, use [the build guide](build-and-test.md).
