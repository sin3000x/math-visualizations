import { FLOW, type Arrow } from "../components/Stage";
import { MATRIX, MATRIX_R, MATRIX_S, type Bag, type Juice } from "../lib/math/map";

/*
 * 各幕的关键位置。每一幕的第 1 步复现上一幕的最后画面，
 * 第 2 步再把保留下来的对象连续移动到本幕的布局，因此两幕共用这里的坐标。
 */

// 两个集合之间只留出放榨汁机的距离。
export const V_OVAL = { x: 200, y: 70, width: 400, height: 590 } as const;
export const W_OVAL = { x: 840, y: 70, width: 400, height: 590 } as const;
/** JuiceSpaceScene 结尾 W 中的托盘；最后一个是刚加倍得到的 (6,6,2)。 */
export const SPACE_TRAYS: readonly (readonly [number, number, Juice])[] = [[955, 255, [2, 0, 3]], [1125, 255, [4, 1, 2]], [955, 475, [0, 3, 1]], [1125, 475, [6, 6, 2]]];
export const SPACE_TRAY_SCALE = .5;

/** 每一袋与它的托盘在同一行，用一条箭头直接对应；榨汁机放在箭头上方，表示产生这种对应的规则。 */
export const MAP = {
  bags: [[2, 1], [1, 3], [3, 0]] as readonly Bag[],
  rowY: [235, 395, 555], bagX: 400, bagScale: .62,
  juicer: [720, 125] as const, juicerScale: .85, trayX: 1040, trayScale: .62,
  /** 箭头画完后托盘出现。 */
  result: .45,
};
export const mapArrows = (i: number, className?: string): Arrow[] => [
  { id: `map-${i}`, from: [MAP.bagX + 78, MAP.rowY[i]], to: [MAP.trayX - 92, MAP.rowY[i]], delay: 0, className },
];

/** 三台榨汁机：颜色只区分机器，同一台机器的箭头与轮廓同色。 */
export const MACHINES = {
  bag: [230, 365] as const, bagScale: .9, juicerX: 700, juicerScale: 100 / 120, trayX: 1125, trayScale: .62,
  list: [
    { matrix: MATRIX, color: "#f6f2e7", y: 165 },
    { matrix: MATRIX_S, color: "#e9a46a", y: 365 },
    { matrix: MATRIX_R, color: "#7fcf8f", y: 565 },
  ],
};
export const machineArrows = (className?: string): Arrow[] => MACHINES.list.flatMap(({ color, y }, i) => [
  { id: `machine-in-${i}`, from: [335, 365], to: [642, y], delay: 0, color, className },
  { id: `machine-out-${i}`, from: [760, y], to: [1022, y], delay: FLOW.out, color, className },
]);

/**
 * 等式从左读到右：左边是运算对象，右边一列 C 是合并或缩放后的结果。
 * 加法 P1 + P2 = C 与数乘 0.5 × P = C 宽度不同，各自水平居中；垂直方向在底部字幕安全区以上居中。
 */
export const LIN = {
  P1: 270, P2: 630, C: 1170, plusX: 450, equalsX: 900,
  scale: { P: 522, C: 1062, timesX: 327, equalsX: 792 },
  bagY: 125, juicerY: 300, trayY: 530, equalsY: 493,
  trayScale: .9, bagScale: .72, juicerScale: 100 / 120,
};
/** 竖直一列：袋子 → 榨汁机 → 托盘。 */
export const columnArrows = (id: string, x: number, className?: string): Arrow[] => [
  { id: `${id}-in`, from: [x, LIN.bagY + 75], to: [x, LIN.juicerY - 60], delay: 0, className },
  { id: `${id}-out`, from: [x, LIN.juicerY + 62], to: [x, LIN.trayY - 100], delay: FLOW.out, className },
];

/**
 * 上方一行并排两张映射：基袋 → T → 托盘。下方两行是一个等式，从左读到右：
 * 上行 (1, 0.5) = 1 × 苹果基袋 + 0.5 × 香蕉基袋，下行把每只袋子换成它的托盘，按列与上行对应。
 * 最后在一般的一袋与它的托盘之间放上 T，对准上下两个对象。上下两部分之间用一条细线分开。
 */
export const BASIS = {
  rowY: 105, bagX: [154, 855], bagScale: .62, juicerX: [344, 1045], juicerScale: .75, trayX: [560, 1260], trayScale: .68,
  eq: {
    bagY: 300, trayY: 602, scale: .62,
    resultX: 343, equalsX: 467, coefX: [552, 930], termX: [694, 1099], plusX: 818,
    juicerY: 450, juicerScale: .6,
  },
  divider: { y: 208, left: 90, right: 1350 },
};
export const basisArrows = (i: number, className?: string): Arrow[] => [
  { id: `basis-in-${i}`, from: [BASIS.bagX[i] + 75, BASIS.rowY], to: [BASIS.juicerX[i] - 55, BASIS.rowY], delay: 0, className },
  { id: `basis-out-${i}`, from: [BASIS.juicerX[i] + 55, BASIS.rowY], to: [BASIS.trayX[i] - 101, BASIS.rowY], delay: FLOW.out, className },
];
/** 等式中的一列：袋子 → T → 它的托盘，竖直对准；默认是一般的一袋 (1, 0.5)。delay 是这一列开始榨汁的时刻。 */
export const equationArrows = (x: number = BASIS.eq.resultX, id = "eq", delay = 0, className?: string): Arrow[] => {
  const { bagY, trayY, juicerY: y } = BASIS.eq;
  return [
    { id: `${id}-in`, from: [x, bagY + 67], to: [x, y - 47], delay, className },
    { id: `${id}-out`, from: [x, y + 47], to: [x, trayY - 72], delay: delay + FLOW.out, className },
  ];
};

