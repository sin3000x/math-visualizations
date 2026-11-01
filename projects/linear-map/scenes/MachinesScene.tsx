import { JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, FLOW, Juicer, Place, Space } from "../components/Stage";
import { apply, juiceOf } from "../lib/math/map";
import { MACHINES, MAP, machineArrows, mapArrows, V_OVAL, W_OVAL } from "./layout";

const bag = MAP.bags[0];

/**
 * 同一袋水果，三台榨汁机同时工作，得到三组不同的果汁。
 * 第 1 步复现 JuiceMapScene 的结尾；第 2 步保留 (2,1) 和榨汁机 T，其余淡出，S、R 出现。
 */
export function MachinesScene({ step }: { step: number }) {
  const leaving = step === 1 ? "fade-out" : "";
  const settled = step >= 1;
  return <section className="lesson machines" data-step={step} aria-label="同一袋水果经过不同榨汁机得到不同果汁组合">
    {step <= 1 && <>
      <Space name="V" {...V_OVAL} className={leaving} />
      <Space name="W" {...W_OVAL} className={leaving} />
      <Arrows arrows={MAP.bags.flatMap((_, i) => mapArrows(i, `still ${leaving}`))} />
      {MAP.bags.slice(1).map((other, i) => <Bag key={i} bag={other} x={MAP.bagX} y={MAP.rowY[i + 1]} scale={MAP.bagScale} className={leaving} />)}
      {MAP.bags.map((other, i) => <Place key={`out-${i}`} x={MAP.trayX} y={MAP.rowY[i]} scale={MAP.trayScale} className={leaving}>
        <JuiceTray values={juiceOf(other)} />
      </Place>)}
    </>}
    <Arrows arrows={step >= 2 ? machineArrows() : []} />
    <Bag bag={bag} x={settled ? MACHINES.bag[0] : MAP.bagX} y={settled ? MACHINES.bag[1] : MAP.rowY[0]} scale={settled ? MACHINES.bagScale : MAP.bagScale} className="glide" />
    {MACHINES.list.map(({ color, y }, i) => i === 0
      ? <Juicer key={i} x={settled ? MACHINES.juicerX : MAP.juicer[0]} y={settled ? y : MAP.juicer[1]} scale={settled ? MACHINES.juicerScale : MAP.juicerScale}
        color={color} className="glide" running={step >= 2} delay={FLOW.run} />
      : step >= 1 && <Juicer key={i} x={MACHINES.juicerX} y={y} scale={MACHINES.juicerScale} color={color}
        className={step === 1 ? "fade-in" : ""} running={step >= 2} delay={step === 1 ? .6 : FLOW.run} />)}
    {step >= 2 && MACHINES.list.map(({ matrix, y }, i) => <Place key={`m-${i}`} x={MACHINES.trayX} y={y} scale={MACHINES.trayScale} className="emerge" delay={FLOW.result}>
      <JuiceTray values={apply(matrix, bag)} />
    </Place>)}
  </section>;
}
