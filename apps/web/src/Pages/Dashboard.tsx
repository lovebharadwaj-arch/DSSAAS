import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Database,
  FileCheck2,
  FileSpreadsheet,
  LineChart,
  MoreHorizontal,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Activity } from "react";
import PageHeader from "../component/dashboard/PageHeader";
import StatCard from "../component/dashboard/StatCard";
import MiniChart from "../component/dashboard/MiniChart";
import DatasetTable from "./[service]/DatasetTable";

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

export default function Dashboard({
  setPage,
}: {
  setPage: (p: PageKey) => void;
}) {
  const activity = [
    {
      icon: FileSpreadsheet,
      color: "blue",
      title: "Customer Churn dataset uploaded",
      meta: "CSV · 7,043 rows",
      time: "12 min ago",
    },
    {
      icon: BrainCircuit,
      color: "violet",
      title: "Churn prediction model completed",
      meta: "Machine Learning · 94.2% accuracy",
      time: "1 hour ago",
    },
    {
      icon: FileCheck2,
      color: "emerald",
      title: "Data quality check finished",
      meta: "Retail Sales Q3 · 3 issues resolved",
      time: "3 hours ago",
    },
    {
      icon: BarChart3,
      color: "amber",
      title: "Monthly performance report generated",
      meta: "Analytics · PDF report",
      time: "Yesterday",
    },
  ];

  function cx(...values: (string | false | null | undefined)[]) {
    return values.filter(Boolean).join(" ");
  }

  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW / MONDAY, OCTOBER 21"
        title="Good afternoon 👋"
        subtitle="Here's what's happening across your data workspace today."
        action="Upload dataset"
        onAction={() => setPage("Datasets")}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total datasets"
          value="24"
          change="+12.8%"
          icon={Database}
          color="blue"
        />
        <StatCard
          label="Models trained"
          value="18"
          change="+8.2%"
          icon={BrainCircuit}
          color="violet"
        />
        <StatCard
          label="Insights generated"
          value="146"
          change="+24.6%"
          icon={Sparkles}
          color="emerald"
        />
        <StatCard
          label="Data processed"
          value="8.4 GB"
          change="+4.3%"
          icon={Activity}
          color="amber"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Workspace activity</h2>
              <p className="mt-1 text-xs text-slate-500">
                Data processing and model activity
              </p>
            </div>
            <select className="dark-select">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl font-bold text-white">2,840</span>
            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
              +18.4%
            </span>
          </div>
          <MiniChart />
          <div className="mt-3 flex justify-between text-[10px] text-slate-500">
            <span>Sep 22</span>
            <span>Sep 29</span>
            <span>Oct 06</span>
            <span>Oct 13</span>
            <span>Oct 21</span>
          </div>
        </section>
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Quick launch</h2>
              <p className="mt-1 text-xs text-slate-500">
                Jump into your next task
              </p>
            </div>
            <Sparkles size={18} className="text-indigo-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: "Explore data",
                icon: Database,
                color: "blue",
                page: "Datasets" as PageKey,
              },
              {
                name: "Build a model",
                icon: BrainCircuit,
                color: "violet",
                page: "AI Services" as PageKey,
              },
              {
                name: "Analyze trends",
                icon: LineChart,
                color: "emerald",
                page: "Analytics" as PageKey,
              },
              {
                name: "Clean a CSV",
                icon: WandSparkles,
                color: "amber",
                page: "CSV Corrector" as PageKey,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setPage(item.page)}
                  className="quick-launch">
                  <div className={cx("stat-icon mb-3", `tone-${item.color}`)}>
                    <Icon size={18} />
                  </div>
                  <div className="text-left text-xs font-semibold text-slate-100">
                    {item.name}
                  </div>
                  <ArrowRight size={14} className="mt-2 text-slate-500" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Recent datasets</h2>
              <p className="mt-1 text-xs text-slate-500">
                Your latest data assets
              </p>
            </div>
            <button
              onClick={() => setPage("Datasets")}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
              View all <ArrowRight size={13} className="ml-1 inline" />
            </button>
          </div>
          <DatasetTable compact />
        </section>
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Recent activity</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest events in your workspace
              </p>
            </div>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>
          <div className="space-y-5">
            {activity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-3">
                  <div className={cx("activity-icon", `tone-${item.color}`)}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium leading-5 text-slate-200">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {item.meta}
                    </div>
                  </div>
                  <div className="whitespace-nowrap pt-1 text-[10px] text-slate-500">
                    {item.time}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
