import type { Matrix } from "./map";
// 苹果、香蕉基列在 KaTeX 中的颜色，与 CSS 的 --coral、--yellow 相同。
export const BASIS_COLORS = ["#ed6a5a", "#f4c95d"] as const;
export const column =(values: readonly (number | string)[]) => `\\begin{bmatrix}${values.join("\\\\")}\\end{bmatrix}`;
/** 按列着色的矩阵；颜色与苹果、香蕉基袋一致。 */
export const coloredMatrix = (m: Matrix, colors: readonly [string, string] = BASIS_COLORS) =>
  `\\begin{bmatrix}${m.map(row => row.map((v, j) => `\\textcolor{${colors[j]}}{${v}}`).join("&")).join("\\\\")}\\end{bmatrix}`;
