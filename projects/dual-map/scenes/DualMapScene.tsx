import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { Arrows, Op } from "../components/Stage";
import { straight } from "../lib/arrows";
import { DUAL_ARROW, MAP_NAME_SIZE, NAME_SIZE, NAMES } from "./layout";
import { CompositeFrame } from "./PullbackScene";
import { DUAL_MAP_BOARD } from "./steps";

export function DualArrow({ className = "" }: { className?: string }) {
  return <Arrows arrows={[straight("dual", [DUAL_ARROW.from, DUAL_ARROW.y], [DUAL_ARROW.to, DUAL_ARROW.y], { color: "var(--purple)", className, delay: .3 })]} />;
}

/**
 * 方块上的名字与箭头，按层出现：1 T* 箭头；2 V、W、T 与 V*、W*；3 果汁收银台 φ 与水果收银台 T*φ；4 等式 T*φ = φ∘T。
 * step 是已出现的层数；animate 为真时最后一层带入场动画。本幕与下一幕第 1 步共用。
 */
export function DualMapOverlay({ step, animate }: { step: number; animate: boolean }) {
  const enter = (k: number) => animate && step === k ? "fade-in" : "";
  return <>
    {step >= 1 && <>
      <DualArrow className={animate && step === 1 ? "" : "still"} />
      <Op latex="T^*" size={MAP_NAME_SIZE} x={NAMES.Ts[0]} y={NAMES.Ts[1]} className={`dual-name ${enter(1)}`} delay={.8} />
    </>}
    {step >= 2 && <>
      <Op latex="V" size={NAME_SIZE} x={NAMES.V[0]} y={NAMES.V[1]} className={enter(2)} />
      <Op latex="W" size={NAME_SIZE} x={NAMES.W[0]} y={NAMES.W[1]} className={enter(2)} />
      <Op latex="T" size={MAP_NAME_SIZE} x={NAMES.T[0]} y={NAMES.T[1]} className={enter(2)} />
      <Op latex="V^*" size={NAME_SIZE} x={NAMES.Vs[0]} y={NAMES.Vs[1]} className={`dual-name ${enter(2)}`} delay={.6} />
      <Op latex="W^*" size={NAME_SIZE} x={NAMES.Ws[0]} y={NAMES.Ws[1]} className={`dual-name ${enter(2)}`} delay={.6} />
    </>}
    {step >= 3 && <>
      <Op latex={"\\varphi"} size={MAP_NAME_SIZE} x={NAMES.phi[0]} y={NAMES.phi[1]} className={`dual-name ${enter(3)}`} />
      <Op latex={"T^*\\varphi"} size={MAP_NAME_SIZE} x={NAMES.pulled[0]} y={NAMES.pulled[1]} className={`dual-name ${enter(3)}`} delay={.8} />
    </>}
    {step >= 4 && <Op latex={"T^*\\varphi = \\varphi\\circ T"} size={MAP_NAME_SIZE} x={NAMES.identity[0]} y={NAMES.identity[1]} className={enter(4)} />}
  </>;
}

/**
 * 对偶映射：榨汁机 T 从水果袋走向果汁，T* 从果汁收银台走回水果收银台，方向相反。
 * 0 复现上一幕结尾（框停在水果收银台上）；1 框、袋子与结果淡出，下行出现 T* 箭头；2 写出 V、W、T 与 V*、W*；
 * 3 果汁收银台叫 φ，翻译出来的水果收银台叫 T*φ；4 写出 T*φ = φ∘T：先榨汁，再结账。
 */
export function DualMapScene({ step }: SceneProps) {
  return <section className="lesson" data-step={step} aria-label="对偶映射把果汁收银台送回水果收银台，方向与榨汁机相反">
    <Board {...DUAL_MAP_BOARD[step]} />
    {step <= 1 && <div className={step === 1 ? "fade-out" : ""}><CompositeFrame /></div>}
    <DualMapOverlay step={step} animate />
  </section>;
}
