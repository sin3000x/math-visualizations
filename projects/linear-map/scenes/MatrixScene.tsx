import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { FruitIcon } from "@math-visualizations/scene-kit/FruitIcon";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import { Bracket, BracketLayer } from "../components/Brackets";
import { JUICE_COLORS, JuiceTray } from "../components/JuiceTray";
import { Arrows, Bag, Juicer, Op, Place } from "../components/Stage";
import { columnOf, juiceOf, MATRIX } from "../lib/math/map";
import { vars } from "../lib/style";
import { BasisLabels } from "./BasisImagesScene";
import { BASIS, basisArrows, MATRIX_LAYOUT } from "./layout";
import "./MatrixScene.css";

const fruits = [{ kind: "apple", bag: [1, 0] }, { kind: "banana", bag: [0, 1] }] as const;
// 托盘几何（托盘自身坐标）：托盘中心到读数中心 70.5，到杯子中心 -41.9；相邻杯 86。
const READ_DY = 70.5, CUP_DY = -41.9, CUP_DX = 86, READ_SIZE = 46;
// 托盘杯（含边框 74×128）与行首小杯（34×42）的宽高比，小杯从托盘杯的大小缩下来。
const CUP_SCALE = [74 / 34, 128 / 42] as const;
// 袋内水果图标相对袋子中心的位置（缩放 0.62 后）与它相对列顶图标的大小。
const BAG_FRUIT = [-30, 7] as const, BAG_FRUIT_SCALE = .6;
const { rowY, trayScale: s } = BASIS;
const { numberSize: NUMBER_SIZE, padX, padY, columnX: COLUMN_X, rowY: ROW_Y, liftDY: LIFT_DY, headerY: HEADER_Y, labelX: LABEL_X,
  note: NOTE, row: ROW, checkout: CHECKOUT, basisTray: BASIS_TRAY } = MATRIX_LAYOUT;
/** W 的自然基：第 i 个托盘只有第 i 杯装一份。 */
const juiceBasis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as const;
/** 步骤：方括号、列顶水果、W 的三个基托盘、基托盘收成行首杯子、第一列、第二列；再依次突出水果、杯子、矩阵，
 * 再让每一列与它上方的托盘一起闪动；然后写出记号，简记为 T；再恢复基底图标，引入收银台，搭出它的行向量，写出它的记号。 */
const AT = {
  brackets: 1, fruits: 2, juiceBasis: 3, cups: 4, columns: [5, 6], focus: { fruits: 7, cups: 8, matrix: 9, columns: 10 }, notation: 11, shorthand: 12,
  restore: 13, checkout: 14, row: 15, prices: 16, rowNotation: 17,
} as const;
/** 突出两列：苹果一列与它的托盘先闪动，香蕉一列隔 COLUMN_LAG 秒后闪动。 */
const COLUMN_LAG = 1.1;
/** 记号从右往左出现：先是输入的基（水果），再是箭头，最后是输出的基（杯子）。 */
const NOTE_AT = { fruits: .5, arrow: 1.4, cups: 1.8 };

/** 复制品：从 (x, y) 处、按 (sx, sy) 倍大小飞到自己的位置；fade 时起步淡入（外形与原件不同的复制品）。 */
const copyFrom = (x: number, y: number, at: readonly [number, number], [sx, sy] = [1, 1], fade = false) =>
  vars({ "--fx": `${x - at[0]}px`, "--fy": `${y - at[1]}px`, "--fsx": sx, "--fsy": sy, "--fo": fade ? 0 : 1 });

/**
 * 把两只基袋的结果抄成两列，就是矩阵。上方两张映射在搭矩阵时始终保留，矩阵的每一部分都是从它们复制过去的。
 * 列顶的水果、行首的杯子与矩阵三者一起才表示线性映射 T，矩阵记作 [T]_{杯←果}；默认用这两组基时简记为 T。
 * 步骤：0 只留 BasisImagesScene 分割线以上的两张映射；1 写出方括号；2 苹果、香蕉从基袋复制到列顶；
 * 3 左边竖排出现 W 的三个基托盘（只有一杯装一份）；4 基托盘中装着的那一杯收成行首的杯子，托盘淡出；
 * 5、6 两只托盘的读数依次复制成第一、二列；7、8、9 依次突出列顶水果、行首杯子、矩阵；
 * 10 上方两张映射重新亮起，每一列与它的托盘依次闪动；11 在右边写出 = [T]_{杯←果}，下标从右往左出现；
 * 12 其余淡出，只留 矩阵 = T，整组上移；13 退回显示基底：列顶水果、行首杯子与 [T] 的下标重新出现；14 左下出现收银台；
 * 15 写出行向量的方括号，水果从收银台屏幕复制到列顶；16 单价复制成行向量；
 * 17 行首写出新基 1，再写出 = [f]_{1←果}：收银台背后的行向量就是 V → R 的矩阵，新基只有 1。
 */
