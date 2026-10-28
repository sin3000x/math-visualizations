export type Bag = readonly [number, number];
export type Juice = readonly [number, number, number];
/** 3×2 矩阵：三行对应 A、B、C 果汁，两列对应苹果、香蕉基袋。 */
export type Matrix = readonly [readonly [number, number], readonly [number, number], readonly [number, number]];
// 产量单位：100 mL；输入单位：斤。固定基下的矩阵，每一列对应一个基袋。
export const MATRIX: Matrix = [[2, 1], [1, 2], [1, 1]];
// 开场对比用的另外两台榨汁机，列分别为 (1,2,0)、(1,1,2) 与 (2,0,2)、(0,2,2)。
export const MATRIX_S: Matrix = [[1, 1], [2, 1], [0, 2]];
export const MATRIX_R: Matrix = [[2, 0], [0, 2], [2, 2]];
export const apply = (m: Matrix, [a, b]: Bag): Juice => m.map(([p, q]) => p * a + q * b) as unknown as Juice;
export const columnOf = (m: Matrix, j: 0 | 1): Juice => m.map(row => row[j]) as unknown as Juice;
export const juiceOf = (bag: Bag): Juice => apply(MATRIX, bag);
