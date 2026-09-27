/** Quadratic Lagrange basis at the distinct nodes -1, 0, 1. */
export const lagrangeNodes = [-1, 0, 1] as const;
export function lagrangeValue(index: number, x: number): number {
  const node = lagrangeNodes[index];
  return lagrangeNodes.reduce<number>((value, other, j) => j === index ? value : value * (x - other) / (node - other), 1);
}

/** One quadratic for the geometric demonstration; all three weights come from this same source. */
export const examplePolynomial = (x: number) => .65 + .3 * x - .25 * x * x;
