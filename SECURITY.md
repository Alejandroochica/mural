# Security

Mural’s current source version connects directly from the device to OpenAI using a key entered by the device’s owner. The key stays in Keychain and is not included in learning exports. A shared service key must never be embedded in a distributed app.

## Report a vulnerability

Use **Security → Report a vulnerability** in the GitHub repository when private vulnerability reporting is enabled. Include the affected version, reproduction steps and likely impact. Use synthetic conversations and redacted diagnostics; do not send a live credential or another person’s data.

Do not disclose an unpatched vulnerability or credential in a public issue. If the private reporting action is unavailable, email [hi@hackmamba.io](mailto:hi@hackmamba.io).

## Scope

Useful reports include credential exposure, unauthorized data access, unsafe backup import, content leaking between learners or languages, and ways to bypass future server-enforced usage limits. Incorrect model answers and pronunciation problems belong in ordinary bug reports unless they reveal a security issue.

Maintainer release requirement: enable GitHub private vulnerability reporting before the first public release. A response-time commitment has not yet been established.
