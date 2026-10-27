import {
  BarChart3,
  BrainCircuit,
  Download,
  FileCheck2,
  Files,
  MoreHorizontal,
} from "lucide-react";
import PageHeader from "../../component/dashboard/PageHeader";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function ReportsPage() {
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
