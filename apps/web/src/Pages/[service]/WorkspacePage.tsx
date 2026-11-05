import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  Database,
  Eye,
  FileSpreadsheet,
  Gauge,
  LoaderCircle,
  MessageSquareText,
  Network,
  Play,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getDatasetPreview,
  getDatasets,
  listModels,
  trainDatasetModel,
  type DatasetOption,
  type DatasetPreview,
  type MLModelSummary,
  type MLTrainingResponse,
} from "../../service/mlTrainingService";

type ServiceKey = "ML" | "DL" | "NLP" | "Computer Vision" | "AI";

type ServiceInfo = {
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  tag: string;
  bullets: string[];
};

const serviceInfo: Record<ServiceKey, ServiceInfo> = {
  ML: {
    subtitle: "Machine Learning",
    description:
      "Train predictive models, evaluate performance, and understand patterns in your organization's data.",
    icon: Gauge,
    color: "blue",
    tag: "Predictive analytics",
    bullets: ["Classification", "Regression", "Clustering"],
  },
  DL: {
    subtitle: "Deep Learning",
    description:
      "Build neural-network workflows for complex patterns and high-dimensional data.",
    icon: Network,
    color: "violet",
    tag: "Neural networks",
    bullets: ["Neural networks", "Computer vision models", "Sequence models"],
  },
  NLP: {
    subtitle: "Natural Language Processing",
    description:
      "Turn documents and text into searchable signals, summaries, and useful insights.",
    icon: MessageSquareText,
    color: "pink",
    tag: "Text intelligence",
    bullets: ["Sentiment analysis", "Text classification", "Entity extraction"],
  },
  "Computer Vision": {
    subtitle: "Computer Vision",
    description:
      "Analyze images and visual data with practical computer-vision workflows.",
    icon: ScanSearch,
    color: "amber",
    tag: "Visual intelligence",
    bullets: [
      "Image classification",
      "Object detection",
      "Image quality checks",
    ],
  },
  AI: {
    subtitle: "AI Playground",
    description:
      "Explore AI-powered workflows, prompts, and intelligent data assistants.",
    icon: Sparkles,
    color: "emerald",
    tag: "AI workspace",
    bullets: ["Data assistant", "Prompt playground", "Insight generation"],
  },
};

const tasks: Record<ServiceKey, string[]> = {
  ML: ["Classification", "Regression", "Clustering"],
  DL: ["Neural network", "Image model", "Sequence model"],
  NLP: [
    "Sentiment analysis",
    "Text classification",
    "Entity extraction",
    "Text summarization",
  ],
  "Computer Vision": [
    "Image classification",
    "Object detection",
    "Image quality check",
  ],
  AI: ["Data assistant", "Insight generation", "Prompt playground"],
};

const algorithms: Record<ServiceKey, string[]> = {
  ML: ["Automatic (Python service)"],
  DL: ["Dense neural network", "CNN", "RNN / LSTM", "Transformer"],
  NLP: [
    "Text classification pipeline",
    "Sentiment pipeline",
    "Named entity recognition",
    "Transformer embeddings",
  ],
  "Computer Vision": [
    "Transfer learning",
    "CNN classifier",
    "Object detection model",
  ],
  AI: ["DSSAAS AI Assistant", "Dataset copilot", "Custom prompt"],
};

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function formatMetricName(name: string) {
  return name
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeDatasetOptions(payload: unknown): DatasetOption[] {
  let value: unknown = payload;

  for (let depth = 0; depth < 4 && !Array.isArray(value); depth += 1) {
    if (!value || typeof value !== "object") return [];

    const record = value as Record<string, unknown>;
    value = record.datasets ?? record.data ?? record.items ?? record.rows;
  }

  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object",
    )
    .map((item) => ({
      id: String(item.id ?? item.datasetId ?? item.dataset_id ?? ""),
      name: String(
        item.name ??
          item.datasetName ??
          item.dataset_name ??
          item.original_filename ??
          "Unnamed dataset",
      ),
      status: String(item.status ?? "unknown"),
    }))
    .filter((item) => item.id.length > 0);
}

