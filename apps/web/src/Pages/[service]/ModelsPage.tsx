import {
  Activity,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  FileWarning,
  Layers3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import PageHeader from "../../component/dashboard/PageHeader";
import StatCard from "../../component/dashboard/StatCard";

import { getLatestModelVersion, listModelVersions } from "../../lib/api";
import {
  getModelArtifactStatus,
  getModelSchema,
  listModels,
  listTrainingJobs,
  predictModel,
  type MLArtifactStatus,
  type MLFeature,
  type MLFeatureSchema,
  type MLModelSummary,
  type MLModelVersion,
  type TrainingJobSummary,
} from "../../service/mlTrainingService";

// ---------------------------------------------
// Helpers
// ---------------------------------------------

function getStoredAuth() {
  const token = sessionStorage.getItem("accessToken");
  const organizationId = sessionStorage.getItem("organizationId");

  if (!token) {
    throw new Error("Authentication token not found. Please log in again.");
  }

  if (!organizationId) {
    throw new Error("Organization not found. Please log in again.");
  }

  return { token, organizationId };
}

function formatDate(date?: string | null): string {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString();
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "Unknown size";

  if (bytes < 1024) {
    return `${bytes} Bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "ready":
    case "completed":
      return "bg-green-100 text-green-700";

    case "training":
    case "running":
      return "bg-blue-100 text-blue-700";

    case "queued":
    case "registered":
      return "bg-yellow-100 text-yellow-700";

    case "failed":
      return "bg-red-100 text-red-700";

    case "archived":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getInitialPredictionValues(
  features: MLFeature[],
): Record<string, string> {
  return Object.fromEntries(features.map((feature) => [feature.name, ""]));
}

function buildPredictionPayload(
  features: MLFeature[],
  values: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const feature of features) {
    const rawValue = values[feature.name] ?? "";
    const value = rawValue.trim();

    if (!value) {
      if (!feature.nullable) {
        throw new Error(`${feature.name} is required.`);
      }

      payload[feature.name] = null;
      continue;
    }

    const normalizedType = feature.type.toLowerCase();

    if (
      normalizedType.includes("int") ||
      normalizedType.includes("float") ||
      normalizedType.includes("double") ||
      normalizedType.includes("number")
    ) {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        throw new Error(`${feature.name} must be a valid number.`);
      }

      payload[feature.name] = numberValue;
      continue;
    }

    if (normalizedType.includes("bool")) {
      if (value !== "true" && value !== "false") {
        throw new Error(`${feature.name} must be true or false.`);
      }

      payload[feature.name] = value === "true";
      continue;
    }

    payload[feature.name] = value;
  }

  return payload;
}

type LifecycleModelVersion = MLModelVersion & {
  is_production?: boolean;
};

type ModelDetailsResponse = {
  success: boolean;
  model?: Record<string, unknown>;
  message?: string;
};

async function requestModelLifecycle<T>(
  organizationId: string,
  modelId: string,
  token: string,
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
): Promise<T> {
  const apiBase = (
    import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
  ).replace(/\/+$/, "");

  const response = await fetch(
    `${apiBase}/organizations/${encodeURIComponent(organizationId)}/models/${encodeURIComponent(modelId)}${endpoint}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify({}) } : {}),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
  } & T;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status}).`);
  }

  return payload;
}

// ---------------------------------------------
// Component
// ---------------------------------------------

export default function ModelsPage() {
  // Registry state
  const [models, setModels] = useState<MLModelSummary[]>([]);
  const [jobs, setJobs] = useState<TrainingJobSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Registry filters
  const [filter, setFilter] = useState("all");

  // Selected model
  const [selectedModel, setSelectedModel] = useState<MLModelSummary | null>(
    null,
  );

  // Dynamic prediction schema
  const [modelSchema, setModelSchema] = useState<MLFeatureSchema | null>(null);

  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Prediction state
  const [predictionValues, setPredictionValues] = useState<
    Record<string, string>
  >({});

  const [predictionResult, setPredictionResult] = useState<unknown>(null);

  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Artifact management state
  const [artifactStatus, setArtifactStatus] = useState<MLArtifactStatus | null>(
    null,
  );

  const [artifactLoading, setArtifactLoading] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [artifactRefreshKey, setArtifactRefreshKey] = useState(0);

  // Model version history state
  const [modelVersions, setModelVersions] = useState<MLModelVersion[]>([]);
  const [latestModelVersion, setLatestModelVersion] =
    useState<MLModelVersion | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionRefreshKey, setVersionRefreshKey] = useState(0);
  const [lifecycleLoadingId, setLifecycleLoadingId] = useState<string | null>(
    null,
  );
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);
  const [comparisonVersionIds, setComparisonVersionIds] = useState<string[]>(
    [],
  );
  const [comparisonDetails, setComparisonDetails] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const selectedModelId = selectedModel?.id;

  // ---------------------------------------------
  // Load models and training jobs
  // ---------------------------------------------

  const loadRegistry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { token, organizationId } = getStoredAuth();

      const [modelsResult, jobsResult] = await Promise.allSettled([
        listModels(organizationId, token),
        listTrainingJobs(organizationId, token),
      ]);

      if (modelsResult.status === "rejected") {
        throw modelsResult.reason;
      }

      const fetchedModels = Array.isArray(modelsResult.value.models)
        ? modelsResult.value.models
        : [];

      setModels(fetchedModels);

      if (jobsResult.status === "fulfilled") {
        setJobs(
          Array.isArray(jobsResult.value.jobs) ? jobsResult.value.jobs : [],
        );
      } else {
        setJobs([]);
        console.error("Unable to load training history:", jobsResult.reason);
      }

      // Preserve the currently selected model after refresh.
      setSelectedModel((current) => {
        if (!current) return null;

        return fetchedModels.find((model) => model.id === current.id) ?? null;
      });
    } catch (err) {
      console.error("Model registry loading failed:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load model registry.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistry();
  }, [loadRegistry, refreshKey]);

  // ---------------------------------------------
  // Select model
  // ---------------------------------------------

  function handleSelectModel(model: MLModelSummary) {
    setSelectedModel(model);

    setModelSchema(null);
    setSchemaError(null);

    setPredictionValues({});
    setPredictionResult(null);
    setPredictionError(null);

    setArtifactStatus(null);
    setArtifactError(null);

    setModelVersions([]);
    setLatestModelVersion(null);
    setVersionsError(null);
    setLifecycleError(null);
    setLifecycleMessage(null);
    setComparisonVersionIds([]);
    setComparisonDetails({});
    setComparisonError(null);
  }

  // ---------------------------------------------
  // Load selected model schema
  // ---------------------------------------------

  useEffect(() => {
    if (!selectedModelId) {
      setModelSchema(null);
      setPredictionValues({});
      setSchemaError(null);
      return;
    }

    let cancelled = false;

    async function fetchSchema() {
      try {
        setSchemaLoading(true);
        setSchemaError(null);
        setModelSchema(null);
        setPredictionValues({});
        setPredictionResult(null);
        setPredictionError(null);

        const { token, organizationId } = getStoredAuth();

        const response = await getModelSchema(
          organizationId,
          selectedModelId!,
          token,
        );

        if (cancelled) return;

        if (!response.success || !response.schema) {
          throw new Error("Model feature schema was not returned.");
        }

        setModelSchema(response.schema);

        setPredictionValues(
          getInitialPredictionValues(response.schema.features),
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Model schema loading failed:", err);

        setSchemaError(
          err instanceof Error ? err.message : "Unable to load model schema.",
        );
      } finally {
        if (!cancelled) {
          setSchemaLoading(false);
        }
      }
    }

    void fetchSchema();

    return () => {
      cancelled = true;
    };
  }, [selectedModelId]);

  // ---------------------------------------------
  // Load selected model artifact status
  // ---------------------------------------------

  useEffect(() => {
    if (!selectedModelId) {
      setArtifactStatus(null);
      setArtifactError(null);
      return;
    }

    let cancelled = false;

    async function fetchArtifactStatus() {
      try {
        setArtifactLoading(true);
        setArtifactError(null);
        setArtifactStatus(null);

        const { token, organizationId } = getStoredAuth();

        // Pass the authentication token explicitly.
        const response = await getModelArtifactStatus(
          organizationId,
          selectedModelId!,
          token,
        );

        if (cancelled) return;

        setArtifactStatus(response.artifactStatus);
      } catch (err) {
        if (cancelled) return;

        console.error("Artifact status loading failed:", err);

        setArtifactError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve artifact status.",
        );
      } finally {
        if (!cancelled) {
          setArtifactLoading(false);
        }
      }
    }

    void fetchArtifactStatus();

    return () => {
      cancelled = true;
    };
  }, [selectedModelId, artifactRefreshKey]);

  // ---------------------------------------------
  // Load selected model version history
  // ---------------------------------------------

  useEffect(() => {
    if (!selectedModelId) {
      setModelVersions([]);
      setLatestModelVersion(null);
      setVersionsError(null);
      return;
    }

    let cancelled = false;

    async function fetchVersions() {
      try {
        setVersionsLoading(true);
        setVersionsError(null);

        const { token, organizationId } = getStoredAuth();

        const [versionsResponse, latestResponse] = await Promise.all([
          listModelVersions(organizationId, selectedModelId!, token),
          getLatestModelVersion(organizationId, selectedModelId!, token),
        ]);

        if (cancelled) return;

        setModelVersions(versionsResponse.versions);
        setLatestModelVersion(latestResponse.model);
      } catch (err) {
        if (cancelled) return;

        console.error("Model version history loading failed:", err);

        setVersionsError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve model version history.",
        );
        setModelVersions([]);
        setLatestModelVersion(null);
      } finally {
        if (!cancelled) {
          setVersionsLoading(false);
        }
      }
    }

    void fetchVersions();

    return () => {
      cancelled = true;
    };
  }, [selectedModelId, versionRefreshKey]);

  // ---------------------------------------------
  // Select a model version
  // ---------------------------------------------

  function handleSelectVersion(version: MLModelVersion) {
    // Selecting a version updates the active model. The existing schema,
    // artifact-status, and prediction effects then load that version.
    setSelectedModel({
      id: version.id,
      name: version.name,
      algorithm: version.algorithm,
      task_type: version.task_type,
      status: version.status,
      metrics: version.metrics ?? {},
      artifact_key: version.artifact_key ?? null,
      created_at: version.created_at,
    });

    setModelSchema(null);
    setSchemaError(null);
    setPredictionValues({});
    setPredictionResult(null);
    setPredictionError(null);
    setArtifactStatus(null);
    setArtifactError(null);
  }

  function handleComparisonSelection(versionId: string, checked: boolean) {
    setComparisonError(null);
    setComparisonDetails({});

    setComparisonVersionIds((current) => {
      if (checked) {
        if (current.includes(versionId)) return current;
        if (current.length >= 2) {
          setComparisonError("Select no more than two versions to compare.");
          return current;
        }
        return [...current, versionId];
      }
      return current.filter((id) => id !== versionId);
    });
  }

  useEffect(() => {
    if (comparisonVersionIds.length !== 2) {
      setComparisonDetails({});
      setComparisonError(null);
      return;
    }

    let cancelled = false;

    async function loadComparisonDetails() {
      try {
        setComparisonLoading(true);
        setComparisonError(null);
        const { token, organizationId } = getStoredAuth();
        const responses = await Promise.all(
          comparisonVersionIds.map((id) =>
            requestModelLifecycle<ModelDetailsResponse>(
              organizationId,
              id,
              token,
              "/details",
            ),
          ),
        );

        if (cancelled) return;

        const nextDetails: Record<string, Record<string, unknown>> = {};
        comparisonVersionIds.forEach((id, index) => {
          nextDetails[id] = responses[index].model ?? {};
        });
        setComparisonDetails(nextDetails);
      } catch (err) {
        if (cancelled) return;
        setComparisonError(
          err instanceof Error
            ? err.message
            : "Unable to load comparison details.",
        );
      } finally {
        if (!cancelled) setComparisonLoading(false);
      }
    }

    void loadComparisonDetails();
    return () => {
      cancelled = true;
    };
  }, [comparisonVersionIds]);

  async function handlePromoteVersion(version: MLModelVersion) {
    const lifecycleVersion = version as LifecycleModelVersion;
    if (lifecycleVersion.is_production) return;

    try {
      setLifecycleLoadingId(version.id);
      setLifecycleError(null);
      setLifecycleMessage(null);
      const { token, organizationId } = getStoredAuth();
      const response = await requestModelLifecycle<{
        success: boolean;
        message?: string;
      }>(organizationId, version.id, token, "/promote", "POST");

      setLifecycleMessage(
        response.message ||
          `Version ${version.version} promoted to production.`,
      );
      setVersionRefreshKey((value) => value + 1);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setLifecycleError(
        err instanceof Error ? err.message : "Unable to promote this version.",
      );
    } finally {
      setLifecycleLoadingId(null);
    }
  }

  async function handleArchiveVersion(version: MLModelVersion) {
    const lifecycleVersion = version as LifecycleModelVersion;
    if (lifecycleVersion.is_production) {
      setLifecycleError(
        "Promote another version before archiving the production version.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Archive model version v${version.version}? Its history and artifact will be preserved.`,
    );
    if (!confirmed) return;

    try {
      setLifecycleLoadingId(version.id);
      setLifecycleError(null);
      setLifecycleMessage(null);
      const { token, organizationId } = getStoredAuth();
      const response = await requestModelLifecycle<{
        success: boolean;
        message?: string;
      }>(organizationId, version.id, token, "", "DELETE");

      setLifecycleMessage(
        response.message || `Version ${version.version} archived.`,
      );
      if (selectedModel?.id === version.id) {
        setSelectedModel(null);
        setModelSchema(null);
        setArtifactStatus(null);
        setPredictionResult(null);
      }
      setComparisonVersionIds((current) =>
        current.filter((id) => id !== version.id),
      );
      setVersionRefreshKey((value) => value + 1);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setLifecycleError(
        err instanceof Error ? err.message : "Unable to archive this version.",
      );
    } finally {
      setLifecycleLoadingId(null);
    }
  }

  // ---------------------------------------------
  // Prediction input handler
  // ---------------------------------------------

  function handlePredictionValueChange(featureName: string, value: string) {
    setPredictionValues((current) => ({
      ...current,
      [featureName]: value,
    }));

    setPredictionError(null);
    setPredictionResult(null);
  }

  // ---------------------------------------------
  // Run prediction
  // ---------------------------------------------

  async function handlePrediction() {
    if (!selectedModel || !modelSchema) {
      setPredictionError("Select a model before making a prediction.");
      return;
    }

    try {
      setPredictionLoading(true);
      setPredictionError(null);
      setPredictionResult(null);

      const { token, organizationId } = getStoredAuth();

      const inputData = buildPredictionPayload(
        modelSchema.features,
        predictionValues,
      );

      const response = await predictModel(
        organizationId,
        selectedModel.id,
        token,
        {
          input_data: inputData,
        },
      );

      if (!response.success) {
        throw new Error("Prediction request was unsuccessful.");
      }

      setPredictionResult(response.prediction);
    } catch (err) {
      console.error("Prediction failed:", err);

      setPredictionError(
        err instanceof Error ? err.message : "Unable to generate prediction.",
      );
    } finally {
      setPredictionLoading(false);
    }
  }

  // ---------------------------------------------
  // Registry statistics
  // ---------------------------------------------

  const readyModels = useMemo(
    () => models.filter((model) => model.status === "ready"),
    [models],
  );

  const trainingJobs = useMemo(
    () =>
      jobs.filter((job) => job.status === "queued" || job.status === "running"),
    [jobs],
  );

  const filteredModels = useMemo(() => {
    if (filter === "all") return models;

    return models.filter((model) => model.status.toLowerCase() === filter);
  }, [models, filter]);

  // ---------------------------------------------
  // Render
  // ---------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="MODEL REGISTRY"
        title="Models"
        subtitle="Manage trained machine learning models, inspect artifacts, and run predictions."
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Registered Models"
          value={models.length}
          change="Models in your organization"
          icon={Layers3}
          color="blue"
        />

        <StatCard
          label="Production Ready"
          value={readyModels.length}
          change="Models available for prediction"
          icon={ShieldCheck}
          color="green"
        />

        <StatCard
          label="Active Training Jobs"
          value={trainingJobs.length}
          change="Queued or running experiments"
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Registry */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Model Registry
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse and select your trained models.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { label: "All", value: "all" },
            { label: "Ready", value: "ready" },
            { label: "Training", value: "training" },
            { label: "Failed", value: "failed" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === item.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Loading models...
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="py-12 text-center">
            <Database size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-700">No models found</p>
            <p className="mt-1 text-sm text-gray-500">
              Train a model to see it in your registry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="px-3 py-3 font-medium">Model</th>
                  <th className="px-3 py-3 font-medium">Algorithm</th>
                  <th className="px-3 py-3 font-medium">Task</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredModels.map((model) => (
                  <tr
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className={`cursor-pointer border-b border-gray-100 transition hover:bg-blue-50 ${
                      selectedModel?.id === model.id ? "bg-blue-50" : ""
                    }`}>
                    <td className="px-3 py-4">
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{model.id}</p>
                    </td>

                    <td className="px-3 py-4 text-gray-700">
                      {model.algorithm}
                    </td>

                    <td className="px-3 py-4 capitalize text-gray-700">
                      {model.task_type}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          model.status,
                        )}`}>
                        {model.status}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-gray-500">
                      {formatDate(model.created_at)}
                    </td>

                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectModel(model);
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Model Version History */}
      {selectedModel && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers3 size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Model Version History
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Inspect previous training versions and switch the active model.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setVersionRefreshKey((value) => value + 1)}
              disabled={versionsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw
                size={15}
                className={versionsLoading ? "animate-spin" : ""}
              />
              Refresh versions
            </button>
          </div>

          {lifecycleError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{lifecycleError}</span>
            </div>
          )}
          {lifecycleMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{lifecycleMessage}</span>
            </div>
          )}

          {latestModelVersion && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                    Latest version
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {latestModelVersion.name} · v{latestModelVersion.version}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {latestModelVersion.algorithm} ·{" "}
                    {latestModelVersion.task_type}
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Latest
                </span>
              </div>
            </div>
          )}

          {versionsLoading ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Loading model versions...
            </p>
          ) : versionsError ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{versionsError}</span>
            </div>
          ) : modelVersions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No version history is available for this model.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="px-3 py-3 font-medium">Version</th>
                    <th className="px-3 py-3 font-medium">Algorithm</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                    <th className="px-3 py-3 font-medium">Artifact</th>
                    <th className="px-3 py-3 font-medium">Compare</th>
                    <th className="px-3 py-3 font-medium">Lifecycle</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modelVersions.map((version) => {
                    const isSelected = selectedModel.id === version.id;
                    const isLatest =
                      version.is_latest ||
                      latestModelVersion?.id === version.id;

                    return (
                      <tr
                        key={version.id}
                        className={`border-b border-gray-100 ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              v{version.version}
                            </span>
                            {isLatest && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                Latest
                              </span>
                            )}
                            {(version as LifecycleModelVersion)
                              .is_production && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                Production
                              </span>
                            )}
                            {isSelected && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {version.id}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-gray-700">
                          {version.algorithm}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              version.status,
                            )}`}>
                            {version.status}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-gray-500">
                          {formatDate(version.created_at)}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              version.artifact_key
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                            {version.artifact_key ? "Registered" : "Missing"}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            aria-label={`Compare version ${version.version}`}
                            checked={comparisonVersionIds.includes(version.id)}
                            disabled={
                              comparisonVersionIds.length === 2 &&
                              !comparisonVersionIds.includes(version.id)
                            }
                            onChange={(event) =>
                              handleComparisonSelection(
                                version.id,
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handlePromoteVersion(version)}
                              disabled={
                                version.status !== "ready" ||
                                !version.artifact_key ||
                                Boolean(
                                  (version as LifecycleModelVersion)
                                    .is_production,
                                ) ||
                                lifecycleLoadingId !== null
                              }
                              className="rounded-lg border border-purple-200 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40">
                              {lifecycleLoadingId === version.id
                                ? "Working..."
                                : "Promote"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleArchiveVersion(version)}
                              disabled={
                                version.status === "archived" ||
                                Boolean(
                                  (version as LifecycleModelVersion)
                                    .is_production,
                                ) ||
                                lifecycleLoadingId !== null
                              }
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                              Archive
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => handleSelectVersion(version)}
                            disabled={
                              isSelected || version.status === "archived"
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                            {version.status === "archived"
                              ? "Archived"
                              : isSelected
                                ? "Selected"
                                : "Inspect"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {comparisonVersionIds.length > 0 && (
            <div className="mt-6 rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Version Comparison
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Select two versions above to compare algorithms, metrics,
                    and training details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setComparisonVersionIds([]);
                    setComparisonDetails({});
                    setComparisonError(null);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Clear comparison
                </button>
              </div>

              {comparisonVersionIds.length < 2 ? (
                <p className="text-sm text-gray-500">
                  Select one more version to compare.
                </p>
              ) : comparisonLoading ? (
                <p className="text-sm text-gray-500">
                  Loading training details...
                </p>
              ) : comparisonError ? (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {comparisonError}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                          <th className="px-3 py-2">Field</th>
                          {comparisonVersionIds.map((id) => {
                            const item = modelVersions.find(
                              (version) => version.id === id,
                            );
                            return (
                              <th key={id} className="px-3 py-2">
                                {item ? `Version ${item.version}` : id}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            label: "Algorithm",
                            value: (v: MLModelVersion) => v.algorithm,
                          },
                          {
                            label: "Task",
                            value: (v: MLModelVersion) => v.task_type,
                          },
                          {
                            label: "Status",
                            value: (v: MLModelVersion) => v.status,
                          },
                          {
                            label: "Created",
                            value: (v: MLModelVersion) =>
                              formatDate(v.created_at),
                          },
                          {
                            label: "Production",
                            value: (v: MLModelVersion) =>
                              (v as LifecycleModelVersion).is_production
                                ? "Yes"
                                : "No",
                          },
                        ].map((row) => (
                          <tr
                            key={row.label}
                            className="border-b border-gray-100">
                            <td className="px-3 py-2 font-medium text-gray-600">
                              {row.label}
                            </td>
                            {comparisonVersionIds.map((id) => {
                              const item = modelVersions.find(
                                (version) => version.id === id,
                              );
                              return (
                                <td
                                  key={id}
                                  className="px-3 py-2 text-gray-800">
                                  {item ? row.value(item) : "—"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {Array.from(
                          new Set(
                            comparisonVersionIds.flatMap((id) => {
                              const item = modelVersions.find(
                                (version) => version.id === id,
                              );
                              return item?.metrics
                                ? Object.keys(item.metrics)
                                : [];
                            }),
                          ),
                        ).map((metric) => (
                          <tr key={metric} className="border-b border-gray-100">
                            <td className="px-3 py-2 font-medium capitalize text-gray-600">
                              {metric.replaceAll("_", " ")}
                            </td>
                            {comparisonVersionIds.map((id) => {
                              const item = modelVersions.find(
                                (version) => version.id === id,
                              );
                              const value = item?.metrics?.[metric];
                              return (
                                <td
                                  key={id}
                                  className="px-3 py-2 text-gray-800">
                                  {typeof value === "number"
                                    ? Number(value.toFixed(4))
                                    : (value ?? "—")}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {comparisonVersionIds.map((id) => {
                      const item = modelVersions.find(
                        (version) => version.id === id,
                      );
                      const detail = comparisonDetails[id] ?? {};
                      const trainingEntries = Object.entries(detail).filter(
                        ([key]) =>
                          /training|parameter|dataset|started|finished|error|result/i.test(
                            key,
                          ),
                      );
                      return (
                        <div key={id} className="rounded-lg bg-gray-50 p-3">
                          <h4 className="mb-2 text-sm font-semibold text-gray-900">
                            {item
                              ? `Version ${item.version} training details`
                              : "Training details"}
                          </h4>
                          {trainingEntries.length > 0 ? (
                            <dl className="space-y-2 text-xs">
                              {trainingEntries.map(([key, value]) => (
                                <div key={key}>
                                  <dt className="font-medium capitalize text-gray-500">
                                    {key.replaceAll("_", " ")}
                                  </dt>
                                  <dd className="mt-0.5 break-words text-gray-800">
                                    {typeof value === "string"
                                      ? value
                                      : JSON.stringify(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="text-xs text-gray-500">
                              No additional training details were returned for
                              this version.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* Selected model details */}
      {selectedModel && (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Model Details
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedModel.name}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                  selectedModel.status,
                )}`}>
                {selectedModel.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Algorithm</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedModel.algorithm}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Task Type</p>
                <p className="mt-1 font-semibold capitalize text-gray-900">
                  {selectedModel.task_type}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Created At</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(selectedModel.created_at)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Model ID</p>
                <p className="mt-1 break-all text-xs font-medium text-gray-900">
                  {selectedModel.id}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-gray-900">
                Training Metrics
              </h3>

              {selectedModel.metrics &&
              Object.keys(selectedModel.metrics).length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(selectedModel.metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs capitalize text-gray-500">
                        {key.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {typeof value === "number"
                          ? Number(value.toFixed(4))
                          : value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No training metrics available.
                </p>
              )}
            </div>
          </section>

          {/* Artifact Management */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Artifact Management
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Check the Python model artifact and feature schema files.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setArtifactRefreshKey((value) => value + 1)}
                disabled={artifactLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw
                  size={15}
                  className={artifactLoading ? "animate-spin" : ""}
                />
                Refresh artifacts
              </button>
            </div>

            {artifactLoading ? (
              <p className="py-6 text-center text-sm text-gray-500">
                Checking Python artifacts...
              </p>
            ) : artifactError ? (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{artifactError}</span>
              </div>
            ) : artifactStatus ? (
              <>
                <div
                  className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                    artifactStatus.complete
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                  {artifactStatus.complete ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <FileWarning size={18} />
                  )}

                  {artifactStatus.complete
                    ? "Artifact and schema are both available."
                    : "One or more required files are missing."}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Joblib artifact */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BrainCircuit size={19} className="text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          Model Artifact
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          artifactStatus.artifact.exists
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                        {artifactStatus.artifact.exists
                          ? "Available"
                          : "Missing"}
                      </span>
                    </div>

                    <p className="mt-3 break-all text-sm text-gray-600">
                      {artifactStatus.artifact.filename ??
                        "Artifact file not found"}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Size: {formatFileSize(artifactStatus.artifact.size_bytes)}
                    </p>
                  </div>

                  {/* Schema artifact */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Database size={19} className="text-purple-600" />
                        <h3 className="font-semibold text-gray-900">
                          Feature Schema
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          artifactStatus.schema.exists
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                        {artifactStatus.schema.exists ? "Available" : "Missing"}
                      </span>
                    </div>

                    <p className="mt-3 break-all text-sm text-gray-600">
                      {artifactStatus.schema.filename ??
                        "Schema file not found"}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Size: {formatFileSize(artifactStatus.schema.size_bytes)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-gray-500">
                Artifact status has not been loaded.
              </p>
            )}
          </section>

          {/* Dynamic Prediction */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Model Prediction
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Enter feature values to generate a prediction using this model.
              </p>
            </div>

            {schemaLoading ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Loading model feature schema...
              </p>
            ) : schemaError ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} />
                {schemaError}
              </div>
            ) : modelSchema ? (
              <>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Task</p>
                    <p className="mt-1 font-medium capitalize text-gray-900">
                      {modelSchema.task}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Target Column</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {modelSchema.target_column}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Features</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {modelSchema.features.length}
                    </p>
                  </div>
                </div>

                {modelSchema.features.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No prediction features were found in this model schema.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {modelSchema.features.map((feature) => {
                      const normalizedType = feature.type.toLowerCase();

                      const isBoolean = normalizedType.includes("bool");

                      const isNumeric =
                        normalizedType.includes("int") ||
                        normalizedType.includes("float") ||
                        normalizedType.includes("double") ||
                        normalizedType.includes("number");

                      return (
                        <div key={feature.name}>
                          <label
                            htmlFor={`feature-${feature.name}`}
                            className="mb-2 block text-sm font-medium text-gray-700">
                            {feature.name}

                            {!feature.nullable && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </label>

                          {isBoolean ? (
                            <select
                              id={`feature-${feature.name}`}
                              value={predictionValues[feature.name] ?? ""}
                              onChange={(event) =>
                                handlePredictionValueChange(
                                  feature.name,
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                              <option value="">Select a value</option>
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <input
                              id={`feature-${feature.name}`}
                              type={isNumeric ? "number" : "text"}
                              step={
                                normalizedType.includes("int") ? "1" : "any"
                              }
                              value={predictionValues[feature.name] ?? ""}
                              onChange={(event) =>
                                handlePredictionValueChange(
                                  feature.name,
                                  event.target.value,
                                )
                              }
                              placeholder={`Enter ${feature.name}`}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          )}

                          <p className="mt-1 text-xs text-gray-400">
                            Type: {feature.type}
                            {feature.nullable ? " · Optional" : " · Required"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {predictionError && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} />
                    {predictionError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePrediction}
                  disabled={
                    predictionLoading || modelSchema.features.length === 0
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <BrainCircuit size={17} />
                  {predictionLoading
                    ? "Generating prediction..."
                    : "Run Prediction"}
                </button>

                {predictionResult !== null && (
                  <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-green-700">
                      <CheckCircle2 size={18} />
                      <h3 className="font-semibold">Prediction Result</h3>
                    </div>

                    <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm text-gray-800">
                      {JSON.stringify(predictionResult, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Select a model to load its prediction schema.
              </p>
            )}
          </section>
        </>
      )}

      {/* Training History */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Training History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Recent model training jobs for your organization.
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No training jobs found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="px-3 py-3 font-medium">Job ID</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Finished</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-100">
                    <td className="px-3 py-4 font-mono text-xs text-gray-600">
                      {job.id}
                    </td>

                    <td className="px-3 py-4 text-gray-700">{job.job_type}</td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          job.status,
                        )}`}>
                        {job.status}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-gray-500">
                      {formatDate(job.created_at)}
                    </td>

                    <td className="px-3 py-4 text-gray-500">
                      {formatDate(job.finished_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