export function MatrixScene({ step }: { step: number }) {
  const copy = (at: number) => step === at ? "copy-fly" : "";
  const focusing = step >= AT.focus.fruits && step <= AT.focus.columns;
  const showColumns = step === AT.focus.columns;
  // 突出两列时，第 j 列与它上方的托盘一起闪动。
  const columnPulse = showColumns ? "pulse" : "";
  // 简记时基底图标淡出，恢复时淡入。
  const hide = step === AT.shorthand ? "fade-out" : step === AT.restore ? "fade-in" : "";
  // 突出某一部分时其余部分变暗。
  const part = (at: number) => step === at ? "pulse" : focusing ? "dim" : hide;
  const short = step >= AT.shorthand;
  const matrixLeft = COLUMN_X[0] - padX, matrixRight = COLUMN_X[1] + padX;
  return <section className="lesson matrix-scene" data-step={step} aria-label="基袋结果按列排成矩阵，与列顶水果、行首杯子一起表示线性映射">
    <div className={`matrix-part ${step >= AT.focus.fruits && !showColumns ? "dim" : ""} ${short ? "fade-out" : ""}`}>
      <Arrows arrows={[0, 1].flatMap(i => basisArrows(i, "still"))} />
      <BasisLabels />
      {fruits.map(({ kind, bag }, j) => <div key={kind}>
        <Bag bag={bag} tone={kind} x={BASIS.bagX[j]} y={rowY} scale={BASIS.bagScale} />
        <Juicer x={BASIS.juicerX[j]} y={rowY} scale={BASIS.juicerScale} />
        <Place x={BASIS.trayX[j]} y={rowY} scale={s} className={columnPulse} delay={j * COLUMN_LAG}><JuiceTray values={juiceOf(bag)} /></Place>
      </div>)}
    </div>
    {/* W 的三个基托盘：竖排在左边，下一步装着的那一杯收成行首的杯子。 */}
    {(step === AT.juiceBasis || step === AT.cups) && juiceBasis.map((values, i) => <Place key={`basis-${i}`} x={BASIS_TRAY.x} y={BASIS_TRAY.y[i]} scale={BASIS_TRAY.scale}
      className={step === AT.juiceBasis ? "fade-in" : "fade-out"} delay={step === AT.juiceBasis ? i * .25 : .7}>
      <JuiceTray values={values} />
    </Place>)}
    {/* 榨汁机这一组：简记时整体上移一次。 */}
    <div className="juicer-block" style={{ transform: short ? `translateY(${LIFT_DY}px)` : undefined }}>
    {step >= AT.fruits && fruits.map(({ kind }, j) => <Place key={kind} x={COLUMN_X[j]} y={HEADER_Y} className={`${copy(AT.fruits)} ${part(AT.focus.fruits)}`} data-layout-content
      style={copyFrom(BASIS.bagX[j] + BAG_FRUIT[0], rowY + BAG_FRUIT[1], [COLUMN_X[j], HEADER_Y], [BAG_FRUIT_SCALE, BAG_FRUIT_SCALE])}>
      <span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span>
    </Place>)}
    {step >= AT.cups && ROW_Y.map((y, i) => <Place key={i} x={LABEL_X} y={y} className={`${copy(AT.cups)} ${part(AT.focus.cups)}`} data-layout-content
      style={copyFrom(BASIS_TRAY.x + (i - 1) * CUP_DX * BASIS_TRAY.scale, BASIS_TRAY.y[i] + CUP_DY * BASIS_TRAY.scale, [LABEL_X, y],
        [CUP_SCALE[0] * BASIS_TRAY.scale, CUP_SCALE[1] * BASIS_TRAY.scale], true)}>
      <span className="mini-cup" style={{ color: JUICE_COLORS[i] }} />
    </Place>)}
    <div className={`matrix-group ${step === AT.focus.matrix ? "pulse" : focusing && !showColumns ? "dim" : ""}`}
      style={{ transformOrigin: `${(matrixLeft + matrixRight) / 2}px ${ROW_Y[1]}px` }}>
      {step >= AT.brackets && <BracketLayer write={step === AT.brackets}>
        <Bracket left={matrixLeft} right={matrixRight} top={ROW_Y[0] - padY} bottom={ROW_Y[2] + padY} />
      </BracketLayer>}
      {fruits.map(({ kind }, j) => step >= AT.columns[j] && columnOf(MATRIX, j as 0 | 1).map((value, i) => <Op key={`${kind}-${i}`} latex={String(value)}
        size={NUMBER_SIZE} x={COLUMN_X[j]} y={ROW_Y[i]} className={`matrix-number ${copy(AT.columns[j])} ${columnPulse}`} delay={showColumns ? j * COLUMN_LAG : undefined}
        style={{ color: JUICE_COLORS[i], ...copyFrom(BASIS.trayX[j] + (i - 1) * CUP_DX * s, rowY + READ_DY * s, [COLUMN_X[j], ROW_Y[i]], [READ_SIZE * s / NUMBER_SIZE, READ_SIZE * s / NUMBER_SIZE]) }} />))}
    </div>
    {step >= AT.notation && <>
      <div className={hide}>
        {[-1, 1].map(side => <Op key={side} latex={side < 0 ? "[" : "]"} size={72} x={NOTE.tX + side * NOTE.bracketDX} y={ROW_Y[1]} className={step === AT.notation ? "fade-in" : ""} />)}
        {NOTE.cupX.map((x, i) => <Place key={i} x={x} y={NOTE.subY} scale={NOTE.cupScale} className={copy(AT.notation)} delay={NOTE_AT.cups} data-layout-content
          style={copyFrom(LABEL_X, ROW_Y[i], [x, NOTE.subY], [1 / NOTE.cupScale, 1 / NOTE.cupScale])}>
          <span className="mini-cup" style={{ color: JUICE_COLORS[i] }} />
        </Place>)}
        <Op latex={"\\leftarrow"} size={NOTE.subSize} x={NOTE.arrowX} y={NOTE.subY} className={step === AT.notation ? "fade-in" : ""} delay={NOTE_AT.arrow} />
        {fruits.map(({ kind }, j) => <Place key={kind} x={NOTE.fruitX[j]} y={NOTE.subY} scale={NOTE.fruitScale} className={copy(AT.notation)} delay={NOTE_AT.fruits} data-layout-content
          style={copyFrom(COLUMN_X[j], HEADER_Y, [NOTE.fruitX[j], NOTE.subY], [1 / NOTE.fruitScale, 1 / NOTE.fruitScale])}>
          <span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span>
        </Place>)}
      </div>
      <Op latex="=" x={NOTE.equalsX} y={ROW_Y[1]} className={step === AT.notation ? "fade-in" : ""} />
      <Op latex="T" size={72} x={NOTE.tX} y={ROW_Y[1]} className={step === AT.notation ? "fade-in" : ""} />
    </>}
    </div>
    {step >= AT.checkout && <Place x={CHECKOUT.x} y={CHECKOUT.y} scale={CHECKOUT.scale} className={step === AT.checkout ? "emerge" : ""} delay={.6}>
      {/* 外层盒子按未缩放的宽度排版，边界检查看缩放后的收银台本身。 */}
      <div className="checkout-machine" data-layout-content><CheckoutIcon accent="#62d2c3" largeScreen /><UnitPrices apples={5} bananas={3} valueSourcePrefix="price" /></div>
    </Place>}
    {step >= AT.row && <>
      <BracketLayer write={step === AT.row}>
        <Bracket left={COLUMN_X[0] - padX} right={COLUMN_X[1] + padX} top={ROW.y - ROW.padY} bottom={ROW.y + ROW.padY} />
      </BracketLayer>
      {fruits.map(({ kind }, j) => <Place key={kind} x={COLUMN_X[j]} y={ROW.headerY} className={copy(AT.row)} data-layout-content
        style={copyFrom(CHECKOUT.x + CHECKOUT.fruit[j][0], CHECKOUT.y + CHECKOUT.fruit[j][1], [COLUMN_X[j], ROW.headerY], [36 * CHECKOUT.scale / 52, 36 * CHECKOUT.scale / 52])}>
        <span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span>
      </Place>)}
    </>}
    {step >= AT.prices && [5, 3].map((price, j) => <Op key={j} latex={String(price)} size={NUMBER_SIZE} x={COLUMN_X[j]} y={ROW.y} className={`row-price ${copy(AT.prices)}`}
      style={copyFrom(CHECKOUT.x + CHECKOUT.price[j][0], CHECKOUT.y + CHECKOUT.price[j][1], [COLUMN_X[j], ROW.y], [30 * CHECKOUT.scale / NUMBER_SIZE, 30 * CHECKOUT.scale / NUMBER_SIZE], true)} />)}
    {/* 行首的新基 1 先出现，再写出记号。 */}
    {step >= AT.rowNotation && <Op latex="1" size={NUMBER_SIZE} x={LABEL_X} y={ROW.y} className={step === AT.rowNotation ? "fade-in" : ""} />}
    {step >= AT.rowNotation && <div className={step === AT.rowNotation ? "fade-in" : ""} style={vars({ "--delay": ".8s" })}>
      <Op latex="=" x={NOTE.equalsX} y={ROW.y} />
      {[-1, 1].map(side => <Op key={side} latex={side < 0 ? "[" : "]"} size={72} x={NOTE.tX + side * NOTE.bracketDX} y={ROW.y} />)}
      <Op latex="f" size={72} x={NOTE.tX} y={ROW.y} />
      <Op latex="1" size={NOTE.subSize} x={ROW.oneX[0]} y={ROW.y + 40} />
      <Op latex={"\\leftarrow"} size={NOTE.subSize} x={ROW.oneX[1]} y={ROW.y + 40} />
      {fruits.map(({ kind }, j) => <Place key={kind} x={ROW.oneX[2 + j]} y={ROW.y + 40} scale={NOTE.fruitScale} data-layout-content>
        <span className={`fruit matrix-fruit ${kind}`}><FruitIcon kind={kind} /></span>
      </Place>)}
    </div>}
  </section>;
}
