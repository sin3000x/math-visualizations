import type { CSSProperties, ReactNode } from "react";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { addJuice, type Juice } from "../lib/math/map";
import { vars } from "../lib/style";
import "./JuiceTray.css";

/** 三种果汁从左到右固定为 A、B、C，颜色为青、蓝、紫。 */
export const JUICE_COLORS = ["#62d2c3", "#73a7ef", "#ba91ef"] as const;
/** 液面高度：每个产量单位 13px，杯子最多容纳 9 个单位。 */
const UNIT = 13;
/** 倒入时，来源托盘停在目标正上方 POUR_RISE 处（托盘自身坐标）。 */
export const POUR_RISE = 230;
/** 每个来源依次：移到目标上方 → 液体落下 → 空杯淡出。 */
const STAGE = 1.1, FALL_AT = .45, LEAVE_AT = .85;
/** 数乘：液面连续升降的时长。 */
export const SCALE_SECONDS = 1;

export type PourSource = Readonly<{
  values: Juice;
  /** 来源托盘相对目标托盘的位置（托盘自身坐标）。 */
  from: readonly [number, number];
}>;

function Cups({ layers, scaledFrom }: { layers: readonly Juice[]; scaledFrom?: Juice }) {
  return <div className="tray-cups">{JUICE_COLORS.map((color, i) => {
    let below = 0;
    return <div className="tray-cup" key={i} style={{ color }}>
      {layers.map((layer, k) => {
        const height = Math.max(0, layer[i]) * UNIT;
        // 倒入层从来源杯底的位置落到已有液面之上；数乘层从原液面连续伸缩。
        const style = vars({
          bottom: below, height, "--fall": `${below - POUR_RISE}px`, "--at": `var(--pour-${k - 1})`,
          "--g": scaledFrom && layer[i] > 0 ? scaledFrom[i] / layer[i] : undefined,
        });
        below += height;
        return height > 0 && <span key={k} className={k ? "juice-layer poured" : "juice-layer"} style={style} />;
      })}
    </div>;
  })}</div>;
}

function Readings({ values, after }: { values: Juice; after?: Juice }) {
  return <div className="tray-readings">{values.map((value, i) => <span className="tray-reading" key={i} style={{ color: JUICE_COLORS[i] }}>
    <span className={after ? "reading-before" : undefined}><MathFormula latex={String(value)} /></span>
    {after && <span className="reading-after"><MathFormula latex={String(after[i])} /></span>}
  </span>)}</div>;
}

function Body({ layers, scaledFrom, readings }: { layers: readonly Juice[]; scaledFrom?: Juice; readings: ReactNode }) {
  return <div className="tray-body"><Cups layers={layers} scaledFrom={scaledFrom} /><div className="tray-base" />{readings}</div>;
}

/**
 * 一组果汁：三杯放在同一个托盘上，是 W 中的一个元素。
 * pouring 时，sources 依次倒进这个托盘；scaledFrom 时，液面从 scaledFrom 连续变到 values（数乘）。
 * 两种变化都在动作结束后才更新读数。
 */
export function JuiceTray({ values, sources = [], pouring = false, scaledFrom, delay = 0, readings = true, className = "", style }: {
  values: Juice; sources?: readonly PourSource[]; pouring?: boolean; scaledFrom?: Juice; delay?: number; readings?: boolean; className?: string; style?: CSSProperties;
}) {
  const layers = pouring ? [values, ...sources.map(source => source.values)] : [values];
  const total = layers.reduce(addJuice);
  const changing = pouring && sources.length > 0 ? "pouring" : scaledFrom ? "scaling" : "";
  const timing = Object.fromEntries(sources.map((_, k) => [`--pour-${k}`, `${delay + k * STAGE + FALL_AT}s`]));
  const done = changing === "pouring" ? delay + sources.length * STAGE : delay + SCALE_SECONDS * .7;
  return <div className={`juice-tray ${changing} ${className}`} data-role="juice" data-values={total.join(",")} data-layout-content
    style={{ ...vars({ "--rise": `${POUR_RISE}px`, "--done": `${done}s`, "--scale-at": `${delay}s`, ...timing }), ...style }}>
    <Body layers={layers} scaledFrom={scaledFrom} readings={readings && (changing
      ? <Readings values={scaledFrom ?? values} after={total} />
      : <Readings values={values} />)} />
    {sources.map((source, k) => <div key={k} className="tray-source" data-role="juice-source" data-layout-content
      style={vars({
        "--sx": `${source.from[0]}px`, "--sy": `${source.from[1]}px`,
        "--start": `${delay + k * STAGE}s`, "--fall-at": `${delay + k * STAGE + FALL_AT}s`, "--leave": `${delay + k * STAGE + LEAVE_AT}s`,
      })}>
      <Body layers={[source.values]} readings={readings && <Readings values={source.values} />} />
    </div>)}
  </div>;
}
