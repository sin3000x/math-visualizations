import { JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, FLOW, Juicer, Op, Place } from "../components/Stage";
import { apply, juiceOf, type Bag as Quantities } from "../lib/math/map";
import { columnArrows, LIN, MACHINES, machineArrows } from "./layout";
import "./LinearityScene.css";

const whole: Quantities = [2, 1];
const u: Quantities = [1, 1];
const v: Quantities = [1, 0];
const HALF = .5;
const half: Quantities = [whole[0] * HALF, whole[1] * HALF];
const { P1, P2, C } = LIN;
const S = LIN.scale;
const HALF_TIMES = "0.5\\times";

function Tray({ x, bag, className = "emerge-down" }: { x: number; bag: Quantities; className?: string }) {
  return <Place x={x} y={LIN.trayY} scale={LIN.trayScale} className={className} delay={className.includes("fade-out") ? 0 : FLOW.result}><JuiceTray values={juiceOf(bag)} /></Place>;
}

/**
 * 线性：分别榨汁再相加 = 合并输入再榨汁；榨汁后乘 0.5 = 输入乘 0.5 再榨汁。两部分都只用加号、0.5× 和等号表达关系。
 * 等式从左读到右：左边是运算对象，右边一列是结果，T 从上一幕移到结果列。
 * 步骤：0 复现 MachinesScene 结尾；1 (2,1) 与 T 移到右列；2 写出 (1,1) + (1,0) = (2,1)；3 三列同时榨汁；
 * 4 托盘写出 (3,3,2) + (2,1,1) = (5,4,3)；5 换成 0.5 × (2,1) = (1,0.5)；6 两列同时榨汁；7 托盘写出 0.5 × (5,4,3) = (2.5,2,1.5)。
 */