/**
 * MatrixScene 的布局。矩阵整组的位置在整幕中不变；简记时上方映射淡出，整组只上移 liftDY 一次，给下方收银台的行向量让出位置。
 * MatrixVectorScene 第 1 步复现它的结尾：上移后的矩阵、记号与收银台。
 */
export const MATRIX_LAYOUT = (() => {
  const columnX = [460, 610], rowY = [355, 450, 545];
  // 收银台的行向量与上移后的矩阵共用两列；行首写新基 1，记号 [f]_{1←果} 的下标只有一项，整体左移紧贴方括号。
  const row = { y: 570, headerY: 485, padY: 45, oneX: [893, 940, 990, 1037] };
  return {
    columnX, rowY, liftDY: -215, headerY: rowY[0] - 85, labelX: columnX[0] - 115,
    numberSize: 54,
    /** 方括号相对列与行的外扩。 */
    padX: 60, padY: 50,
    /** 记号 矩阵 = [T]_{杯←果}：等号与 T 在矩阵右边的中间一行，下标图标比列顶、行首图标小。 */
    note: { equalsX: 735, tX: 830, bracketDX: 42, subY: rowY[1] + 40, cupX: [908, 943, 978], arrowX: 1025, fruitX: [1075, 1122], cupScale: .9, fruitScale: .8 },
    row,
    /**
     * 收银台：缩放后放在行向量左边，略微上提以留在字幕安全区以上；屏幕上水果图标与单价数字相对收银台中心的位置。
     * 屏幕上的单价字号 30、水果图标 36（收银台自身坐标）。
     */
    checkout: { x: 178, y: row.y - 15, scale: .55, fruit: [[-62, -62], [-62, -33]], price: [[-41, -62], [-41, -33]] },
  } as const;
})();

/**
 * MatrixVectorScene：上行是 T(v) = 1 × T(e1) + 0.5 × T(e2) 写成矩阵乘向量：[T] v = 1 × 第一列 + 0.5 × 第二列 = 结果；
 * 下行是同一个等式的图形写法：榨汁机(一袋) = 1 × 榨汁机(苹果基袋) + 0.5 × 榨汁机(香蕉基袋) = 结果托盘。
 * 两行逐项对齐：上下对应的项（矩阵乘向量与 榨汁机(一袋)、两列与两个 榨汁机(基袋)、结果列与托盘）中心在同一竖线上，
 * 加号、等号也上下同位；系数紧贴各自的项。下行的项更宽，上行的运算符两侧因此留得更开。
 * 两行放不进 1440 宽，本幕内容整体缩小 scale 倍放在舞台上，以下坐标都是舞台坐标（缩放前）。
 * 舞台高 810 / scale，字幕安全区以上的部分高 680 / scale，内容在其中竖直居中。
 */
export const MATRIX_VECTOR = {
  scale: .82,
  /** 矩阵、列顶水果与行首杯子：彼此的相对位置与上一幕相同，第 2 步整组从上一幕的位置缩放移来。 */
  columnX: [172, 322], rowY: [218, 313, 408], cupX: 57, headerDY: MATRIX_LAYOUT.headerY - MATRIX_LAYOUT.rowY[0],
  /** 向量与它右侧的水果、结果列与它右侧的杯子：标出每一行对应的基。 */
  vectorX: 452, vectorY: [265.5, 360.5], vectorFruitX: 543, vectorFruitScale: .8, resultX: 1608, resultCupX: 1695,
  top: { equalsX: [608, 1506], coefX: [759, 1208], plusX: 1035, termX: [875, 1346] },
  /** 单列向量的方括号相对数字的外扩。 */
  vectorPadX: 58,
  /** 下行：termX 是 榨汁机(基袋) 的袋子位置，trayX 是结果托盘。 */
  bottom: { y: 670, equalsX: [608, 1506], coefX: [700, 1149], plusX: 1035, termX: [909, 1380], trayX: 1608 },
  trayScale: .5,
  /** 函数写法 榨汁机(袋)：v 在矩阵与向量下方，用大号；e1、e2 用小号。各部分相对袋子中心的位置。 */
  bagX: 358,
  apply: {
    big: { bagScale: .62, juicerScale: .7, juicerDX: -167, parenDX: 91, parenSize: 120 },
    small: { bagScale: .45, juicerScale: .5, juicerDX: -121, parenDX: 66, parenSize: 84 },
  },
} as const;
