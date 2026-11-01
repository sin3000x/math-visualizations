import { JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, Divider, FLOW, Juicer, Op, Place } from "../components/Stage";
import { juiceOf, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { BASIS, basisArrows, columnArrows, equationArrows, LIN } from "./layout";
import "./BasisImagesScene.css";

const bases = [{ bag: [1, 0] as Quantities, tone: "apple" as const }, { bag: [0, 1] as Quantities, tone: "banana" as const }];
const target: Quantities = [1, .5];
/** 上一幕左列：0.5 × (2,1) 榨汁的结果。 */
const previous: Quantities = [2, 1];
const { eq } = BASIS;

/** 从左边原件处飞来的复制品：起点位置与大小都取原件的。 */
const copyFrom = (x: number, y: number, fromX: number, fromY: number, fromScale: number) =>
  vars({ "--from-x": `${fromX - x}px`, "--from-y": `${fromY - y}px`, "--from-s": String(fromScale / eq.scale) });

/**
 * 由线性，只需知道两只基袋的结果：(1, 0.5) = 1 × 苹果基袋 + 0.5 × 香蕉基袋，
 * 所以它的托盘 = 1 × 苹果托盘 + 0.5 × 香蕉托盘：T 把袋子的等式映成托盘的等式。
 * 步骤：0 复现 LinearityScene 结尾；1 上一幕淡出，T 移到苹果映射，基袋出现；2 两只基袋同时榨汁；
 * 3 分割线与 (1,0.5) 出现在等式左端；4 写成两只基袋的组合，基袋复制飞来；5 基袋托盘复制飞到下一行；6 得到 (1,0.5) 的托盘；
 * 7 T 放在 (1,0.5) 与它的托盘之间。
 */
export function BasisImagesScene({ step }: { step: number }) {
  const settled = step >= 1;
  const leaving = step === 1 ? "fade-out" : "";
  const enter = step === 1 ? "fade-in" : "";
  const appear = (at: number) => step === at ? "fade-in" : "";
  return <section className="lesson basis-images" data-step={step} aria-label="两个基袋的结果决定任意一袋的结果">
    {step <= 1 && <>
      <Arrows arrows={[...columnArrows("p2-half", LIN.scale.P, `still dim ${leaving}`), ...columnArrows("c-half", LIN.scale.C, `still dim ${leaving}`)]} />
      <Place x={LIN.scale.P} y={LIN.trayY} scale={LIN.trayScale} className={leaving}><JuiceTray values={juiceOf(previous)} /></Place>
      <Place x={LIN.scale.C} y={LIN.trayY} scale={LIN.trayScale} className={leaving}><JuiceTray values={juiceOf(target)} /></Place>
      {[LIN.bagY, LIN.equalsY].map(y => <Op key={y} latex="=" x={LIN.scale.equalsX} y={y} className={`${y === LIN.bagY ? "dim " : ""}${leaving}`} />)}
      {[LIN.bagY, LIN.equalsY].map(y => <Op key={`t-${y}`} latex={"0.5\\times"} x={LIN.scale.timesX} y={y} className={`${y === LIN.bagY ? "dim " : ""}${leaving}`} />)}
      <Bag bag={previous} x={LIN.scale.P} y={LIN.bagY} scale={LIN.bagScale} className={`dim ${leaving}`} />
      <Bag bag={target} x={LIN.scale.C} y={LIN.bagY} scale={LIN.bagScale} className={`dim ${leaving}`} />
      <Juicer x={LIN.scale.P} y={LIN.juicerY} scale={LIN.juicerScale} className={`dim ${leaving}`} />
    </>}
    <Arrows arrows={[...(step >= 2 ? bases.flatMap((_, i) => basisArrows(i)) : []), ...(step >= 7 ? equationArrows() : [])]} />

    {/* 上方并排两张映射：基袋 → T → 托盘。苹果那台 T 是从上一幕移来的同一台。 */}
    {bases.map(({ bag, tone }, i) => <div key={i}>
      {settled && <Bag bag={bag} tone={tone} x={BASIS.bagX[i]} y={BASIS.rowY} scale={BASIS.bagScale} className={enter} delay={.5} />}
      {(i === 0 || settled) && <Juicer x={i === 0 && !settled ? LIN.scale.C : BASIS.juicerX[i]} y={i === 0 && !settled ? LIN.juicerY : BASIS.rowY}
        scale={settled ? BASIS.juicerScale : LIN.juicerScale} className={i === 0 ? `glide${settled ? "" : " dim"}` : enter} running={step === 2}
        key={step === 2 ? "run" : "juicer"} delay={step === 1 ? .5 : FLOW.run} />}
      {step >= 2 && <Place x={BASIS.trayX[i]} y={BASIS.rowY} scale={BASIS.trayScale} className={step === 2 ? "emerge" : ""} delay={FLOW.result}>
        <JuiceTray values={juiceOf(bag)} />
      </Place>}
    </div>)}

    {/* 下方等式：上行是袋子，下行是对应的托盘。系数是 (1, 0.5) 中的数量。 */}
    {step >= 3 && <Divider {...BASIS.divider} className={appear(3)} />}
    {step >= 3 && <Bag bag={target} x={eq.resultX} y={eq.bagY} scale={eq.scale} className={appear(3)} />}
    {step >= 4 && <>
      {bases.map(({ bag, tone }, i) => <div key={`eq-${i}`}>
        <Op latex={`${target[i]}\\times`} x={eq.coefX[i]} y={eq.bagY} className={appear(4)} delay={.6} />
        <Bag bag={bag} tone={tone} x={eq.termX[i]} y={eq.bagY} scale={eq.scale} className={step === 4 ? "copy-fly" : ""}
          style={copyFrom(eq.termX[i], eq.bagY, BASIS.bagX[i], BASIS.rowY, BASIS.bagScale)} />
      </div>)}
      <Op latex="+" x={eq.plusX} y={eq.bagY} className={appear(4)} delay={.6} />
      <Op latex="=" x={eq.equalsX} y={eq.bagY} className={appear(4)} delay={.6} />
    </>}
    {step >= 5 && <>
      {bases.map(({ bag }, i) => <div key={`eq-tray-${i}`}>
        <Op latex={`${target[i]}\\times`} x={eq.coefX[i]} y={eq.trayY} className={appear(5)} delay={.6} />
        <Place x={eq.termX[i]} y={eq.trayY} scale={eq.scale} className={step === 5 ? "copy-fly" : ""}
          style={copyFrom(eq.termX[i], eq.trayY, BASIS.trayX[i], BASIS.rowY, BASIS.trayScale)}><JuiceTray values={juiceOf(bag)} /></Place>
      </div>)}
      <Op latex="+" x={eq.plusX} y={eq.trayY} className={appear(5)} delay={.6} />
    </>}
    {step >= 6 && <>
      <Op latex="=" x={eq.equalsX} y={eq.trayY} className={appear(6)} />
      <Place x={eq.resultX} y={eq.trayY} scale={eq.scale} className={step === 6 ? "emerge" : ""} delay={.3}><JuiceTray values={juiceOf(target)} /></Place>
    </>}
    {step >= 7 && <Juicer x={eq.resultX} y={eq.juicerY} scale={eq.juicerScale} className={step === 7 ? "fade-in" : ""}
      running={step === 7} key={step === 7 ? "run" : "juicer"} delay={FLOW.run} />}
  </section>;
}
