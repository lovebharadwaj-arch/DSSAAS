import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = ({
  label,
  id,
  name,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = "",
  ...props
}: InputProps) => {
  const inputId =
    id ||
    name ||
    `input-${label?.toLowerCase().replace(/\s+/g, "-") || "field"}`;
  const inputName = name || inputId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      <input
        id={inputId}
        name={inputName}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${
          error ? "border-red-500" : "border-slate-200"
        } disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
