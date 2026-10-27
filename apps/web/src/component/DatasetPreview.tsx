import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { PreviewResponse } from "../types";

interface DatasetPreviewProps {
  organizationId: string;
  datasetId: string;
  token: string;
}

export default function DatasetPreview({
  organizationId,
  datasetId,
  token,
}: DatasetPreviewProps) {
  const [data, setData] = useState<PreviewResponse["data"] | null>(null);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organizationId || !datasetId || !token) {
      setData(null);
      setError("Select a dataset and sign in to continue.");
      return;
    }

    const controller = new AbortController();

    async function loadPreview() {
      setLoading(true);
      setError("");

      try {
        const result = await apiRequest<PreviewResponse>(
          `/organizations/${encodeURIComponent(organizationId)}/datasets/${encodeURIComponent(datasetId)}/preview?limit=${limit}`,
          token,
          { signal: controller.signal },
        );

        setData(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setData(null);
        setError(
          err instanceof Error ? err.message : "Failed to load dataset.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, [organizationId, datasetId, token, limit]);

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Dataset preview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Inspect your uploaded data before analysis.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          Rows
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      {loading && (
        <p className="py-8 text-center text-gray-500">
          Loading dataset preview...
        </p>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              <strong className="text-gray-900">{data.columns.length}</strong>{" "}
              columns
            </span>
            <span>
              <strong className="text-gray-900">{data.rowCount}</strong> preview
              rows
            </span>
            <span>
              {data.hasMore ? "More rows available" : "End of dataset"}
            </span>
          </div>

          {data.rows.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
              This dataset contains headers but no data rows.
            </p>
          ) : (
            <div className="max-w-full overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-semibold text-gray-700">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {data.columns.map((column) => (
                        <td
                          key={column}
                          className="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-gray-600">
                          {row[column] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
