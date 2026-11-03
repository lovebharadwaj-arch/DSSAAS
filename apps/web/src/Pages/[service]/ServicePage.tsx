import {
  ArrowRight,
  BrainCircuit,
  CircleHelp,
  Gauge,
  Image,
  MessageSquareText,
  Network,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import PageHeader from "../../component/dashboard/PageHeader";

type PageKey =
  | "Dashboard"
  | "Datasets"
  | "Analytics"
  | "AI Services"
  | "ML Workspace"
  | "DL Workspace"
  | "NLP Workspace"
  | "Computer Vision Workspace"
  | "AI Workspace"
  | "Models"
  | "CSV Corrector"
  | "Reports"
  | "Team"
  | "Settings"
  | "Login"
  | "Signup";
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

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function ServicesPage({
  setPage,
  setService,
}: {
  setPage: React.Dispatch<React.SetStateAction<any>>;
  setService: (s: ServiceKey) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="INTELLIGENCE STUDIO"
        title="AI Services"
        subtitle="Choose a specialized workspace and start turning your data into actionable intelligence."
      />
      <div className="service-hero mb-6 overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="relative z-10 max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-[10px] font-semibold text-indigo-200">
            <Sparkles size={13} /> YOUR AI TOOLKIT
          </div>
          <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
            From raw data to{" "}
            <span className="gradient-text">real intelligence.</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
            A unified workspace for machine learning, deep learning, language,
            vision, and AI-assisted analysis.
          </p>
          <button
            onClick={() => {
              setService("ML");
              setPage("ML Workspace");
            }}
            className="primary-button mt-5">
            Explore ML Studio <ArrowRight size={15} />
          </button>
        </div>
        <div className="hero-orbit">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-center">
            <BrainCircuit size={32} />
          </div>
          <div className="orbit-node node-a">
            <Gauge size={16} />
          </div>
          <div className="orbit-node node-b">
            <MessageSquareText size={16} />
          </div>
          <div className="orbit-node node-c">
            <Image size={16} />
          </div>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Explore workspaces</h2>
          <p className="mt-1 text-xs text-slate-500">
            Five powerful ways to work with your data
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-400">
          5 services
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {(Object.keys(serviceInfo) as ServiceKey[]).map((key) => {
          const s = serviceInfo[key];
          const Icon = s.icon;
          return (
            <button
              key={key}
              onClick={() => {
                setService(key);
                setPage(
                  key === "ML"
                    ? "ML Workspace"
                    : key === "DL"
                      ? "DL Workspace"
                      : key === "NLP"
                        ? "NLP Workspace"
                        : key === "Computer Vision"
                          ? "Computer Vision Workspace"
                          : "AI Workspace",
                );
              }}
              className="service-card text-left">
              <div className="flex items-start justify-between">
                <div className={cx("service-icon", `tone-${s.color}`)}>
                  <Icon size={22} />
                </div>
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[9px] text-slate-400">
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {s.subtitle}
              </h3>
              <p className="mt-2 min-h-[48px] text-xs leading-5 text-slate-400">
                {s.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.bullets.map((b) => (
                  <span
                    key={b}
                    className="rounded-md bg-slate-800/80 px-2 py-1 text-[10px] text-slate-300">
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 text-xs font-semibold text-indigo-300">
                <span>Open workspace</span>
                <ArrowRight size={15} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="panel mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="stat-icon tone-violet">
            <CircleHelp size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Not sure where to start?
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Use the AI assistant to explore your dataset and suggest a
              workflow.
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setService("AI");
            setPage("AI Services");
          }}
          className="secondary-button">
          Ask AI assistant <Sparkles size={14} />
        </button>
      </div>
    </>
  );
}
