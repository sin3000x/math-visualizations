import { JuiceTray } from "../components/JuiceTray";
import { Op, Place, Space } from "../components/Stage";
import { addJuice, scaleJuice, type Juice } from "../lib/math/map";
import { SPACE_TRAYS, SPACE_TRAY_SCALE, W_OVAL } from "./layout";
import "./JuiceSpaceScene.css";

const first: Juice = [1, 2, 1];
const second: Juice = [2, 1, 0];
const sum = addJuice(first, second);
const doubled = scaleJuice(2, sum);
const MAIN: readonly [number, number] = [600, 495];
const MAIN_SCALE = 1.35;
// 杯身中线：托盘中心向上约 0.2 个托盘高。
const CUPS_Y = 440;
const [mainX, mainY] = SPACE_TRAYS[3];

/** W 是什么：一托盘三杯果汁是一个元素；托盘可以倒在一起，液面可以按倍数伸缩；所有托盘组成 W。 */
export function JuiceSpaceScene({ step }: { step: number }) {
  const world = step >= 5;
  const values = step <= 2 ? first : step === 3 ? sum : doubled;
  return <section className="lesson juice-space" data-step={step} aria-label="一组果汁是 W 中的元素，可以相加和数乘">
    {world && <>
      <Space name="W" {...W_OVAL} className="fade-in" />
      {SPACE_TRAYS.slice(0, 3).map(([x, y, juice], i) => <Place key={i} x={x} y={y} scale={SPACE_TRAY_SCALE} className="fade-in" delay={.6 + i * .15}>
        <JuiceTray values={juice} />
      </Place>)}
    </>}
    <Place x={world ? mainX : MAIN[0]} y={world ? mainY : MAIN[1]} scale={world ? SPACE_TRAY_SCALE : MAIN_SCALE} className="glide">
      <JuiceTray values={values} className={step === 1 ? "second-enters" : ""}
        sources={step === 1 || step === 2 ? [{ values: second, from: [330, 0] }] : []} pouring={step === 2}
        scaledFrom={step === 4 ? sum : undefined} delay={step === 4 ? .2 : 0} />
    </Place>
    {(step === 1 || step === 2) && <Op latex="+" x={822} y={CUPS_Y} size={72} className={step === 1 ? "fade-in" : "fade-out"} />}
    {(step === 3 || step === 4) && <Op latex={"\\times 2"} x={345} y={CUPS_Y} size={72} className={step === 3 ? "fade-in" : "fade-out"} delay={step === 4 ? 1.2 : 0} />}
  </section>;
}
