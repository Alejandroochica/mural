# Android commerce and voice verification

Verified on 13 September 2026 during the Android release work. The checks below use the current local release branch; the signed Play candidate still needs its own verification.

## Real Stripe sandbox

The new minute-purchase adapter created a 30-minute test pack in Mural's dedicated Stripe sandbox. The $3.00 USD amount was a test fixture, not an approved launch price. No real money, production accounts or production database records were involved.

Checkout was completed in Stripe's hosted form with its documented test card and synthetic contact details. Genuine signed notifications reached the new `/v1/webhooks/stripe/minutes` route. The checks confirmed:

- Retrying checkout returned the same payment session.
- A completed payment granted exactly 1,800,000 milliseconds once.
- Replaying the signed payment notification did not add another grant.
- A $1.00 partial refund left exactly 20 minutes.
- Refunding the remaining $2.00 left zero minutes and no outstanding reversal.
- Replaying refund notifications did not subtract time twice.
- The provider reference was encrypted in the receipt table.
- Adaptive Pricing was disabled, preserving the quoted USD amount.

The temporary product and price were archived after the test. The browser return exposed a missing website page; the website fix was committed separately as `268a365`. The return page does not infer payment success from a query string. Private evidence contains only the test identifiers and assertions; signing secrets and raw webhook bodies were not written to the evidence report.

This verifies card checkout and partial/full refund delivery in Stripe's sandbox. Play purchases, regional prices, taxes, disputes, live payments and candidate-app purchase restoration remain separate release checks. [Stripe test payments](https://docs.stripe.com/testing)

## Real provider shutdown

One local browser WebRTC session used a synthetic silent audio track and the dedicated server key. It sent no microphone audio or learner history. The server sent `session.close` after 20 seconds and received an authoritative final event reporting 19 seconds. There was one create request, one usage update, no connection loss, and no fallback hangup. The test kept no transcript or audio recording.

This confirms the provider's server-control path on this account. It does not establish Android microphone quality or end-to-end minute settlement. [GPT-Live server controls](https://developers.openai.com/api/docs/guides/voice-server-controls)

## Local accounting and recovery

The shared voice controller now supports either legacy money reservations or minute reservations. Eighteen HTTP/WebSocket integration tests passed against an isolated local PostgreSQL database, including exact minute settlement, guest balances without money wallets, short remainders, setup delay, duplicate creates, uncertain creation, final-usage regression, recovery, cutoff overrun, refunds during speech and sign-out. Voice admission reserves teaching funding in the same transaction, so an unfunded helper budget cannot leave a billed voice session running.

Only authenticated provider usage settles time. Missing final usage retains the hold. Mural absorbs the provider's 15-second creation minimum and cutoff overrun in these controlled tests; it does not silently round the learner's consumed minutes up. Public funding still requires reviewed connection and helper budgets before activation.

The restricted-runtime test also exercised guest-to-account transfer. Claim ownership can move, while device proof and original allowance remain protected from modification.

The complete API suite passed 227 tests with no skips after the combined integration. These cover the helper HTTP boundary, private report submission, account management, guest grants, provider purchase verification and recovery after losing a Play order ID. A source secret scan found no credentials. Native purchase testing and deployed runtime checks remain separate gates.

## Guest beta decision

The owner approved one free allowance per installation for the first public beta, accepting that a reinstall may claim another allowance. New grants must stay within the approved $25/day and $100 total funding commitments. Device Recall approval is no longer a prerequisite for this beta; actual cost accounting, installation proof and the enforced grant limits still require verification before public activation.
