import {
  Bell,
  CircleUserRound,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import PageHeader from "../../component/dashboard/PageHeader";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function SettingsPage() {
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
