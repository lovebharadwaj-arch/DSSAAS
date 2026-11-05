
-- =====================================================
-- Migration: 002_model_versioning
-- Purpose: Add model version and family management
-- =====================================================

-- 1. Add versioning columns.
ALTER TABLE public.models
ADD COLUMN model_family_id UUID,
ADD COLUMN version INTEGER,
ADD COLUMN parent_model_id UUID,
ADD COLUMN is_latest BOOLEAN;
hy7
-- 2. Initialize existing models as version 1.
-- Each existing model starts its own model family.
UPDATE public.models
SET
    model_family_id = id,
    version = 1,
    parent_model_id = NULL,
    is_latest = TRUE;

-- 3. Make required fields NOT NULL.
ALTER TABLE public.models
ALTER COLUMN model_family_id SET NOT NULL,
ALTER COLUMN version SET DEFAULT 1,
ALTER COLUMN version SET NOT NULL,
ALTER COLUMN is_latest SET DEFAULT TRUE,
ALTER COLUMN is_latest SET NOT NULL;

-- 4. Ensure every model ID and organization pair is unique.
ALTER TABLE public.models
ADD CONSTRAINT uq_models_id_organization
UNIQUE (id, organization_id);

-- 5. Ensure a family belongs to the same organization.
ALTER TABLE public.models
ADD CONSTRAINT fk_models_family
FOREIGN KEY (model_family_id, organization_id)
REFERENCES public.models (id, organization_id)
ON DELETE CASCADE;

-- 6. Ensure a parent belongs to the same organization
-- and the same model family.
ALTER TABLE public.models
ADD CONSTRAINT uq_models_id_org_family
UNIQUE (id, organization_id, model_family_id);

ALTER TABLE public.models
ADD CONSTRAINT fk_models_parent_same_family
FOREIGN KEY (
    parent_model_id,
    organization_id,
    model_family_id
)
REFERENCES public.models (
    id,
    organization_id,
    model_family_id
)
ON DELETE CASCADE;

-- 7. Prevent invalid version numbers.
ALTER TABLE public.models
ADD CONSTRAINT chk_models_version_positive
CHECK (version > 0);

-- 8. Prevent duplicate versions in one model family.
ALTER TABLE public.models
ADD CONSTRAINT uq_models_family_version
UNIQUE (organization_id, model_family_id, version);

-- 9. Only one latest version per family.
CREATE UNIQUE INDEX idx_models_one_latest_version
ON public.models (organization_id, model_family_id)
WHERE is_latest = TRUE;

-- 10. Index model version history queries.
CREATE INDEX idx_models_family_history
ON public.models (
    organization_id,
    model_family_id,
    version DESC
);

CREATE INDEX idx_models_parent
ON public.models (parent_model_id);
