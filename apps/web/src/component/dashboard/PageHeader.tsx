import { Plus } from "lucide-react";
import "../../index.css";

export default function PageHeader({
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
