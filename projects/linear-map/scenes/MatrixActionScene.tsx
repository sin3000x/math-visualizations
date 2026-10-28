import { BASIS_COLORS, coloredMatrix, column } from "../lib/math/notation";
import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { Juice } from "../components/Juice";
import { Formula } from "../components/Notation";
import { columnOf, juiceOf, MATRIX, type Bag } from "../lib/math/map";
import "./MatrixActionScene.css";

const bag: Bag = [2, 1];
const coefficient = (value: number) => value === 1 ? "" : String(value);
// 按列展开 A[v]：每个坐标乘以对应基袋的像，颜色与基袋一致。
const combination = ([0, 1] as const).map(j => `${coefficient(bag[j])}\\textcolor{${BASIS_COLORS[j]}}{${column(columnOf(MATRIX, j))}}`).join("+");

export function MatrixActionScene({ step }: { step: number }) {
  return <section className="lesson matrix-action" data-step={step} aria-label="矩阵乘法就是基的像的线性组合">
    <div className="action-bag" data-layout-content><FruitBag apples={bag[0]} bananas={bag[1]} /><Formula latex={"[v]_{\\mathcal E}=" + column(bag)} /></div>
    {step >= 1 && <Formula className="action-calculation" latex={step === 1 ? `${coloredMatrix(MATRIX)}${column(bag)}` : `${combination}=${column(juiceOf(bag))}`} />}
    {step >= 2 && <div className="action-juice" data-layout-content><Juice values={juiceOf(bag)} /></div>}
    {step >= 3 && <Formula className="foot-equation" latex={"[T(v)]_{\\mathcal U}=A[v]_{\\mathcal E}"} />}
  </section>;
}
