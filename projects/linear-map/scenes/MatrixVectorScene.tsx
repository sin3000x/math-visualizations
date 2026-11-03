import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { FruitIcon } from "@math-visualizations/scene-kit/FruitIcon";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import { Bracket, BracketLayer } from "../components/Brackets";
import { JUICE_COLORS, JuiceTray } from "../components/JuiceTray";
import { Bag, Juicer, Op, Place } from "../components/Stage";
import { columnOf, juiceOf, MATRIX, type Bag as Quantities } from "../lib/math/map";
import { vars } from "../lib/style";
import { MATRIX_LAYOUT, MATRIX_VECTOR } from "./layout";
import "./MatrixVectorScene.css";

const fruits = ["apple", "banana"] as const;
const bases = [{ bag: [1, 0] as Quantities, tone: "apple" as const }, { bag: [0, 1] as Quantities, tone: "banana" as const }];
const input: Quantities = [1, .5];
const columns = [columnOf(MATRIX, 0), columnOf(MATRIX, 1)] as const;
const output = juiceOf(input);
const { numberSize: NUMBER_SIZE, padX, padY, note, row, checkout } = MATRIX_LAYOUT;
const { scale: S, columnX, rowY, cupX, headerDY, vectorX, vectorY, vectorFruitX, vectorFruitScale, resultX, resultCupX,
  top, bottom, vectorPadX, trayScale, bagX, apply } = MATRIX_VECTOR;
const { equalsX, coefX, plusX, termX } = top, bottomY = bottom.y;
/** 上一幕结尾（屏幕坐标）：矩阵上移后的行与 [T] 下标的高度。 */
const PREV_ROW_Y = MATRIX_LAYOUT.rowY.map(y => y + MATRIX_LAYOUT.liftDY);
const LABEL_X = MATRIX_LAYOUT.labelX, SUB_Y = note.subY + MATRIX_LAYOUT.liftDY;
/**
 * 第 1 步之前，矩阵整组仍在上一幕的位置与大小：舞台坐标 p 经 translate(FROM) scale(1/S) 变为 FROM + p / S，
 * 再乘舞台的 S 落在屏幕上的 S · FROM + p，等于上一幕的位置 p + (上一幕 − 本幕)，所以 FROM = (上一幕 − 本幕) / S。
 * 去掉这个变换，整组就连续地缩放移到本幕的位置。
 */
const FROM = [(MATRIX_LAYOUT.columnX[0] - columnX[0]) / S, (PREV_ROW_Y[0] - rowY[0]) / S];
// 袋内两个数字相对袋子中心的位置与字号（缩放后）：数量从这里原样浮起，再飞成向量。
const BAG_DIGIT = [[-1, -11], [6, 25]] as const, BAG_DIGIT_SCALE = 27 * apply.big.bagScale / NUMBER_SIZE;
const AT = { move: 1, lift: 2, combination: 3, result: 4, juice: 5 } as const;
/**
 * 第 2 步：数量从袋中依次浮起。第 3 步：每一列连同它的权重一起飞出，第二列在 COLUMN_LAG 秒后飞出。
 * 路线互不交叉：列在途中缩小并收拢到 COLUMN_PEAK_Y，第一列从矩阵下方与下行之间的空白穿过，
 * 第二列从列顶水果与已落定的第一列上方越过；权重走另一侧：1× 从向量旁的水果与等号上方越过，
 * 0.5× 下沉到第一列走过的空白再升到列前（第一列早已离开那里）。
 */
const LIFT_AT = .2, DIGIT_LAG = .2, FLIGHT = 1, COLUMN_AT = .3, COLUMN_LAG = 1.3;
const COLUMN_PEAK_Y = [[487, 512, 537], [60, 85, 110]], COLUMN_PEAK_SCALE = .4, WEIGHT_PEAK_Y = [210, 520];
/** 第 5 步：下行从左到右逐项出现的时刻：第一个等号、两项、结果托盘。 */
const TERM_AT = [.2, .8, 1.4, 2];

/**
 * 沿弧线飞来的复制品：从 (x, y) 处、按 scale 倍大小出发。水平先加速后减速，竖直先到 peakY 再到终点，
 * 合起来是一段弧（peakY 在两端之上为拱，之下为垂）；途中在 peakY 处的大小为 peakScale。
 * fade 时起步淡入（外形与原件不同的复制品）。加 rise 类时改为从原件处原样浮起：竖直先走、水平后走。
 */
