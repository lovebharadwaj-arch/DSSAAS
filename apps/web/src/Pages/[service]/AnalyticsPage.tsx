import { ArrowRight, BarChart3, Filter, Gauge, Users } from "lucide-react";
import { Activity } from "react";
import PageHeader from "../../component/dashboard/PageHeader.tsx";
import StatCard from "../../component/dashboard/StatCard.tsx";
import MiniChart from "../../component/dashboard/MiniChart.tsx";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function AnalyticsPage() {
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
