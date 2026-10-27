import { useState } from "react";
import {
  correctCsvFile,
  downloadCorrectedCsv,
  type CsvCorrectionResult,
} from "../service/csvServiceCorrector";

export default function CsvCorrector() {
  const [file, setFile] = useState<File | null>(null);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [standardizeText, setStandardizeText] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [missingStrategy, setMissingStrategy] = useState<
    "none" | "empty" | "mean" | "median" | "mode"
  >("none");

  const [result, setResult] = useState<CsvCorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await correctCsvFile(file, {
        trimWhitespace,
        standardizeText,
        removeDuplicates,
        missingStrategy,
      });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV correction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-xl border p-6 bg-white text-black">
      {" "}
      <div>
        {" "}
        <h1 className="text-2xl font-bold">CSV Corrector</h1>{" "}
        <p className="mt-1 text-sm text-gray-500">
          Upload a dataset and clean it using Python.{" "}
        </p>{" "}
      </div>
      ```
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="csv-file" className="mb-2 block font-medium">
            Select dataset
          </label>

          <input
            id="csv-file"
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
              setError("");
            }}
            className="block w-full rounded-lg border p-3"
          />

          {file && (
            <p className="mt-2 text-sm text-gray-500">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-2 font-semibold">Correction options</legend>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={(event) => setTrimWhitespace(event.target.checked)}
            />
            Remove leading and trailing whitespace
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={standardizeText}
              onChange={(event) => setStandardizeText(event.target.checked)}
            />
            Standardize repeated whitespace in text
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(event) => setRemoveDuplicates(event.target.checked)}
            />
            Remove duplicate rows
          </label>
        </fieldset>

        <div>
          <label htmlFor="missing-strategy" className="mb-2 block font-medium">
            Handle missing values
          </label>

          <select
            id="missing-strategy"
            value={missingStrategy}
            onChange={(event) =>
              setMissingStrategy(event.target.value as typeof missingStrategy)
            }
            className="w-full rounded-lg border p-3">
            <option value="none">Leave missing values unchanged</option>
            <option value="empty">
              Replace missing values with empty strings
            </option>
            <option value="mean">Fill numeric values using mean</option>
            <option value="median">Fill numeric values using median</option>
            <option value="mode">Fill using the most frequent value</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Correcting dataset..." : "Correct CSV"}
        </button>
      </form>
      {result && (
        <section className="space-y-4 border-t pt-5">
          <div>
            <h2 className="text-xl font-semibold">Correction completed</h2>
            <p className="text-sm text-gray-500">{result.filename}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Original rows" value={result.summary.original_rows} />
            <Stat
              label="Corrected rows"
              value={result.summary.corrected_rows}
            />
            <Stat label="Columns" value={result.summary.columns} />
            <Stat
              label="Duplicates removed"
              value={result.summary.duplicates_removed}
            />
            <Stat
              label="Missing values remaining"
              value={result.summary.missing_values_remaining}
            />
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Changes applied</h3>

            {result.changes.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {result.changes.map((change, index) => (
                  <li key={index}>
                    {Object.entries(change)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No changes were reported.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              downloadCorrectedCsv(
                file?.name ?? result.filename,
                result.corrected_csv,
              )
            }
            className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white">
            Download corrected CSV
          </button>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      {" "}
      <p className="text-sm text-gray-500">{label}</p>{" "}
      <p className="mt-1 text-xl font-bold">{value.toLocaleString()}</p>{" "}
    </div>
  );
}