const arcFrom = (x: number, y: number, at: readonly [number, number],
  { scale = 1, fade = false, peakY = Math.min(y, at[1]), peakScale = (scale + 1) / 2 }: { scale?: number; fade?: boolean; peakY?: number; peakScale?: number } = {}) =>
  vars({ "--fx": `${x - at[0]}px`, "--fy": `${y - at[1]}px`, "--peak": `${peakY - at[1]}px`, "--fs": scale, "--ps": peakScale, "--fo": fade ? 0 : 1 });

/** 一列向量的方括号：两行或三行。 */
const columnBracket = (x: number, ys: readonly number[]) =>
  <Bracket left={x - vectorPadX} right={x + vectorPadX} top={ys[0] - padY} bottom={ys[ys.length - 1] + padY} />;

const fruitMark = (kind: typeof fruits[number], x: number, y: number, scale?: number) =>
  <Place key={`${kind}-${x}-${y}`} x={x} y={y} scale={scale} data-layout-content><span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span></Place>;
/** 三行各自对应的杯子，竖直对准矩阵的行。 */
const cupMarks = (x: number) => rowY.map((y, i) => <Place key={i} x={x} y={y} data-layout-content><span className="mini-cup" style={{ color: JUICE_COLORS[i] }} /></Place>);

/** 函数写法 榨汁机(袋)：袋子中心在 (x, y)，榨汁机与圆括号按 size 排在它两边。 */
function Application({ bag, tone, x, y, size, className, delay }: {
  bag: Quantities; tone?: "apple" | "banana"; x: number; y: number; size: typeof apply.big | typeof apply.small; className?: string; delay?: number;
}) {
  return <div className={className} style={vars({ "--delay": delay === undefined ? undefined : `${delay}s` })}>
    <Juicer x={x + size.juicerDX} y={y} scale={size.juicerScale} />
    {[-1, 1].map(side => <Op key={side} latex={side < 0 ? "(" : ")"} size={size.parenSize} x={x + side * size.parenDX} y={y} />)}
    <Bag bag={bag} tone={tone} x={x} y={y} scale={size.bagScale} />
  </div>;
}

/** MatrixScene 结尾除矩阵与它的列顶水果、行首杯子以外的部分：= [T] 记号、收银台与它的行向量（屏幕坐标）。 */
function PreviousEnd({ className }: { className: string }) {
  return <div className={`previous-end ${className}`}>
    <Op latex="=" x={note.equalsX} y={PREV_ROW_Y[1]} />
    {[-1, 1].map(side => <Op key={side} latex={side < 0 ? "[" : "]"} size={72} x={note.tX + side * note.bracketDX} y={PREV_ROW_Y[1]} />)}
    <Op latex="T" size={72} x={note.tX} y={PREV_ROW_Y[1]} />
    {note.cupX.map((x, i) => <Place key={i} x={x} y={SUB_Y} scale={note.cupScale} data-layout-content><span className="mini-cup" style={{ color: JUICE_COLORS[i] }} /></Place>)}
    <Op latex={"\\leftarrow"} size={42} x={note.arrowX} y={SUB_Y} />
    {fruits.map((kind, j) => fruitMark(kind, note.fruitX[j], SUB_Y, note.fruitScale))}

    <Place x={checkout.x} y={checkout.y} scale={checkout.scale}>
      <div className="checkout-machine" data-layout-content><CheckoutIcon accent="#62d2c3" largeScreen /><UnitPrices apples={5} bananas={3} valueSourcePrefix="previous-price" /></div>
    </Place>
    <BracketLayer><Bracket left={MATRIX_LAYOUT.columnX[0] - padX} right={MATRIX_LAYOUT.columnX[1] + padX} top={row.y - row.padY} bottom={row.y + row.padY} /></BracketLayer>
    <Op latex="1" size={NUMBER_SIZE} x={LABEL_X} y={row.y} />
    {fruits.map((kind, j) => fruitMark(kind, MATRIX_LAYOUT.columnX[j], row.headerY))}
    {[5, 3].map((price, j) => <Op key={j} latex={String(price)} size={NUMBER_SIZE} x={MATRIX_LAYOUT.columnX[j]} y={row.y} className="number" />)}
    <Op latex="=" x={note.equalsX} y={row.y} />
    {[-1, 1].map(side => <Op key={side} latex={side < 0 ? "[" : "]"} size={72} x={note.tX + side * note.bracketDX} y={row.y} />)}
    <Op latex="f" size={72} x={note.tX} y={row.y} />
    <Op latex="1" size={42} x={row.oneX[0]} y={row.y + 40} />
    <Op latex={"\\leftarrow"} size={42} x={row.oneX[1]} y={row.y + 40} />
    {fruits.map((kind, j) => fruitMark(kind, row.oneX[2 + j], row.y + 40, note.fruitScale))}
  </div>;
}

