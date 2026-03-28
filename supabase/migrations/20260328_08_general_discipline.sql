-- Add 'general' discipline for general contractors / project management orgs
-- These orgs own master projects but don't belong to a specialty trade

ALTER TABLE public.organizations
  DROP CONSTRAINT organizations_discipline_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_discipline_check
  CHECK (discipline = ANY (ARRAY['electro'::text, 'water'::text, 'klima'::text, 'general'::text]));
