import katex from "katex";

export function MathFormula({ latex }: { latex: string }) {
  return <span className="math-formula" dangerouslySetInnerHTML={{ __html: katex.renderToString(latex, { throwOnError: false, strict: false }) }} />;
}