/**
 * 矩阵乘向量：一袋水果的数量是矩阵两列的权重，[T] v = 1 × 第一列 + 0.5 × 第二列，正是 BasisImagesScene 中
 * T(v) = 1 × T(e1) + 0.5 × T(e2) 写成数字；下行的 T、v、e1、e2 都用榨汁机与水果袋画出。
 * 步骤：0 复现 MatrixScene 结尾；1 其余淡出，矩阵连同列顶水果、行首杯子缩放移到本幕位置，同时下方写出 榨汁机(一袋 (1, 0.5))；
 * 2 袋中数量依次浮起，沿弧线飞上去成为向量 v，向量右侧标出对应的水果；
 * 3 写出 = 1 × 第一列 + 0.5 × 第二列，两列连同权重依次沿弧线飞出；4 加权和得到结果列，右侧标出对应的杯子；
 * 5 下行：= 1 × 榨汁机(苹果基袋) + 0.5 × 榨汁机(香蕉基袋) = 结果托盘，与上行逐项对齐，从左到右逐项出现。
 */
export function MatrixVectorScene({ step }: { step: number }) {
  return <section className="lesson matrix-vector-scene" data-step={step} aria-label="水果数量是矩阵各列的权重，加权和就是榨出的果汁">
    <MatrixVectorContent step={step} />
  </section>;
}

