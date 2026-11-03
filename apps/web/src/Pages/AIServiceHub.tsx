import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Clock3,
  CloudUpload,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  Files,
  Filter,
  Gauge,
  Image,
  Layers3,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquareText,
  MoreHorizontal,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import "./styles.css";

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

const navPrimary: { label: PageKey; icon: React.ElementType; hint?: string }[] =
  [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Datasets", icon: Database },
    { label: "Analytics", icon: BarChart3 },
    { label: "AI Services", icon: BrainCircuit },
    { label: "Models", icon: Layers3 },
    { label: "CSV Corrector", icon: FileCheck2 },
    { label: "Reports", icon: Files },
  ];
const navManage: { label: PageKey; icon: React.ElementType }[] = [
  { label: "Team", icon: Users },
  { label: "Settings", icon: Settings },
];

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

const initialDatasets = [
  {
    name: "Customer Churn",
    file: "customer_churn.csv",
    rows: "7,043",
    cols: 21,
    status: "Ready",
    updated: "12 min ago",
    color: "blue",
  },
  {
    name: "Retail Sales Q3",
    file: "retail_sales_q3.csv",
    rows: "18,420",
    cols: 14,
    status: "Ready",
    updated: "Yesterday",
    color: "violet",
  },
  {
    name: "Marketing Campaign",
    file: "campaign_results.csv",
    rows: "3,812",
    cols: 18,
    status: "Processing",
    updated: "2 min ago",
    color: "amber",
  },
  {
    name: "Product Reviews",
    file: "product_reviews.csv",
    rows: "12,608",
    cols: 8,
    status: "Ready",
    updated: "2 days ago",
    color: "pink",
  },
];

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="brand-mark">
        <BrainCircuit size={21} strokeWidth={2.2} />
      </div>
      <div>
        <div className="text-[17px] font-bold tracking-tight text-white">
          dssa<span className="text-indigo-300">as</span>
        </div>
        <div className="text-[10px] tracking-[.18em] text-slate-500 uppercase">
          Data intelligence
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  page,
  setPage,
  collapsed,
  setCollapsed,
}: {
  page: PageKey;
  setPage: React.Dispatch<React.SetStateAction<any>>;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside className={cx("sidebar", collapsed && "sidebar-collapsed")}>
      <div className="flex h-[78px] items-center justify-between px-5">
        <Brand />
        <button
          className="icon-button text-slate-500"
          onClick={() => setCollapsed(!collapsed)}
          title="Collapse sidebar">
          {collapsed ? (
            <PanelLeftOpen size={17} />
          ) : (
            <PanelLeftClose size={17} />
          )}
        </button>
      </div>
      <div className="px-4 pb-4">
        <button className="workspace-switch">
          <div className="workspace-avatar">A</div>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-xs font-semibold text-white">
              Acme Analytics
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">
              Free workspace
            </div>
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="space-y-1 px-3">
        {navPrimary.map((item) => {
          const Icon = item.icon;
          const active =
            page === item.label ||
            (page === "Login" || page === "Signup" ? false : false);
          return (
            <button
              key={item.label}
              onClick={() => setPage(item.label)}
              className={cx("nav-item", active && "nav-item-active")}
              title={collapsed ? item.label : undefined}>
              <Icon size={17} />
              <span>{item.label}</span>
              {item.label === "AI Services" && (
                <span className="nav-badge">5</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-label mt-7">MANAGE</div>
      <nav className="space-y-1 px-3">
        {navManage.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => setPage(item.label)}
              className={cx(
                "nav-item",
                page === item.label && "nav-item-active",
              )}>
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div className="sidebar-plan">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              Workspace usage
            </span>
            <Zap size={14} className="text-indigo-300" />
          </div>
          <div className="mb-2 flex justify-between text-[10px] text-slate-400">
            <span>Storage used</span>
            <span>2.4 / 10 GB</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full w-[24%] rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" />
          </div>
          <button
            onClick={() => setPage("Settings")}
            className="mt-3 flex w-full items-center justify-between text-xs font-medium text-indigo-200 hover:text-white">
            Upgrade plan <ArrowRight size={13} />
          </button>
        </div>
        <button
          className="nav-item mt-3 w-full"
          onClick={() => setPage("Login")}>
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  page,
  search,
  setSearch,
  setPage,
}: {
  page: string;
  search: string;
  setSearch: (s: string) => void;
  setPage: React.Dispatch<React.SetStateAction<any>>;
}) {
  return (
    <header className="topbar">
      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
        <span>Workspace</span>
        <ChevronRight size={13} />
        <span className="truncate font-semibold text-slate-200">{page}</span>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <label className="top-search hidden md:flex">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anything..."
          />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button relative" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <div className="hidden h-7 w-px bg-slate-800 sm:block" />
        <button
          onClick={() => setPage("Settings")}
          className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-800/70">
          <div className="user-avatar">LB</div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-slate-100">
              Workspace Admin
            </div>
            <div className="text-[10px] text-slate-500">admin@acme.io</div>
          </div>
          <ChevronDown size={14} className="hidden text-slate-500 sm:block" />
        </button>
      </div>
    </header>
  );
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-indigo-300">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {subtitle}
        </p>
      </div>
      {action && (
        <button className="primary-button shrink-0" onClick={onAction}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  trend = "up",
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="panel stat-card">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-slate-400">{label}</div>
        <div className={cx("stat-icon", `tone-${color}`)}>
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="text-[27px] font-bold tracking-tight text-white">
          {value}
        </div>
        <div
          className={cx(
            "mb-1 flex items-center gap-1 text-[11px] font-semibold",
            trend === "up" ? "text-emerald-400" : "text-rose-400",
          )}>
          {trend === "up" ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}{" "}
          {change}
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        vs. previous 30 days
      </div>
    </div>
  );
}

function MiniChart({ type = "line" }: { type?: "line" | "bar" }) {
  const bars = [28, 43, 34, 58, 47, 68, 53, 79, 61, 72, 58, 91];
  if (type === "bar")
    return (
      <div className="flex h-32 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600/70 to-sky-400/90 transition hover:opacity-80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    );
  return (
    <svg
      viewBox="0 0 500 150"
      className="h-36 w-full"
      preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity=".28" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 60, 95, 130].map((y) => (
        <line
          key={y}
          x1="0"
          x2="500"
          y1={y}
          y2={y}
          stroke="#293449"
          strokeDasharray="4 6"
        />
      ))}
      <path
        d="M0 112 C24 100 36 110 58 83 S95 91 116 68 S153 85 177 64 S218 76 238 48 S274 65 296 56 S333 75 357 38 S394 52 416 30 S455 47 500 14 L500 150 L0 150 Z"
        fill="url(#chartFill)"
      />
      <path
        d="M0 112 C24 100 36 110 58 83 S95 91 116 68 S153 85 177 64 S218 76 238 48 S274 65 296 56 S333 75 357 38 S394 52 416 30 S455 47 500 14"
        fill="none"
        stroke="#818cf8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Dashboard({ setPage }: { setPage: (p: PageKey) => void }) {
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

function DatasetTable({
  compact = false,
  filter = "",
}: {
  compact?: boolean;
  filter?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState(filter);
  const data = initialDatasets.filter((d) =>
    `${d.name} ${d.file}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="field-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search datasets..."
          />
        </label>
        {!compact && (
          <button className="secondary-button">
            <Filter size={14} /> Filters <ChevronDown size={13} />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all"
                  onChange={(e) =>
                    setSelected(e.target.checked ? data.map((d) => d.name) : [])
                  }
                />
              </th>
              <th>Dataset</th>
              <th>Rows</th>
              <th>Columns</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${d.name}`}
                    checked={selected.includes(d.name)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, d.name]
                          : selected.filter((n) => n !== d.name),
                      )
                    }
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className={cx("file-icon", `tone-${d.color}`)}>
                      <FileSpreadsheet size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        {d.name}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {d.file}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="tabular-nums">{d.rows}</td>
                <td>{d.cols}</td>
                <td>
                  <span
                    className={cx(
                      "status-pill",
                      d.status === "Ready"
                        ? "status-ready"
                        : "status-processing",
                    )}>
                    <span className="status-dot" />
                    {d.status}
                  </span>
                </td>
                <td className="whitespace-nowrap">{d.updated}</td>
                <td>
                  <button className="icon-button">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No datasets match your search.
          </div>
        )}
      </div>
      {!compact && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {data.length} of 24 datasets · demo data</span>
          <div className="flex items-center gap-2">
            <button className="pagination-button">
              <ChevronLeft size={14} />
            </button>
            <button className="pagination-button pagination-active">1</button>
            <button className="pagination-button">2</button>
            <button className="pagination-button">3</button>
            <button className="pagination-button">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DatasetsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [fileName, setFileName] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="DATA MANAGEMENT"
        title="Datasets"
        subtitle="Upload, organize, and inspect the data that powers your intelligence workflows."
        action="Upload dataset"
        onAction={() => setShowUpload(true)}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total datasets"
          value="24"
          change="+3 this month"
          icon={Database}
          color="blue"
        />
        <StatCard
          label="Total records"
          value="128.4K"
          change="+16.2%"
          icon={Layers3}
          color="violet"
        />
        <StatCard
          label="Storage used"
          value="2.4 GB"
          change="24% of plan"
          icon={CloudUpload}
          color="emerald"
        />
      </div>
      <section className="panel p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">All datasets</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage your uploaded files and data sources
          </p>
        </div>
        <DatasetTable />
      </section>
      {showUpload && (
        <Modal title="Upload a dataset" onClose={() => setShowUpload(false)}>
          <label className="upload-drop">
            <input
              type="file"
              accept=".csv,.tsv,.xlsx,.json,.parquet"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
            <div className="upload-icon">
              <CloudUpload size={24} />
            </div>
            <div className="mt-3 text-sm font-semibold text-white">
              {fileName || "Drop your file here, or browse"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              CSV, TSV, XLSX, JSON or Parquet · up to 100 MB
            </div>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button
              className="secondary-button"
              onClick={() => setShowUpload(false)}>
              Cancel
            </button>
            <button
              className="primary-button"
              onClick={() => setShowUpload(false)}
              disabled={!fileName}>
              Continue <ArrowRight size={14} />
            </button>
          </div>
          <p className="mt-3 text-[10px] text-slate-500">
            UI preview only: this form does not upload a file yet.
          </p>
        </Modal>
      )}
    </>
  );
}

function AnalyticsPage() {
  return (
    <>
      <PageHeader
        eyebrow="INSIGHTS & EXPLORATION"
        title="Analytics"
        subtitle="Explore data trends, monitor key metrics, and turn raw information into decisions."
        action="New analysis"
        onAction={() =>
          window.alert("Demo UI: analysis creation will be connected later.")
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value="$284.6K"
          change="+14.8%"
          icon={Activity}
          color="emerald"
        />
        <StatCard
          label="Active customers"
          value="8,249"
          change="+9.3%"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Conversion rate"
          value="4.82%"
          change="+0.6%"
          icon={Gauge}
          color="violet"
        />
        <StatCard
          label="Avg. order value"
          value="$68.40"
          change="-2.1%"
          trend="down"
          icon={BarChart3}
          color="amber"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Performance overview</h2>
              <p className="mt-1 text-xs text-slate-500">
                Revenue and activity trend · sample visualization
              </p>
            </div>
            <select className="dark-select">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <MiniChart />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-900/70 p-3">
              <div className="text-[10px] text-slate-500">Revenue</div>
              <div className="mt-1 text-lg font-bold text-white">$284K</div>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-3">
              <div className="text-[10px] text-slate-500">Orders</div>
              <div className="mt-1 text-lg font-bold text-white">4,162</div>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-3">
              <div className="text-[10px] text-slate-500">Growth</div>
              <div className="mt-1 text-lg font-bold text-emerald-300">
                +14.8%
              </div>
            </div>
          </div>
        </section>
        <section className="panel p-5 sm:p-6">
          <h2 className="font-semibold text-white">Top segments</h2>
          <p className="mt-1 text-xs text-slate-500">
            Revenue by customer segment
          </p>
          <div className="mt-6 space-y-5">
            {[
              {
                n: "Enterprise",
                v: 72,
                c: "from-indigo-500 to-sky-400",
                amt: "$124,800",
              },
              {
                n: "Business",
                v: 56,
                c: "from-violet-500 to-fuchsia-400",
                amt: "$96,400",
              },
              {
                n: "Individual",
                v: 31,
                c: "from-emerald-500 to-teal-300",
                amt: "$63,400",
              },
            ].map((x) => (
              <div key={x.n}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-300">{x.n}</span>
                  <span className="font-semibold text-white">{x.amt}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cx("h-full rounded-full bg-gradient-to-r", x.c)}
                    style={{ width: `${x.v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel mt-5 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Saved analyses</h2>
            <p className="mt-1 text-xs text-slate-500">
              Reusable reports and explorations
            </p>
          </div>
          <button className="secondary-button">
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              t: "Customer retention analysis",
              s: "Customer Churn · Updated today",
              i: Users,
              c: "blue",
            },
            {
              t: "Sales performance Q3",
              s: "Retail Sales Q3 · Updated yesterday",
              i: BarChart3,
              c: "violet",
            },
            {
              t: "Campaign attribution",
              s: "Marketing Campaign · Updated Oct 18",
              i: Activity,
              c: "emerald",
            },
          ].map((x) => {
            const Icon = x.i;
            return (
              <div
                key={x.t}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className={cx("stat-icon mb-3", `tone-${x.c}`)}>
                  <Icon size={17} />
                </div>
                <div className="text-sm font-semibold text-white">{x.t}</div>
                <div className="mt-2 text-[10px] text-slate-500">{x.s}</div>
                <button className="mt-4 text-xs font-semibold text-indigo-300">
                  Open analysis <ArrowRight size={12} className="ml-1 inline" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function ServicesPage({
  setPage,
  setService,
}: {
  setPage: (p: PageKey) => void;
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

function WorkspacePage({
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

function CsvCorrectorPage() {
  const [fileName, setFileName] = useState("");
  const [options, setOptions] = useState([
    "Trim whitespace",
    "Remove duplicate rows",
    "Standardize text",
  ]);
  const toggle = (o: string) =>
    setOptions((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );
  return (
    <>
      <PageHeader
        eyebrow="DATA QUALITY"
        title="CSV Corrector"
        subtitle="Prepare cleaner, more consistent datasets before analysis and modeling."
      />
      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-white">Upload your CSV</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a file to preview correction options
              </p>
            </div>
            <label className="upload-drop">
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              />
              <div className="upload-icon">
                <CloudUpload size={25} />
              </div>
              <div className="mt-3 text-sm font-semibold text-white">
                {fileName || "Drag and drop your CSV file"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                or click to browse · CSV, TSV · max 100 MB
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="file-chip">.CSV</span>
                <span className="file-chip">.TSV</span>
                <span className="file-chip">.TXT</span>
              </div>
            </label>
          </section>
          <section className="panel p-5 sm:p-6">
            <h2 className="font-semibold text-white">Correction options</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select the cleanup operations you want to apply
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  t: "Trim whitespace",
                  d: "Remove leading and trailing spaces from values",
                  i: WandSparkles,
                },
                {
                  t: "Remove duplicate rows",
                  d: "Identify and remove identical records",
                  i: Layers3,
                },
                {
                  t: "Standardize text",
                  d: "Normalize casing and text formatting",
                  i: SlidersHorizontal,
                },
                {
                  t: "Handle missing values",
                  d: "Choose how empty cells should be treated",
                  i: AlertCircle,
                },
              ].map((x) => {
                const Icon = x.i;
                return (
                  <label key={x.t} className="option-row">
                    <input
                      type="checkbox"
                      checked={options.includes(x.t)}
                      onChange={() => toggle(x.t)}
                    />
                    <div className="option-icon">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200">
                        {x.t}
                      </div>
                      <div className="mt-1 text-[10px] leading-4 text-slate-500">
                        {x.d}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                  </label>
                );
              })}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                className="primary-button"
                disabled={!fileName}
                onClick={() =>
                  window.alert(
                    "UI preview only. CSV correction is not connected yet.",
                  )
                }>
                <WandSparkles size={15} /> Analyze & correct
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setFileName("");
                  setOptions([
                    "Trim whitespace",
                    "Remove duplicate rows",
                    "Standardize text",
                  ]);
                }}>
                Reset
              </button>
            </div>
            <p className="mt-3 text-[10px] text-slate-500">
              Selected: {options.length} operations · UI preview only
            </p>
          </section>
        </div>
        <div className="space-y-5">
          <section className="panel p-5">
            <h2 className="font-semibold text-white">Data quality overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              Illustrative preview metrics
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { v: "98.2%", l: "Completeness", c: "emerald" },
                { v: "142", l: "Duplicates", c: "amber" },
                { v: "37", l: "Missing cells", c: "pink" },
                { v: "12", l: "Format issues", c: "blue" },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div
                    className={cx(
                      "text-xl font-bold",
                      x.c === "emerald"
                        ? "text-emerald-300"
                        : x.c === "amber"
                          ? "text-amber-300"
                          : x.c === "pink"
                            ? "text-pink-300"
                            : "text-sky-300",
                    )}>
                    {x.v}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">{x.l}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileCheck2 size={17} className="text-indigo-300" />
              <h2 className="font-semibold text-white">Correction workflow</h2>
            </div>
            {[
              "Upload file",
              "Inspect data quality",
              "Apply corrections",
              "Review & download",
            ].map((x, i) => (
              <div
                key={x}
                className="flex items-center gap-3 border-b border-slate-800 py-3 last:border-0">
                <div
                  className={cx(
                    "pipeline-step",
                    i === 0 && fileName ? "pipeline-done" : "",
                  )}>
                  {i === 0 && fileName ? <Check size={13} /> : i + 1}
                </div>
                <div className="flex-1 text-xs text-slate-300">{x}</div>
                <span className="text-[10px] text-slate-600">
                  {i === 0 && fileName ? "Selected" : "Pending"}
                </span>
              </div>
            ))}
          </section>
          <div className="rounded-xl border border-indigo-400/15 bg-indigo-400/5 p-4">
            <div className="flex gap-2">
              <Sparkles size={16} className="shrink-0 text-indigo-300" />
              <p className="text-xs leading-5 text-slate-300">
                Tip: run data quality checks before training a model to reduce
                avoidable errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ModelsPage() {
  return (
    <>
      <PageHeader
        eyebrow="MODEL REGISTRY"
        title="Models"
        subtitle="Keep track of experiments, versions, and model performance in one place."
        action="New model"
        onAction={() =>
          window.alert("Demo UI: model creation will be connected later.")
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Registered models"
          value="18"
          change="+4 this month"
          icon={Layers3}
          color="blue"
        />
        <StatCard
          label="Production ready"
          value="6"
          change="+2 this month"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          label="Experiments"
          value="42"
          change="+18.5%"
          icon={Activity}
          color="violet"
        />
      </div>
      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Model registry</h2>
            <p className="mt-1 text-xs text-slate-500">
              Your latest trained and saved models
            </p>
          </div>
          <button className="secondary-button">
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Type</th>
                <th>Dataset</th>
                <th>Metric</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[
                {
                  n: "Churn Predictor v2",
                  t: "Classification",
                  d: "Customer Churn",
                  m: "94.2% acc.",
                  s: "Production",
                  c: "emerald",
                },
                {
                  n: "Sales Forecast Q4",
                  t: "Regression",
                  d: "Retail Sales Q3",
                  m: "RMSE 12.4",
                  s: "Ready",
                  c: "blue",
                },
                {
                  n: "Customer Segments",
                  t: "Clustering",
                  d: "Customer Churn",
                  m: "0.78 score",
                  s: "Ready",
                  c: "blue",
                },
                {
                  n: "Review Sentiment",
                  t: "NLP",
                  d: "Product Reviews",
                  m: "91.8% acc.",
                  s: "Draft",
                  c: "amber",
                },
              ].map((x) => (
                <tr key={x.n}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="file-icon tone-violet">
                        <BrainCircuit size={17} />
                      </div>
                      <span className="text-xs font-semibold text-slate-100">
                        {x.n}
                      </span>
                    </div>
                  </td>
                  <td>{x.t}</td>
                  <td>{x.d}</td>
                  <td className="font-semibold text-slate-200">{x.m}</td>
                  <td>
                    <span
                      className={cx(
                        "status-pill",
                        x.c === "emerald"
                          ? "status-ready"
                          : x.c === "amber"
                            ? "status-processing"
                            : "status-ready",
                      )}>
                      {x.s}
                    </span>
                  </td>
                  <td>Oct 20, 2026</td>
                  <td>
                    <button className="icon-button">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="REPORTING"
        title="Reports"
        subtitle="Create shareable summaries of your analytics, datasets, and model experiments."
        action="Create report"
        onAction={() =>
          window.alert("Demo UI: report builder will be connected later.")
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            t: "Monthly analytics summary",
            d: "Performance overview · PDF",
            date: "Oct 20, 2026",
            icon: BarChart3,
            c: "blue",
          },
          {
            t: "Customer churn insights",
            d: "Model evaluation · PDF",
            date: "Oct 18, 2026",
            icon: BrainCircuit,
            c: "violet",
          },
          {
            t: "Data quality audit",
            d: "Dataset quality · CSV",
            date: "Oct 16, 2026",
            icon: FileCheck2,
            c: "emerald",
          },
        ].map((x) => {
          const Icon = x.icon;
          return (
            <div key={x.t} className="panel p-5">
              <div className="flex items-start justify-between">
                <div className={cx("stat-icon", `tone-${x.c}`)}>
                  <Icon size={18} />
                </div>
                <button className="icon-button">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <h3 className="mt-5 text-sm font-semibold text-white">{x.t}</h3>
              <p className="mt-2 text-xs text-slate-500">{x.d}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-[10px] text-slate-500">{x.date}</span>
                <button className="flex items-center gap-1 text-xs font-semibold text-indigo-300">
                  <Download size={13} /> Export
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <section className="panel mt-5 p-5 sm:p-6">
        <h2 className="font-semibold text-white">Report activity</h2>
        <p className="mt-1 text-xs text-slate-500">
          Recent report generation events
        </p>
        <div className="mt-5 space-y-4">
          {[
            "Monthly analytics summary generated",
            "Customer churn insights shared with team",
            "Data quality audit exported",
          ].map((x, i) => (
            <div key={x} className="flex items-center gap-3">
              <div className="activity-icon tone-blue">
                <Files size={16} />
              </div>
              <div className="flex-1 text-xs text-slate-300">{x}</div>
              <div className="text-[10px] text-slate-500">
                {["2 hours ago", "Yesterday", "Oct 16"][i]}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow="COLLABORATION"
        title="Team members"
        subtitle="Manage access to your workspace and collaborate securely."
        action="Invite member"
        onAction={() =>
          window.alert("Demo UI: invitations will be connected later.")
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Members"
          value="8"
          change="+2 this month"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Admins"
          value="2"
          change="No change"
          icon={ShieldCheck}
          color="violet"
        />
        <StatCard
          label="Pending invites"
          value="1"
          change="Awaiting response"
          icon={Clock3}
          color="amber"
        />
      </div>
      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Workspace access</h2>
            <p className="mt-1 text-xs text-slate-500">Demo team directory</p>
          </div>
          <button className="secondary-button">
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Last active</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[
                {
                  n: "Love Bharadwaj",
                  e: "love@acme.io",
                  r: "Owner",
                  a: "Now",
                  i: "LB",
                },
                {
                  n: "Aarav Sharma",
                  e: "aarav@acme.io",
                  r: "Admin",
                  a: "15 min ago",
                  i: "AS",
                },
                {
                  n: "Priya Verma",
                  e: "priya@acme.io",
                  r: "Analyst",
                  a: "2 hours ago",
                  i: "PV",
                },
                {
                  n: "Rohan Mehta",
                  e: "rohan@acme.io",
                  r: "Viewer",
                  a: "Yesterday",
                  i: "RM",
                },
              ].map((x) => (
                <tr key={x.e}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar">{x.i}</div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">
                          {x.n}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {x.e}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                      {x.r}
                    </span>
                  </td>
                  <td>{x.a}</td>
                  <td>
                    <span className="status-pill status-ready">
                      <span className="status-dot" /> Active
                    </span>
                  </td>
                  <td>
                    <button className="icon-button">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SettingsPage() {
  const [tab, setTab] = useState("General");
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE PREFERENCES"
        title="Settings"
        subtitle="Configure your workspace, profile, and data preferences."
      />
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="panel h-fit p-2">
          {["General", "Profile", "Security", "Notifications", "Billing"].map(
            (x, i) => (
              <button
                key={x}
                onClick={() => setTab(x)}
                className={cx(
                  "settings-tab",
                  tab === x && "settings-tab-active",
                )}>
                {[Settings, CircleUserRound, ShieldCheck, Bell, Zap].map(
                  (I, j) => (i === j ? <I key={j} size={16} /> : null),
                )}
                {x}
              </button>
            ),
          )}
        </nav>
        <section className="panel p-5 sm:p-7">
          <div className="mb-6 border-b border-slate-800 pb-5">
            <h2 className="text-lg font-semibold text-white">{tab} settings</h2>
            <p className="mt-1 text-xs text-slate-500">
              Update your {tab.toLowerCase()} preferences.
            </p>
          </div>
          {tab === "General" ? (
            <div className="max-w-xl space-y-5">
              <div>
                <label className="form-label">Workspace name</label>
                <input className="form-input" defaultValue="Acme Analytics" />
              </div>
              <div>
                <label className="form-label">Workspace URL</label>
                <div className="flex">
                  <input
                    className="form-input rounded-r-none"
                    defaultValue="acme-analytics"
                  />
                  <span className="rounded-r-lg border border-l-0 border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-500">
                    .dssa.as
                  </span>
                </div>
              </div>
              <div>
                <label className="form-label">Default timezone</label>
                <select className="form-select">
                  <option>Asia/Kolkata (IST)</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                </select>
              </div>
              <div>
                <label className="form-label">Workspace description</label>
                <textarea
                  className="form-input min-h-[90px]"
                  defaultValue="Central workspace for data analytics and AI experiments."
                />
              </div>
              <button
                className="primary-button"
                onClick={() =>
                  window.alert("Demo UI: settings are not saved.")
                }>
                Save changes
              </button>
            </div>
          ) : (
            <div className="max-w-xl space-y-4">
              {[
                "Email notifications",
                "Product updates",
                "Weekly workspace summary",
                "Security alerts",
              ].map((x, i) => (
                <label
                  key={x}
                  className="flex items-center justify-between rounded-xl border border-slate-800 p-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {x}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      Manage this preference for your workspace
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked={i !== 1} />
                </label>
              ))}
              <button
                className="primary-button"
                onClick={() =>
                  window.alert("Demo UI: settings are not saved.")
                }>
                Save preferences
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function AuthPage({
  mode,
  setPage,
}: {
  mode: "Login" | "Signup";
  setPage: (p: PageKey) => void;
}) {
  return (
    <div className="auth-screen">
      <div className="auth-decoration">
        <div className="auth-glow" />
        <div className="auth-brand">
          <Brand />
        </div>
        <div className="auth-message">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs text-indigo-200">
            <Sparkles size={14} /> DATA INTELLIGENCE, REIMAGINED
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
            Make your data
            <br />
            <span className="gradient-text">work smarter.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
            A unified workspace to explore data, build intelligent models, and
            turn information into impact.
          </p>
          <div className="mt-8 flex gap-8">
            <div>
              <div className="text-2xl font-bold text-white">10x</div>
              <div className="mt-1 text-xs text-slate-500">Faster insights</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">5-in-1</div>
              <div className="mt-1 text-xs text-slate-500">AI workspaces</div>
            </div>
          </div>
        </div>
        <div className="auth-footer text-xs text-slate-600">
          © 2026 DSSAAS · Data intelligence platform
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {mode === "Login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {mode === "Login"
                ? "Enter your details to access your workspace."
                : "Start building smarter workflows with DSSAAS."}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.alert(
                "UI preview only. Authentication will be connected to your existing auth flow.",
              );
            }}
            className="space-y-4">
            {mode === "Signup" && (
              <div>
                <label className="form-label">Full name</label>
                <input
                  className="form-input"
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div>
              <label className="form-label">Work email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="form-label mb-0">Password</label>
                {mode === "Login" && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-indigo-300">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
            {mode === "Signup" && (
              <div>
                <label className="form-label">Confirm password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  minLength={8}
                  required
                />
              </div>
            )}
            <button className="primary-button mt-2 w-full justify-center py-3">
              {mode === "Login" ? "Sign in to workspace" : "Create account"}{" "}
              <ArrowRight size={15} />
            </button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] text-slate-600">
              SECURE WORKSPACE ACCESS
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <p className="text-center text-xs text-slate-500">
            {mode === "Login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() => setPage(mode === "Login" ? "Signup" : "Login")}
              className="font-semibold text-indigo-300 hover:text-indigo-200">
              {mode === "Login" ? "Create account" : "Sign in"}
            </button>
          </p>
          <p className="mt-8 text-center text-[10px] leading-5 text-slate-600">
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DSSAASApp() {
  const [page, setPage] = useState<PageKey>("Dashboard");
  const [service, setService] = useState<ServiceKey>("ML");
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const pageTitle = useMemo(
    () => (page.endsWith("Workspace") ? serviceInfo[service].subtitle : page),
    [page, service],
  );
  const openService = (key: ServiceKey) => {
    setService(key);
    setPage("AI Services");
  };
  if (page === "Login" || page === "Signup")
    return <AuthPage mode={page} setPage={setPage} />;
  const renderPage = () => {
    switch (page) {
      case "Dashboard":
        return <Dashboard setPage={setPage} />;
      case "Datasets":
        return <DatasetsPage />;
      case "Analytics":
        return <AnalyticsPage />;
      case "AI Services":
        return <ServicesPage setPage={setPage} setService={openService} />;
      case "ML Workspace":
        return (
          <WorkspacePage service="ML" onBack={() => setPage("AI Services")} />
        );
      case "DL Workspace":
        return (
          <WorkspacePage service="DL" onBack={() => setPage("AI Services")} />
        );
      case "NLP Workspace":
        return (
          <WorkspacePage service="NLP" onBack={() => setPage("AI Services")} />
        );
      case "Computer Vision Workspace":
        return (
          <WorkspacePage
            service="Computer Vision"
            onBack={() => setPage("AI Services")}
          />
        );
      case "AI Workspace":
        return (
          <WorkspacePage service="AI" onBack={() => setPage("AI Services")} />
        );
      case "Models":
        return <ModelsPage />;
      case "CSV Corrector":
        return <CsvCorrectorPage />;
      case "Reports":
        return <ReportsPage />;
      case "Team":
        return <TeamPage />;
      case "Settings":
        return <SettingsPage />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };
  return (
    <div className="dssa-app">
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main className="app-main">
        <Topbar
          page={pageTitle}
          search={search}
          setSearch={setSearch}
          setPage={setPage}
        />
        <div className="page-content">{renderPage()}</div>
        <footer className="app-footer">
          <span>© 2026 DSSAAS</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All
            systems operational <span className="mx-1 text-slate-700">·</span>{" "}
            UI preview with sample data
          </span>
        </footer>
      </main>
    </div>
  );
}
