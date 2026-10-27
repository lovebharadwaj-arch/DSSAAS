import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Database,
  FlaskConical,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../lib/api";

interface DatasetOption {
  id: string;
  name: string;
  status?: string;
  original_filename?: string;
}

interface DatasetListResponse {
  success?: boolean;
  data?: DatasetOption[] | { datasets?: DatasetOption[] };
  datasets?: DatasetOption[];
}

const tasks = [
  {
    id: "classification",
    name: "Classification",
    description: "Predict categories, such as customer churn.",
    algorithms: [
      "Logistic Regression",
      "Decision Tree",
      "Random Forest",
      "K-Nearest Neighbors",
    ],
  },
  {
    id: "regression",
    name: "Regression",
    description: "Predict numerical values, such as sales or prices.",
    algorithms: [
      "Linear Regression",
      "Decision Tree Regressor",
      "Random Forest Regressor",
    ],
  },
  {
    id: "clustering",
    name: "Clustering",
    description: "Group similar records without a target column.",
    algorithms: ["K-Means", "DBSCAN", "Agglomerative Clustering"],
  },
];

function normalizeDatasets(response: DatasetListResponse): DatasetOption[] {
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "datasets" in response.data) {
    return response.data.datasets ?? [];
  }
  return response.datasets ?? [];
}

async function getOrganizationDatasets(
  token: string,
  organizationId: string,
): Promise<DatasetOption[]> {
  const response = await apiRequest<DatasetListResponse>(
    `/organizations/${encodeURIComponent(organizationId)}/datasets`,
    token,
  );

  return normalizeDatasets(response);
}

