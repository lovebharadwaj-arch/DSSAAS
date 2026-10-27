import { useState } from "react";
import { checkCsvFile, type CsvCheckResult } from "../service/checkCSV";
import Button from "./common/Button";

export default function CsvUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvCheckResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await checkCsvFile(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">CSV File Checker</h2>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setResult(null);
          setError("");
        }}
        className="block w-full rounded-lg border border-slate-300 p-3"
      />

      <Button
        type="button"
        onClick={handleUpload}
        disabled={!file || loading}
        className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Checking CSV..." : "Check CSV"}
      </Button>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          <p className={result.valid ? "text-green-700" : "text-red-700"}>
            {result.valid ? "CSV structure is valid" : "CSV validation failed"}
          </p>

          {result.errors.map((item, index) => (
            <p key={index} className="text-red-600">
              {item}
            </p>
          ))}

          {result.warnings.map((item, index) => (
            <p key={index} className="text-amber-700">
              Warning: {item}
            </p>
          ))}

          {result.summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Rows", result.summary.rows],
                ["Columns", result.summary.columns],
                ["Missing values", result.summary.missing_values],
                ["Duplicate rows", result.summary.duplicate_rows],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
