import { FruitIcon } from "@math-visualizations/scene-kit/FruitIcon";
import { Bracket, BracketLayer } from "../components/Brackets";
import { JUICE_COLORS, JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, FLOW, Juicer, Op, Place, type Arrow } from "../components/Stage";
import { juiceOf, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { MATRIX_LAYOUT, MATRIX_VECTOR, TAKEAWAY } from "./layout";
import { MatrixVectorContent } from "./MatrixVectorScene";
import "./TakeawayScene.css";

const fruits = ["apple", "banana"] as const;
const input: Quantities = [1, .5];
const bases = [{ bag: [1, 0] as Quantities, tone: "apple" as const }, { bag: [0, 1] as Quantities, tone: "banana" as const }];
const { map, juicerX: JUICER_X, equalsX: EQUALS_X, columnX, rowY, basis } = TAKEAWAY;
const { numberSize: NUMBER_SIZE, padX, padY } = MATRIX_LAYOUT;
const { scale: S, bagX: MV_BAG_X, apply: { big }, bottom, trayScale: MV_TRAY_SCALE } = MATRIX_VECTOR;
/** 上一幕结尾下行的 榨汁机(一袋) 与结果托盘（屏幕坐标）：上一幕舞台坐标乘舞台缩放 S。 */
const PREV = {
  y: bottom.y * S, bagX: MV_BAG_X * S, juicerX: (MV_BAG_X + big.juicerDX) * S, parenX: [-1, 1].map(side => (MV_BAG_X + side * big.parenDX) * S),
  trayX: bottom.trayX * S, bagScale: big.bagScale * S, juicerScale: big.juicerScale * S, parenSize: big.parenSize * S, trayScale: MV_TRAY_SCALE * S,
};
const CUP_X = columnX[0] - (MATRIX_VECTOR.columnX[0] - MATRIX_VECTOR.cupX), HEADER_Y = rowY[0] + MATRIX_VECTOR.headerDY;
/** 托盘读数相对托盘中心的位置与字号（托盘自身坐标）：三杯间距 86，读数在杯底下方。 */
const READING = { dx: 86, dy: 71, size: 46 };
const AT = { move: 1, matrix: 2, columns: [3, 4] } as const;
/** 基袋的一行 袋 → T → 托盘 直接淡入；淡入后，读数依次飞进矩阵的一列。 */
const COPY_AT = .6, COPY_LAG = .15;

const mapArrows = (className?: string): Arrow[] => [
  { id: "takeaway-in", from: [map.bagX + 78, map.y], to: [map.juicerX - 60, map.y], delay: 1, className },
  { id: "takeaway-out", from: [map.juicerX + 60, map.y], to: [map.trayX - 92, map.y], delay: 1 + FLOW.out, className },
];
const basisArrows = (j: number, className?: string): Arrow[] => [
  { id: `takeaway-basis-in-${j}`, from: [basis.bagX + 55, basis.y[j]], to: [basis.juicerX - 42, basis.y[j]], delay: 0, className },
  { id: `takeaway-basis-out-${j}`, from: [basis.juicerX + 42, basis.y[j]], to: [basis.trayX - 75, basis.y[j]], delay: 0, className },
];

/**
 * 回顾：榨汁机是一个线性映射，把一袋水果对应到一托盘果汁；它可以用矩阵表示，两列分别是一袋苹果、一袋香蕉的结果。
 * 步骤：0 复现 MatrixVectorScene 结尾；1 其余淡出，下行的一袋、榨汁机与结果托盘移到上方排成 袋 → T → 托盘；
 * 2 榨汁机复制到左下，写出 T = 空矩阵（列顶水果、行首杯子）；3、4 苹果、香蕉基袋的 袋 → T → 托盘 依次淡入，托盘读数复制成矩阵的第一、二列。
 */
export function TakeawayScene({ step }: { step: number }) {
  const moved = step >= AT.move;
  const leave = step === AT.move ? "fade-out" : "";
  const appear = (at: number) => step === at ? "fade-in" : "";
  const columnShown = AT.columns.map(at => step >= at);
  return <section className="lesson takeaway-scene" data-step={step} aria-label="榨汁机是把水果袋对应到果汁托盘的线性映射，它的矩阵两列是两只基袋的结果">
    {step <= AT.move && <div className={`mv-end matrix-vector-scene ${leave}`}><MatrixVectorContent step={5} /></div>}

    {step <= AT.move && [-1, 1].map((side, k) => <Op key={side} latex={side < 0 ? "(" : ")"} size={PREV.parenSize} x={PREV.parenX[k]} y={PREV.y} className={leave} />)}
    <Arrows arrows={[
      ...moved ? mapArrows(step === AT.move ? undefined : "still") : [],
      ...bases.flatMap((_, j) => columnShown[j] ? basisArrows(j, step === AT.columns[j] ? "still fade-in" : "still") : []),
    ]} />
    <Bag bag={input} x={moved ? map.bagX : PREV.bagX} y={moved ? map.y : PREV.y} scale={moved ? map.bagScale : PREV.bagScale} className="glide" />
    <Juicer x={moved ? map.juicerX : PREV.juicerX} y={moved ? map.y : PREV.y} scale={moved ? map.juicerScale : PREV.juicerScale} className="glide" />
    <Place x={moved ? map.trayX : PREV.trayX} y={moved ? map.y : PREV.y} scale={moved ? map.trayScale : PREV.trayScale} className="glide">
      <JuiceTray values={juiceOf(input)} />
    </Place>

    {/* 榨汁机从上方复制下来，等号右边是它的矩阵：先只有方括号、列顶水果与行首杯子。 */}
    {step >= AT.matrix && <>
      <Juicer x={JUICER_X} y={rowY[1]} scale={map.juicerScale} className={step === AT.matrix ? "copy" : ""}
        style={vars({ "--from-x": `${map.juicerX - JUICER_X}px`, "--from-y": `${map.y - rowY[1]}px`, "--from-s": 1 })} />
      <div className={appear(AT.matrix)} style={vars({ "--delay": ".6s" })}>
        <Op latex="=" x={EQUALS_X} y={rowY[1]} />
        {fruits.map((kind, j) => <Place key={kind} x={columnX[j]} y={HEADER_Y} data-layout-content><span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span></Place>)}
        {rowY.map((y, i) => <Place key={i} x={CUP_X} y={y} data-layout-content><span className="mini-cup" style={{ color: JUICE_COLORS[i] }} /></Place>)}
      </div>
      <BracketLayer write={step === AT.matrix} delay={.6}><Bracket left={columnX[0] - padX} right={columnX[1] + padX} top={rowY[0] - padY} bottom={rowY[2] + padY} /></BracketLayer>
    </>}

    {/* 每一步一只基袋：袋 → T → 托盘 直接淡入，读数再复制成矩阵的一列。 */}
    {bases.map(({ bag, tone }, j) => {
      if (!columnShown[j]) return null;
      const at = AT.columns[j], y = basis.y[j], juice = juiceOf(bag), now = step === at;
      return <div key={j}>
        <div className={now ? "fade-in" : ""}>
          <Bag bag={bag} tone={tone} x={basis.bagX} y={y} scale={basis.bagScale} />
          <Juicer x={basis.juicerX} y={y} scale={basis.juicerScale} />
          <Place x={basis.trayX} y={y} scale={basis.trayScale}><JuiceTray values={juice} /></Place>
        </div>
        {juice.map((value, i) => {
          const from = [basis.trayX + (i - 1) * READING.dx * basis.trayScale, y + READING.dy * basis.trayScale];
          return <Op key={i} latex={String(value)} size={NUMBER_SIZE} x={columnX[j]} y={rowY[i]} className={now ? "copy" : ""}
            delay={COPY_AT + i * COPY_LAG} style={{ color: JUICE_COLORS[i], ...vars({
              "--from-x": `${from[0] - columnX[j]}px`, "--from-y": `${from[1] - rowY[i]}px`, "--from-s": READING.size * basis.trayScale / NUMBER_SIZE,
            }) }} />;
        })}
      </div>;
    })}
  </section>;
}
