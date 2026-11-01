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

export const BASIS = {
  rowY: [210, 470], bagX: 120, bagScale: .62, juicerX: 320, juicerScale: .75, trayX: 550, trayScale: .68,
  target: [1100, 110] as const, targetScale: .62,
  /** (1, 0.5) 拆成 1 袋苹果基袋与 0.5 袋香蕉基袋。 */
  parts: [{ x: 1000, bag: [1, 0] as Bag, tone: "apple" as const }, { x: 1230, bag: [0, .5] as Bag, tone: "banana" as const }],
  partY: 110, partScale: .5,
  appleCopy: [1000, 500] as const, bananaCopy: [1230, 300] as const, copyScale: .68,
};
export const basisArrows = (i: number, className?: string): Arrow[] => [
  { id: `basis-in-${i}`, from: [192, BASIS.rowY[i]], to: [270, BASIS.rowY[i]], delay: 0, className },
  { id: `basis-out-${i}`, from: [372, BASIS.rowY[i]], to: [448, BASIS.rowY[i]], delay: FLOW.out, className },
];
