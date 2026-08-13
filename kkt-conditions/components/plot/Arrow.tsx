import { SvgFormula } from "@/components/math/SvgFormula";
import type { Point } from "@/lib/geometry/plot";
import { sx, sy } from "@/lib/geometry/plot";

export function Arrow({
  from,
  vector,
  tone,
  label,
  latex,
  labelNormalOffset = 18,
  labelTangentOffset = 0,
  dashed = false,
  showLabel = true,
}: {
  from: Point;
  vector: Point;
  tone: "red" | "blue" | "amber" | "violet";
  label: string;
  latex?: string;
  labelNormalOffset?: number;
  labelTangentOffset?: number;
  dashed?: boolean;
  showLabel?: boolean;
}) {
  const end = { x: from.x + vector.x, y: from.y + vector.y };
  const midpoint = { x: from.x + vector.x / 2, y: from.y + vector.y / 2 };
  const screenVector = { x: sx(end.x) - sx(from.x), y: sy(end.y) - sy(from.y) };
  const screenLength = Math.hypot(screenVector.x, screenVector.y) || 1;
  const labelCenter = {
    x: sx(midpoint.x) - (screenVector.y / screenLength) * labelNormalOffset
      + (screenVector.x / screenLength) * labelTangentOffset,
    y: sy(midpoint.y) + (screenVector.x / screenLength) * labelNormalOffset
      + (screenVector.y / screenLength) * labelTangentOffset,
  };

  return (
    <g className={`vector vector-${tone}`} data-role={label}>
      <line
        x1={sx(from.x)}
        y1={sy(from.y)}
        x2={sx(end.x)}
        y2={sy(end.y)}
        markerEnd={`url(#arrow-${tone})`}
        strokeDasharray={dashed ? "7 6" : undefined}
      />
      {showLabel && latex ? (
        <SvgFormula x={labelCenter.x - 75} y={labelCenter.y - 16} width={150} latex={latex} className={`svg-vector-${tone}`} />
      ) : showLabel ? (
        <text x={sx(end.x) + 10} y={sy(end.y) - 10}>{label}</text>
      ) : null}
    </g>
  );
}
