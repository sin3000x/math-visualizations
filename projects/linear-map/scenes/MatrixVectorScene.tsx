import { Bracket, BracketLayer } from "../components/Brackets";
import { JUICE_COLORS, JuiceTray } from "../components/JuiceTray";
import { Bag, Op, Place } from "../components/Stage";
import { columnOf, juiceOf, MATRIX, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { MATRIX_END } from "./layout";
import "./MatrixVectorScene.css";

const input: Quantities = [1, .5];
const output = juiceOf(input);
const { columnX, rowY, numberSize: NUMBER_SIZE, padX, padY } = MATRIX_END;
const WEIGHT_Y = rowY[0] - 95, BAG_AT: readonly [number, number] = [320, rowY[1]];
const RESULT_X = 960, EQUALS_X = 862, TRAY_AT: readonly [number, number] = [1160, rowY[1]];
// 袋内读数相对袋子中心的位置（缩放 0.62 后），权重从这里飞向列顶。
const BAG_READING = [[6, -10], [6, 26]] as const;

/**
 * 一袋水果的数量就是矩阵两列的权重：两列按数量加权相加，得到这一袋榨出的果汁。
 * 步骤：0 只有矩阵；1 左边出现一般的一袋 (1,0.5)；
 * 2 袋中数量飞到列顶；3 得到结果与对应托盘。
 */
export function MatrixVectorScene({ step }: { step: number }) {
  const [left, right] = [columnX[0] - padX, columnX[1] + padX];
  return <section className="lesson matrix-vector-scene" data-step={step} aria-label="水果数量是矩阵各列的权重，加权和就是榨出的果汁">
    <BracketLayer><Bracket left={left} right={right} top={rowY[0] - padY} bottom={rowY[2] + padY} /></BracketLayer>
    {[0, 1].map(j => columnOf(MATRIX, j as 0 | 1).map((value, i) => <Op key={`${j}-${i}`} latex={String(value)} size={NUMBER_SIZE}
      x={columnX[j]} y={rowY[i]} style={{ color: JUICE_COLORS[i] }} />))}
    {step >= 1 && <Bag bag={input} x={BAG_AT[0]} y={BAG_AT[1]} scale={.62} className={step === 1 ? "emerge" : ""} />}
    {step >= 2 && input.map((weight, j) => <Op key={j} latex={String(weight)} size={NUMBER_SIZE} x={columnX[j]} y={WEIGHT_Y}
      className={step === 2 ? "weight weight-fly" : "weight"} style={vars({ "--fx": `${BAG_AT[0] + BAG_READING[j][0] - columnX[j]}px`, "--fy": `${BAG_AT[1] + BAG_READING[j][1] - WEIGHT_Y}px` })} />)}
    {step >= 3 && <>
      <BracketLayer className="fade-in"><Bracket left={RESULT_X - 62} right={RESULT_X + 62} top={rowY[0] - padY} bottom={rowY[2] + padY} /></BracketLayer>
      <Op latex="=" x={EQUALS_X} y={rowY[1]} className="fade-in" />
      {output.map((value, i) => <Op key={i} latex={String(value)} size={NUMBER_SIZE} x={RESULT_X} y={rowY[i]} className="fade-in" delay={.3 + i * .25} style={{ color: JUICE_COLORS[i] }} />)}
      <Place x={TRAY_AT[0]} y={TRAY_AT[1]} scale={.75} className="emerge" delay={1.2}><JuiceTray values={output} /></Place>
    </>}
  </section>;
}
