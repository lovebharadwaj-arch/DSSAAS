import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { DatasetRecord } from "../../service/datasetService";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

const palette = ["blue", "violet", "emerald", "amber", "pink", "sky"] as const;

export default function DatasetTable({
  compact = false,
  filter = "",
  datasets = [],
  loading = false,
  onRefresh,
}: {
  compact?: boolean;
  filter?: string;
  datasets?: DatasetRecord[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState(filter);

  const data = useMemo(() => {
    const filtered = datasets.filter((dataset) => {
      const name = dataset.name ?? "";
      const fileName = dataset.original_filename ?? "";
      return `${name} ${fileName}`.toLowerCase().includes(query.toLowerCase());
    });

    return filtered.map((dataset, index) => ({
      id: dataset.id,
      name: dataset.name ?? "Untitled dataset",
      file: dataset.original_filename ?? "Unknown file",
      rows: Number(dataset.row_count ?? 0),
      cols: Number(dataset.column_count ?? 0),
      status: dataset.status === "deleted" ? "Archived" : "Ready",
      updated: dataset.updated_at
        ? new Date(dataset.updated_at).toLocaleDateString()
        : "Recently",
      color: palette[index % palette.length],
    }));
  }, [datasets, query]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="field-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search datasets..."
          />
        </label>
        {!compact && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onRefresh?.()}>
            <Filter size={14} /> Refresh <ChevronDown size={13} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={
                    selected.length > 0 && selected.length === data.length
                  }
                  onChange={(event) =>
                    setSelected(
                      event.target.checked ? data.map((item) => item.id) : [],
                    )
                  }
                />
              </th>
              <th>Dataset</th>
              <th>Rows</th>
              <th>Columns</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {data.map((dataset) => (
              <tr key={dataset.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${dataset.name}`}
                    checked={selected.includes(dataset.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, dataset.id]
                          : current.filter((id) => id !== dataset.id),
                      )
                    }
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className={cx("file-icon", `tone-${dataset.color}`)}>
                      <FileSpreadsheet size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        {dataset.name}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {dataset.file}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="tabular-nums">
                  {new Intl.NumberFormat("en-US").format(dataset.rows)}
                </td>
                <td>{dataset.cols}</td>
                <td>
                  <span
                    className={cx(
                      "status-pill",
                      dataset.status === "Ready"
                        ? "status-ready"
                        : "status-processing",
                    )}>
                    <span className="status-dot" />
                    {dataset.status}
                  </span>
                </td>
                <td className="whitespace-nowrap">{dataset.updated}</td>
                <td>
                  <button type="button" className="icon-button">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No datasets match your search.
          </div>
        )}

        {loading && (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading datasets...
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {data.length} of {datasets.length || 0} dataset
            {datasets.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="pagination-button">
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="pagination-button pagination-active">
              1
            </button>
            <button type="button" className="pagination-button">
              2
            </button>
            <button type="button" className="pagination-button">
              3
            </button>
            <button type="button" className="pagination-button">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
