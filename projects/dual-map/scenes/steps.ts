import { JUICE_COLORS } from "@math-visualizations/scene-kit/JuiceTray";
import { fadeAll, still, type BoardProps } from "../lib/board";
import { FRUIT_PRICES, JUICE_PRICES, juice, priceBag, priceTray, pullback, SAMPLE_BAG, STRAY_TRAY, type Bag } from "../lib/math/prices";

/*
 * 每一幕每一步的方块状态。下一幕第 1 步是上一幕最后一步的 still()，衔接因此自动一致。
 */

const sampleTray = juice(SAMPLE_BAG);
const rest = { anim: "still" } as const;

/**
 * JuiceCheckoutScene：0 水果收银台（5、3 元/斤）结一袋 (2,1)，得 13 元；1 右边出现果汁收银台（1、2、1 元/份）；
 * 2 一托盘 (5,4,3) 放上去；3 得 16 元。
 */
export const JUICE_CHECKOUT_STEPS: readonly BoardProps[] = (() => {
  const base = { fruitPrices: FRUIT_PRICES, juicePrices: JUICE_PRICES } as const;
  const bagPrice = priceBag(FRUIT_PRICES, SAMPLE_BAG);
  const fruitDone = { fruitBag: { bag: SAMPLE_BAG, anim: "still" }, fruitPrice: { value: bagPrice, anim: "still" } } as const;
  return [
    { ...base, juiceCheckout: false, fruitCheckout: "in", fruitBag: { bag: SAMPLE_BAG, anim: "drop", delay: .5 }, fruitPrice: { value: bagPrice, anim: "in", delay: 1.8 } },
    { ...base, ...fruitDone, juiceCheckout: "emerge" },
    { ...base, ...fruitDone, juiceTray: { values: sampleTray, anim: "drop" } },
    { ...base, ...fruitDone, juiceTray: { values: sampleTray, anim: "still" }, juicePrice: { value: priceTray(JUICE_PRICES, sampleTray), anim: "in" } },
  ];
})();

/**
 * NoPushforwardScene：0 复现上一幕结尾；1 袋子、托盘与结果淡出，果汁单价变成问号，榨汁机出现在上方（停顿给观众思考）；
 * 2 右上方来了一托盘 (2,2,1)，没有任何一袋能榨出它；3 往回的虚线指向左上方的问号；4 虚线上打叉（虚线与叉由 Scene 画）。
 */
export const NO_PUSHFORWARD_STEPS: readonly BoardProps[] = (() => {
  const previous = JUICE_CHECKOUT_STEPS.at(-1)!;
  const base = { fruitPrices: FRUIT_PRICES, juicePrices: [null, null, null] } as const;
  const stray = { juicer: rest, topTray: { values: STRAY_TRAY, anim: "still" } } as const;
  return [
    still(previous),
    { ...base, juicer: { anim: "in" }, ...fadeAll(previous) },
    { ...base, juicer: rest, topTray: { values: STRAY_TRAY, anim: "in" } },
    { ...base, ...stray },
    { ...base, ...stray },
  ];
})();

/**
 * PullbackScene：0 复现上一幕结尾；1 虚线、问号、叉与托盘淡出，果汁单价变成 1、2、1，水果单价变成问号；
 * 2 左上方出现一袋 (2,1)；3 榨汁得到 (5,4,3)；4 托盘放上果汁收银台，得 16 元；
 * 5 同一袋（复制）放上水果收银台，16 元从果汁收银台复制过来：这就是它的价格；
 * 6 方块不变，Scene 画一个框：先框住榨汁机到结果这一整套，再移到水果收银台上——这一整套就是一台合格的水果收银台。
 */
export const PULLBACK_STEPS: readonly BoardProps[] = (() => {
  const price = priceTray(JUICE_PRICES, sampleTray);
  const base = { fruitPrices: [null, null], juicePrices: JUICE_PRICES } as const;
  const bag = { topBag: { bag: SAMPLE_BAG, anim: "still" } } as const;
  const moved = { ...bag, juicer: rest, topTray: { values: sampleTray, anim: "moved" } } as const;
  const priced = { ...base, ...moved, juiceTray: { values: sampleTray, anim: "still" }, juicePrice: { value: price, anim: "still" },
    fruitBag: { bag: SAMPLE_BAG, anim: "place" }, fruitPrice: { value: price, anim: "in", delay: 1.2, fly: "[data-role=juice-price] .price-value" } } as const;
  return [
    still(NO_PUSHFORWARD_STEPS.at(-1)!),
    { ...base, juicer: rest, topTray: { values: STRAY_TRAY, anim: "out" } },
    { ...base, juicer: rest, topBag: { bag: SAMPLE_BAG, anim: "in" } },
    { ...base, ...bag, juicer: { anim: "still", run: true }, topTray: { values: sampleTray, anim: "juiced" } },
    { ...base, ...moved, juiceTray: { values: sampleTray, anim: "place" }, juicePrice: { value: price, anim: "in", delay: 1.2 } },
    priced,
    still(priced),
  ];
})();

/**
 * DualMapScene：0 复现上一幕结尾（含框）；1 框、袋子、托盘与结果淡出，下行出现 T* 箭头；
 * 2–4 方块不再变化，名字、φ 与 T*φ、等式由 Scene 画。
 */
