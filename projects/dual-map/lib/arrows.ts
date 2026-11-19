/** 一条箭头：d 是箭杆路径，head 为尖端位置与方向角（弧度）；className：still 直接画好，dashed 虚线，fade-out 淡出。 */
export type Arrow = Readonly<{ id: string; d: string; head: readonly [number, number, number]; delay?: number; color?: string; className?: string }>;

/** 直线箭头。 */
export const straight = (id: string, [x1, y1]: readonly [number, number], [x2, y2]: readonly [number, number], rest: Partial<Arrow> = {}): Arrow =>
  ({ id, d: `M${x1} ${y1}L${x2} ${y2}`, head: [x2, y2, Math.atan2(y2 - y1, x2 - x1)], ...rest });

