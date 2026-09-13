# How to enable minute commerce

Use this guide after the API host has wired `configuredMinuteCommerce` into startup and shutdown. This module does not deploy itself, create provider products or enable production sales.

## Prepare the deployment

1. Apply reviewed migrations through 013, including the provider receipt tables. Apply `minute-purchase-runtime-grants.sql`, `minute-provider-runtime-grants.sql` and `minute-commerce-runtime-grants.sql` with the migration/operator database role.
2. Place the manifest, catalog and credentials in protected files outside the repository. Use the [configuration reference](minute-commerce-configuration.md) for exact schemas and permissions. Keep existing receipt keys in the key ring. Keep the Play binding key stable.
3. Configure only the providers whose existing accounts, credentials and catalog products are ready. Use the dedicated Stripe sandbox and Google license testers for validation. Keep test and live purchase data in separate databases.
4. Start with `MURAL_MINUTE_COMMERCE_ENABLED=true`, `MURAL_MINUTE_SALES_ENABLED=false`, and manifest environment `test`. Leave `MURAL_MINUTE_ALLOW_LIVE` false. Set only absolute file paths; do not put secret values in environment examples, shell history, issue comments or the repository.

## Connect lifecycle and monitoring

1. Await `configuredMinuteCommerce(db, process.env, { onFailure })` after migrations are available. Pass its `purchases`, `stripe` and `play` to the HTTP app.
2. Call `runner.start()` only after startup succeeds. Forward the fixed failure codes to an operator alert. Monitor retry age, unconsumed Play purchases and the persisted void checkpoint.
3. During shutdown, stop accepting new HTTP requests, drain request handlers, then await `runner.stop()` before closing the database. Allow the current bounded provider verification to finish. If the host is killed, leave job state intact for lease recovery.

## Review and enable a catalog

1. Review each provider product, currency, final amount, included minutes, payment fees and launch market. Include no placeholder prices in an active catalog.
2. Compute SHA-256 from the exact final catalog file and set `MURAL_MINUTE_CATALOG_APPROVED_SHA256` to that digest. Set `MURAL_MINUTE_SALES_ENABLED=true` and restart the service.
3. In the sandbox, confirm a signed payment, replay, pending state, partial refund, full refund and fulfillment retry. Confirm the account receives exactly the configured minutes and that client bodies cannot override the amount or owner.
4. Verify Play purchase acknowledgment/consumption on a signed test build before opening Play sales. Verify the permanent package is `chat.mural.android`. Complete regional payment-policy review separately.
5. For production, use the reviewed live database, provider credentials and final catalog. Change the manifest environment to `live`, set `MURAL_MINUTE_ALLOW_LIVE=true`, approve that catalog's digest and restart. Verify readiness before exposing any purchase CTA.

Successful activation returns the reviewed products from `/v1/minutes/products`; it does not expose credentials. Disabled sales return no products while existing fulfillment and refund jobs continue.

## Pause or recover

- To pause new sales, set `MURAL_MINUTE_SALES_ENABLED=false` and restart. Keep commerce enabled so refunds and fulfillment continue.
- To change prices, edit the catalog, review it, replace the approved digest and restart. Existing orders keep their original quotes.
- To rotate receipt encryption, add a new key ID, retain old keys, select the new active ID and restart. Back up the protected key ring independently of the database.
- If void pagination stalls, inspect the checkpoint and provider availability without logging its token. Retry after the provider recovers. If the cursor exceeds Google's history window, pause sales and reconcile saved receipts against provider orders before an operator repairs the checkpoint. Do not advance past an unreviewed gap.
- If startup rejects a missing key or provider scope, restore the previous protected configuration. Do not delete financial history to bypass the check.