export const DUAL_MAP_BOARD: readonly BoardProps[] = (() => {
  const settled = still(PULLBACK_STEPS.at(-1)!);
  const { topBag, topTray, fruitBag, juiceTray, fruitPrice, juicePrice, ...board } = settled;
  void topTray; void fruitBag; void juiceTray; void fruitPrice; void juicePrice;
  const bare = { ...board, topBagOut: undefined };
  return [settled, { ...board, ...fadeAll(settled), topBagOut: topBag && { bag: topBag.bag, tone: topBag.tone } }, bare, bare, bare];
})();

const bases: readonly { bag: Bag; tone: "apple" | "banana" }[] = [{ bag: [1, 0], tone: "apple" }, { bag: [0, 1], tone: "banana" }];

/** 逐杯算式：每杯份数乘单价，按三种果汁的颜色着色。 */
const breakdownOf = (tray: readonly [number, number, number]) =>
  tray.map((x, i) => `\\textcolor{${JUICE_COLORS[i]}}{${JUICE_PRICES[i] * x}}`).join("+");

/** 一只基袋：榨出托盘；托盘放上果汁收银台，逐杯算式与合计出现；合计飞进水果收银台的单价。known 是此前已求出的单价。 */
function basisSteps(j: 0 | 1, known: readonly [number | null, number | null], first: BoardProps): BoardProps[] {
  const { bag, tone } = bases[j], tray = juice(bag), value = priceTray(JUICE_PRICES, tray);
  const prices = { fruitPrices: known, juicePrices: JUICE_PRICES } as const;
  const after: readonly [number | null, number | null] = j === 0 ? [value, known[1]] : [known[0], value];
  const top = { topBag: { bag, tone, anim: "still" }, topTray: { values: tray, anim: "moved" } } as const;
  const breakdown = breakdownOf(tray);
  return [
    first,
    { ...prices, ...top, juicer: rest, juiceTray: { values: tray, anim: "place" }, juicePrice: { value, breakdown, anim: "in", delay: 1.2 } },
    { ...prices, ...top, fruitPrices: after, juicer: rest, juiceTray: { values: tray, anim: "still" }, juicePrice: { value, breakdown, anim: "still" }, priceFly: { index: j } },
  ];
}

/**
 * PulledPricesScene：0 复现上一幕结尾（名字与等式由 Scene 画）；1 名字淡出，苹果基袋出现；2 榨出 (2,1,1)；
 * 3 托盘放上果汁收银台，逐杯 2、2、1，合计 5 元；4 5 飞进苹果单价；
 * 5 香蕉基袋出现并榨出 (1,2,1)；6 逐杯 1、4、1，合计 6 元；7 6 飞进香蕉单价。
 */
export const PULLED_PRICES_STEPS: readonly BoardProps[] = (() => {
  const previous = still(DUAL_MAP_BOARD.at(-1)!);
  const pulled = pullback(JUICE_PRICES);
  const unknown = { fruitPrices: [null, null], juicePrices: JUICE_PRICES } as const;
  const apple = bases[0], appleTray = juice(apple.bag);
  const appleIn: BoardProps = { ...unknown, juicer: rest, topBag: { ...apple, anim: "in" } };
  const appleJuiced: BoardProps = { ...unknown, topBag: { ...apple, anim: "still" }, juicer: { anim: "still", run: true }, topTray: { values: appleTray, anim: "juiced" } };
  const appleSteps = basisSteps(0, [null, null], appleJuiced);
  const banana = bases[1], bananaTray = juice(banana.bag);
  const bananaJuiced: BoardProps = { fruitPrices: [pulled[0], null], juicePrices: JUICE_PRICES, ...fadeAll(appleSteps.at(-1)!),
    juicer: { anim: "still", run: true, delay: 1 }, topBag: { ...banana, anim: "in", delay: .4 }, topTray: { values: bananaTray, anim: "juiced" } };
  return [previous, appleIn, ...appleSteps, ...basisSteps(1, [pulled[0], null], bananaJuiced)];
})();

/**
 * TwoWaysScene：0 复现上一幕结尾；1 香蕉袋、托盘与结果淡出，一袋 (2,1) 出现并榨出 (5,4,3)；
 * 2 托盘放上果汁收银台，得 16 元；3 同一袋放上水果收银台，按 5、6 元/斤直接结账也得 16 元：两条路一致。
 */
export const TWO_WAYS_STEPS: readonly BoardProps[] = (() => {
  const previous = still(PULLED_PRICES_STEPS.at(-1)!);
  const base = { fruitPrices: pullback(JUICE_PRICES), juicePrices: JUICE_PRICES } as const;
  const price = priceTray(JUICE_PRICES, sampleTray);
  const moved = { topBag: { bag: SAMPLE_BAG, anim: "still" }, juicer: rest, topTray: { values: sampleTray, anim: "moved" } } as const;
  return [
    previous,
    { ...base, ...fadeAll(previous), juicer: { anim: "still", run: true, delay: 1 }, topBag: { bag: SAMPLE_BAG, anim: "in", delay: .4 }, topTray: { values: sampleTray, anim: "juiced" } },
    { ...base, ...moved, juiceTray: { values: sampleTray, anim: "place" }, juicePrice: { value: price, anim: "in", delay: 1.2 } },
    { ...base, ...moved, juiceTray: { values: sampleTray, anim: "still" }, juicePrice: { value: price, anim: "still" },
      fruitBag: { bag: SAMPLE_BAG, anim: "place" }, fruitPrice: { value: priceBag(base.fruitPrices, SAMPLE_BAG), anim: "in", delay: 1.2 } },
  ];
})();

/** ContravariantScene 第 1 步复现上一幕结尾，之后整个方块淡出。 */
export const CONTRAVARIANT_BOARD: BoardProps = still(TWO_WAYS_STEPS.at(-1)!);
