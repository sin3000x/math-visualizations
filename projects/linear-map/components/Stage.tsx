import type { HTMLAttributes, ReactNode } from "react";
import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { JuicerIcon } from "@math-visualizations/scene-kit/JuicerIcon";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import type { Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import "./Stage.css";

/** 一次映射的节奏（秒）：输入箭头 → 榨汁机运转 → 输出箭头 → 结果出现。 */
export const FLOW = { run: .45, out: .75, result: 1.05 } as const;

type PlaceProps = { x: number; y: number; scale?: number; delay?: number; children: ReactNode } & HTMLAttributes<HTMLDivElement>;

/** 以 (x, y) 为中心放置对象；scale 只缩放内容，外层 transform 留给动画。 */
export function Place({ x, y, scale, delay, className = "", style, children, ...rest }: PlaceProps) {
  return <div {...rest} className={`place ${className}`} style={{ left: x, top: y, ...vars({ "--delay": delay === undefined ? undefined : `${delay}s` }), ...style }}>
    <div className="place-inner" style={scale === undefined ? undefined : { scale: String(scale) }}>{children}</div>
  </div>;
}

export function Bag({ bag, tone, ...place }: { bag: Quantities; tone?: "apple" | "banana" } & Omit<PlaceProps, "children">) {
  return <Place {...place}><FruitBag apples={bag[0]} bananas={bag[1]} tone={tone} /></Place>;
}

/** 榨汁机固定画成 120px 宽，大小由 scale 决定，换位置时可连续缩放。 */
export function Juicer({ color, running = false, ...place }: { running?: boolean } & Omit<PlaceProps, "children">) {
  return <Place {...place} className={`${place.className ?? ""}${running ? " juicer-run" : ""}`} style={{ color, ...place.style }} data-role="juicer" data-layout-content>
    <JuicerIcon width={120} height={120 * 8 / 7} />
  </Place>;
}

export function Op({ latex, size = 56, ...place }: { latex: string; size?: number } & Omit<PlaceProps, "children">) {
  return <Place {...place} className={`operator ${place.className ?? ""}`} style={{ fontSize: size, ...place.style }} data-layout-content><MathFormula latex={latex} /></Place>;
}

/** 一个集合：只有轮廓和名字。 */
export function Space({ name, x, y, width, height, className = "" }: { name: string; x: number; y: number; width: number; height: number; className?: string }) {
  return <div className={`space-oval ${className}`} style={{ left: x, top: y, width, height }} data-layout-content>
    <span className="space-name"><MathFormula latex={name} /></span>
  </div>;
}

/** 一条水平细线，分开画面上下两部分。 */
export function Divider({ y, left, right, className = "", delay }: { y: number; left: number; right: number; className?: string; delay?: number }) {
  return <div className={`divider ${className}`} style={{ top: y, left, width: right - left, ...vars({ "--delay": delay === undefined ? undefined : `${delay}s` }) }} data-layout-content />;
}

/** className：dim 变暗，still 直接画好（复现上一幕结尾时用），fade-out 淡出。 */
export type Arrow = Readonly<{ id: string; from: readonly [number, number]; to: readonly [number, number]; delay: number; color?: string; className?: string }>;

/** 起止切线沿主方向的箭头；箭杆按 pathLength 绘出，箭头随后出现。 */
function arrowPaths([x1, y1]: readonly [number, number], [x2, y2]: readonly [number, number]) {
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
  const [ux, uy] = horizontal ? [Math.sign(x2 - x1), 0] : [0, Math.sign(y2 - y1)];
  const m = horizontal ? (x1 + x2) / 2 : (y1 + y2) / 2;
  const shaft = horizontal ? `M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}` : `M${x1} ${y1}C${x1} ${m} ${x2} ${m} ${x2} ${y2}`;
  const [bx, by, px, py] = [x2 - ux * 16, y2 - uy * 16, -uy * 10, ux * 10];
  return { shaft, head: `M${bx + px} ${by + py}L${x2} ${y2}L${bx - px} ${by - py}` };
}

export function Arrows({ arrows }: { arrows: readonly Arrow[] }) {
  return <svg className="flow-arrows" viewBox="0 0 1440 810" aria-hidden="true">
    {arrows.map(arrow => {
      const { shaft, head } = arrowPaths(arrow.from, arrow.to);
      return <g key={arrow.id} className={arrow.className} style={vars({ "--delay": `${arrow.delay}s`, color: arrow.color })}>
        <path className="arrow-shaft" pathLength={1} d={shaft} /><path className="arrow-head" d={head} />
      </g>;
    })}
  </svg>;
}
