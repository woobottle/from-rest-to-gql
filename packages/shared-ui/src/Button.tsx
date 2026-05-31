import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", style, ...rest }: ButtonProps) {
  const base = {
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    border: "1px solid #d1d5db",
    background: variant === "primary" ? "#111827" : "transparent",
    color: variant === "primary" ? "#fff" : "#111827",
  } as const;
  return <button {...rest} style={{ ...base, ...style }} />;
}
