import katex from "katex";
import "katex/dist/katex.min.css";
import "./MathFormula.css";

export function MathFormula({ latex }: { latex: string }) {
  return <span className="math-formula" dangerouslySetInnerHTML={{ __html: katex.renderToString(latex, { throwOnError: false, strict: false }) }} />;
}
