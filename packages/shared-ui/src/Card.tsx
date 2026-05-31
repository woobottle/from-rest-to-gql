import type { CSSProperties, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  style?: CSSProperties;
};

const base: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
};

export function Card({ children, style }: CardProps) {
  return <div style={{ ...base, ...style }}>{children}</div>;
}
