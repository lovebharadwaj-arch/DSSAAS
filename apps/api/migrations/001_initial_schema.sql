
BEGIN;

-- Track applied database migrations.
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing users table is preserved if it already exists.
-- This definition is used only if the table is absent.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations / workspaces.
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES public.users(id)
        ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users can belong to multiple organizations.
CREATE TABLE IF NOT EXISTS public.memberships (
    organization_id UUID NOT NULL REFERENCES public.organizations(id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id)
        ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'analyst'
        CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id
    ON public.memberships(user_id);

-- Dataset registry; actual file contents live in object storage.
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id)
        ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150),
    file_size_bytes BIGINT
        CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    storage_key TEXT NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded'
        CHECK (status IN (
            'uploaded', 'processing', 'ready', 'failed', 'deleted'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_datasets_organization_created
    ON public.datasets(organization_id, created_at DESC);

-- Each dataset can have multiple immutable versions.
CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    dataset_id UUID NOT NULL,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    storage_key TEXT NOT NULL UNIQUE,
    file_size_bytes BIGINT
        CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    schema_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES public.users(id)
        ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (dataset_id, organization_id)
        REFERENCES public.datasets(id, organization_id)
        ON DELETE CASCADE,
    UNIQUE (dataset_id, version_number),
    UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset
    ON public.dataset_versions(dataset_id, version_number DESC);

-- Track statistics, cleaning, analysis and training jobs.
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL
        REFERENCES public.organizations(id) ON DELETE CASCADE,
    dataset_id UUID,
    dataset_version_id UUID,
    created_by UUID NOT NULL REFERENCES public.users(id)
        ON DELETE RESTRICT,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN (
            'queued', 'running', 'completed', 'failed', 'cancelled'
        )),
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (dataset_id, organization_id)
        REFERENCES public.datasets(id, organization_id)
        ON DELETE CASCADE,
    FOREIGN KEY (dataset_version_id, organization_id)
        REFERENCES public.dataset_versions(id, organization_id)
        ON DELETE CASCADE,
    CHECK (finished_at IS NULL OR started_at IS NULL
        OR finished_at >= started_at),
    UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_org_created
    ON public.analysis_jobs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status
    ON public.analysis_jobs(status, created_at);

-- Registry for trained models; model files live in object storage.
CREATE TABLE IF NOT EXISTS public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    analysis_job_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (status IN (
            'registered', 'training', 'ready', 'failed', 'archived'
        )),
    artifact_key TEXT,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (analysis_job_id, organization_id)
        REFERENCES public.analysis_jobs(id, organization_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_models_org_created
    ON public.models(organization_id, created_at DESC);

-- Record this migration only after all schema changes succeed.
INSERT INTO public.schema_migrations (version)
VALUES ('001_initial_schema')
ON CONFLICT (version) DO NOTHING;

COMMIT;
