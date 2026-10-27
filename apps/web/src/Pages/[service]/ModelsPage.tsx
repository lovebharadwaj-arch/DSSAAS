import {
  BrainCircuit,
  Filter,
  Layers3,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { Activity } from "react";
import PageHeader from "../../component/dashboard/PageHeader";
import StatCard from "../../component/dashboard/StatCard";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function ModelsPage() {
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
