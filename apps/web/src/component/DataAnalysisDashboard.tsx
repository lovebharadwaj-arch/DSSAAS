import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../lib/api";
import {
  fetchColumnDistribution,
  type ColumnDistribution,
} from "../service/columnDistributionService";
import type { DatasetProfile, ProfileApiResponse } from "../types";

interface Props {
  organizationId: string;
  datasetId: string;
  token: string;
}

export default function DatasetAnalysisDashboard({
  organizationId,
  datasetId,
  token,
}: Props) {
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);

  const [selectedColumnName, setSelectedColumnName] = useState("");

  const selectedColumn =
    profile?.columns.find((column) => column.name === selectedColumnName) ??
    profile?.columns[0] ??
    null;

  const statistics = selectedColumn?.statistics ?? {};

  const numericChartData = ["min", "mean", "median", "max"].flatMap((key) => {
    const value = statistics[key];

    return typeof value === "number" && Number.isFinite(value)
      ? [{ name: key, value }]
      : [];
  });

  const frequencySource =
    statistics.topValues ??
    statistics.top_values ??
    statistics.frequencies ??
    statistics.topFrequencies;

  const categoricalChartData = (() => {
    if (Array.isArray(frequencySource)) {
      return frequencySource.flatMap((item) => {
        if (!item || typeof item !== "object") return [];

        const record = item as Record<string, unknown>;
        const name = record.value ?? record.name ?? record.label;
        const count = record.count ?? record.frequency ?? record.valueCount;

        return name !== undefined &&
          typeof count === "number" &&
          Number.isFinite(count)
          ? [{ name: String(name), value: count }]
          : [];
      });
    }

    if (frequencySource !== null && typeof frequencySource === "object") {
      return Object.entries(frequencySource as Record<string, unknown>).flatMap(
        ([name, count]) =>
          typeof count === "number" && Number.isFinite(count)
            ? [{ name, value: count }]
            : [],
      );
    }

    return [];
  })();

  const [distribution, setDistribution] = useState<ColumnDistribution | null>(
    null,
  );
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [distributionError, setDistributionError] = useState("");

  useEffect(() => {
    if (!selectedColumn) {
      setDistribution(null);
      return;
    }

    let cancelled = false;

    async function loadDistribution() {
      setDistributionLoading(true);
      setDistributionError("");
      setDistribution(null);

      try {
        const result = await fetchColumnDistribution(
          organizationId,
          datasetId,
          selectedColumn!.name,
          token,
        );

        if (!cancelled) {
          setDistribution(result);
        }
      } catch (error) {
        if (!cancelled) {
          setDistributionError(
            error instanceof Error
              ? error.message
              : "Unable to load column distribution.",
          );
        }
      } finally {
        if (!cancelled) {
          setDistributionLoading(false);
        }
      }
    }

    void loadDistribution();

    return () => {
      cancelled = true;
    };
  }, [organizationId, datasetId, selectedColumn?.name, token]);

  useEffect(() => {
    setProfile(null);
    setError("");
    setLoading(false);
    setRequestKey(0);
  }, [organizationId, datasetId]);

  useEffect(() => {
    if (!token || !organizationId || !datasetId || requestKey === 0) {
      return;
    }

    let cancelled = false;

    async function runAnalysis() {
      setLoading(true);
      setError("");

      try {
        const result = await apiRequest<ProfileApiResponse>(
          `/organizations/${encodeURIComponent(
            organizationId,
          )}/datasets/${encodeURIComponent(datasetId)}/profile`,
          token,
          { method: "POST" },
        );

        if (!cancelled) {
          setProfile(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Analysis failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [organizationId, datasetId, token, requestKey]);

  const analyzeDataset = () => {
    if (!token || !organizationId || !datasetId) {
      setError("Authentication or dataset information is missing.");
      return;
    }

    setRequestKey((previous) => previous + 1);
  };

  const chartData =
    profile?.columns.map((column) => ({
      name: column.name,
      missing: column.missingCount,
    })) ?? [];

  const totalMissingValues =
    profile?.columns.reduce(
      (total, column) => total + column.missingCount,
      0,
    ) ?? 0;

  const totalCells = profile ? profile.rowCount * profile.columnCount : 0;

  const missingRatio =
    totalCells > 0 ? Math.min(totalMissingValues / totalCells, 1) : 0;

  const duplicateRatio =
    profile && profile.rowCount > 0
      ? Math.min(profile.duplicateCount / profile.rowCount, 1)
      : 0;

  // Missing values have a 70% weight;
  // duplicate rows have a 30% weight.
  const dataQualityScore = profile
    ? Math.max(
        0,
        Math.round(100 * (1 - missingRatio * 0.7 - duplicateRatio * 0.3)),
      )
    : 0;

  const dataQualityLabel =
    dataQualityScore >= 90
      ? "Excellent"
      : dataQualityScore >= 75
        ? "Good"
        : dataQualityScore >= 50
          ? "Needs improvement"
          : "Poor";

  const cards = profile
    ? [
        { label: "Total Rows", value: profile.rowCount },
        { label: "Total Columns", value: profile.columnCount },
        { label: "Duplicate Rows", value: profile.duplicateCount },
        { label: "Missing Values", value: totalMissingValues },
      ]
    : [];

  // Read-only cleaning preview derived from the existing dataset profile.
  const columnsWithMissingValues =
    profile?.columns.filter((column) => column.missingCount > 0) ?? [];

  const hasCleaningIssues = Boolean(
    profile &&
    (profile.duplicateCount > 0 || columnsWithMissingValues.length > 0),
  );

  const getMissingValueRecommendation = (dataType: string) => {
    const normalizedType = dataType.toLowerCase();
    const isNumeric =
      /number|numeric|integer|int|float|double|decimal|real|bigint|smallint/.test(
        normalizedType,
      );

    if (isNumeric) {
      return "Review the distribution, then consider median or mean imputation.";
    }

    if (/boolean|bool/.test(normalizedType)) {
      return "Review the column's meaning before choosing a default value.";
    }

    if (/date|time/.test(normalizedType)) {
      return "Check whether the missing dates are meaningful before filling them.";
    }

    if (/string|text|char|categor|object/.test(normalizedType)) {
      return "Consider the most frequent value or an explicit 'Unknown' category.";
    }

    return "Inspect sample values and choose a strategy appropriate for this column.";
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-full overflow-x-clip space-y-6 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 text-slate-900 shadow-sm sm:p-6 lg:p-8">
      <div className="flex min-w-0 grid grid-cols-2 justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Dataset Analysis
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Explore data quality and column statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={analyzeDataset}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
          {loading
            ? "Analyzing..."
            : profile
              ? "Re-analyze Dataset"
              : "Analyze Dataset"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {!profile && !loading && !error && (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-white/80 p-8 text-center shadow-sm sm:p-12">
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Ready to analyze your data?
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Click Analyze Dataset to calculate your dataset profile.
          </p>
        </div>
      )}

      {loading && (
        <p
          role="status"
          className="rounded-2xl bg-white/70 py-8 text-center text-sm font-medium text-slate-500">
          Processing your CSV file...
        </p>
      )}

      {profile && (
        <>
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition duration-200 hover:border-indigo-200 hover:shadow-md sm:p-6">
                <p className="text-sm leading-6 text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="min-w-0 rounded-2xl overflow-hidden border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition duration-200 hover:border-indigo-200 hover:shadow-md sm:p-6">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Missing Values by Column
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500">
              Number of empty values detected in each column.
            </p>

            {chartData.length > 0 ? (
              <div className="h-80 min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="missing"
                      name="Missing values"
                      fill="#6366f1"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                No columns available.
              </p>
            )}

            {profile && (
              <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex min-w-0 flex-col gap-4 overflow-hidden sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      Data Quality
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Based on missing values and duplicate rows
                    </p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                      {dataQualityScore}/100
                    </p>
                    <p className="text-sm font-medium text-slate-600">
                      {dataQualityLabel}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Data quality score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={dataQualityScore}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dataQualityScore >= 90
                        ? "bg-emerald-500"
                        : dataQualityScore >= 75
                          ? "bg-blue-500"
                          : dataQualityScore >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${dataQualityScore}%` }}
                  />
                </div>

                <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-sm leading-5 text-slate-500">
                      Missing values
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {totalMissingValues.toLocaleString()}
                    </p>
                    <p className="text-sm leading-5 text-slate-500">
                      {(missingRatio * 100).toFixed(2)}% of all cells
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-sm leading-5 text-slate-500">
                      Duplicate rows
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                      {profile.duplicateCount.toLocaleString()}
                    </p>
                    <p className="text-sm leading-5 text-slate-500">
                      {(duplicateRatio * 100).toFixed(2)}% of rows
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {profile && selectedColumn && (
            <section className="mt-6 min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Column Analysis
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Explore statistics for an individual column.
                  </p>
                </div>

                <select
                  value={selectedColumn.name}
                  onChange={(event) =>
                    setSelectedColumnName(event.target.value)
                  }
                  className="w-full max-w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-auto sm:max-w-[280px]"
                  aria-label="Select column to analyze">
                  {profile.columns.map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm leading-5 text-slate-500">Data Type</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedColumn.dataType}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm leading-5 text-slate-500">
                    Unique Values
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {selectedColumn.uniqueCount.toLocaleString()}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm leading-5 text-slate-500">
                    Missing Values
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {selectedColumn.missingCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {profile && selectedColumn && (
                <section className="mt-6 min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Column Visualization
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Distribution summary for {selectedColumn.name}
                  </p>

                  {["number", "numeric"].includes(
                    selectedColumn.dataType.toLowerCase(),
                  ) ? (
                    numericChartData.length > 0 ? (
                      <div className="mt-6 h-72 min-w-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={numericChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        No numeric summary statistics are available.
                      </p>
                    )
                  ) : categoricalChartData.length > 0 ? (
                    <div className="mt-6 h-72 min-w-0 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoricalChartData}
                          margin={{ bottom: 35, left: 5, right: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            height={70}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#0d9488" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No frequency data is available for this column.
                    </p>
                  )}
                </section>
              )}

              <div className="mt-6">
                <h3 className="mb-3 text-base font-bold tracking-tight text-slate-900">
                  Statistical Details
                </h3>

                {Object.keys(selectedColumn.statistics ?? {}).length > 0 ? (
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    {Object.entries(selectedColumn.statistics ?? {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/20">
                          <p className="text-sm capitalize text-slate-500">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>

                          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-sm text-slate-900">
                            {value !== null && typeof value === "object"
                              ? JSON.stringify(value, null, 2)
                              : String(value ?? "N/A")}
                          </pre>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                    No additional statistics are available for this column.
                  </p>
                )}
              </div>
            </section>
          )}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
            <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Column Details
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Detected types, missing values, and distinct values.
              </p>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Column
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Data Type
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Missing
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Unique Values
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profile.columns.map((column) => (
                    <tr
                      key={column.name}
                      className="border-t border-slate-100 transition hover:bg-indigo-50/40">
                      <td className="break-words px-5 py-4 font-semibold text-slate-800">
                        {column.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                          {column.dataType}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {column.missingCount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {column.uniqueCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition duration-200 hover:border-indigo-200 hover:shadow-md sm:p-6">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Detailed Column Statistics
            </h3>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              Additional statistics returned by the profiling service.
            </p>

            <div className="space-y-3">
              {profile.columns.map((column) => (
                <details
                  key={column.name}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200">
                  <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden transition hover:text-indigo-700">
                    {column.name}
                  </summary>
                  <pre className="mt-3 max-w-full overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-700">
                    {JSON.stringify(column.statistics ?? {}, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          </div>

          <section
            aria-labelledby="cleaning-preview-title"
            className="min-w-0 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="cleaning-preview-title"
                    className="text-lg font-bold tracking-tight text-slate-900">
                    Data Cleaning Preview
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                    Preview only
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review detected issues and suggested next steps before
                  deciding whether to clean the dataset.
                </p>
              </div>
              <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                No changes applied
              </span>
            </div>

            {!hasCleaningIssues ? (
              <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                  aria-hidden="true">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-emerald-900">
                    No missing values or duplicate rows detected
                  </p>
                  <p className="mt-1 text-sm leading-5 text-emerald-800">
                    Based on the current profile, no cleaning suggestions are
                    needed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {profile.duplicateCount > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-start">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                      aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5">
                        <rect x="8" y="8" width="12" height="12" rx="2" />
                        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900">
                          Duplicate rows
                        </h4>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                          {profile.duplicateCount.toLocaleString()} detected
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Review repeated records before removing anything.
                        Confirm that repeated rows are not valid transactions or
                        repeated events.
                      </p>
                      <p className="mt-2 text-xs font-medium text-amber-800">
                        Suggested next step: preview duplicate records and
                        compare their values.
                      </p>
                    </div>
                  </div>
                )}

                {columnsWithMissingValues.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h4 className="font-semibold text-slate-900">
                        Columns with missing values
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {columnsWithMissingValues.length} of{" "}
                        {profile.columns.length} columns need review.
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {columnsWithMissingValues.map((column) => (
                        <div
                          key={column.name}
                          className="grid min-w-0 gap-2 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] sm:gap-5">
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-slate-800">
                              {column.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Type: {column.dataType}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-amber-700">
                              {column.missingCount.toLocaleString()} missing
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Suggested review
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {getMissingValueRecommendation(column.dataType)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              These are recommendations based on the available profile only.
              This preview does not display raw rows, change values, remove
              records, or save a cleaned dataset.
            </p>
          </section>
        </>
      )}
    </section>
  );
}
