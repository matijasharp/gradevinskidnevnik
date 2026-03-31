-- Add 'general' discipline to master_project_organizations
-- Coordinator orgs have discipline='general'; this was missing from the check constraint.

ALTER TABLE public.master_project_organizations
  DROP CONSTRAINT master_project_organizations_discipline_check;

ALTER TABLE public.master_project_organizations
  ADD CONSTRAINT master_project_organizations_discipline_check
  CHECK (discipline = ANY (ARRAY['electro'::text, 'water'::text, 'klima'::text, 'general'::text]));
