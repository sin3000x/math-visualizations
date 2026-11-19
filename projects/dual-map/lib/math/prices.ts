import type { Juice } from "@math-visualizations/scene-kit/JuiceTray";

export type Bag = readonly [number, number];
/** 一台收银台的单价：水果收银台两项（元/斤），果汁收银台三项（元/份，1 份 = 100 mL）。 */
export type FruitPrices = Bag;
export type JuicePrices = Juice;

/** 第 5 集的榨汁机 T：每斤苹果榨出 (2,1,1)，每斤香蕉榨出 (1,2,1)。 */
export const JUICER: readonly [Juice, Juice] = [[2, 1, 1], [1, 2, 1]];
/** 本集的果汁收银台 g：A、B、C 每份 1、2、1 元。 */
export const JUICE_PRICES: JuicePrices = [1, 2, 1];
/** 开场与反例里给定的水果收银台 f：苹果 5、香蕉 3 元/斤（沿用第 3、5 集）。 */
export const FRUIT_PRICES: FruitPrices = [5, 3];
/** 示例袋 (2,1) 与它榨出的托盘 (5,4,3)。 */
export const SAMPLE_BAG: Bag = [2, 1];
/** 反例托盘：不是任何一袋榨出来的。 */
export const STRAY_TRAY: Juice = [2, 2, 1];

export const juice = ([a, b]: Bag): Juice => [0, 1, 2].map(i => a * JUICER[0][i] + b * JUICER[1][i]) as unknown as Juice;
export const priceBag = (p: FruitPrices, [a, b]: Bag) => p[0] * a + p[1] * b;
export const priceTray = (p: JuicePrices, x: Juice) => p[0] * x[0] + p[1] * x[1] + p[2] * x[2];
/** 对偶映射 T*：果汁收银台 g ↦ 水果收银台 g∘T。单价就是两只基袋榨汁后的价格。 */
export const pullback = (g: JuicePrices): FruitPrices => [priceTray(g, juice([1, 0])), priceTray(g, juice([0, 1]))];
/** 托盘 x 是否由某一袋榨出：T 的列线性无关，用前两项解出袋子，再核对第三项。 */
export const bagOf = (x: Juice): Bag | null => {
  const a = (2 * x[0] - x[1]) / 3, b = (2 * x[1] - x[0]) / 3;
  const back = juice([a, b]);
  return back.every((v, i) => Math.abs(v - x[i]) < 1e-9) ? [a, b] : null;
};
