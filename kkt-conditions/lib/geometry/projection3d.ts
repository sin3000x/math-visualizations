import { MAX, MIN } from "./plot.ts";

export type ProjectedPoint = { x: number; y: number };

export const SURFACE_SAMPLES = Array.from(
  { length: 17 },
  (_, index) => MIN + (index * (MAX - MIN)) / 16,
);

export const SURFACE_LINES = Array.from(
  { length: 9 },
  (_, index) => MIN + (index * (MAX - MIN)) / 8,
);

export function project3d(x: number, y: number, z: number): ProjectedPoint {
  return { x: 260 + x * 62, y: 410 - y * 30 - z * 15 };
}
export function surfacePath(fixed: number, alongX: boolean) {
  return SURFACE_SAMPLES.map((sample, index) => {
    const x = alongX ? sample : fixed;
    const y = alongX ? fixed : sample;
    const projected = project3d(x, y, x * x + y * y);
    return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(6)} ${projected.y.toFixed(6)}`;
  }).join(" ");
}

export function contourSectionPath(radius: number) {
  return Array.from({ length: 65 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const projected = project3d(x, y, radius * radius);
    // 只统一 SVG 序列化精度，避免服务端和浏览器三角函数的尾数差异影响 hydration。
    return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(6)} ${projected.y.toFixed(6)}`;
  }).join(" ");
}
