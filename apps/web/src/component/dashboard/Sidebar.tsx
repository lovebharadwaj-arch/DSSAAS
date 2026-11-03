import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  Database,
  FileCheck2,
  Files,
  Layers3,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import "../../index.css";
import BrandLogo from "./BrandLogo";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

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

export default function Sidebar({
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
        <BrandLogo />
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
