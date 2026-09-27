import { lagrangeNodes, lagrangeValue, examplePolynomial } from '../math/lagrange';

export const RECONSTRUCTION_MS = 6500;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const curveXs = Array.from({ length: 121 }, (_, i) => -1.2 + i * .02);
export const curvePath = (point: (x: number) => readonly [number, number]) => curveXs.map((x, i) => {
  const [px, py] = point(x);
  return `${i ? 'L' : 'M'}${px},${py}`;
}).join(' ');

/** Read a native animation clock so the same finite motion is seekable during video export. */
export function animateLagrangeReconstruction(scene: HTMLElement, overlay: SVGSVGElement) {
  const frame = scene.getBoundingClientRect();
  const zoom = frame.width / 1440;
  const graphs = [...scene.querySelectorAll<SVGSVGElement>('.lagrange-basis-graph svg')];
  const origins = graphs.map(graph => {
    const rect = graph.getBoundingClientRect();
    const unit = rect.width / zoom / 150;
    return { x: (rect.left - frame.left) / zoom + 72 * unit, y: (rect.top - frame.top) / zoom + 112 * unit, scale: 48 * unit };
  });
  const curves = [...overlay.querySelectorAll<SVGPathElement>('[data-role="reconstruction-term"]')];
  const bars = [...overlay.querySelectorAll<SVGPathElement>('[data-role="addition-segment"]')];
  const weights = lagrangeNodes.map(examplePolynomial);
  const clock = overlay.animate([{ opacity: 1 }, { opacity: 1 }], { duration: RECONSTRUCTION_MS, fill: 'both' });
  clock.id = 'lagrange-reconstruction-clock';
  const originalPaths = graphs.map(graph => graph.querySelector('.lagrange-curve')!.getAttribute('d')!);
  let raf = 0;
  const draw = () => {
    const time = Number(clock.currentTime ?? 0);
    const scaling = clamp((time - 1000) / 1000);
    const moving = clamp((time - 3000) / 1000);
    const addFirst = clamp((time - 4000) / 1000);
    const addLast = clamp((time - 5000) / 1000);
    const finish = clamp((time - 6000) / 500);
    scene.dataset.reconstructionStage = time < 1000 ? 'coefficients' : time < 3000 ? 'scale' : time < 4000 ? 'move' : time < 6000 ? 'add' : 'complete';
    scene.style.setProperty('--reconstruction-move', String(moving));
    graphs.forEach((graph, i) => {
      const factor = mix(1, weights[i], scaling);
      graph.dataset.scaleFactor = String(factor);
      graph.querySelector('.lagrange-curve')!.setAttribute('d', curvePath(x => [72 + 48 * x, 112 - 48 * factor * lagrangeValue(i, x)]));
      graph.querySelectorAll<SVGCircleElement>('.lagrange-node').forEach((node, j) => node.setAttribute('cy', String(112 - 48 * factor * lagrangeValue(i, lagrangeNodes[j]))));
      graph.style.opacity = time < 3000 ? '1' : String(1 - moving);
      const origin = origins[i];
      const unit = mix(origin.scale, 160, moving);
      const ox = mix(origin.x, 720, moving), oy = mix(origin.y, 350, moving);
      const y = (x: number) => {
        const term = weights[i] * lagrangeValue(i, x);
        if (i === 1) return term + addFirst * weights[0] * lagrangeValue(0, x);
        if (i === 2) return term + addLast * (weights[0] * lagrangeValue(0, x) + weights[1] * lagrangeValue(1, x));
        return term;
      };
      curves[i].setAttribute('d', curvePath(x => [ox + unit * x, oy - unit * y(x)]));
      curves[i].style.opacity = time < 3000 ? '0' : String(i === 2 ? 1 : i === 0 ? 1 - .75 * addFirst - .25 * finish : 1 - .75 * addLast - .25 * finish);
      curves[i].style.stroke = i === 2 && time >= 6000 ? 'var(--vector-color)' : 'var(--yellow)';
    });
    overlay.querySelector<SVGGElement>('[data-role="sum-axes"]')!.style.opacity = String(moving);
    overlay.querySelector<SVGGElement>('[data-role="sum-nodes"]')!.style.opacity = String(finish);
    bars.forEach((bar, i) => {
      const x = [-.8, -.4, .4, .8][i];
      const partial = weights[0] * lagrangeValue(0, x) + weights[1] * lagrangeValue(1, x);
      const lower = time < 5000 ? weights[1] * lagrangeValue(1, x) : weights[2] * lagrangeValue(2, x);
      const increment = time < 5000 ? addFirst * weights[0] * lagrangeValue(0, x) : addLast * partial;
      bar.setAttribute('d', `M${720 + 160 * x},${350 - 160 * lower} V${350 - 160 * (lower + increment)}`);
      bar.style.opacity = time >= 4000 && time < 6000 ? '1' : '0';
    });
    if (time < RECONSTRUCTION_MS) raf = requestAnimationFrame(draw);
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) clock.finish();
  draw();
  return () => {
    cancelAnimationFrame(raf);
    clock.cancel();
    delete scene.dataset.reconstructionStage;
    scene.style.removeProperty('--reconstruction-move');
    graphs.forEach((graph, i) => {
      graph.style.removeProperty('opacity');
      delete graph.dataset.scaleFactor;
      graph.querySelector('.lagrange-curve')!.setAttribute('d', originalPaths[i]);
      graph.querySelectorAll<SVGCircleElement>('.lagrange-node').forEach((node, j) => node.setAttribute('cy', String(112 - 48 * lagrangeValue(i, lagrangeNodes[j]))));
    });
  };
}
