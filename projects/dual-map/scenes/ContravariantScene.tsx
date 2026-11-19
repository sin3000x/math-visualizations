import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { Arrows, Op } from "../components/Stage";
import { straight } from "../lib/arrows";
import { vars } from "../lib/style";
import { DIAGRAM, MAP_NAME_SIZE, NAME_SIZE } from "./layout";
import { CONTRAVARIANT_BOARD } from "./steps";
import "./ContravariantScene.css";

const { x: [X0, X1], top: TOP, bottom: BOTTOM, gap: GAP } = DIAGRAM;
const MID = (X0 + X1) / 2;
const AT = { diagram: 1, dualize: 2, flip: 3 } as const;
/** 上行 T 箭头的两端；取对偶时它的复制品原地转 180°、落到下行，成为 T*。 */
const T_ARROW = { from: [X0 + GAP, TOP], to: [X1 - GAP, TOP] } as const;

/** T 箭头的复制品：以自身中心旋转半圈并下落，颜色换成对偶一侧的紫色。 */
function FlipArrow() {
  const [[x1, y1], [x2, y2]] = [T_ARROW.from, T_ARROW.to];
  const wing = (side: number) => `${x2 - 18} ${y2 - side * 11}`;
  return <svg className="flow-arrows" viewBox="0 0 1440 810" aria-hidden="true">
    <g className="arrow still flip-arrow" style={vars({ "--drop": `${BOTTOM - TOP}px` })}>
      <path className="arrow-shaft" d={`M${x1} ${y1}L${x2} ${y2}`} /><path className="arrow-head" d={`M${wing(1)}L${x2} ${y2}L${wing(-1)}`} />
    </g>
  </svg>;
}

/**
 * 反变：对偶操作把每个空间变成它的收银台空间，却把映射的方向反过来。
 * 0 复现上一幕结尾；1 方块淡出，上行出现 V → W 与 T；2 两条竖直的对偶箭头把 V、W 送到 V*、W*；
 * 3 T 箭头的复制品转半圈落到下行，成为 W* → V* 的 T*。
 */
export function ContravariantScene({ step }: SceneProps) {
  const enter = (k: number) => step === k ? "fade-in" : "";
  const draw = (k: number) => step === k ? "" : "still";
  return <section className="lesson" data-step={step} aria-label="对偶操作把空间变成收银台空间，把映射的方向反过来">
    {step <= AT.diagram && <div className={step === AT.diagram ? "fade-out" : ""}><Board {...CONTRAVARIANT_BOARD} /></div>}
    {step >= AT.diagram && <>
      <Op latex="V" size={NAME_SIZE} x={X0} y={TOP} className={enter(AT.diagram)} delay={.4} />
      <Op latex="W" size={NAME_SIZE} x={X1} y={TOP} className={enter(AT.diagram)} delay={.4} />
      <Arrows arrows={[straight("t", T_ARROW.from, T_ARROW.to, { delay: .9, className: draw(AT.diagram) })]} />
      <Op latex="T" size={MAP_NAME_SIZE} x={MID} y={TOP - 45} className={enter(AT.diagram)} delay={1.3} />
    </>}
    {step >= AT.dualize && <>
      <Arrows arrows={[
        straight("dual-v", [X0, TOP + 55], [X0, BOTTOM - 55], { color: "var(--purple)", className: draw(AT.dualize) }),
        straight("dual-w", [X1, TOP + 55], [X1, BOTTOM - 55], { color: "var(--purple)", delay: .3, className: draw(AT.dualize) }),
      ]} />
      <Op latex="V^*" size={NAME_SIZE} x={X0} y={BOTTOM} className={`dual-name ${enter(AT.dualize)}`} delay={.5} />
      <Op latex="W^*" size={NAME_SIZE} x={X1} y={BOTTOM} className={`dual-name ${enter(AT.dualize)}`} delay={.8} />
    </>}
    {step >= AT.flip && <>
      <FlipArrow />
      <Op latex="T^*" size={MAP_NAME_SIZE} x={MID} y={BOTTOM - 45} className={`dual-name ${enter(AT.flip)}`} delay={1.6} />
    </>}
  </section>;
}
