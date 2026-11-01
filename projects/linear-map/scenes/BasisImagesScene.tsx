import { JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, FLOW, Juicer, Op, Place } from "../components/Stage";
import { juiceOf, scaleJuice, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { BASIS, basisArrows, columnArrows, LIN } from "./layout";
import "./BasisImagesScene.css";

const bases = [{ bag: [1, 0] as Quantities, tone: "apple" as const }, { bag: [0, 1] as Quantities, tone: "banana" as const }];
const target: Quantities = [1, .5];
/** 上一幕左列：0.5 × (2,1) 榨汁的结果。 */
const previous: Quantities = [2, 1];
const [apple, banana] = bases.map(({ bag }) => juiceOf(bag));
const bananaPart = scaleJuice(target[1], banana);
const local = ([x, y]: readonly [number, number]) => [(x - BASIS.appleCopy[0]) / BASIS.copyScale, (y - BASIS.appleCopy[1]) / BASIS.copyScale] as const;

/**
 * 只需知道两只基袋的结果：(1, 0.5) 拆成 1 袋苹果基袋与 0.5 袋香蕉基袋，
 * 抄来两只基袋的托盘，香蕉托盘液面乘 0.5，再倒进苹果托盘。
 * 步骤：0 复现 LinearityScene 结尾；1 (1,0.5) 移到右上，T 移到苹果行；2 两只基袋同时榨汁；
 * 3 (1,0.5) 拆开；4 抄来托盘；5 香蕉托盘 ×0.5；6 倒在一起。
 */
export function BasisImagesScene({ step }: { step: number }) {
  const settled = step >= 1;
  const leaving = step === 1 ? "fade-out" : "";
  const enter = step === 1 ? "fade-in" : "";
  return <section className="lesson basis-images" data-step={step} aria-label="两个基袋的结果决定任意一袋的结果">
    {step <= 1 && <>
      <Arrows arrows={[...columnArrows("p2-half", LIN.scale.P, `still dim ${leaving}`), ...columnArrows("c-half", LIN.scale.C, `still dim ${leaving}`)]} />
      <Place x={LIN.scale.P} y={LIN.trayY} scale={LIN.trayScale} className={leaving}><JuiceTray values={juiceOf(previous)} /></Place>
      <Place x={LIN.scale.C} y={LIN.trayY} scale={LIN.trayScale} className={leaving}><JuiceTray values={juiceOf(target)} /></Place>
      {[LIN.bagY, LIN.equalsY].map(y => <Op key={y} latex="=" x={LIN.scale.equalsX} y={y} className={`${y === LIN.bagY ? "dim " : ""}${leaving}`} />)}
      {[LIN.bagY, LIN.equalsY].map(y => <Op key={`t-${y}`} latex={"0.5\\times"} x={LIN.scale.timesX} y={y} className={`${y === LIN.bagY ? "dim " : ""}${leaving}`} />)}
      <Bag bag={previous} x={LIN.scale.P} y={LIN.bagY} scale={LIN.bagScale} className={`dim ${leaving}`} />
      <Juicer x={LIN.scale.P} y={LIN.juicerY} scale={LIN.juicerScale} className={`dim ${leaving}`} />
    </>}
    <Arrows arrows={step >= 2 ? bases.flatMap((_, i) => basisArrows(i)) : []} />

    {/* 左边两行：基袋 → T → 托盘。苹果行的 T 是从上一幕移来的同一台。 */}
    {bases.map(({ bag, tone }, i) => <div key={i}>
      {settled && <Bag bag={bag} tone={tone} x={BASIS.bagX} y={BASIS.rowY[i]} scale={BASIS.bagScale} className={enter} delay={.5} />}
      {(i === 0 || settled) && <Juicer x={i === 0 && !settled ? LIN.scale.C : BASIS.juicerX} y={i === 0 && !settled ? LIN.juicerY : BASIS.rowY[i]}
        scale={settled ? BASIS.juicerScale : LIN.juicerScale} className={i === 0 ? `glide${settled ? "" : " dim"}` : enter} running={step === 2}
        key={step === 2 ? "run" : "juicer"} delay={step === 1 ? .5 : FLOW.run} />}
      {step >= 2 && <Place x={BASIS.trayX} y={BASIS.rowY[i]} scale={BASIS.trayScale} className={step === 2 ? "emerge" : ""} delay={FLOW.result}>
        <JuiceTray values={juiceOf(bag)} />
      </Place>}
    </div>)}

    {/* 右边：(1, 0.5) 从上一幕移来，再拆成两部分。 */}
    {step <= 3 && <Bag bag={target} x={settled ? BASIS.target[0] : LIN.scale.C} y={settled ? BASIS.target[1] : LIN.bagY}
      scale={settled ? BASIS.targetScale : LIN.bagScale} className={`glide${settled ? "" : " dim"}${step === 3 ? " fade-out" : ""}`} />}
    {step >= 3 && BASIS.parts.map(({ x, bag, tone }, i) => <Bag key={`part-${i}`} bag={bag} tone={tone} x={x} y={BASIS.partY} scale={BASIS.partScale}
      className={step === 3 ? "split" : ""} style={vars({ "--dx": `${BASIS.target[0] - x}px` })} />)}

    {step >= 4 && <Place x={BASIS.appleCopy[0]} y={BASIS.appleCopy[1]} scale={BASIS.copyScale} className={step === 4 ? "fly" : ""}
      style={vars({ "--from-x": `${BASIS.trayX - BASIS.appleCopy[0]}px`, "--from-y": `${BASIS.rowY[0] - BASIS.appleCopy[1]}px` })}>
      <JuiceTray values={apple} sources={step === 6 ? [{ values: bananaPart, from: local(BASIS.bananaCopy) }] : []} pouring={step === 6} delay={.2} />
    </Place>}
    {(step === 4 || step === 5) && <Place x={BASIS.bananaCopy[0]} y={BASIS.bananaCopy[1]} scale={BASIS.copyScale} className={step === 4 ? "fly" : ""}
      style={vars({ "--from-x": `${BASIS.trayX - BASIS.bananaCopy[0]}px`, "--from-y": `${BASIS.rowY[1] - BASIS.bananaCopy[1]}px` })}>
      <JuiceTray values={step === 4 ? banana : bananaPart} scaledFrom={step === 5 ? banana : undefined} delay={.2} />
    </Place>}
    {(step === 4 || step === 5) && <Op latex={"\\times 0.5"} x={1072} y={BASIS.bananaCopy[1] - 10}
      className={step === 4 ? "fade-in" : "fade-out"} delay={step === 4 ? .8 : 1.3} />}
  </section>;
}
