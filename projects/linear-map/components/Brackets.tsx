import type { ReactNode } from "react";
import "./Brackets.css";

/** 一对方括号：两边各是一条带短钩的竖线，各自按 pathLength 绘出。 */
export function Bracket({ left, right, top, bottom }: { left: number; right: number; top: number; bottom: number }) {
  return <>
    <path pathLength={1} d={`M${left + 16} ${top}H${left}V${bottom}H${left + 16}`} />
    <path pathLength={1} d={`M${right - 16} ${top}H${right}V${bottom}H${right - 16}`} />
  </>;
}

/** 全画布的方括号层；write 时两边同时沿笔画画出。 */
export function BracketLayer({ write = false, className = "", children }: { write?: boolean; className?: string; children: ReactNode }) {
  return <svg className={`brackets${write ? " write" : ""} ${className}`} viewBox="0 0 1440 810" aria-hidden="true">{children}</svg>;
}
