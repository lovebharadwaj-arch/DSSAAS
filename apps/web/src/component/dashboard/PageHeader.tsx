import { Plus } from "lucide-react";
import "../../index.css";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
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

      <div className="flex flex-wrap items-center gap-2">
        {secondaryAction && (
          <button
            type="button"
            className="secondary-button shrink-0"
            onClick={onSecondaryAction}>
            <Plus size={16} />
            {secondaryAction}
          </button>
        )}

        {action && (
          <button
            type="button"
            className="primary-button shrink-0"
            onClick={onAction}>
            <Plus size={16} />
            {action}
          </button>
        )}
      </div>
    </div>
  );
}
