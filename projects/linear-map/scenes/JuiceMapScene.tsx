import { JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, Juicer, Place, Space } from "../components/Stage";
import { juiceOf } from "../lib/math/map";
import { MAP, mapArrows, SPACE_TRAYS, SPACE_TRAY_SCALE, V_OVAL, W_OVAL } from "./layout";

// 每一步对应一袋，节奏相同：每一袋都恰好对应一组果汁。
const shownAt = [2, 3, 4];

/**
 * V 中每一袋都对应 W 中的一组果汁：同一行的袋子和托盘用一条箭头直接连起来，
 * 榨汁机放在箭头上方，表示决定这种对应的规则；每画一条对应，榨汁机运转一次。
 * 第 1 步复现 JuiceSpaceScene 的结尾。
 */
export function JuiceMapScene({ step }: { step: number }) {
  const mapped = MAP.bags.map((_, i) => step >= shownAt[i]);
  const enter = step === 1 ? "fade-in" : "";
  return <section className="lesson juice-map" data-step={step} aria-label="榨汁机把每一袋水果映射为一组果汁">
    {step >= 1 && <Space name="V" {...V_OVAL} className={enter} />}
    <Space name="W" {...W_OVAL} />
    {step <= 1 && SPACE_TRAYS.map(([x, y, juice], i) => <Place key={i} x={x} y={y} scale={SPACE_TRAY_SCALE} className={step === 1 ? "fade-out" : ""}>
      <JuiceTray values={juice} />
    </Place>)}
    <Arrows arrows={MAP.bags.flatMap((_, i) => mapped[i] ? mapArrows(i) : [])} />
    {step >= 1 && MAP.bags.map((bag, i) => <Bag key={i} bag={bag} x={MAP.bagX} y={MAP.rowY[i]} scale={MAP.bagScale} className={enter} delay={.3} />)}
    {step >= 1 && <Juicer x={MAP.juicer[0]} y={MAP.juicer[1]} scale={MAP.juicerScale} running={step >= 2} key={`juicer-${step}`} className={enter} delay={step === 1 ? .5 : .1} />}
    {MAP.bags.map((bag, i) => mapped[i] && <Place key={`out-${i}`} x={MAP.trayX} y={MAP.rowY[i]} scale={MAP.trayScale} className="emerge" delay={MAP.result}>
      <JuiceTray values={juiceOf(bag)} />
    </Place>)}
  </section>;
}