/** 本幕的画面内容；下一幕第 1 步用它复现本幕结尾。 */
export function MatrixVectorContent({ step }: { step: number }) {
  const appear = (at: number) => step === at ? "fade-in" : "";
  const arc = (at: number) => step === at ? "arc" : "";
  const [left, right] = [columnX[0] - padX, columnX[1] + padX];
  return <>
    {step <= AT.move && <PreviousEnd className={step === AT.move ? "fade-out" : ""} />}

    <div className="mv-stage" style={{ scale: String(S), width: 1440 / S, height: 810 / S }}>
      {/* 矩阵整组：第 1 步连同列顶水果、行首杯子从上一幕的位置与大小移到本幕。 */}
      <div className="matrix-shift" style={{ transform: step < AT.move ? `translate(${FROM[0]}px, ${FROM[1]}px) scale(${1 / S})` : undefined }}>
        {fruits.map((kind, j) => fruitMark(kind, columnX[j], rowY[0] + headerDY))}
        {cupMarks(cupX)}
        <BracketLayer><Bracket left={left} right={right} top={rowY[0] - padY} bottom={rowY[2] + padY} /></BracketLayer>
        {columns.map((column, j) => column.map((value, i) => <Op key={`${j}-${i}`} latex={String(value)} size={NUMBER_SIZE}
          x={columnX[j]} y={rowY[i]} style={{ color: JUICE_COLORS[i] }} />))}
      </div>

      {/* 下行左端 榨汁机(一袋)：与矩阵的移动同时出现。 */}
      {step >= AT.move && <Application bag={input} x={bagX} y={bottomY} size={apply.big} className={`input-apply ${appear(AT.move)}`} delay={.3} />}

      {/* 数量从袋中原样浮起，依次飞上去成为向量，再写出向量的方括号与右侧的水果。 */}
      {step >= AT.lift && <>
        {input.map((weight, j) => <Op key={j} latex={String(weight)} size={NUMBER_SIZE} x={vectorX} y={vectorY[j]}
          className={`number ${step === AT.lift ? "arc rise" : ""}`} delay={LIFT_AT + j * DIGIT_LAG}
          style={arcFrom(bagX + BAG_DIGIT[j][0], bottomY + BAG_DIGIT[j][1], [vectorX, vectorY[j]], { scale: BAG_DIGIT_SCALE, fade: true })} />)}
        <BracketLayer write={step === AT.lift} delay={LIFT_AT + DIGIT_LAG + FLIGHT - .2}>{columnBracket(vectorX, vectorY)}</BracketLayer>
        <div className={appear(AT.lift)} style={vars({ "--delay": `${LIFT_AT + DIGIT_LAG + FLIGHT}s` })}>
          {fruits.map((kind, j) => fruitMark(kind, vectorFruitX, vectorY[j], vectorFruitScale))}
        </div>
      </>}

      {/* 每一列连同它的权重一起沿弧线飞出，两列一下一上、权重走另一侧，路线不交叉；列落定后写出它的方括号。 */}
      {step >= AT.combination && <>
        <Op latex="=" x={equalsX[0]} y={rowY[1]} className={appear(AT.combination)} />
        {columns.map((column, j) => {
          const at = COLUMN_AT + j * COLUMN_LAG;
          return <div key={j}>
            {column.map((value, i) => <Op key={i} latex={String(value)} size={NUMBER_SIZE} x={termX[j]} y={rowY[i]} className={arc(AT.combination)} delay={at}
              style={{ color: JUICE_COLORS[i], ...arcFrom(columnX[j], rowY[i], [termX[j], rowY[i]], { peakY: COLUMN_PEAK_Y[j][i], peakScale: COLUMN_PEAK_SCALE }) }} />)}
            <Op latex={`${input[j]}\\times`} x={coefX[j]} y={rowY[1]} className={arc(AT.combination)} delay={at}
              style={arcFrom(vectorX, vectorY[j], [coefX[j], rowY[1]], { fade: true, peakY: WEIGHT_PEAK_Y[j] })} />
            <BracketLayer write={step === AT.combination} delay={at + FLIGHT - .3}>{columnBracket(termX[j], rowY)}</BracketLayer>
          </div>;
        })}
        <Op latex="+" x={plusX} y={rowY[1]} className={appear(AT.combination)} delay={COLUMN_AT + COLUMN_LAG} />
      </>}

      {step >= AT.result && <>
        <Op latex="=" x={equalsX[1]} y={rowY[1]} className={appear(AT.result)} />
        <BracketLayer write={step === AT.result}>{columnBracket(resultX, rowY)}</BracketLayer>
        {output.map((value, i) => <Op key={i} latex={String(value)} size={NUMBER_SIZE} x={resultX} y={rowY[i]} className={appear(AT.result)}
          delay={.3 + i * .25} style={{ color: JUICE_COLORS[i] }} />)}
        <div className={appear(AT.result)} style={vars({ "--delay": "1.2s" })}>{cupMarks(resultCupX)}</div>
      </>}

      {/*
        * 下行：每一项写成 榨汁机(基袋)，与上行逐项对齐，从左到右逐项出现。
        */}
      {step >= AT.juice && <>
        <Op latex="=" x={bottom.equalsX[0]} y={bottomY} className={appear(AT.juice)} delay={TERM_AT[0]} />
        {bases.map(({ bag, tone }, j) => <div key={j}>
          <Op latex={`${input[j]}\\times`} x={bottom.coefX[j]} y={bottomY} className={appear(AT.juice)} delay={TERM_AT[j + 1]} />
          <Application bag={bag} tone={tone} x={bottom.termX[j]} y={bottomY} size={apply.small} className={appear(AT.juice)} delay={TERM_AT[j + 1]} />
        </div>)}
        <Op latex="+" x={bottom.plusX} y={bottomY} className={appear(AT.juice)} delay={TERM_AT[2]} />
        <Op latex="=" x={bottom.equalsX[1]} y={bottomY} className={appear(AT.juice)} delay={TERM_AT[3]} />
        <Place x={bottom.trayX} y={bottomY} scale={trayScale} className={`result-tray ${step === AT.juice ? "emerge" : ""}`} delay={TERM_AT[3]}>
          <JuiceTray values={output} />
        </Place>
      </>}
    </div>
  </>;
}
