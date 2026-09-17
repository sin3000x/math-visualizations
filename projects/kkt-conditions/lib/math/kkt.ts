import type { Point } from "@/lib/geometry/plot";

export const WALL_TOLERANCE = 0.035;
export const CURVE_A = 0.32;

export function curveBoundary(x: number) {
  return -CURVE_A * x * x;
}
export function cornerConstraintValues(point: Point) {
  return {
    g1: -point.x,
    g2: curveBoundary(point.x) - point.y,
  };
}

export function cornerKktLambdas(point: Point) {
  const { g1, g2 } = cornerConstraintValues(point);
  const grad = { x: 2 * (point.x + 1.1), y: 2 * (point.y + 0.72) };
  const onG1 = Math.abs(g1) < WALL_TOLERANCE;
  const onG2 = Math.abs(g2) < WALL_TOLERANCE;

  if (onG1 && onG2) {
    const lambda2 = Math.max(0, grad.y);
    return {
      lambda1: Math.max(0, grad.x - 2 * CURVE_A * point.x * lambda2),
      lambda2,
    };
  }

  const gradG2 = { x: -2 * CURVE_A * point.x, y: -1 };
  const lambda2 = onG2
    ? Math.max(0, -(grad.x * gradG2.x + grad.y * gradG2.y) / (gradG2.x ** 2 + gradG2.y ** 2))
    : 0;
  return {
    lambda1: onG1 ? Math.max(0, grad.x) : 0,
    lambda2,
  };
}
