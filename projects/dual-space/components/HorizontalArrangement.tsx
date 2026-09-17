import type { ReactNode } from "react";

export function HorizontalArrangement({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`horizontal-arrangement ${className}`.trim()}>{children}</div>;
}