export default function MLWorkspace() {
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasetError, setDatasetError] = useState("");

  const [taskId, setTaskId] = useState("classification");
  const [algorithm, setAlgorithm] = useState("Random Forest");
  const [targetColumn, setTargetColumn] = useState("");
  const [testSplit, setTestSplit] = useState("20");
  const [message, setMessage] = useState("");

  const token = ""; // TODO: replace with existing authenticated user's token
  const organizationId = ""; // TODO: replace with active organization UUID

  const selectedTask = tasks.find((task) => task.id === taskId)!;

  useEffect(() => {
    if (!token || !organizationId) {
      setLoadingDatasets(false);
      setDatasetError(
        "Connect your existing auth token and active organization ID in MLWorkspace.tsx to load datasets.",
      );
      return;
    }

    let cancelled = false;

    async function loadDatasets() {
      setLoadingDatasets(true);
      setDatasetError("");

      try {
        const result = await getOrganizationDatasets(token, organizationId);
        if (!cancelled) {
          setDatasets(result);
        }
      } catch (error) {
        if (!cancelled) {
          setDatasetError(
            error instanceof Error ? error.message : "Unable to load datasets.",
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
  }, [token, organizationId]);

  function handleTaskChange(value: string) {
    const nextTask = tasks.find((task) => task.id === value);
    if (!nextTask) return;

    setTaskId(value);
    setAlgorithm(nextTask.algorithms[0]);
    setMessage("");
  }

  function handleContinue() {
    if (!datasetId) {
      setMessage("Please select a dataset first.");
      return;
    }

    if (taskId !== "clustering" && !targetColumn.trim()) {
      setMessage("Please enter the target column name.");
      return;
    }

    const configuration = {
      organizationId,
      datasetId,
      task: taskId,
      algorithm,
      targetColumn: taskId === "clustering" ? null : targetColumn.trim(),
      testSplit: Number(testSplit),
    };

    // Temporary: replace this with your model-training API integration.
    console.log("ML configuration:", configuration);
    setMessage(
      "Configuration validated. Model execution will be connected in the next step.",
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/services")}
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
          <ArrowLeft size={17} />
          Back to AI Services
        </button>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-900 p-7 text-white sm:p-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Brain size={30} />
            </div>
            <div>
              <p className="text-sm text-blue-200">AI Services / ML</p>
              <h1 className="mt-1 text-3xl font-bold">
                Machine Learning Studio
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-2xl leading-7 text-blue-100/80">
            Configure a machine-learning experiment using your dataset. Select a
            task, choose an algorithm, and prepare your model settings.
          </p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <Database className="text-blue-600" size={22} />
                <div>
                  <h2 className="font-bold">1. Select dataset</h2>
                  <p className="text-sm text-slate-500">
                    Choose a dataset from your organization.
                  </p>
                </div>
              </div>

              <label
                htmlFor="ml-dataset"
                className="mt-5 block text-sm font-medium">
                Dataset
              </label>
              <select
                id="ml-dataset"
                value={datasetId}
                onChange={(event) => {
                  setDatasetId(event.target.value);
                  setMessage("");
                }}
                disabled={loadingDatasets || datasets.length === 0}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100">
                <option value="">
                  {loadingDatasets
                    ? "Loading datasets..."
                    : datasets.length
                      ? "Select a dataset"
                      : "No datasets available"}
                </option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name || dataset.original_filename || dataset.id}
                    {dataset.status ? ` (${dataset.status})` : ""}
                  </option>
                ))}
              </select>

              {datasetError && (
                <p role="alert" className="mt-2 text-sm text-amber-700">
                  {datasetError}
                </p>
              )}
              {!loadingDatasets && !datasetError && datasets.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  No datasets were returned. Upload a dataset first, or verify
                  the list endpoint response.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <FlaskConical className="text-violet-600" size={22} />
                <div>
                  <h2 className="font-bold">2. Choose ML task</h2>
                  <p className="text-sm text-slate-500">
                    Select what you want your model to do.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {tasks.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => handleTaskChange(task.id)}
                    aria-pressed={taskId === task.id}
                    className={`rounded-xl border p-4 text-left transition ${
                      taskId === task.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}>
                    <span className="font-semibold">{task.name}</span>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {task.description}
                    </p>
                  </button>
                ))}
              </div>

              <label
                htmlFor="ml-algorithm"
                className="mt-6 block text-sm font-medium">
                Algorithm
              </label>
              <select
                id="ml-algorithm"
                value={algorithm}
                onChange={(event) => setAlgorithm(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
                {selectedTask.algorithms.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {taskId !== "clustering" && (
                <>
                  <label
                    htmlFor="ml-target"
                    className="mt-5 block text-sm font-medium">
                    Target column
                  </label>
                  <input
                    id="ml-target"
                    value={targetColumn}
                    onChange={(event) => setTargetColumn(event.target.value)}
                    placeholder="e.g. churn, price, or sales"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <Settings2 className="text-emerald-600" size={22} />
                <div>
                  <h2 className="font-bold">3. Experiment settings</h2>
                  <p className="text-sm text-slate-500">
                    Configure the test split for supervised learning.
                  </p>
                </div>
              </div>

              <label
                htmlFor="ml-test-split"
                className="mt-5 block text-sm font-medium">
                Test data percentage
              </label>
              <select
                id="ml-test-split"
                value={testSplit}
                onChange={(event) => setTestSplit(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option value="10">10% test / 90% train</option>
                <option value="20">20% test / 80% train</option>
                <option value="25">25% test / 75% train</option>
                <option value="30">30% test / 70% train</option>
              </select>
              {taskId === "clustering" && (
                <p className="mt-2 text-xs text-slate-500">
                  The test split is displayed for now; clustering usually does
                  not use a target column and may need different evaluation
                  settings.
                </p>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-violet-600" size={21} />
              <h2 className="font-bold">Experiment summary</h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Task</p>
                <p className="mt-1 font-semibold">{selectedTask.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Algorithm</p>
                <p className="mt-1 font-semibold">{algorithm}</p>
              </div>
              <div>
                <p className="text-slate-500">Dataset</p>
                <p className="mt-1 break-words font-semibold">
                  {datasets.find((dataset) => dataset.id === datasetId)?.name ||
                    datasetId ||
                    "Not selected"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Test split</p>
                <p className="mt-1 font-semibold">{testSplit}%</p>
              </div>
            </div>

            {message && (
              <div
                role="status"
                className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">
              Validate configuration
              <ArrowRight size={18} />
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              This validates your selections only. It does not train a model
              yet.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
