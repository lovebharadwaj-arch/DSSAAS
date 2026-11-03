import {
  Activity,
  AlertCircle,
  BrainCircuit,
  Filter,
  Layers3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../component/dashboard/PageHeader";
import StatCard from "../../component/dashboard/StatCard";

import {
  listModels,
  listTrainingJobs,
  predictModel,
  type MLModelSummary,
  type TrainingJobSummary,
} from "../../service/mlTrainingService";

type ModelFilter = "all" | "ready" | "training" | "failed";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString();
}

function formatMetric(metrics?: Record<string, number>) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return "No metrics";
  }

  const preferredKeys = [
    "accuracy",
    "f1_weighted",
    "r2",
    "precision_weighted",
    "recall_weighted",
    "rmse",
    "mae",
  ];

  const key =
    preferredKeys.find((item) => item in metrics) ?? Object.keys(metrics)[0];

  const value = metrics[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  const label = key.replaceAll("_", " ").toUpperCase();

  const isPercentage = [
    "accuracy",
    "f1_weighted",
    "precision_weighted",
    "recall_weighted",
  ].includes(key);

  const formattedValue = isPercentage
    ? `${(value <= 1 ? value * 100 : value).toFixed(2)}%`
    : value.toFixed(3);

  return `${label}: ${formattedValue}`;
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "ready":
      return "status-ready";

    case "training":
    case "running":
    case "queued":
      return "status-processing";

    default:
      return "status-processing";
  }
}

