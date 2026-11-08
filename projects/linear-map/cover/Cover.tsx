import { FruitIcon } from "@math-visualizations/scene-kit/FruitIcon";
import { JuicerIcon } from "@math-visualizations/scene-kit/JuicerIcon";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { JUICE_COLORS } from "../components/JuiceTray";
import { MATRIX } from "../lib/math/map";
import "./cover.css";

const fruits = ["apple", "banana"] as const;
/** 1920×1080 坐标：矩阵两列、三行的中心；列顶水果与行首杯子沿用 MatrixScene 的排法。 */
const COLUMN_X = [1245, 1505], ROW_Y = [395, 610, 825], HEADER_Y = 205, CUP_X = 990;
const BRACKET = { left: 1085, right: 1665, top: 300, bottom: 920, hook: 40 };

const at = (x: number, y: number) => ({ left: x, top: y });

/** 封面：榨汁机 = 它的矩阵。两列是一斤苹果、一斤香蕉榨出的三杯果汁。 */
export default function Cover() {
  return <div className="cover-preview"><div className="cover-frame">
    <main className="video-cover linear-map-cover" data-role="video-cover" aria-label="线性映射封面：榨汁机等于它的矩阵">
      <div className="cover-place cover-juicer" data-cover-object="juicer" style={at(406, 560)}><JuicerIcon width={460} height={460 * 8 / 7} /></div>
      <div className="cover-place cover-op" data-cover-object="equals" style={at(783, 610)}><MathFormula latex="=" /></div>
      {fruits.map((kind, j) => <div key={kind} className="cover-place" data-cover-object={kind} style={at(COLUMN_X[j], HEADER_Y)}>
        <span className={`fruit cover-fruit ${kind}`}><FruitIcon kind={kind} /></span>
      </div>)}
      {ROW_Y.map((y, i) => <div key={i} className="cover-place" data-cover-object={`cup-${i}`} style={at(CUP_X, y)}>
        <span className="cover-cup" style={{ color: JUICE_COLORS[i] }} />
      </div>)}
      {MATRIX.map((row, i) => row.map((value, j) => <div key={`${i}-${j}`} className="cover-place cover-number" data-cover-object={`entry-${i}-${j}`}
        style={{ ...at(COLUMN_X[j], ROW_Y[i]), color: JUICE_COLORS[i] }}><MathFormula latex={String(value)} /></div>))}
      <svg className="cover-brackets" viewBox="0 0 1920 1080" aria-hidden="true">
        {[[BRACKET.left, 1], [BRACKET.right, -1]].map(([x, side]) =>
          <path key={x} d={`M${x + side * BRACKET.hook} ${BRACKET.top}H${x}V${BRACKET.bottom}H${x + side * BRACKET.hook}`} />)}
      </svg>
    </main>
  </div></div>;
}
