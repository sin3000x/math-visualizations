/** 闭合轮廓逐点补间：对齐点数、绕向、起点；用浏览器原生时间线保持录屏可控。 */
export type Point = readonly [number, number];
export type Shape = { color: string; rings: Point[][] };
export type Outline = { width: number; height: number; shapes: Shape[] };
export type OutlinePair = { from: Outline; to: Outline };

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const center = (ring: readonly Point[]): Point => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
const area = (ring: readonly Point[]) => ring.reduce((sum, p, i) => {
  const q = ring[(i + 1) % ring.length];
  return sum + p[0] * q[1] - q[0] * p[1];
}, 0) / 2;

export function resample(ring: readonly Point[], count: number): Point[] {
  if (!ring.length || count < 1) throw new Error('轮廓不能为空，点数必须为正');
  const lengths = ring.map((point, i) => distance(point, ring[(i + 1) % ring.length]));
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total < 1e-8) return Array.from({ length: count }, () => ring[0]);
  let segment = 0, start = 0;
  return Array.from({ length: count }, (_, i) => {
    const at = total * i / count;
    while (segment < ring.length - 1 && start + lengths[segment] < at) start += lengths[segment++];
    const t = lengths[segment] ? (at - start) / lengths[segment] : 0;
    const a = ring[segment], b = ring[(segment + 1) % ring.length];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  });
}

/** 使用形状自身的归一化坐标匹配起点，避免把平移误判成轮廓扭转。 */
export function alignRings(from: readonly Point[], to: readonly Point[]): [Point[], Point[]] {
  const count = Math.min(192, Math.max(96, from.length, to.length));
  const a = resample(from, count);
  let b = resample(to, count);
  if (area(a) * area(b) < 0) b = b.reverse();
  const ca = center(a), cb = center(b);
  const sa = Math.max(1, ...a.map(p => distance(p, ca)));
  const sb = Math.max(1, ...b.map(p => distance(p, cb)));
  let best = 0, bestError = Infinity;
  for (let shift = 0; shift < count; shift++) {
    let error = 0;
    for (let i = 0; i < count; i++) {
      const p = a[i], q = b[(i + shift) % count];
      error += ((p[0] - ca[0]) / sa - (q[0] - cb[0]) / sb) ** 2 + ((p[1] - ca[1]) / sa - (q[1] - cb[1]) / sb) ** 2;
    }
    if (error < bestError) { bestError = error; best = shift; }
  }
  return [a, b.map((_, i) => b[(i + best) % count])];
}

export function pairedContours(from: Outline, to: Outline) {
  if (!from.shapes.length || !to.shapes.length) throw new Error('变形需要源轮廓和目标轮廓');
  const sorted = (shapes: Shape[]) => [...shapes].sort((a, b) => {
    const aa = Math.abs(area(a.rings[0])), ab = Math.abs(area(b.rings[0]));
    if (Math.abs(aa - ab) > Math.max(aa, ab) * .2) return ab - aa;
    // 同尺寸部件保留空间顺序，例如等号的两横不能在途中互相穿过。
    const ca = center(a.rings[0]), cb = center(b.rings[0]);
    return Math.abs(ca[1] - cb[1]) > 3 ? ca[1] - cb[1] : ca[0] - cb[0];
  });
  const a = sorted(from.shapes), b = sorted(to.shapes);
  const count = Math.max(a.length, b.length);
  return Array.from({ length: count }, (_, i) => {
    // 多余部件收缩到点，新增部件从点长出，避免复制完整字形产生重影。
    const source = a[i] ?? { color: a[0].color, rings: [[center(a[0].rings[0])]] };
    const target = b[i] ?? { color: b[0].color, rings: [[center(b[0].rings[0])]] };
    const rings = Array.from({ length: Math.max(source.rings.length, target.rings.length) }, (_, j) =>
      alignRings(source.rings[j] ?? [center(source.rings[0])], target.rings[j] ?? [center(target.rings[0])]),
    );
    return { fromColor: source.color, toColor: target.color, rings };
  });
}

const SVG = 'http://www.w3.org/2000/svg';
export function animateContourTransform({ layer, source, target, outlines, duration = 2200 }: {
  layer: HTMLElement; source: HTMLElement; target: HTMLElement; outlines: OutlinePair; duration?: number;
}) {
  const scene = layer.closest('section')!;
  const bounds = scene.getBoundingClientRect();
  const scale = bounds.width / 1440;
  const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 1440 810');
  svg.setAttribute('aria-hidden', 'true');
  svg.dataset.contourTransform = '';
  Object.assign(svg.style, { position: 'absolute', inset: '0', width: '1440px', height: '810px', overflow: 'visible', pointerEvents: 'none' });
  layer.append(svg);
  const visibility = target.style.visibility;
  target.style.visibility = 'hidden';
  const pathData = (rings: Point[][], box: DOMRect, outline: Outline) => rings.map(ring =>
    ring.map((p, i) => `${i ? 'L' : 'M'}${((box.left - bounds.left + p[0] * box.width / outline.width) / scale).toFixed(3)},${((box.top - bounds.top + p[1] * box.height / outline.height) / scale).toFixed(3)}`).join(' ') + ' Z',
  ).join(' ');
  const animations = pairedContours(outlines.from, outlines.to).map(pair => {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('fill-rule', 'evenodd');
    const from = pathData(pair.rings.map(r => r[0]), a, outlines.from);
    const to = pathData(pair.rings.map(r => r[1]), b, outlines.to);
    path.setAttribute('d', to);
    path.setAttribute('fill', pair.toColor);
    svg.append(path);
    return path.animate([
      { d: `path("${from}")`, fill: pair.fromColor },
      { d: `path("${to}")`, fill: pair.toColor },
    ], { duration, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'both' });
  });
  let disposed = false;
  const restore = () => { svg.remove(); target.style.visibility = visibility; };
  void Promise.all(animations.map(animation => animation.finished)).then(() => { if (!disposed) restore(); }, () => {});
  return () => { disposed = true; animations.forEach(animation => animation.cancel()); restore(); };
}
