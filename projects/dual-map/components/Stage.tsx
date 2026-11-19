import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { JuicerIcon } from "@math-visualizations/scene-kit/JuicerIcon";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import type { Arrow } from "../lib/arrows";
import { flyFrom } from "../lib/fly";
import type { Bag as Quantities } from "../lib/math/prices";
import { vars } from "../lib/style";
import "./Stage.css";

/** 一次榨汁的节奏（秒）：输入箭头 → 榨汁机运转 → 输出箭头 → 托盘出现。 */
export const FLOW = { run: .45, out: .75, result: 1.15 } as const;

type PlaceProps = { x: number; y: number; scale?: number; delay?: number; children?: ReactNode } & HTMLAttributes<HTMLDivElement>;

/** 以 (x, y) 为中心放置对象；scale 只缩放内容，外层留给动画。 */
export function Place({ x, y, scale, delay, className = "", style, children, ...rest }: PlaceProps) {
  return <div {...rest} className={`place ${className}`} style={{ left: x, top: y, ...vars({ "--delay": delay === undefined ? undefined : `${delay}s` }), ...style }}>
    <div className="place-inner" style={scale === undefined ? undefined : { scale: String(scale) }}>{children}</div>
  </div>;
}

export function Bag({ bag, tone, ...place }: { bag: Quantities; tone?: "apple" | "banana" } & Omit<PlaceProps, "children">) {
  return <Place {...place} data-role="bag" data-values={bag.join(",")} data-layout-content><FruitBag apples={bag[0]} bananas={bag[1]} tone={tone} /></Place>;
}

/** 榨汁机固定画成 120px 宽，大小由 scale 决定。 */
export function Juicer({ running = false, ...place }: { running?: boolean } & Omit<PlaceProps, "children">) {
  return <Place {...place} className={`juicer ${place.className ?? ""}${running ? " juicer-run" : ""}`} data-role="juicer" data-layout-content>
    <JuicerIcon width={120} height={120 * 8 / 7} />
  </Place>;
}

export function Op({ latex, size = 56, ...place }: { latex: string; size?: number } & Omit<PlaceProps, "children">) {
  return <Place {...place} className={`operator ${place.className ?? ""}`} style={{ fontSize: size, ...place.style }} data-layout-content><MathFormula latex={latex} /></Place>;
}

/** 收银台下方的结算结果；breakdown 是结果前的逐杯算式；fly 时从同一 section 内的 source 复制飞来。 */
export function Price({ value, breakdown, fly, flyDelay = 0, className = "", ...place }: { value: number; breakdown?: string; fly?: string; flyDelay?: number } & Omit<PlaceProps, "children">) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!fly) return;
    const source = ref.current!.closest("section")?.querySelector(fly);
    if (!source) throw new Error(`找不到复制来源：${fly}`);
    const animation = flyFrom(ref.current!, source, { delay: flyDelay });
    return () => animation.cancel();
  }, [fly, flyDelay]);
  return <Place data-role="price" {...place} className={`price ${className}`} data-value={value} data-layout-content>
    {breakdown && <span className="price-breakdown"><MathFormula latex={`${breakdown}=`} /></span>}
    <span ref={ref} className="price-value"><MathFormula latex={`${value}\\,\\text{元}`} /></span>
  </Place>;
}

/** 箭杆按 pathLength 绘出，箭头随后出现；className：still 直接画好，dashed 虚线，fade-out 淡出。 */
export function Arrows({ arrows }: { arrows: readonly Arrow[] }) {
  return <svg className="flow-arrows" viewBox="0 0 1440 810" aria-hidden="true">
    {arrows.map(({ id, d, head: [x, y, angle], delay = 0, color, className = "" }) => {
      const wing = (side: number) => `${x - 18 * Math.cos(angle) + side * 11 * Math.sin(angle)} ${y - 18 * Math.sin(angle) - side * 11 * Math.cos(angle)}`;
      return <g key={id} className={`arrow ${className}`} style={vars({ "--delay": `${delay}s`, color })}>
        <path className="arrow-shaft" pathLength={1} d={d} /><path className="arrow-head" d={`M${wing(1)}L${x} ${y}L${wing(-1)}`} />
      </g>;
    })}
  </svg>;
}
