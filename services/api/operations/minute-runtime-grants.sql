-- Run as the migration owner after migrations 006 and 007.
-- Operators use a separate privileged connection for reviewed grant/policy commands.
GRANT SELECT ON minute_policy, minute_policy_audit, minute_wallets, minute_entries,
  minute_welcome_offers, minute_welcome_claims, minute_guest_links, minute_reservations,
  minute_campaigns, minute_campaign_recipients, welcome_funding_policy,
  welcome_funding_audit, welcome_funding_allocations TO mural_runtime;
REVOKE INSERT, UPDATE, DELETE ON minute_policy, minute_policy_audit, minute_campaigns,
  minute_campaign_recipients, welcome_funding_policy, welcome_funding_audit FROM mural_runtime;
GRANT INSERT, UPDATE, DELETE ON minute_wallets TO mural_runtime;
GRANT INSERT ON minute_entries, minute_welcome_offers, minute_welcome_claims,
  minute_guest_links, welcome_funding_allocations TO mural_runtime;
REVOKE UPDATE, DELETE ON minute_entries, minute_welcome_offers, minute_welcome_claims,
  minute_guest_links, welcome_funding_allocations FROM mural_runtime;
-- A verified guest transfer may move claim ownership, never its device proof or allowance.
GRANT UPDATE(account_id) ON minute_welcome_claims TO mural_runtime;
GRANT INSERT, UPDATE ON minute_reservations TO mural_runtime;
REVOKE DELETE ON minute_reservations FROM mural_runtime;
