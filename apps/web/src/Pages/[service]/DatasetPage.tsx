import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Database,
  Layers3,
  LoaderCircle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../component/dashboard/PageHeader";
import StatCard from "../../component/dashboard/StatCard";
import { checkCsvFile, type CsvCheckResult } from "../../service/checkCSV";
import {
  listDatasets,
  uploadDataset,
  type DatasetRecord,
} from "../../service/datasetService";
import DatasetTable from "./DatasetTable";
import Modal from "./Modal";

export default function DatasetsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvCheckResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState("");

  const organizationId = sessionStorage.getItem("organizationId") ?? "";
  const token =
    localStorage.getItem("auth_token") ??
    sessionStorage.getItem("accessToken") ??
    "";

  const datasetStats = useMemo(() => {
    const totalRows = datasets.reduce(
      (total, dataset) => total + Number(dataset.row_count ?? 0),
      0,
    );
    const totalColumns = datasets.reduce(
      (total, dataset) => total + Number(dataset.column_count ?? 0),
      0,
    );
    const totalBytes = datasets.reduce(
      (total, dataset) => total + Number(dataset.file_size_bytes ?? 0),
      0,
    );

    const formatCompact = (value: number) =>
      new Intl.NumberFormat("en-US", {
        notation: value >= 10000 ? "compact" : "standard",
        maximumFractionDigits: value >= 10000 ? 1 : 0,
      }).format(value);

    const formatStorage = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return {
      totalDatasets: datasets.length,
      totalRows: formatCompact(totalRows),
      totalColumns: formatCompact(totalColumns),
      totalStorage: formatStorage(totalBytes),
    };
  }, [datasets]);

  async function loadDatasets() {
    if (!token || !organizationId) {
      return;
    }

    setDatasetsLoading(true);
    setDatasetsError("");

    try {
      const result = await listDatasets(token, organizationId);
      setDatasets(result);
    } catch (err) {
      setDatasetsError(
        err instanceof Error ? err.message : "Unable to load datasets.",
      );
    } finally {
      setDatasetsLoading(false);
    }
  }

  useEffect(() => {
    void loadDatasets();
  }, [organizationId, token]);

  const isCsv = file?.name.toLowerCase().endsWith(".csv") ?? false;

  function resetUpload() {
    setShowUpload(false);
    setFile(null);
    setResult(null);
    setError("");
    setLoading(false);
  }

  function handleFileChange(selectedFile?: File) {
    setFile(selectedFile ?? null);
    setResult(null);
    setError("");

    if (selectedFile && !selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("CSV checking is currently supported only for .csv files.");
    }

    if (selectedFile && selectedFile.size > 100 * 1024 * 1024) {
      setError("The maximum allowed file size is 100 MB.");
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (!isCsv) {
      setError("Please select a CSV file to validate.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("The maximum allowed file size is 100 MB.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await checkCsvFile(file);
      setResult(data);

      if (data.valid) {
        if (!token || !organizationId) {
          setError(
            "Your session is missing organization data. Please log in again.",
          );
          return;
        }

        await uploadDataset(token, organizationId, file);
        await loadDatasets();
        resetUpload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="DATA MANAGEMENT"
        title="Datasets"
        subtitle="Upload, organize, and inspect the data that powers your intelligence workflows."
        action="Upload dataset"
        onAction={() => setShowUpload(true)}
        secondaryAction="Upload CSV"
        onSecondaryAction={() => setShowUpload(true)}
      />

      {datasetsError && (
        <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {datasetsError}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total datasets"
          value={datasetsLoading ? "..." : String(datasetStats.totalDatasets)}
          change={
            datasetsLoading
              ? "Loading"
              : `${datasetStats.totalDatasets || 0} active records`
          }
          icon={Database}
          color="blue"
          trend="up"
        />
        <StatCard
          label="Total records"
          value={datasetsLoading ? "..." : datasetStats.totalRows}
          change={datasets.length ? "+ live count" : "No data yet"}
          icon={Layers3}
          color="violet"
          trend="up"
        />
        <StatCard
          label="Storage used"
          value={datasetsLoading ? "..." : datasetStats.totalStorage}
          change={
            datasets.length
              ? `${datasetStats.totalColumns} columns tracked`
              : "No uploads yet"
          }
          icon={CloudUpload}
          color="emerald"
          trend="up"
        />
      </div>

      <section className="panel p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">All datasets</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage your uploaded files and data sources
          </p>
        </div>

        <DatasetTable
          datasets={datasets}
          loading={datasetsLoading}
          onRefresh={loadDatasets}
        />
      </section>

      {showUpload && (
        <Modal title="Upload a dataset" onClose={resetUpload}>
          <div className="space-y-5">
            {/* File selection */}
            <label className="upload-drop relative block cursor-pointer">
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.json,.parquet"
                className="sr-only"
                onChange={(event) => handleFileChange(event.target.files?.[0])}
              />

              <div className="upload-icon">
                <CloudUpload size={24} />
              </div>

              <div className="mt-3 break-all text-sm font-semibold text-white">
                {file?.name ?? "Drop your file here, or browse"}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                CSV, TSV, XLSX, JSON or Parquet · up to 100 MB
              </div>

              {file && (
                <div className="mt-2 text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Validation result */}
            {result && (
              <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2">
                  {result.valid ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={20} className="text-red-400" />
                  )}

                  <h3 className="font-semibold text-white">
                    {result.valid
                      ? "CSV validation successful"
                      : "CSV validation failed"}
                  </h3>
                </div>

                {result.summary && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["Rows", result.summary.rows],
                      ["Columns", result.summary.columns],
                      ["Missing values", result.summary.missing_values],
                      ["Duplicate rows", result.summary.duplicate_rows],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="mt-1 text-xl font-bold text-white">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-red-300">
                      Errors
                    </h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-red-300">
                      {result.errors.map((item, index) => (
                        <li key={`${index}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-amber-300">
                      Warnings
                    </h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-amber-300">
                      {result.warnings.map((item, index) => (
                        <li key={`${index}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="secondary-button"
                onClick={resetUpload}
                disabled={loading}>
                Cancel
              </button>

              <button
                type="button"
                className="primary-button flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleUpload}
                disabled={
                  !file || loading || !isCsv || file.size > 100 * 1024 * 1024
                }>
                {loading ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Checking CSV...
                  </>
                ) : result?.valid ? (
                  <>
                    Validated
                    <CheckCircle2 size={15} />
                  </>
                ) : (
                  <>
                    Check CSV
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {file && (
                <button
                  type="button"
                  className="secondary-button flex items-center gap-1"
                  onClick={() => handleFileChange(undefined)}
                  disabled={loading}>
                  <X size={14} />
                  Remove file
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-500">
              This step validates the CSV through your existing checker. It does
              not yet save the dataset to your database.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
