export type Point = { x: number; y: number };

export const VIEW_W = 760;
export const VIEW_H = 520;
export const MIN = -2.8;
export const MAX = 2.8;
export const PLOT_SCALE = VIEW_H / (MAX - MIN);
export const PLOT_W = (MAX - MIN) * PLOT_SCALE;
export const PLOT_X = (VIEW_W - PLOT_W) / 2;
export const CONTOUR_RADII = [0.48, 0.86, 1.25, 1.67, 2.12, 2.58] as const;

export function sx(x: number) {
  return PLOT_X + (x - MIN) * PLOT_SCALE;
}
export function sy(y: number) {
  return VIEW_H - (y - MIN) * PLOT_SCALE;
}

export function fmt(value: number) {
  const clean = Math.abs(value) < 0.005 ? 0 : value;
  return clean.toFixed(2);
}

export function pointerToPlot(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const rect = svg.getBoundingClientRect();
  const svgX = ((clientX - rect.left) / rect.width) * VIEW_W;
  const svgY = ((clientY - rect.top) / rect.height) * VIEW_H;
  return {
    x: Math.max(MIN, Math.min(MAX, MIN + (svgX - PLOT_X) / PLOT_SCALE)),
    y: Math.max(MIN, Math.min(MAX, MAX - svgY / PLOT_SCALE)),
  };
}
