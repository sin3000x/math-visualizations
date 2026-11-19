/**
 * 复制飞行：目标元素从来源元素的位置与大小移到自己的位置，来源留在原处。
 * 两者都用实际 DOM 边界换算，自动处理播放器与局部缩放；目标须是块级或 inline-block。
 */
export function flyFrom(target: HTMLElement, source: Element, { delay = 0, duration = 900 }: { delay?: number; duration?: number } = {}) {
  const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
  const k = b.width / target.offsetWidth || 1;
  const from = `translate(${(a.x - b.x) / k}px, ${(a.y - b.y) / k}px) scale(${a.height / b.height})`;
  // 飞行途中沿用来源的颜色，落定时换成目标自己的颜色（例如屏幕上的深色字）。
  const [color, to] = [getComputedStyle(source).color, getComputedStyle(target).color];
  return target.animate([{ transform: from, transformOrigin: "0 0", color }, { color, offset: .7 }, { transform: "none", transformOrigin: "0 0", color: to }],
    { duration, delay: delay * 1000, easing: "ease-in-out", fill: "backwards" });
}
