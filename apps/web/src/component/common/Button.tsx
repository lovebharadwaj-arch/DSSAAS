import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  ...props
}: ButtonProps) => {
  const buttonVariants: Record<ButtonVariant, string> = {
    primary:
      "bg-[#0B7A53] text-white shadow-lg shadow-emerald-600/20 hover:bg-[#085f41]",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
  };

  const selectedVariant = buttonVariants[variant] || buttonVariants.primary;

  return (
    <button
      {...props}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${selectedVariant} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
