-- Migration: Stripe billing foundation
-- Adds stripe_customer_id and subscription_status to organizations.
-- RLS: existing orgs_select_members policy covers these columns (SELECT * for org members).
-- No UPDATE policy via client — subscription_status is set by webhook only (service role).

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('free', 'pro', 'cancelled', 'past_due'));
