import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
}

const Checkbox = ({
  label,
  name,
  checked = false,
  onChange,
  value,
  disabled = false,
  required = false,
  error,
  className = "",
}: CheckboxProps) => {
  return (
    <div className={`w-full ${className}`}>
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {label && <span className="text-sm text-slate-700">{label}</span>}
      </label>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Checkbox;
