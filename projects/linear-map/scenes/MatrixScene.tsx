import { FruitIcon } from "@math-visualizations/scene-kit/FruitIcon";
import { JUICE_COLORS, JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, Juicer, Op, Place } from "../components/Stage";
import { addJuice, columnOf, juiceOf, MATRIX, scaleJuice, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { BASIS, basisArrows } from "./layout";
import "./MatrixScene.css";

const fruits = [{ kind: "apple", bag: [1, 0] }, { kind: "banana", bag: [0, 1] }] as const;
const input: Quantities = [1, .5];
const output = juiceOf(input);
// 托盘几何（托盘自身坐标）：带读数时托盘中心到读数中心 70.5，到不带读数托盘中心 -33.4；相邻杯 86。
const READ_DY = 70.5, BODY_DY = -33.4, CUP_DX = 86, READ_SIZE = 46;
const TRAY_X = [430, 930], TRAY_Y = 320, BAG_Y = 140;
const COLUMN_X = [550, 700], ROW_Y = [290, 385, 480], HEADER_Y = 205, WEIGHT_Y = 136;
const RESULT_X = 915;
const INPUT_AT: readonly [number, number] = [1205, 170];
// 袋内读数相对袋子中心的位置（缩放 0.62 后），权重从这里飞向列顶。
const BAG_READING = [[6, -10], [6, 26]] as const;

function Brackets({ left, right }: { left: number; right: number }) {
  const [top, bottom] = [ROW_Y[0] - 50, ROW_Y[2] + 50];
  return <path d={`M${left + 16} ${top}H${left}V${bottom}H${left + 16}M${right - 16} ${top}H${right}V${bottom}H${right - 16}`} />;
}

/**
 * 把两只基袋的结果抄成两列，就是矩阵；一袋水果的数量就是两列的权重。
 * 步骤：0 复现 BasisImagesScene 结尾；1 两只基袋与托盘移到上方，(1,0.5) 合回一袋；
 * 2 读数移进矩阵；3 袋中数量飞到列顶；4 得到结果。
 */
export function MatrixScene({ step }: { step: number }) {
  const settled = step >= 1, table = step >= 2;
  // 托盘中心与缩放：第 1 步在基袋那一幕的位置，之后移到上方。
  const trayAt = (j: number) => settled ? { x: TRAY_X[j], y: TRAY_Y, s: 1 } : { x: BASIS.trayX, y: BASIS.rowY[j], s: BASIS.trayScale };
  return <section className="lesson matrix-scene" data-step={step} aria-label="基袋结果按列排成矩阵，矩阵按水果数量加权得到果汁">
    {step <= 1 && <>
      <Arrows arrows={[0, 1].flatMap(i => basisArrows(i, `still${step === 1 ? " fade-out" : ""}`))} />
      {[0, 1].map(i => <Juicer key={i} x={BASIS.juicerX} y={BASIS.rowY[i]} scale={BASIS.juicerScale} className={step === 1 ? "fade-out" : ""} />)}
      <Place x={BASIS.appleCopy[0]} y={BASIS.appleCopy[1]} scale={BASIS.copyScale} className={step === 1 ? "fade-out" : ""}>
        <JuiceTray values={addJuice(juiceOf([1, 0]), scaleJuice(.5, juiceOf([0, 1])))} />
      </Place>
      {BASIS.parts.map(({ x, bag, tone }, i) => <Bag key={`part-${i}`} bag={bag} tone={tone} x={settled ? INPUT_AT[0] : x} y={settled ? INPUT_AT[1] : BASIS.partY}
        scale={BASIS.partScale} className={`glide${step === 1 ? " fade-out" : ""}`} delay={.5} />)}
    </>}
    {step <= 2 && fruits.map(({ kind, bag }, j) => {
      const at = trayAt(j);
      return <div key={kind} className={step === 2 ? "fade-out" : ""}>
        <Bag bag={bag} tone={kind} x={settled ? at.x : BASIS.bagX} y={settled ? BAG_Y : BASIS.rowY[j]} scale={settled ? .5 : BASIS.bagScale} className="glide" />
        <Place x={at.x} y={at.y + BODY_DY * at.s} scale={at.s} className="glide"><JuiceTray values={juiceOf(bag)} readings={false} /></Place>
      </div>;
    })}
    {fruits.map(({ kind }, j) => columnOf(MATRIX, j as 0 | 1).map((value, i) => {
      const at = trayAt(j);
      return <Op key={`${kind}-${i}`} latex={String(value)} size={table ? 54 : READ_SIZE * at.s}
        x={table ? COLUMN_X[j] : at.x + (i - 1) * CUP_DX * at.s} y={table ? ROW_Y[i] : at.y + READ_DY * at.s} className="matrix-number" style={{ color: JUICE_COLORS[i] }} />;
    }))}
    {table && <>
      <svg className="matrix-brackets fade-in" viewBox="0 0 1440 810" aria-hidden="true" style={vars({ "--delay": step === 2 ? ".6s" : "0s" })}>
        <Brackets left={COLUMN_X[0] - 60} right={COLUMN_X[1] + 60} />
        {step >= 4 && <g className="fade-in"><Brackets left={RESULT_X - 62} right={RESULT_X + 62} /></g>}
      </svg>
      {fruits.map(({ kind }, j) => <Place key={kind} x={COLUMN_X[j]} y={HEADER_Y} className={step === 2 ? "fade-in" : ""} delay={.6} data-layout-content>
        <span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span>
      </Place>)}
      {ROW_Y.map((y, i) => <Place key={i} x={COLUMN_X[0] - 115} y={y} className={step === 2 ? "fade-in" : ""} delay={.6} data-layout-content>
        <span className="mini-cup" style={{ color: JUICE_COLORS[i] }} />
      </Place>)}
    </>}
    {settled && <Bag bag={input} x={INPUT_AT[0]} y={INPUT_AT[1]} scale={.62} className={step === 1 ? "fade-in" : ""} delay={.6} />}
    {step >= 3 && input.map((weight, j) => <Op key={j} latex={String(weight)} size={54} x={COLUMN_X[j]} y={WEIGHT_Y}
      className={step === 3 ? "weight weight-fly" : "weight"} style={vars({ "--fx": `${INPUT_AT[0] + BAG_READING[j][0] - COLUMN_X[j]}px`, "--fy": `${INPUT_AT[1] + BAG_READING[j][1] - WEIGHT_Y}px` })} />)}
    {step >= 4 && <>
      <Op latex="=" x={RESULT_X - 100} y={ROW_Y[1]} className="fade-in" />
      {output.map((value, i) => <Op key={i} latex={String(value)} size={54} x={RESULT_X} y={ROW_Y[i]} className="fade-in" delay={.3 + i * .25} style={{ color: JUICE_COLORS[i] }} />)}
      <Place x={1190} y={440} scale={.75} className="emerge" delay={1.2}><JuiceTray values={output} /></Place>
    </>}
  </section>;
}
