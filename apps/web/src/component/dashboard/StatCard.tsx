import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import "../../index.css";
function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  trend = "up",
}: {
  label: string;
  value: string | number;
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
