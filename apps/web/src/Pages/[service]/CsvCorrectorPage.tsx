import {
  AlertCircle,
  Check,
  ChevronRight,
  CloudUpload,
  FileCheck2,
  Layers3,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";
import PageHeader from "../../component/dashboard/PageHeader";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default function CsvCorrectorPage() {
  const [fileName, setFileName] = useState("");
  const [options, setOptions] = useState([
    "Trim whitespace",
    "Remove duplicate rows",
    "Standardize text",
  ]);
  const toggle = (o: string) =>
    setOptions((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );
  return (
    <>
      <PageHeader
        eyebrow="DATA QUALITY"
        title="CSV Corrector"
        subtitle="Prepare cleaner, more consistent datasets before analysis and modeling."
      />
      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-white">Upload your CSV</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a file to preview correction options
              </p>
            </div>
            <label className="upload-drop">
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              />
              <div className="upload-icon">
                <CloudUpload size={25} />
              </div>
              <div className="mt-3 text-sm font-semibold text-white">
                {fileName || "Drag and drop your CSV file"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                or click to browse · CSV, TSV · max 100 MB
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="file-chip">.CSV</span>
                <span className="file-chip">.TSV</span>
                <span className="file-chip">.TXT</span>
              </div>
            </label>
          </section>
          <section className="panel p-5 sm:p-6">
            <h2 className="font-semibold text-white">Correction options</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select the cleanup operations you want to apply
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  t: "Trim whitespace",
                  d: "Remove leading and trailing spaces from values",
                  i: WandSparkles,
                },
                {
                  t: "Remove duplicate rows",
                  d: "Identify and remove identical records",
                  i: Layers3,
                },
                {
                  t: "Standardize text",
                  d: "Normalize casing and text formatting",
                  i: SlidersHorizontal,
                },
                {
                  t: "Handle missing values",
                  d: "Choose how empty cells should be treated",
                  i: AlertCircle,
                },
              ].map((x) => {
                const Icon = x.i;
                return (
                  <label key={x.t} className="option-row">
                    <input
                      type="checkbox"
                      checked={options.includes(x.t)}
                      onChange={() => toggle(x.t)}
                    />
                    <div className="option-icon">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200">
                        {x.t}
                      </div>
                      <div className="mt-1 text-[10px] leading-4 text-slate-500">
                        {x.d}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                  </label>
                );
              })}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                className="primary-button"
                disabled={!fileName}
                onClick={() =>
                  window.alert(
                    "UI preview only. CSV correction is not connected yet.",
                  )
                }>
                <WandSparkles size={15} /> Analyze & correct
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setFileName("");
                  setOptions([
                    "Trim whitespace",
                    "Remove duplicate rows",
                    "Standardize text",
                  ]);
                }}>
                Reset
              </button>
            </div>
            <p className="mt-3 text-[10px] text-slate-500">
              Selected: {options.length} operations · UI preview only
            </p>
          </section>
        </div>
        <div className="space-y-5">
          <section className="panel p-5">
            <h2 className="font-semibold text-white">Data quality overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              Illustrative preview metrics
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { v: "98.2%", l: "Completeness", c: "emerald" },
                { v: "142", l: "Duplicates", c: "amber" },
                { v: "37", l: "Missing cells", c: "pink" },
                { v: "12", l: "Format issues", c: "blue" },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div
                    className={cx(
                      "text-xl font-bold",
                      x.c === "emerald"
                        ? "text-emerald-300"
                        : x.c === "amber"
                          ? "text-amber-300"
                          : x.c === "pink"
                            ? "text-pink-300"
                            : "text-sky-300",
                    )}>
                    {x.v}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">{x.l}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileCheck2 size={17} className="text-indigo-300" />
              <h2 className="font-semibold text-white">Correction workflow</h2>
            </div>
            {[
              "Upload file",
              "Inspect data quality",
              "Apply corrections",
              "Review & download",
            ].map((x, i) => (
              <div
                key={x}
                className="flex items-center gap-3 border-b border-slate-800 py-3 last:border-0">
                <div
                  className={cx(
                    "pipeline-step",
                    i === 0 && fileName ? "pipeline-done" : "",
                  )}>
                  {i === 0 && fileName ? <Check size={13} /> : i + 1}
                </div>
                <div className="flex-1 text-xs text-slate-300">{x}</div>
                <span className="text-[10px] text-slate-600">
                  {i === 0 && fileName ? "Selected" : "Pending"}
                </span>
              </div>
            ))}
          </section>
          <div className="rounded-xl border border-indigo-400/15 bg-indigo-400/5 p-4">
            <div className="flex gap-2">
              <Sparkles size={16} className="shrink-0 text-indigo-300" />
              <p className="text-xs leading-5 text-slate-300">
                Tip: run data quality checks before training a model to reduce
                avoidable errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
