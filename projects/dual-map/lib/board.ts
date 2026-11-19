import type { Juice } from "@math-visualizations/scene-kit/JuiceTray";
import type { Bag as Quantities } from "./math/prices";

/** 每个对象在当前这一步的状态：still 静止，in 入场，out 淡出。 */
export type Anim = "still" | "in" | "out";
type Tone = "apple" | "banana";

export type BoardProps = Readonly<{
  fruitPrices: readonly [number | null, number | null];
  juicePrices: readonly [number | null, number | null, number | null];
  /** 榨汁机与上行两条箭头；run 时箭头重新画出、榨汁机运转一次，delay 是开始时刻。 */
  juicer?: { anim: Anim; run?: boolean; delay?: number };
  topBag?: { bag: Quantities; tone?: Tone; anim: Anim; delay?: number };
  /** 换袋时正在淡出的上一袋。 */
  topBagOut?: { bag: Quantities; tone?: Tone };
  /** juiced：随榨汁机产出；moved：已放上果汁收银台，原位只保留布局。 */
  topTray?: { values: Juice; anim: Anim | "juiced" | "moved" };
  /** place：从上行的袋子（托盘）放上收银台；drop：从右上方落下。 */
  fruitBag?: { bag: Quantities; tone?: Tone; anim: Anim | "place" | "drop"; delay?: number };
  juiceTray?: { values: Juice; anim: Anim | "place" | "drop" };
  /** fly 是复制来源的选择器。 */
  fruitPrice?: { value: number; anim: Anim; delay?: number; fly?: string };
  /** breakdown 是结果前的逐杯算式（LaTeX，不含等号）。 */
  juicePrice?: { value: number; anim: Anim; delay?: number; breakdown?: string };
  /** 果汁收银台的结果数字飞进水果收银台屏幕的第 index 项单价。 */
  priceFly?: { index: 0 | 1; delay?: number };
  /** 两台收银台本身；省略为静止显示，false 不显示。 */
  fruitCheckout?: Anim | false;
  juiceCheckout?: Anim | "emerge" | false;
}>;

/** 上一幕的最后一步，作为下一幕第 1 步复现：所有对象停在终态，淡出的对象不再出现。 */
export function still(props: BoardProps): BoardProps {
  const keep = <T extends { anim: string }>(item: T | undefined, map: (anim: string) => string = a => a): T | undefined =>
    !item || item.anim === "out" ? undefined : { ...item, anim: map(item.anim), delay: undefined, fly: undefined };
  const settle = (anim: string) => anim === "moved" ? "moved" : "still";
  return {
    ...props,
    juicer: props.juicer && props.juicer.anim !== "out" ? { anim: "still" } : undefined,
    topBag: keep(props.topBag, settle) as BoardProps["topBag"],
    topTray: keep(props.topTray, settle) as BoardProps["topTray"],
    fruitBag: keep(props.fruitBag, settle) as BoardProps["fruitBag"],
    juiceTray: keep(props.juiceTray, settle) as BoardProps["juiceTray"],
    fruitPrice: keep(props.fruitPrice, settle) as BoardProps["fruitPrice"],
    juicePrice: keep(props.juicePrice, settle) as BoardProps["juicePrice"],
    priceFly: undefined,
    topBagOut: undefined,
    fruitCheckout: props.fruitCheckout === "out" || props.fruitCheckout === false ? false : "still",
    juiceCheckout: props.juiceCheckout === "out" || props.juiceCheckout === false ? false : "still",
  };
}

/** 把上一步留在画面上的袋子、托盘与结果全部淡出（上行的托盘若已放上收银台，原位本就不可见）。 */
export function fadeAll(props: BoardProps): Partial<BoardProps> {
  return {
    topBagOut: props.topBag && { bag: props.topBag.bag, tone: props.topBag.tone },
    juiceTray: props.juiceTray && { values: props.juiceTray.values, anim: "out" },
    juicePrice: props.juicePrice && { value: props.juicePrice.value, breakdown: props.juicePrice.breakdown, anim: "out" },
    fruitBag: props.fruitBag && { bag: props.fruitBag.bag, tone: props.fruitBag.tone, anim: "out" },
    fruitPrice: props.fruitPrice && { value: props.fruitPrice.value, anim: "out" },
  };
}
