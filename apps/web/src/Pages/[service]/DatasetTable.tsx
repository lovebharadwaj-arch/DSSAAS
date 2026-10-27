import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useState } from "react";

const initialDatasets = [
  {
    name: "Customer Churn",
    file: "customer_churn.csv",
    rows: "7,043",
    cols: 21,
    status: "Ready",
    updated: "12 min ago",
    color: "blue",
  },
  {
    name: "Retail Sales Q3",
    file: "retail_sales_q3.csv",
    rows: "18,420",
    cols: 14,
    status: "Ready",
    updated: "Yesterday",
    color: "violet",
  },
  {
    name: "Marketing Campaign",
    file: "campaign_results.csv",
    rows: "3,812",
    cols: 18,
    status: "Processing",
    updated: "2 min ago",
    color: "amber",
  },
  {
    name: "Product Reviews",
    file: "product_reviews.csv",
    rows: "12,608",
    cols: 8,
    status: "Ready",
    updated: "2 days ago",
    color: "pink",
  },
];

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function DatasetTable({
  compact = false,
  filter = "",
}: {
  compact?: boolean;
  filter?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState(filter);
  const data = initialDatasets.filter((d) =>
    `${d.name} ${d.file}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="field-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search datasets..."
          />
        </label>
        {!compact && (
          <button className="secondary-button">
            <Filter size={14} /> Filters <ChevronDown size={13} />
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
                  onChange={(e) =>
                    setSelected(e.target.checked ? data.map((d) => d.name) : [])
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
            {data.map((d) => (
              <tr key={d.name}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${d.name}`}
                    checked={selected.includes(d.name)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, d.name]
                          : selected.filter((n) => n !== d.name),
                      )
                    }
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className={cx("file-icon", `tone-${d.color}`)}>
                      <FileSpreadsheet size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        {d.name}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {d.file}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="tabular-nums">{d.rows}</td>
                <td>{d.cols}</td>
                <td>
                  <span
                    className={cx(
                      "status-pill",
                      d.status === "Ready"
                        ? "status-ready"
                        : "status-processing",
                    )}>
                    <span className="status-dot" />
                    {d.status}
                  </span>
                </td>
                <td className="whitespace-nowrap">{d.updated}</td>
                <td>
                  <button className="icon-button">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No datasets match your search.
          </div>
        )}
      </div>
      {!compact && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {data.length} of 24 datasets · demo data</span>
          <div className="flex items-center gap-2">
            <button className="pagination-button">
              <ChevronLeft size={14} />
            </button>
            <button className="pagination-button pagination-active">1</button>
            <button className="pagination-button">2</button>
            <button className="pagination-button">3</button>
            <button className="pagination-button">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
