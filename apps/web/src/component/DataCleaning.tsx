import { useEffect, useState } from "react";
import {
  previewDataCleaning,
  saveCleanedDatasetVersion,
  type CleaningOptions,
  type CleaningPreview,
} from "../service/dataCleaningService";

interface DataCleaningProps {
  organizationId: string;
  datasetId: string;
  token: string;
}

export default function DataCleaning({
  organizationId,
  datasetId,
  token,
}: DataCleaningProps) {
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [missingValues, setMissingValues] =
    useState<CleaningOptions["missingValues"]>("keep");

  const [result, setResult] = useState<CleaningPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPreviewed, setHasPreviewed] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedVersion, setSavedVersion] = useState<number | null>(null);

  useEffect(() => {
    setResult(null);
    setError("");
    setHasPreviewed(false);
  }, [organizationId, datasetId]);

  async function handlePreview() {
    if (!organizationId || !datasetId || !token) {
      setError("Please select a dataset and sign in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await previewDataCleaning(organizationId, datasetId, token, {
        removeDuplicates,
        missingValues,
      });

      setResult(data);
      setHasPreviewed(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate cleaning preview.",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCleanedVersion() {
    setSaving(true);
    setSaveMessage("");
    setSavedVersion(null);

    try {
      const result = await saveCleanedDatasetVersion(
        organizationId,
        datasetId,
        token,
        {
          removeDuplicates,
          missingValues,
        },
      );

      setSavedVersion(result.data.version_number);
      setSaveMessage(result.message);
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Failed to save cleaned dataset.",
      );
    } finally {
      setSaving(false);
    }
  }

  const rowsRemoved = result
    ? result.originalRowCount - result.cleanedRowCount
    : 0;

  return (
    <section className="space-y-6 rounded-2xl bg-white p-6 text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
      <div>
        <h2 className="text-2xl font-bold">Data Cleaning</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Identify data-quality issues and preview cleaning operations. Your
          original CSV remains unchanged.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <input
            type="checkbox"
            checked={removeDuplicates}
            onChange={(event) => setRemoveDuplicates(event.target.checked)}
            className="mt-1 h-4 w-4 accent-indigo-600"
          />

          <span>
            <span className="block font-semibold">Remove duplicate rows</span>
            <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
              Keep the first occurrence of each identical row.
            </span>
          </span>
        </label>

        <label className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <span className="block font-semibold">Handle missing values</span>

          <select
            value={missingValues}
            onChange={(event) =>
              setMissingValues(
                event.target.value as CleaningOptions["missingValues"],
              )
            }
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="keep">Keep missing values</option>
            <option value="drop_rows">Remove rows with missing values</option>
            <option value="fill_empty">Fill with N/A</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={handlePreview}
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? "Generating preview..." : "Preview cleaning"}
      </button>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {hasPreviewed && result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Original rows"
              value={result.originalRowCount}
            />
            <SummaryCard
              title="Rows after cleaning"
              value={result.cleanedRowCount}
            />
            <SummaryCard
              title="Duplicates removed"
              value={result.duplicatesRemoved}
            />
            <SummaryCard title="Rows removed" value={rowsRemoved} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-semibold">Data quality summary</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Rows containing missing values before cleaning:{" "}
              <strong>{result.rowsWithMissingValues}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Previewing up to 100 cleaned rows. No changes have been saved.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Cleaned data preview</h3>

            {result.columns.length === 0 ? (
              <p className="text-sm text-slate-500">
                No columns are available to preview.
              </p>
            ) : result.preview.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                No rows remain after applying these cleaning options.
              </p>
            ) : (
              <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr>
                      {result.columns.map((column, index) => (
                        <th
                          key={`${column}-${index}`}
                          className="whitespace-nowrap px-4 py-3 font-semibold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.preview.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-t border-slate-200 dark:border-slate-700">
                        {result.columns.map((column, columnIndex) => (
                          <td
                            key={`${column}-${columnIndex}`}
                            className="whitespace-nowrap px-4 py-3">
                            {row[columnIndex]?.trim() || (
                              <span className="italic text-amber-600">
                                Missing
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      <button
        type="button"
        onClick={handleSaveCleanedVersion}
        disabled={saving}
        className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? "Saving..." : "Save Cleaned Version"}
      </button>

      {saveMessage && (
        <p role="status" className="mt-3 text-sm">
          {saveMessage}
          {savedVersion !== null && ` Version: ${savedVersion}`}
        </p>
      )}
    </section>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
