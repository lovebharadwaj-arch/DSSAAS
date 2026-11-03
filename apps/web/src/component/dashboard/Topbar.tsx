import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";

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

interface TopbarProps {
  page: string;
  search: string;
  setSearch: (value: string) => void;
  setPage: React.Dispatch<React.SetStateAction<any>>;
}

export default function Topbar({
  page,
  search,
  setSearch,
  setPage,
}: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleGetStarted = () => {
    navigate(user ? "/dataPages" : "/login");
  };

  return (
    <header className="topbar">
      {/* Page title */}
      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
        <span>Workspace</span>
        <ChevronRight size={13} />
        <span className="truncate font-semibold text-slate-200">{page}</span>
      </div>

      {/* Search, notifications, and user actions */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <label className="top-search hidden md:flex">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search anything..."
          />
          <kbd>⌘ K</kbd>
        </label>

        <button
          type="button"
          className="icon-button relative"
          title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="hidden h-7 w-px bg-slate-800 sm:block" />

        {user ? (
          <>
            {/* User profile */}
            <button
              type="button"
              onClick={() => setPage("Settings")}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-800/70">
              <div className="user-avatar">LB</div>

              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold text-slate-100">
                  Hi, {user.name}
                </div>

                <div className="text-[10px] text-slate-500">{user.email}</div>
              </div>

              <ChevronDown
                size={14}
                className="hidden text-slate-500 sm:block"
              />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Public actions */}
            <button
              type="button"
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              onClick={handleLogin}>
              Sign in
            </button>

            <button
              type="button"
              className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              onClick={handleGetStarted}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