export function LinearityScene({ step }: { step: number }) {
  const settled = step >= 1;
  const scaling = step >= 5;
  // 比较托盘时，托盘上方的袋子、榨汁机、箭头和符号一起变暗，只突出托盘等式；
  // 第 5 步要离开的对象从暗处继续淡出，不先闪回原亮度。
  const topDim = step === 4 || step === 7 ? "dim" : "";
  const additionParts = step === 5 ? "dim fade-out" : topDim;
  const enter = (at: number) => step === at ? "fade-in" : topDim;
  return <section className="lesson linearity" data-step={step} aria-label="榨汁机保持合并与数乘">
    {step <= 1 && <>
      <Arrows arrows={machineArrows(`still${step === 1 ? " fade-out" : ""}`)} />
      {MACHINES.list.slice(1).map(({ color, y }, i) => <Juicer key={i} x={MACHINES.juicerX} y={y} scale={MACHINES.juicerScale} color={color} className={step === 1 ? "fade-out" : ""} />)}
      {MACHINES.list.map(({ matrix, y }, i) => <Place key={`m-${i}`} x={MACHINES.trayX} y={y} scale={MACHINES.trayScale} className={step === 1 ? "fade-out" : ""}>
        <JuiceTray values={apply(matrix, whole)} />
      </Place>)}
    </>}

    <Arrows arrows={[
      ...(step >= 3 && step <= 5 ? [...columnArrows("p1", P1, additionParts), ...columnArrows("p2", P2, additionParts)] : []),
      ...(step >= 3 && step <= 5 ? columnArrows("c", C, step === 5 ? "dim fade-out" : topDim) : []),
      ...(step >= 6 ? [...columnArrows("p2-half", S.P, topDim), ...columnArrows("c-half", S.C, topDim)] : []),
    ]} />

    {/* 加法：(1,1) + (1,0)，各自榨汁后两托盘相加。 */}
    {step >= 2 && step <= 5 && <>
      {[[u, P1], [v, P2]].map(([bag, x], i) => <Bag key={`part-${i}`} bag={bag as Quantities} x={x as number} y={LIN.bagY} scale={LIN.bagScale}
        className={step === 2 ? "fade-in" : additionParts} />)}
      <Op latex="+" x={LIN.plusX} y={LIN.bagY} className={step === 2 ? "fade-in" : additionParts} delay={step === 2 ? .4 : 0} />
    </>}
    {step >= 1 && step <= 5 && <Juicer x={P1} y={LIN.juicerY} scale={LIN.juicerScale}
      className={step === 1 ? "fade-in" : additionParts} delay={step === 1 ? .6 : FLOW.run} running={step === 3} />}
    {step >= 3 && step <= 5 && <>
      <Tray x={P1} bag={u} className={step === 3 ? "emerge-down" : step === 5 ? "fade-out" : ""} />
      <Tray x={P2} bag={v} className={step === 3 ? "emerge-down" : step === 5 ? "fade-out" : ""} />
    </>}
    {(step === 4 || step === 5) && <Op latex="+" x={LIN.plusX} y={LIN.equalsY} className={step === 4 ? "fade-in" : "fade-out"} />}

    {/* 数乘：0.5 × (2,1)，榨汁后托盘前写 0.5×。左边第二列的 T 贯穿两部分，换到数乘时随画面一起平移居中。 */}
    {step >= 1 && <Juicer x={scaling ? S.P : P2} y={LIN.juicerY} scale={LIN.juicerScale}
      className={`glide ${step === 1 ? "fade-in" : topDim}`} delay={step === 1 ? .6 : FLOW.run} running={step === 3 || step === 6} />}
    {scaling && <>
      <Bag bag={whole} x={S.P} y={LIN.bagY} scale={LIN.bagScale} className={enter(5)} delay={.4} />
      <Op latex={HALF_TIMES} x={S.timesX} y={LIN.bagY} className={enter(5)} delay={.4} />
    </>}
    {step >= 6 && <Tray x={S.P} bag={whole} className={step === 6 ? "emerge-down" : ""} />}
    {step === 7 && <Op latex={HALF_TIMES} x={S.timesX} y={LIN.equalsY} className="fade-in" />}

    {/* 输入行的等号贯穿加法与数乘。 */}
    {step >= 2 && <Op latex="=" x={scaling ? S.equalsX : LIN.equalsX} y={LIN.bagY} className={`glide ${enter(2)}`} delay={.4} />}
    {(step === 4 || step === 5) && <Op key="sum-equals" latex="=" x={LIN.equalsX} y={LIN.equalsY} className={step === 4 ? "fade-in" : "fade-out"} />}
    {step === 7 && <Op key="scale-equals" latex="=" x={S.equalsX} y={LIN.equalsY} className="fade-in" />}

    {/* 右列（结果）：(2,1) 与 T 从上一幕移来；数乘部分换成 (1,0.5)。 */}
    {step <= 5 && <Bag bag={whole} x={settled ? C : MACHINES.bag[0]} y={settled ? LIN.bagY : MACHINES.bag[1]}
      scale={settled ? LIN.bagScale : MACHINES.bagScale} className={`glide ${step === 5 ? "dim fade-out" : topDim}`} />}
    {scaling && <Bag bag={half} x={S.C} y={LIN.bagY} scale={LIN.bagScale} className={enter(5)} delay={.4} />}
    <Juicer x={scaling ? S.C : settled ? C : MACHINES.juicerX} y={settled ? LIN.juicerY : MACHINES.list[0].y} scale={MACHINES.juicerScale} className={`glide ${topDim}`}
      running={step === 3 || step === 6} key={step === 3 || step === 6 ? `run-${step}` : "juicer"} delay={FLOW.run} />
    {step >= 3 && step <= 5 && <Tray x={C} bag={whole} className={step === 3 ? "emerge-down" : step === 5 ? "fade-out" : ""} />}
    {step >= 6 && <Tray x={S.C} bag={half} className={step === 6 ? "emerge-down" : ""} />}
  </section>;
}
