import { MathFormula } from "./MathFormula";

export function SvgFormula({ x, y, width = 240, height = 80, latex }: {
  x: number; y: number; width?: number; height?: number; latex: string;
}) {
  return <foreignObject x={x} y={y} width={width} height={height}>
    <div className="svg-formula"><MathFormula latex={latex} /></div>
  </foreignObject>;
}
