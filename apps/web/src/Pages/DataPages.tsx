import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../component/common/Button";
import DatasetAnalysisDashboard from "../component/DataAnalysisDashboard";
import DataCleaning from "../component/DataCleaning";
import DatasetPreview from "../component/DatasetPreview";
import FileUpload from "../component/global/FileUploadFile";
import Navbar from "../component/global/Navbar";
import {
  deleteDataset,
  listDatasets,
  uploadDataset,
  type DatasetRecord,
} from "../service/datasetService";

const DataPages = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = useMemo(() => sessionStorage.getItem("accessToken") ?? "", []);
  const organizationId = useMemo(
    () => sessionStorage.getItem("organizationId") ?? "",
    [],
  );
  const loadDatasets = async () => {
    if (!token || !organizationId) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const data = await listDatasets(token, organizationId);
      setDatasets(data);

      if (!selectedDatasetId && data[0]?.id) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDatasets();
  }, [navigate, token, organizationId]);

  const handleUpload = async (file: File) => {
    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!organizationId) {
      throw new Error("No organization selected. Please log in again.");
    }

    await uploadDataset(token, organizationId, file);
    await loadDatasets();
  };

  const handleDelete = async (datasetId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dataset?",
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteDataset(token, organizationId, datasetId);

      // Remove the deleted dataset from the UI
      setDatasets((previous) =>
        previous.filter((dataset) => dataset.id !== datasetId),
      );

      // Clear the selected dataset if it was deleted
      if (selectedDatasetId === datasetId) {
        setSelectedDatasetId(null);
      }

      // Clear the stored ID if it matches the deleted dataset
      if (sessionStorage.getItem("datasetId") === datasetId) {
        sessionStorage.removeItem("datasetId");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete dataset.",
      );
    }
  };

  const selectedDataset =
    datasets.find((item) => item.id === selectedDatasetId) ?? null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-6 py-28 md:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-sky-600 p-6 text-white shadow-lg md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">
                  Workspace
                </p>
                <h1 className="mt-2 text-3xl font-black md:text-4xl">
                  Data Studio
                </h1>
              </div>

              <button
                type="button"
                onClick={() => navigate("/home")}
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                Back to Home
              </button>
              <button
                type="button"
                onClick={() => navigate("/csv-corrector")}
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                CSV corrector
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
            <div className="space-y-6">
              <FileUpload onUpload={handleUpload} />
              <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Datasets</h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {datasets.length}
                  </span>
                </div>

                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                {loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Loading datasets...
                  </div>
                ) : datasets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No datasets uploaded yet. Add your first file to begin
                    analysis.
                  </div>
                ) : (
                  <div className="space-y-3">
                    ```tsx
                    {datasets.map((dataset) => {
                      const isActive = selectedDatasetId === dataset.id;

                      return (
                        <div
                          key={dataset.id}
                          className={`w-full rounded-2xl border p-4 transition ${
                            isActive
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                          }`}>
                          {/* Button 1: Select the dataset */}
                          <button
                            type="button"
                            onClick={() => setSelectedDatasetId(dataset.id)}
                            className="w-full text-left">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">
                                  {dataset.name ||
                                    dataset.original_filename ||
                                    "Dataset"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {dataset.original_filename || "CSV file"}
                                </p>
                              </div>

                              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                {dataset.status || "ready"}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                              <span>{dataset.column_count ?? 0} columns</span>
                              <span>{dataset.row_count ?? 0} rows</span>
                            </div>

                            <div className="mt-2 text-[11px] text-slate-400">
                              {dataset.created_at
                                ? new Date(
                                    dataset.created_at,
                                  ).toLocaleDateString()
                                : "Today"}
                            </div>
                          </button>

                          {/* Button 2: Delete the dataset */}
                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              onClick={() => handleDelete(dataset.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    ```
                  </div>
                )}
              </aside>
            </div>

            <div className="space-y-6">
              {selectedDataset ? (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                          Selected dataset
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                          {selectedDataset.name ||
                            selectedDataset.original_filename ||
                            "Dataset"}
                        </h2>
                      </div>
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {selectedDataset.status || "ready"}
                      </span>
                    </div>
                  </div>

                  <DatasetPreview
                    organizationId={organizationId}
                    datasetId={selectedDataset.id}
                    token={token}
                  />

                  <DatasetAnalysisDashboard
                    organizationId={organizationId}
                    datasetId={selectedDataset.id}
                    token={token}
                  />
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800">
                    Choose a dataset to explore
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload a CSV file or select a dataset from the list to
                    preview and analyze it.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {selectedDatasetId && organizationId && token && (
          <DataCleaning
            organizationId={organizationId}
            datasetId={selectedDatasetId}
            token={token}
          />
        )}
      </main>
    </>
  );
};

export default DataPages;