function normalizeDatasetPreview(payload: unknown): DatasetPreview | null {
  let value: unknown = payload;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;

    if (Array.isArray(record.columns) || Array.isArray(record.rows)) {
      break;
    }

    const nested =
      record.preview ?? record.data ?? record.result ?? record.dataset;

    if (!nested || nested === value) break;

    value = nested;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawRows = Array.isArray(record.rows) ? record.rows : [];

  const rows: Record<string, unknown>[] = rawRows.map((row) => {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      return row as Record<string, unknown>;
    }

    return {};
  });

  const rawColumns = Array.isArray(record.columns) ? record.columns : [];

  const columns = rawColumns
    .map((column) => {
      if (typeof column === "string") return column;

      if (column && typeof column === "object") {
        const item = column as Record<string, unknown>;
        const name = item.name ?? item.column ?? item.key;

        return typeof name === "string" ? name : "";
      }

      return "";
    })
    .filter(Boolean);

  const inferredColumns =
    columns.length > 0 ? columns : Object.keys(rows[0] ?? {});

  if (inferredColumns.length === 0 && rows.length === 0) {
    return null;
  }

  return {
    datasetId: String(record.datasetId ?? record.dataset_id ?? ""),
    columns: inferredColumns,
    rows: rows as DatasetPreview["rows"],
    rowCount:
      typeof record.rowCount === "number" ? record.rowCount : rows.length,
    limit: typeof record.limit === "number" ? record.limit : rows.length,
    hasMore: typeof record.hasMore === "boolean" ? record.hasMore : false,
  };
}

