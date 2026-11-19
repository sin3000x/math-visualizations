import { straight, type Arrow } from "../lib/arrows";

/*
 * 全集共用一个“方块”构图：上行 袋 → 榨汁机 → 托盘（V → W），下行左边水果收银台、右边果汁收银台（V*、W*），
 * 各自正对上方的袋子与托盘。每一幕的第 1 步复现上一幕的结尾，因此所有幕共用这里的坐标。
 */
export const BOARD = {
  left: 360, right: 1080, mid: 720,
  top: 170, bottom: 450, priceY: 640,
  /** 上行的袋子与托盘；放上收银台时从这个大小连续缩到收银台的比例。 */
  objectScale: .72, juicerScale: 1, checkoutScale: .68,
} as const;

/** 上行两条箭头：袋 → 榨汁机 → 托盘。delay 是开始榨汁的时刻。 */
export const juicerArrows = (delay = 0, className?: string): Arrow[] => {
  const { left, right, mid, top } = BOARD;
  return [
    straight("juicer-in", [left + 92, top], [mid - 70, top], { delay, className }),
    straight("juicer-out", [mid + 70, top], [right - 114, top], { delay: delay + .75, className }),
  ];
};

/** 下行 T* 箭头：从果汁收银台指向水果收银台。 */
export const DUAL_ARROW = { y: BOARD.bottom, from: 845, to: 585 } as const;

/** NoPushforwardScene 往回的虚线：从托盘下方绕过榨汁机下面，回到左上方袋子的位置；叉打在虚线最低处。 */
export const BACK = { from: [985, 262], c1: [880, 330], c2: [560, 330], to: [450, 252], crossY: 311, question: [BOARD.left, BOARD.top] } as const;

/**
 * PullbackScene 结尾的框：先框住“榨汁机 → 托盘 → 果汁收银台 → 结果”这一整套，再移到水果收银台上，
 * 表示这一整套就是一台水果收银台。两个框的底边都不进入字幕安全区（y ≤ 680）。
 */
export const FRAME = {
  composite: { x: 630, y: 78, width: 690, height: 598 },
  fruit: { x: 128, y: 290, width: 464, height: 386 },
} as const;

/** DualMapScene：四个空间与两张映射的名字，各自贴在所属对象旁边；φ 与 T*φ 写在两台收银台下方。 */
export const NAMES = {
  V: [88, BOARD.top], W: [1352, BOARD.top], Vs: [88, BOARD.bottom], Ws: [1352, BOARD.bottom],
  T: [BOARD.mid, 58], Ts: [BOARD.mid, BOARD.bottom - 52],
  phi: [BOARD.right, 622], pulled: [BOARD.left, 622], identity: [BOARD.mid, 622],
} as const;
export const NAME_SIZE = 72, MAP_NAME_SIZE = 56;

/** 最后一幕的抽象图：上行 V → W，下行 V* ← W*；两条竖直的对偶箭头把 V、W 分别送到 V*、W*。 */
export const DIAGRAM = { x: [470, 970], top: 230, bottom: 500, gap: 80 } as const;