export default function ModelsPage() {
  // ------------------------------------
  // 1. Model registry state
  // ------------------------------------

  const [models, setModels] = useState<MLModelSummary[]>([]);
  const [jobs, setJobs] = useState<TrainingJobSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobError, setJobError] = useState("");

  const [filter, setFilter] = useState<ModelFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // ------------------------------------
  // 2. Authentication and organization
  // ------------------------------------

  const [token] = useState(() => sessionStorage.getItem("accessToken") ?? "");

  const [organizationId] = useState(
    () => sessionStorage.getItem("organizationId") ?? "",
  );

  // ------------------------------------
  // 3. Selected model and prediction state
  // ------------------------------------

  const [selectedModel, setSelectedModel] = useState<MLModelSummary | null>(
    null,
  );

  const [predictionInput, setPredictionInput] = useState(
    '{\n  "feature_name": 1\n}',
  );

  const [predictionResult, setPredictionResult] = useState<unknown>(null);

  const [predictionLoading, setPredictionLoading] = useState(false);

  const [predictionError, setPredictionError] = useState("");

  // ------------------------------------
  // 4. Fetch models and training jobs
  // ------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setLoading(true);
      setError("");
      setJobError("");

      if (!token || !organizationId) {
        setError(
          "Authentication or organization information is missing. Please log in again.",
        );
        setLoading(false);
        return;
      }

      const [modelResult, jobResult] = await Promise.allSettled([
        listModels(organizationId, token),
        listTrainingJobs(organizationId, token),
      ]);

      if (cancelled) return;

      if (modelResult.status === "fulfilled") {
        const fetchedModels = modelResult.value.models ?? [];

        setModels(fetchedModels);

        // Keep the selected model synchronized with refreshed data.
        setSelectedModel((current) =>
          current
            ? (fetchedModels.find((model) => model.id === current.id) ?? null)
            : null,
        );
      } else {
        setModels([]);

        setError(
          modelResult.reason instanceof Error
            ? modelResult.reason.message
            : "Unable to load models.",
        );
      }

      if (jobResult.status === "fulfilled") {
        setJobs(jobResult.value.jobs ?? []);
      } else {
        setJobs([]);
        setJobError("Training job information could not be loaded.");
      }

      setLoading(false);
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [token, organizationId, refreshKey]);

  // ------------------------------------
  // 5. Statistics and filtering
  // ------------------------------------

  const readyCount = models.filter(
    (model) => model.status.toLowerCase() === "ready",
  ).length;

  const filteredModels = useMemo(() => {
    if (filter === "all") return models;

    return models.filter((model) => model.status.toLowerCase() === filter);
  }, [models, filter]);

  // ------------------------------------
  // 6. Select a model
  // ------------------------------------

  function handleSelectModel(model: MLModelSummary) {
    setSelectedModel(model);

    setPredictionResult(null);
    setPredictionError("");

    // This is an example only.
    // Replace it with the actual feature names of your dataset.
    setPredictionInput('{\n  "feature_name": 1\n}');
  }

  // ------------------------------------
  // 7. Send prediction request
  // ------------------------------------

  async function handlePrediction() {
    if (!selectedModel || !token || !organizationId) {
      setPredictionError("Select a model and log in first.");
      return;
    }

    if (selectedModel.status.toLowerCase() !== "ready") {
      setPredictionError("Only ready models can be used for prediction.");
      return;
    }

    try {
      setPredictionLoading(true);
      setPredictionError("");
      setPredictionResult(null);

      const parsedInput: unknown = JSON.parse(predictionInput);

      if (
        typeof parsedInput !== "object" ||
        parsedInput === null ||
        Array.isArray(parsedInput) ||
        Object.keys(parsedInput).length === 0
      ) {
        throw new Error("Enter a non-empty JSON object.");
      }

      const response = await predictModel(
        organizationId,
        selectedModel.id,
        token,
        {
          input_data: parsedInput as Record<string, unknown>,
        },
      );

      setPredictionResult(response.prediction);
    } catch (error) {
      setPredictionError(
        error instanceof Error ? error.message : "Prediction failed.",
      );
    } finally {
      setPredictionLoading(false);
    }
  }

  // ------------------------------------
  // 8. Page UI
  // ------------------------------------

  return (
    <>
      <PageHeader
        eyebrow="MODEL REGISTRY"
        title="Models"
        subtitle="Manage your trained models, monitor performance, and track experiments."
      />

      {/* Model statistics */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Registered models"
          value={loading ? "..." : String(models.length)}
          change="Total saved models"
          icon={Layers3}
          color="blue"
        />

        <StatCard
          label="Production ready"
          value={loading ? "..." : String(readyCount)}
          change="Models ready for prediction"
          icon={ShieldCheck}
          color="emerald"
        />

        <StatCard
          label="Training experiments"
          value={loading ? "..." : String(jobs.length)}
          change="Total training jobs"
          icon={Activity}
          color="violet"
        />
      </div>

      {/* Model registry */}
      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Model registry</h2>

            <p className="mt-1 text-xs text-slate-500">
              Your trained and saved machine learning models
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as ModelFilter)
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200">
                <option value="all">All models</option>
                <option value="ready">Ready</option>
                <option value="training">Training</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="secondary-button">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {jobError && <p className="mb-4 text-xs text-amber-400">{jobError}</p>}

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading your models...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[750px]">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Algorithm</th>
                  <th>Task</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {filteredModels.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-slate-400">
                      {models.length === 0
                        ? "No models registered yet. Train a model from your ML Workspace."
                        : "No models match this filter."}
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((model) => (
                    <tr key={model.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="file-icon tone-violet">
                            <BrainCircuit size={17} />
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => handleSelectModel(model)}
                              className="text-left text-xs font-semibold text-slate-100 hover:text-violet-400">
                              {model.name}
                            </button>

                            <p className="mt-1 text-[10px] text-slate-500">
                              {model.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="capitalize">
                        {model.algorithm.replaceAll("_", " ")}
                      </td>

                      <td className="capitalize">{model.task_type}</td>

                      <td className="font-semibold text-slate-200">
                        {formatMetric(model.metrics)}
                      </td>

                      <td>
                        <span
                          className={cx(
                            "status-pill",
                            getStatusClass(model.status),
                          )}>
                          {model.status}
                        </span>
                      </td>

                      <td>{formatDate(model.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Selected model details */}
      {selectedModel && (
        <section className="panel mt-5 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-violet-400">
                Model details
              </p>

              <h2 className="mt-2 text-lg font-semibold text-white">
                {selectedModel.name}
              </h2>

              <p className="mt-1 break-all text-xs text-slate-500">
                Model ID: {selectedModel.id}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedModel(null);
                setPredictionResult(null);
                setPredictionError("");
              }}
              className="secondary-button">
              Close
            </button>
          </div>

          {/* Model information */}
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">Algorithm</p>

              <p className="mt-2 text-sm font-semibold capitalize text-white">
                {selectedModel.algorithm.replaceAll("_", " ")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">Task type</p>

              <p className="mt-2 text-sm font-semibold capitalize text-white">
                {selectedModel.task_type}
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">Status</p>

              <p className="mt-2 text-sm font-semibold capitalize text-white">
                {selectedModel.status}
              </p>
            </div>
          </div>

          {/* Model metrics */}
          <h3 className="mb-3 font-semibold text-white">Model performance</h3>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(selectedModel.metrics ?? {}).map(
              ([metric, value]) => (
                <div
                  key={metric}
                  className="rounded-lg border border-slate-700 p-3">
                  <p className="text-xs uppercase text-slate-500">
                    {metric.replaceAll("_", " ")}
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {typeof value === "number"
                      ? value.toFixed(4)
                      : String(value)}
                  </p>
                </div>
              ),
            )}

            {Object.keys(selectedModel.metrics ?? {}).length === 0 && (
              <p className="text-sm text-slate-500">
                No performance metrics available.
              </p>
            )}
          </div>

          {/* Prediction */}
          <div className="border-t border-slate-700 pt-5">
            <h3 className="font-semibold text-white">Make a prediction</h3>

            <p className="mb-3 mt-1 text-xs text-slate-500">
              Enter feature values expected by this trained model. Do not
              include the target column.
            </p>

            <textarea
              value={predictionInput}
              onChange={(event) => {
                setPredictionInput(event.target.value);
                setPredictionError("");
                setPredictionResult(null);
              }}
              rows={6}
              spellCheck={false}
              disabled={predictionLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-200 outline-none focus:border-violet-500"
            />

            {predictionError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {predictionError}
              </div>
            )}

            <button
              type="button"
              onClick={handlePrediction}
              disabled={
                predictionLoading ||
                selectedModel.status.toLowerCase() !== "ready"
              }
              className="primary-button mt-4">
              {predictionLoading ? "Predicting..." : "Run prediction"}
            </button>

            {predictionResult !== null && (
              <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-400">
                  Prediction result
                </p>

                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-slate-200">
                  {JSON.stringify(predictionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