export default function WorkspacePage({
  service,
  onBack,
}: {
  service: ServiceKey;
  onBack: () => void;
}) {
  const [task, setTask] = useState<string>(
    service === "ML"
      ? "Classification"
      : service === "NLP"
        ? "Sentiment analysis"
        : service === "Computer Vision"
          ? "Image classification"
          : service === "DL"
            ? "Neural network"
            : "Data assistant",
  );

  const [algorithm, setAlgorithm] = useState(algorithms[service][0]);

  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [preview, setPreview] = useState<DatasetPreview | null>(null);

  const [target, setTarget] = useState("");
  const [testSize, setTestSize] = useState(20);

  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [training, setTraining] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [trainingResult, setTrainingResult] =
    useState<MLTrainingResponse | null>(null);

  // Model versioning state
  const [models, setModels] = useState<MLModelSummary[]>([]);
  const [sourceModelId, setSourceModelId] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);

  const [organizationId] = useState(
    () => sessionStorage.getItem("organizationId") ?? "",
  );

  const [token] = useState(() => sessionStorage.getItem("accessToken") ?? "");

  const info = serviceInfo[service];
  const Icon = info.icon;

  const selectedDataset = useMemo(
    () => datasets.find((item) => item.id === datasetId),
    [datasets, datasetId],
  );

  // Only the latest ready version of a matching task can be continued.
  const availableSourceModels = useMemo(() => {
    const selectedTask = task.toLowerCase();

    return models.filter(
      (model) =>
        model.status === "ready" &&
        model.is_latest === true &&
        model.task_type === selectedTask,
    );
  }, [models, task]);

  const selectedSourceModel = useMemo(
    () =>
      availableSourceModels.find((model) => model.id === sourceModelId) ?? null,
    [availableSourceModels, sourceModelId],
  );

  // Load organization datasets.
  useEffect(() => {
    if (service !== "ML") return;

    if (!organizationId || !token) {
      setError("Please sign in and select your organization to load datasets.");
      return;
    }

    let cancelled = false;

    async function loadDatasets() {
      setLoadingDatasets(true);
      setError("");

      try {
        const response: unknown = await getDatasets(organizationId, token);

        if (cancelled) return;

        const result = normalizeDatasetOptions(response);

        setDatasets(result);

        setDatasetId((current) =>
          current && result.some((item) => item.id === current)
            ? current
            : (result[0]?.id ?? ""),
        );

        if (result.length === 0) {
          setError(
            "The API response did not contain any datasets. Check the dataset list endpoint response shape.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load datasets.",
          );
        }
      } finally {
        if (!cancelled) setLoadingDatasets(false);
      }
    }

    void loadDatasets();

    return () => {
      cancelled = true;
    };
  }, [service, organizationId, token]);

  // Load existing models for version continuation.
  useEffect(() => {
    if (service !== "ML") return;

    if (!organizationId || !token) return;

    let cancelled = false;

    async function loadExistingModels() {
      setLoadingModels(true);

      try {
        const response = await listModels(organizationId, token);

        if (cancelled) return;

        const modelList = Array.isArray(response.models) ? response.models : [];

        setModels(modelList);
      } catch (err) {
        if (!cancelled) {
          setModels([]);
          setSourceModelId("");

          console.error("Unable to load existing models:", err);
        }
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    }

    void loadExistingModels();

    return () => {
      cancelled = true;
    };
  }, [service, organizationId, token]);

  // Clear an invalid selection when task or available models change.
  useEffect(() => {
    if (
      sourceModelId &&
      !availableSourceModels.some((model) => model.id === sourceModelId)
    ) {
      setSourceModelId("");
    }
  }, [availableSourceModels, sourceModelId]);

  // Load dataset preview when the selected dataset changes.
  useEffect(() => {
    if (service !== "ML" || !organizationId || !token || !datasetId) {
      setPreview(null);
      setTarget("");
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setLoadingPreview(true);
      setError("");
      setNotice("");
      setPreview(null);
      setTarget("");
      setTrainingResult(null);

      try {
        const response: unknown = await getDatasetPreview(
          organizationId,
          datasetId,
          token,
        );

        if (cancelled) return;

        const result = normalizeDatasetPreview(response);

        if (!result) {
          setPreview(null);
          setTarget("");

          setError(
            "The dataset preview API returned an unexpected response. Expected columns and rows; check the preview endpoint response in DevTools → Network.",
          );

          return;
        }

        setPreview(result);
        setTarget(result.columns[0] ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dataset columns.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [service, organizationId, token, datasetId]);

  // Reset service-specific selections.
  useEffect(() => {
    setTask(
      service === "ML"
        ? "Classification"
        : service === "NLP"
          ? "Sentiment analysis"
          : service === "Computer Vision"
            ? "Image classification"
            : service === "DL"
              ? "Neural network"
              : "Data assistant",
    );

    setAlgorithm(algorithms[service][0]);
  }, [service]);

  async function handleTrainModel() {
    if (!organizationId || !token) {
      setError("Please sign in before training a model.");
      return;
    }

    if (!datasetId || !target) {
      setError("Select a dataset and target column before training.");
      return;
    }

    if (task !== "Classification" && task !== "Regression") {
      setError(
        "Clustering is not supported by the current Python training endpoint. Choose Classification or Regression.",
      );
      return;
    }

    if (!preview?.columns.includes(target)) {
      setError(
        "The selected target column is not present in the dataset preview. Reload the dataset and try again.",
      );
      return;
    }

    // Validate the selected source model before submitting.
    if (
      sourceModelId &&
      !availableSourceModels.some((model) => model.id === sourceModelId)
    ) {
      setError(
        "The selected source model is no longer available. Refresh the model list and select another model.",
      );
      return;
    }

    setTraining(true);
    setError("");
    setNotice("");
    setTrainingResult(null);

    try {
      const result: unknown = await trainDatasetModel(
        organizationId,
        datasetId,
        token,
        {
          targetColumn: target,
          task: task.toLowerCase() as "classification" | "regression",
          testSize: testSize / 100,

          // No sourceModelId means create a new model family.
          ...(sourceModelId ? { sourceModelId } : {}),
        },
      );

      console.log("ML Training API Response:", result);

      if (
        !result ||
        typeof result !== "object" ||
        !("result" in result) ||
        !result.result ||
        typeof result.result !== "object"
      ) {
        throw new Error(
          "Training completed, but the API returned an unexpected response structure. Check the training API response.",
        );
      }

      setTrainingResult(result as MLTrainingResponse);

      setNotice(
        selectedSourceModel
          ? `Training completed successfully. A new version of ${selectedSourceModel.name} has been created.`
          : "Training completed successfully. A new model family has been created.",
      );

      // Refresh models so the next version becomes selectable.
      const refreshed = await listModels(organizationId, token);

      if (Array.isArray(refreshed.models)) {
        setModels(refreshed.models);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Model training failed.");
    } finally {
      setTraining(false);
    }
  }

  function handlePrimaryAction() {
    if (service === "ML") {
      void handleTrainModel();
      return;
    }

    setNotice(
      `${info.subtitle} is currently a UI preview. Its execution endpoint has not been connected yet.`,
    );

    setError("");
  }

  const isMLTaskSupported = task === "Classification" || task === "Regression";

  const previewColumns = preview?.columns ?? [];
  const previewRows = preview?.rows ?? [];

  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-xs text-slate-500 transition hover:text-white">
          <ChevronLeft size={14} />
          All services
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className={cx("service-icon h-14 w-14", `tone-${info.color}`)}>
              <Icon size={26} />
            </div>

            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-indigo-300">
                {info.subtitle}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {service === "ML"
                  ? "ML Studio"
                  : service === "DL"
                    ? "Deep Learning Studio"
                    : service === "NLP"
                      ? "Language Studio"
                      : service === "Computer Vision"
                        ? "Vision Studio"
                        : "AI Playground"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {info.description}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {service === "ML" ? "API-connected workflow" : "Workspace preview"}
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <div className="min-w-0 flex-1">{error}</div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">Configure workflow</h2>

                <p className="mt-1 text-xs text-slate-500">
                  Choose your data and customize the task
                </p>
              </div>

              <span className="whitespace-nowrap text-[10px] text-slate-500">
                STEP 01 / 03
              </span>
            </div>

            <label htmlFor="workspace-dataset" className="form-label">
              Select dataset
            </label>

            {service === "ML" ? (
              <select
                id="workspace-dataset"
                className="form-select mb-5"
                value={datasetId}
                disabled={loadingDatasets || datasets.length === 0}
                onChange={(event) => setDatasetId(event.target.value)}>
                {loadingDatasets && (
                  <option value="">Loading datasets...</option>
                )}

                {!loadingDatasets && datasets.length === 0 && (
                  <option value="">No datasets available</option>
                )}

                {datasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="workspace-dataset"
                className="form-select mb-5"
                value=""
                disabled>
                <option value="">
                  Dataset selection will be available when this service is
                  connected
                </option>
              </select>
            )}

            {/* Model family and version selection */}
            {service === "ML" && (
              <div className="mb-5">
                <label htmlFor="workspace-source-model" className="form-label">
                  Model versioning
                </label>

                <select
                  id="workspace-source-model"
                  className="form-select"
                  value={sourceModelId}
                  disabled={loadingModels || training}
                  onChange={(event) => {
                    setSourceModelId(event.target.value);
                    setError("");
                    setNotice("");
                    setTrainingResult(null);
                  }}>
                  <option value="">Create a new model (Version 1)</option>

                  {availableSourceModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} · v{model.version} · {model.algorithm}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-[10px] leading-5 text-slate-500">
                  {loadingModels
                    ? "Loading existing models..."
                    : selectedSourceModel
                      ? `Continuing ${selectedSourceModel.name}: the next version will be v${selectedSourceModel.version + 1}.`
                      : availableSourceModels.length > 0
                        ? "Select an existing model to create its next version, or create a new model family."
                        : "No compatible ready models found. Training will create a new model family."}
                </p>
              </div>
            )}

            <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="file-icon tone-blue">
                  <FileSpreadsheet size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-white">
                    {service === "ML"
                      ? (selectedDataset?.name ??
                        (loadingDatasets
                          ? "Loading your datasets"
                          : "No dataset selected"))
                      : "Dataset connection pending"}
                  </div>

                  <div className="mt-1 text-[10px] text-slate-500">
                    {service === "ML"
                      ? preview
                        ? `${preview.rowCount} preview rows · ${preview.columns.length} columns detected`
                        : loadingPreview
                          ? "Reading dataset schema..."
                          : "Select a dataset to inspect its schema"
                      : "Connect this service to your organization datasets in a later integration step"}
                  </div>
                </div>

                <span
                  className={cx(
                    "status-pill",
                    service === "ML" && preview
                      ? "status-ready"
                      : "border border-slate-700 text-slate-400",
                  )}>
                  <span className="status-dot" />

                  {service === "ML"
                    ? loadingPreview
                      ? "Loading"
                      : preview
                        ? "Loaded"
                        : "Waiting"
                    : "Preview"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
                <div>
                  <div className="text-lg font-bold text-white">
                    {service === "ML"
                      ? preview
                        ? preview.rowCount
                        : "—"
                      : "—"}
                  </div>
                  <div className="text-[10px] text-slate-500">Preview rows</div>
                </div>

                <div>
                  <div className="text-lg font-bold text-white">
                    {service === "ML"
                      ? preview
                        ? preview.columns.length
                        : "—"
                      : "—"}
                  </div>
                  <div className="text-[10px] text-slate-500">Columns</div>
                </div>

                <div>
                  <div className="text-lg font-bold text-emerald-300">
                    {service === "ML" && preview ? "Ready" : "—"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Schema status
                  </div>
                </div>
              </div>
            </div>

            <label className="form-label">Choose task</label>

            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {tasks[service].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    setTask(item);
                    setError("");
                    setNotice("");
                    setTrainingResult(null);
                  }}
                  className={cx(
                    "choice-card",
                    task === item && "choice-card-active",
                  )}>
                  <span
                    className={cx(
                      "choice-radio",
                      task === item && "choice-radio-active",
                    )}>
                    {task === item && <Check size={10} />}
                  </span>

                  <span className="text-xs font-medium text-slate-200">
                    {item}
                  </span>
                </button>
              ))}
            </div>

            <label htmlFor="workspace-algorithm" className="form-label">
              Algorithm / model
            </label>

            <select
              id="workspace-algorithm"
              className="form-select mb-5"
              value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value)}
              disabled={service === "ML"}>
              {algorithms[service].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {service === "ML" && (
              <p className="-mt-3 mb-5 text-[10px] leading-5 text-slate-500">
                The current Python endpoint selects its algorithm automatically.
                The model returned by the service is shown in the evaluation
                results.
              </p>
            )}

            {service === "ML" && (
              <>
                <label htmlFor="workspace-target" className="form-label">
                  Target column
                </label>

                <select
                  id="workspace-target"
                  className="form-select mb-5"
                  value={target}
                  disabled={loadingPreview || !previewColumns.length}
                  onChange={(event) => setTarget(event.target.value)}>
                  {!previewColumns.length && (
                    <option value="">
                      {loadingPreview
                        ? "Loading columns..."
                        : "No columns available"}
                    </option>
                  )}

                  {previewColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>

                <div className="mb-1 flex items-center justify-between gap-3">
                  <label
                    htmlFor="workspace-test-split"
                    className="form-label !mb-0">
                    Test split
                  </label>

                  <span className="text-xs font-semibold text-indigo-300">
                    {testSize}%
                  </span>
                </div>

                <input
                  id="workspace-test-split"
                  type="range"
                  className="mb-2 w-full accent-indigo-400"
                  min="10"
                  max="40"
                  step="5"
                  value={testSize}
                  onChange={(event) => setTestSize(Number(event.target.value))}
                />

                <div className="mb-5 flex justify-between text-[10px] text-slate-500">
                  <span>10% test · more training data</span>
                  <span>40% test · more evaluation data</span>
                </div>

                {!isMLTaskSupported && (
                  <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">
                    Clustering is visible in the workspace, but this training
                    endpoint currently supports Classification and Regression
                    only.
                  </p>
                )}
              </>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-800 pt-5 sm:flex-row">
              <button
                type="button"
                className="primary-button"
                onClick={handlePrimaryAction}
                disabled={
                  service === "ML" &&
                  (training ||
                    loadingDatasets ||
                    loadingPreview ||
                    !datasetId ||
                    !target ||
                    !isMLTaskSupported)
                }>
                {training ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Play size={15} />
                )}

                {training
                  ? "Training model..."
                  : service === "ML"
                    ? "Train model"
                    : service === "AI"
                      ? "Run assistant"
                      : "Configure & continue"}

                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setNotice(
                    "Draft saving is not connected yet. Your current selections remain in this page until you leave it.",
                  );
                  setError("");
                }}>
                Save draft
              </button>
            </div>

            <p className="mt-3 text-[10px] leading-5 text-slate-500">
              {service === "ML"
                ? "Training sends the selected dataset rows to your Python ML service through the API. Use small datasets for this synchronous workflow."
                : "Preview only · this service's execution endpoint is not connected yet."}
            </p>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">Dataset preview</h2>

                <p className="mt-1 text-xs text-slate-500">
                  {service === "ML"
                    ? "Real sample rows from the selected dataset"
                    : "Sample preview becomes available when the dataset connection is added"}
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-[10px] text-slate-400">
                <Eye size={13} />

                {loadingPreview
                  ? "Loading"
                  : preview
                    ? `${preview.rowCount} rows`
                    : "No preview"}
              </span>
            </div>

            {service === "ML" && preview ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      {previewColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={`${datasetId}-${rowIndex}`}>
                        {previewColumns.map((column) => (
                          <td key={column} className="max-w-56 truncate">
                            {displayCell(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 px-5 py-10 text-center">
                {loadingPreview ? (
                  <LoaderCircle
                    size={22}
                    className="mb-3 animate-spin text-indigo-300"
                  />
                ) : (
                  <Database size={22} className="mb-3 text-slate-600" />
                )}

                <p className="text-xs font-medium text-slate-300">
                  {loadingPreview
                    ? "Loading dataset preview"
                    : "Your data preview will appear here"}
                </p>

                <p className="mt-1 max-w-sm text-[10px] leading-5 text-slate-500">
                  {service === "ML"
                    ? "Choose a dataset above. Column names and sample values will be loaded from your API."
                    : "Connect this service to a dataset to preview real records."}
                </p>
              </div>
            )}
          </section>

          {trainingResult?.result && (
            <section className="panel p-5 sm:p-6">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">
                    <Check size={12} />
                    Training completed
                  </div>

                  <h2 className="font-semibold text-white">
                    Model evaluation results
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {trainingResult.result.algorithm} ·{" "}
                    {trainingResult.result.task} · Target:{" "}
                    {trainingResult.result.target_column}
                  </p>
                </div>

                <span className="text-[10px] text-slate-500">
                  Dataset ID: {trainingResult.datasetId}
                </span>
              </div>

              {Object.keys(trainingResult.result.metrics ?? {}).length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(trainingResult.result.metrics).map(
                    ([name, value]) => (
                      <div
                        key={name}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs capitalize text-slate-400">
                          {formatMetricName(name)}
                        </p>

                        <p className="mt-2 break-all text-2xl font-bold text-emerald-300">
                          {typeof value === "number" && Number.isFinite(value)
                            ? value.toFixed(4)
                            : displayCell(value)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  The training service did not return evaluation metrics.
                </p>
              )}

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {trainingResult.result.total_rows ?? "—"}
                  </p>
                  <p className="text-[10px] text-slate-500">Total rows</p>
                </div>

                <div>
                  <p className="text-lg font-semibold text-white">
                    {trainingResult.result.training_rows ?? "—"}
                  </p>
                  <p className="text-[10px] text-slate-500">Training rows</p>
                </div>

                <div>
                  <p className="text-lg font-semibold text-white">
                    {trainingResult.result.testing_rows ?? "—"}
                  </p>
                  <p className="text-[10px] text-slate-500">Testing rows</p>
                </div>
              </div>

              {trainingResult.result.sample_predictions?.length ? (
                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
                  <table className="data-table min-w-full">
                    <thead>
                      <tr>
                        <th>Actual</th>
                        <th>Predicted</th>
                      </tr>
                    </thead>

                    <tbody>
                      {trainingResult.result.sample_predictions.map(
                        (prediction, index) => (
                          <tr key={index}>
                            <td>{displayCell(prediction.actual)}</td>
                            <td>{displayCell(prediction.predicted)}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="stat-icon tone-violet">
                <SlidersHorizontal size={17} />
              </div>

              <h2 className="font-semibold text-white">Workflow summary</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: "Service", value: service },
                {
                  label: "Dataset",
                  value:
                    service === "ML"
                      ? (selectedDataset?.name ?? "Not selected")
                      : "Not connected",
                },
                { label: "Task", value: task },
                {
                  label: "Model",
                  value:
                    service === "ML" ? "Selected by Python service" : algorithm,
                },
                {
                  label: "Model version",
                  value: selectedSourceModel
                    ? `Continue v${selectedSourceModel.version} → v${selectedSourceModel.version + 1}`
                    : "New model · v1",
                },
                {
                  label: "Target",
                  value:
                    service === "ML"
                      ? target || "Not selected"
                      : "Not applicable",
                },
                {
                  label: "Test split",
                  value: service === "ML" ? `${testSize}%` : "Not applicable",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-3">
                  <span className="text-xs text-slate-500">{item.label}</span>

                  <span className="max-w-[65%] break-words text-right text-xs font-medium text-slate-200">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-indigo-400/15 bg-indigo-400/5 p-3">
              <div className="flex gap-2">
                <Sparkles
                  size={15}
                  className="mt-0.5 shrink-0 text-indigo-300"
                />

                <p className="text-[11px] leading-5 text-slate-300">
                  {service === "ML"
                    ? "Your training configuration is sent to the API. The backend must verify organization access and dataset ownership before reading the file."
                    : "Your configuration is ready for review. Connect the service execution endpoint to run this workflow."}
                </p>
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-white">Pipeline progress</h2>

              <span className="text-[10px] text-slate-500">
                {trainingResult ? "3 / 3" : training ? "2 / 3" : "0 / 3"}
              </span>
            </div>

            {[
              {
                label: "Data validation",
                description: trainingResult
                  ? "Completed"
                  : "Checks run by the API",
              },
              {
                label: "Feature preparation",
                description: trainingResult
                  ? "Completed"
                  : "Handled by the Python pipeline",
              },
              {
                label: "Model execution",
                description: trainingResult
                  ? "Evaluation results returned"
                  : training
                    ? "Training in progress"
                    : "Waiting to start",
              },
            ].map((item, index) => {
              const completed = Boolean(trainingResult);
              const current = training && index === 2;

              return (
                <div key={item.label} className="flex gap-3 pb-4 last:pb-0">
                  <div
                    className={cx(
                      "pipeline-step",
                      completed || current ? "pipeline-current" : "",
                    )}>
                    {completed ? (
                      <Check size={12} />
                    ) : current ? (
                      <LoaderCircle size={12} className="animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-200">
                      {item.label}
                    </div>

                    <div className="mt-1 text-[10px] leading-5 text-slate-500">
                      {item.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-300" />

              <h2 className="text-sm font-semibold text-white">
                Privacy & security
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              The UI sends requests through your authenticated API. Ensure the
              API checks the user's organization membership and dataset
              ownership, limits CSV size and row count, and never trusts a file
              path supplied by the browser.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
