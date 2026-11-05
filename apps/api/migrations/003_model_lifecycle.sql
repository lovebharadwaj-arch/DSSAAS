
-- 003_model_lifecycle.sql

-- Production status is independent of is_latest.
ALTER TABLE public.models
ADD COLUMN IF NOT EXISTS is_production BOOLEAN NOT NULL DEFAULT FALSE;

-- Only one production version is allowed per organization/model family.
CREATE UNIQUE INDEX IF NOT EXISTS
  idx_models_one_production_per_family
ON public.models (organization_id, model_family_id)
WHERE is_production = TRUE;

-- Helps retrieve production versions by organization.
CREATE INDEX IF NOT EXISTS
  idx_models_production_lookup
ON public.models (organization_id, model_family_id, is_production);
