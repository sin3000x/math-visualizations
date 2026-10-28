import { column } from "../lib/math/notation";
import { Formula } from "../components/Notation";
import { columnOf, MATRIX } from "../lib/math/map";
import "./MatrixColumnsScene.css";

// 组装后外层方括号由 .matrix-brackets 绘制，两列只保留数字。
const entries = (j: 0 | 1, bare: boolean) => bare ? `\\begin{matrix}${columnOf(MATRIX, j).join("\\\\")}\\end{matrix}` : column(columnOf(MATRIX, j));

export function MatrixColumnsScene({ step }: { step: number }) {
  const assembled = step >= 2;
  return <section className={`lesson matrix-columns ${assembled ? "assembled" : ""}`} data-step={step} aria-label="把两个基向量的像按顺序排成矩阵">
    {([0, 1] as const).filter(j => j === 0 || step >= 1).map(j => <div key={j}>
      <Formula className={`column-name name-${j} ${j ? "banana-color" : "apple-color"}`} latex={assembled ? `e_${j + 1}` : `[T(e_${j + 1})]_{\\mathcal U}`} />
      <div className={`moving-column col-${j} ${j ? "banana-color" : "apple-color"}`} data-layout-content><Formula latex={entries(j, assembled)} /></div>
    </div>)}
    {assembled && <><Formula className="matrix-equals" latex={"A="} /><div className="matrix-brackets" data-layout-content /></>}
    {step >= 3 && <Formula className="foot-equation" latex={"A=[T]_{\\mathcal U\\leftarrow\\mathcal E}\\in\\mathbb R^{3\\times2}"} />}
  </section>;
}
