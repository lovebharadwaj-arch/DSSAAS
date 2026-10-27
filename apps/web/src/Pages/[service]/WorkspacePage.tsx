import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  FileSpreadsheet,
  Gauge,
  MessageSquareText,
  Network,
  Play,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

type ServiceKey = "ML" | "DL" | "NLP" | "Computer Vision" | "AI";

const serviceInfo: Record<
  ServiceKey,
  {
    subtitle: string;
    description: string;
    icon: React.ElementType;
    color: string;
    tag: string;
    bullets: string[];
  }
> = {
  ML: {
    subtitle: "Machine Learning",
    description:
      "Train predictive models, evaluate performance, and understand the patterns in your data.",
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

export default function WorkspacePage({
  service,
  onBack,
}: {
  service: ServiceKey;
  onBack: () => void;
}) {
  const [task, setTask] = useState(
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
  const [dataset, setDataset] = useState("Customer Churn");
  const [algorithm, setAlgorithm] = useState(
    service === "ML"
      ? "Logistic Regression"
      : service === "DL"
        ? "Dense neural network"
        : service === "NLP"
          ? "Text classification pipeline"
          : service === "Computer Vision"
            ? "Transfer learning"
            : "DSSAAS AI Assistant",
  );
  const [target, setTarget] = useState("churn");
  const info = serviceInfo[service];
  const Icon = info.icon;
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
    ML: [
      "Logistic Regression",
      "Random Forest",
      "Decision Tree",
      "XGBoost",
      "K-Means",
    ],
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

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-xs text-slate-500 hover:text-white">
          <ChevronLeft size={14} /> All services
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
            Workspace ready
          </span>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">Configure workflow</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose your data and customize the task
                </p>
              </div>
              <span className="text-[10px] text-slate-500">STEP 01 / 03</span>
            </div>
            <label className="form-label">Select dataset</label>
            <select
              className="form-select mb-5"
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}>
              <option>Customer Churn</option>
              <option>Retail Sales Q3</option>
              <option>Marketing Campaign</option>
              <option>Product Reviews</option>
            </select>
            <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <div className="file-icon tone-blue">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">
                    {dataset}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    CSV dataset · uploaded sample
                  </div>
                </div>
                <span className="status-pill status-ready">
                  <span className="status-dot" /> Ready
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
                <div>
                  <div className="text-lg font-bold text-white">
                    {dataset === "Retail Sales Q3"
                      ? "18.4K"
                      : dataset === "Product Reviews"
                        ? "12.6K"
                        : dataset === "Marketing Campaign"
                          ? "3.8K"
                          : "7.0K"}
                  </div>
                  <div className="text-[10px] text-slate-500">Rows</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {dataset === "Retail Sales Q3"
                      ? 14
                      : dataset === "Product Reviews"
                        ? 8
                        : dataset === "Marketing Campaign"
                          ? 18
                          : 21}
                  </div>
                  <div className="text-[10px] text-slate-500">Columns</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-300">100%</div>
                  <div className="text-[10px] text-slate-500">Loaded</div>
                </div>
              </div>
            </div>
            <label className="form-label">Choose task</label>
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {tasks[service].map((t) => (
                <button
                  key={t}
                  onClick={() => setTask(t)}
                  className={cx(
                    "choice-card",
                    task === t && "choice-card-active",
                  )}>
                  <span
                    className={cx(
                      "choice-radio",
                      task === t && "choice-radio-active",
                    )}>
                    {task === t && <Check size={10} />}
                  </span>
                  <span className="text-xs font-medium text-slate-200">
                    {t}
                  </span>
                </button>
              ))}
            </div>
            <label className="form-label">Algorithm / model</label>
            <select
              className="form-select mb-5"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}>
              {algorithms[service].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            {service === "ML" && (
              <>
                <label className="form-label">Target column</label>
                <select
                  className="form-select mb-5"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}>
                  <option value="churn">churn</option>
                  <option value="customer_segment">customer_segment</option>
                  <option value="monthly_spend">monthly_spend</option>
                </select>
                <label className="form-label">
                  Test split{" "}
                  <span className="float-right text-indigo-300">20%</span>
                </label>
                <input
                  type="range"
                  className="mb-2 w-full accent-indigo-400"
                  min="10"
                  max="40"
                  defaultValue="20"
                />
                <div className="mb-5 flex justify-between text-[10px] text-slate-500">
                  <span>10% test</span>
                  <span>40% test</span>
                </div>
              </>
            )}
            <div className="flex flex-col gap-2 border-t border-slate-800 pt-5 sm:flex-row">
              <button
                className="primary-button"
                onClick={() =>
                  window.alert(
                    "UI preview only. Model execution will be connected later.",
                  )
                }>
                <Play size={15} />{" "}
                {service === "AI" ? "Run assistant" : "Configure & continue"}{" "}
                <ArrowRight size={14} />
              </button>
              <button
                className="secondary-button"
                onClick={() =>
                  window.alert("Demo UI: configuration saved locally only.")
                }>
                Save draft
              </button>
            </div>
            <p className="mt-3 text-[10px] text-slate-500">
              Preview only · no data is sent or model trained.
            </p>
          </section>
          <section className="panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">Dataset preview</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Sample rows · demo values
                </p>
              </div>
              <button className="secondary-button !px-3 !py-2">
                <Eye size={13} /> View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>customer_id</th>
                    <th>tenure</th>
                    <th>monthly_spend</th>
                    <th>churn</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["C-1001", "12", "$84.20", "No"],
                    ["C-1002", "3", "$49.00", "Yes"],
                    ["C-1003", "28", "$120.50", "No"],
                    ["C-1004", "8", "$65.40", "Yes"],
                  ].map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td
                          key={j}
                          className={
                            j === 3
                              ? v === "Yes"
                                ? "text-rose-300"
                                : "text-emerald-300"
                              : ""
                          }>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
                { l: "Service", v: service },
                { l: "Dataset", v: dataset },
                { l: "Task", v: task },
                { l: "Model", v: algorithm },
                {
                  l: "Target",
                  v: service === "ML" ? target : "Not applicable",
                },
              ].map((x) => (
                <div
                  key={x.l}
                  className="flex items-start justify-between gap-3">
                  <span className="text-xs text-slate-500">{x.l}</span>
                  <span className="max-w-[60%] text-right text-xs font-medium text-slate-200">
                    {x.v}
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
                  Your configuration is ready for review. Connect the training
                  service later to run this workflow.
                </p>
              </div>
            </div>
          </section>
          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Pipeline progress</h2>
              <span className="text-[10px] text-slate-500">0 / 3</span>
            </div>
            {["Data validation", "Feature preparation", "Model execution"].map(
              (x, i) => (
                <div key={x} className="flex gap-3 pb-4 last:pb-0">
                  <div
                    className={cx(
                      "pipeline-step",
                      i === 0 ? "pipeline-current" : "",
                    )}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">
                      {x}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {i === 0
                        ? "Ready to validate"
                        : "Waiting for previous step"}
                    </div>
                  </div>
                </div>
              ),
            )}
          </section>
          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-300" />
              <h2 className="text-sm font-semibold text-white">
                Privacy & security
              </h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Workspace data is shown here as sample content. Organization
              permissions and API security will be connected in a later
              integration step.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
