import { useRef, useState } from "react";
// import { checkCsvFile, type CsvCheckResult } from "../../service/checkCSV";

interface FileUploadProps {
  onUpload?: (file: File) => Promise<void>;
  maxSizeMB?: number;
  accept?: string;
}

const FileUpload = ({
  onUpload,
  maxSizeMB = 10,
  accept = ".csv,.xlsx,.json,.pdf",
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  // const [validationResult, setValidationResult] =
  //   useState<CsvCheckResult | null>(null);

  const handleFile = (selectedFile?: File) => {
    setError("");
    // setValidationResult(null);

    if (!selectedFile) return;

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setFile(null);
      setError(`File size must be less than ${maxSizeMB} MB.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (!onUpload) {
      setError("Upload service is not configured yet.");
      return;
    }

    setLoading(true);
    setError("");
    // setValidationResult(null);

    try {
      // Step 1: Validate CSV files before uploading.
      // if (file.name.toLowerCase().endsWith(".csv")) {
      //   // const result = await checkCsvFile(file);
      //   // setValidationResult(result);

      //   // Stop if CSV validation fails.
      //   if (!result.valid) {
      //     setError("CSV validation failed. Fix the errors before uploading.");
      //     return;
      //   }
      // }

      // Step 2: Upload the same file after successful validation.
      await onUpload(file);

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "File validation or upload failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Upload your file
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a file to validate and upload to your workspace.
        </p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        onClick={() => {
          if (!loading) inputRef.current?.click();
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
        }`}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={loading}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl">
          ↑
        </div>

        <p className="mt-4 font-medium text-slate-800">
          Click to browse or drag and drop
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Supported: CSV, XLSX, JSON, PDF
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Maximum file size: {maxSizeMB} MB
        </p>
      </div>

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setFile(null);
              setError("");
              // setValidationResult(null);

              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            className="ml-4 text-sm text-red-600 hover:text-red-700 disabled:opacity-50">
            Remove
          </button>
        </div>
      )}

      {/* {validationResult && (
        <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p
              className={`font-semibold ${
                validationResult.valid ? "text-green-700" : "text-red-700"
              }`}>
              {validationResult.valid
                ? "CSV structure is valid"
                : "CSV validation failed"}
            </p>

            {validationResult.summary && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  ["Rows", validationResult.summary.rows],
                  ["Columns", validationResult.summary.columns],
                  ["Missing values", validationResult.summary.missing_values],
                  ["Duplicate rows", validationResult.summary.duplicate_rows],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {validationResult.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-700">Errors</p>
              {validationResult.errors.map((item, index) => (
                <p key={index} className="text-sm text-red-600">
                  • {item}
                </p>
              ))}
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-700">Warnings</p>
              {validationResult.warnings.map((item, index) => (
                <p key={index} className="text-sm text-amber-700">
                  • {item}
                </p>
              ))}
            </div>
          )}
        </div>
      )} */}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Validating and uploading..." : "Validate and upload"}
      </button>
    </form>
  );
};

export default FileUpload;
