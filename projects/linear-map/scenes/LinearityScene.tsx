import { JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, FLOW, Juicer, Op, Place } from "../components/Stage";
import { apply, juiceOf, scaleJuice, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { columnArrows, LIN, MACHINES, machineArrows } from "./layout";
import "./LinearityScene.css";

const whole: Quantities = [2, 1];
const u: Quantities = [1, 1];
const v: Quantities = [1, 0];
const HALF = .5;
const half: Quantities = [whole[0] * HALF, whole[1] * HALF];
const { L, R1, R2 } = LIN;

function Tray({ x, bag, className = "emerge-down" }: { x: number; bag: Quantities; className?: string }) {
  return <Place x={x} y={LIN.trayY} scale={LIN.trayScale} className={className} delay={FLOW.result}><JuiceTray values={juiceOf(bag)} /></Place>;
}

/**
 * 线性：合并输入再榨汁 = 分别榨汁再倒在一起；输入按倍数缩放再榨汁 = 榨汁后液面按同样倍数缩放。
 * 步骤：0 复现 MachinesScene 结尾；1 (2,1) 与 T 移到左列；2 (2,1) 分成两袋送到右边；3 三列同时榨汁；
 * 4 右边倒在一起，与左边相等；5 换成数乘 ×0.5；6 左袋缩放；7 左边榨汁；8 右边液面缩放，两边相等。
 */
export function LinearityScene({ step }: { step: number }) {
  const settled = step >= 1;
  // 已变暗的右边对象从暗处继续淡出，不先闪回原亮度。
  const rightLeaving = step === 5 ? "dim fade-out" : "";
  const rightDim = step === 4 ? "dim" : rightLeaving;
  const scaledTray = scaleJuice(HALF, juiceOf(whole));
  return <section className="lesson linearity" data-step={step} aria-label="榨汁机保持合并与数乘">
    {step <= 1 && <>
      <Arrows arrows={machineArrows(`still${step === 1 ? " fade-out" : ""}`)} />
      {MACHINES.list.slice(1).map(({ color, y }, i) => <Juicer key={i} x={MACHINES.juicerX} y={y} scale={MACHINES.juicerScale} color={color} className={step === 1 ? "fade-out" : ""} />)}
      {MACHINES.list.map(({ matrix, y }, i) => <Place key={`m-${i}`} x={MACHINES.trayX} y={y} scale={MACHINES.trayScale} className={step === 1 ? "fade-out" : ""}>
        <JuiceTray values={apply(matrix, whole)} />
      </Place>)}
    </>}

    <Arrows arrows={[
      ...(step >= 3 && step <= 5 ? columnArrows("l", L, step === 5 ? "fade-out" : "") : []),
      ...(step >= 7 ? columnArrows("l-half", L) : []),
      ...(step >= 3 && step <= 5 ? [...columnArrows("r1", R1, rightDim), ...columnArrows("r2", R2, rightDim)] : []),
    ]} />

    {/* 左列：同一袋 (2,1) 从上一幕移来；第 6 步缩放成 (1,0.5)。 */}
    {step <= 6 && <Bag bag={whole} x={settled ? L : MACHINES.bag[0]} y={settled ? LIN.bagY : MACHINES.bag[1]}
      scale={settled ? LIN.bagScale : MACHINES.bagScale} className={`glide${step === 6 ? " bag-scale-out" : ""}`} />}
    {step >= 6 && <Bag bag={half} x={L} y={LIN.bagY} scale={LIN.bagScale} className={step === 6 ? "bag-scale-in" : ""} />}
    {(step === 5 || step === 6) && <Op latex={"\\times 0.5"} x={175} y={LIN.bagY} className={step === 5 ? "fade-in" : "fade-out"} delay={step === 6 ? .8 : 0} />}
    <Juicer x={settled ? L : MACHINES.juicerX} y={settled ? LIN.juicerY : MACHINES.list[0].y} scale={MACHINES.juicerScale} className="glide"
      running={step === 3 || step === 7} key={step === 3 || step === 7 ? `run-${step}` : "juicer"} delay={FLOW.run} />
    {step >= 3 && step <= 5 && <Tray x={L} bag={whole} className={step === 3 ? "emerge-down" : step === 5 ? "fade-out" : ""} />}
    {step >= 7 && <Place x={L} y={LIN.trayY} scale={LIN.trayScale} className={step === 7 ? "emerge-down" : ""} delay={FLOW.result}>
      <JuiceTray values={juiceOf(half)} />
    </Place>}

    {/* 右边两列：(2,1) 分成 (1,1) 与 (1,0)。 */}
    {step >= 2 && step <= 5 && [[u, R1], [v, R2]].map(([bag, x], i) => <Bag key={`part-${i}`} bag={bag as Quantities} x={x as number} y={LIN.bagY} scale={LIN.bagScale}
      className={step === 2 ? "fly" : rightDim} style={vars({ "--from-x": `${L - (x as number)}px`, "--from-y": "0px" })} />)}
    {step >= 1 && step <= 5 && [R1, R2].map((x, i) => <Juicer key={`rj-${i}`} x={x} y={LIN.juicerY} scale={LIN.juicerScale}
      className={step === 1 ? "fade-in" : rightDim} delay={step === 1 ? .6 : FLOW.run} running={step === 3} />)}
    {step === 3 && <><Tray x={R1} bag={u} /><Tray x={R2} bag={v} /></>}
    {step >= 4 && <Place x={R1} y={LIN.trayY} scale={LIN.trayScale}>
      <JuiceTray values={step === 4 ? juiceOf(u) : step <= 7 ? juiceOf(whole) : scaledTray}
        sources={step === 4 ? [{ values: juiceOf(v), from: [(R2 - R1) / LIN.trayScale, 0] }] : []} pouring={step === 4}
        scaledFrom={step === 8 ? juiceOf(whole) : undefined} delay={.3} />
    </Place>}
    {step === 4 && <Op latex="=" x={LIN.equalsX} y={LIN.equalsY} className="fade-in" delay={1.7} />}
    {step === 5 && <Op latex="=" x={LIN.equalsX} y={LIN.equalsY} className="fade-out" />}
    {step >= 5 && <Op latex={"\\times 0.5"} x={1095} y={LIN.equalsY} className={step === 5 ? "fade-in" : step === 8 ? "fade-out" : ""} delay={step === 8 ? 1.4 : 0} />}
    {step === 8 && <Op latex="=" x={LIN.equalsX} y={LIN.equalsY} className="fade-in" delay={1.5} />}
  </section>;
}
