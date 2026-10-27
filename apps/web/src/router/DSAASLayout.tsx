import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import AnalyticsPage from "../Pages/[service]/AnalyticsPage";
import DatasetsPage from "../Pages/[service]/DatasetPage";
import ModelsPage from "../Pages/[service]/ModelsPage";
import ReportsPage from "../Pages/[service]/ReportPage";
import ServicesPage from "../Pages/[service]/ServicePage";
import SettingsPage from "../Pages/[service]/SettingPage";
import TeamPage from "../Pages/[service]/TeamPage";
import WorkspacePage from "../Pages/[service]/WorkspacePage";
import CsvCorrectorPage from "../Pages/csvCorrectorPage";

import Sidebar from "../component/dashboard/Sidebar";
import Topbar from "../component/dashboard/Topbar";

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
  | "Settings";

type ServiceKey = "ML" | "DL" | "NLP" | "Computer Vision" | "AI";

const serviceInfo: Record<ServiceKey, { subtitle: string }> = {
  ML: { subtitle: "Machine Learning" },
  DL: { subtitle: "Deep Learning" },
  NLP: { subtitle: "Natural Language Processing" },
  "Computer Vision": { subtitle: "Computer Vision" },
  AI: { subtitle: "AI Playground" },
};

const routeToPage: Record<string, PageKey> = {
  "/dashboard": "Dashboard",
  "/home": "Dashboard",
  "/dataset": "Datasets",
  "/analytics": "Analytics",
  "/services": "AI Services",
  "/services/ml": "ML Workspace",
  "/models": "Models",
  "/csv-corrector": "CSV Corrector",
  "/report": "Reports",
  "/team": "Team",
  "/settings": "Settings",
};

export default function DSSAASLayout() {
  const location = useLocation();

  const [page, setPage] = useState<PageKey>(
    routeToPage[location.pathname] ?? "Dashboard",
  );
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

        <div className="page-content">
          {renderPage()}
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>© 2026 DSSAAS</span>
          <span>All systems operational · UI preview with sample data</span>
        </footer>
      </main>
    </div>
  );
}
