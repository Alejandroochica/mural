# Configure the native account foundation

The account client is implemented but disabled. The shipped app still uses the owner's OpenAI API key. Account creation does not enable hosted conversations, trial minutes or purchases.

`ManagedAccountView` is a reusable Settings destination. `ManagedAccountStore` manages its state, `ManagedAccountIdentity` presents the native provider flows, and `ManagedAccountClient` implements the server contracts. None of these files reads or writes the OpenAI key.

## Enable a configured development build

Do these steps only after the server and both identity providers are configured. Keep the current Personal Team build unchanged.

1. Run the server behind a valid HTTPS origin. Its public API paths must start at `/v1`; the app rejects HTTP, URLs containing credentials, and base URLs with a path, query or fragment.
2. Create a Google OAuth client of type **iOS**, using Mural's bundle ID. Set the server's `GOOGLE_CLIENT_ID` to this same client ID. This flow obtains an ID token for the native client, not a separate web client.
3. Register the reversed Google client ID in `CFBundleURLTypes`. The callback is `<reversed-client-id>:/oauth2redirect`, with one slash. Enable the provider's consent screen for the intended testers.
4. Using a paid Apple Developer team, enable **Sign in with Apple** for the app identifier and target. Add the `com.apple.developer.applesignin` entitlement containing `Default`, and regenerate the provisioning profile. Set server `APPLE_CLIENT_ID` to the app's bundle ID. Configure Apple's server credentials and test authorization revocation before accepting Apple signups.
5. Add `MURAL_SIGN_IN_WITH_APPLE` to Swift compilation conditions only in the build configuration with that entitlement and matching provisioning profile. This is a build integration assertion; the client does not inspect private signing APIs at runtime. The default source build does not define it.
6. Supply these public Info.plist values in that configuration:

| Key | Value |
| --- | --- |
| `MuralManagedAccountsEnabled` | Boolean `true` |
| `MuralManagedAPIURL` | The deployed HTTPS origin |
| `MuralGoogleClientID` | The iOS OAuth client ID |
| `MuralAppleClientID` | The app's bundle ID |

7. Regenerate the Xcode project to include the new Swift files, then add `ManagedAccountView()` as a Settings navigation destination when `ManagedAccountConfiguration.load()` succeeds. Do not make it a prerequisite for BYOK conversations.

Client IDs are public configuration. Google or Apple client secrets, signing keys, OpenAI service keys and database credentials belong only on the server. Do not place them in Info.plist or an app resource.

## Authentication and storage

Google uses `ASWebAuthenticationSession` with an authorization code, PKCE S256, independent cryptographic state and the server's challenge nonce. Apple uses `ASAuthorizationController` with state and the same raw challenge nonce. The server hashes the nonce from the signed ID token once and compares it to its stored challenge hash. Do not hash the Apple nonce again in the client.

The Google callback must match the registered scheme and exact path. Duplicate security parameters, unexpected authority or fragments, and a mismatched state are rejected. Neither provider's decoded JWT claims grant client access; the server verifies the signature, issuer, audience and nonce before returning a Mural session.

Only Mural's 24-hour session and its account identifier, provider, expiry and configuration scope are saved in Keychain. The service is `chat.mural.managed-account`; it is separate from the OpenAI key service. Entries use `WhenUnlockedThisDeviceOnly`, do not synchronize through iCloud Keychain, and are scoped to the API origin and both client IDs. Provider tokens and authorization codes stay in memory for the exchange. Requests use ephemeral networking, reject redirects, and do not log bodies or credentials.

Sign-out revokes Mural sessions on the server and removes the local session. If the server cannot be reached, the view reports local sign-out and the remaining 24-hour maximum server lifetime. Account deletion waits for server confirmation. Apple deletion requests a fresh authorization code so the server can verify the account's Apple identity and revoke authorization. A balance, pending payment or usage reservation produces `unresolved_billing`; the account remains intact until those records are resolved.

## Verify before enabling it

Run `swift test --filter ManagedAccountTests` for configuration, PKCE, callback, session, wallet and cancellation checks. These tests use synthetic values and make no network calls. They do not replace these configured-device checks:

- Complete and cancel each provider flow; reject a reused challenge and a callback from an earlier attempt.
- Confirm both ID-token audiences match server configuration and test an expired Mural session.
- Confirm a saved session cannot be sent to a different API origin or restored after local sign-out.
- Delete a Google account and an Apple account. Verify Apple's authorization is revoked and neither account can reuse its old Mural session.
- Exercise a pending payment, nonzero balance and offline deletion. The UI must not claim successful deletion.
- Update the public privacy policy, App Privacy disclosures and review instructions before exposing account creation.

No real provider sign-in, live server account or purchase was used to verify this foundation. Server availability and provider setup remain release prerequisites.

## Provider references and artwork

The Google implementation follows [OAuth for installed iOS apps](https://developers.google.com/identity/protocols/oauth2/native-app) and [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect). Apple flows use [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession), [Sign in with Apple](https://developer.apple.com/documentation/authenticationservices/implementing-user-authentication-with-sign-in-with-apple), and its documented [nonce](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest/nonce) and [state](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest/state) properties.

The Google button is the unmodified light iOS pill PNG at 3× resolution from Google's [approved sign-in artwork](https://developers.google.com/static/identity/images/signin-assets.zip), downloaded September 12, 2026. Display it without tinting or changing its aspect ratio, following [Google's branding guidelines](https://developers.google.com/identity/branding-guidelines). Google retains its trademarks and artwork rights; the repository's MIT license does not grant rights to those marks.
