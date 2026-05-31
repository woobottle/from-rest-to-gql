import type { CSSProperties, ReactNode } from "react";

type StackProps = {
  children: ReactNode;
  direction?: "row" | "column";
  gap?: number;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
};

export function Stack({ children, direction = "column", gap = 8, align, style }: StackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap,
        alignItems: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
