import { MathFormula } from "@/components/math/MathFormula";

export function SvgFormula({
  x,
  y,
  width,
  latex,
  prefix,
  suffix,
  className = "",
}: {
  x: number;
  y: number;
  width: number;
  latex: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height="32" className={`svg-formula ${className}`}>
      <div>
        {prefix && <span className="svg-formula-copy">{prefix}</span>}
        <MathFormula latex={latex} />
        {suffix && <span className="svg-formula-copy">{suffix}</span>}
      </div>
    </foreignObject>
  );
}
