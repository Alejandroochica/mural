# Why paid minutes are estimates

Mural's approved paid model is prepaid AI usage, plus a 15% Mural service fee and separately quoted payment costs and buffer. The app should lead with an estimated conversation duration and make the cost breakdown available before purchase. A fixed promise such as “30 minutes for $5.99” is not the approved offer.

Voice has a duration-based cost. Meanings, corrections, assessments and topic searches add usage that varies between conversations. A currency balance allows Mural to charge for actual provider usage while keeping unused value available for later conversations. Purchased value adds to the existing balance; it does not replace remaining free time. Free and gifted minutes remain duration entitlements and are spent before paid value.

## Fee calculation

The quote preserves the amount allocated to AI usage. Mural's service fee is a percentage of that amount. Payment costs are calculated on the full amount collected, because a processor's percentage also applies to the fees in the payment. Any payment buffer is shown separately from the estimated processing charge.

For example, a hypothetical $2.00 AI allocation with the 15% service fee leaves $2.00 for AI and $0.30 for Mural before payment costs. No live processor rate or checkout total is implied by this example. Channel, currency, regional fees and taxes need verification before a purchasable offer is created.

The service percentage lives in the database, initially at 1,500 basis points. Operator changes are versioned and audited. The public API can read this policy but cannot change it. A fulfilled order must retain its original quote, AI value, fees, currency and policy version; future fee changes must not rewrite an existing purchase.

## Implementation status

The configurable policy, integer quote calculation and estimated-duration calculation are implemented and tested. The public pricing response identifies the actual-usage model and does not advertise fixed minute packs.

Live exact-cost purchases remain disabled. Connecting verified Stripe and Play fulfillment to the currency wallet, settling both voice and teaching usage, handling paid refunds, and updating Android's purchase and balance screens are still required. Existing fixed-minute purchase tests describe the previous implementation; they do not certify the new paid flow. The sandbox-only Stripe top-up path is also not a production payment service.

Free trial funding is independent of payment pricing. The daily and total trial budgets govern new grants across the app. They do not cap signups, revoke existing grants, or set a per-customer spending ceiling.
