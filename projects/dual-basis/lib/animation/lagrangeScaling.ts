import { lagrangeNodes, lagrangeValue, examplePolynomial } from '../math/lagrange';

export const SCALING_MS = 2000;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const curveXs = Array.from({ length: 121 }, (_, i) => -1.2 + i * .02);
export const curvePath = (point: (x: number) => readonly [number, number]) => curveXs.map((x, i) => {
  const [px, py] = point(x);
  return `${i ? 'L' : 'M'}${px},${py}`;
}).join(' ');

/** Read a native animation clock so the same finite motion is seekable during video export. */
export function animateLagrangeScaling(scene: HTMLElement, clockElement: HTMLElement) {
  const graphs = [...scene.querySelectorAll<SVGSVGElement>('.lagrange-basis-graph svg')];
  const weights = lagrangeNodes.map(examplePolynomial);
  const clock = clockElement.animate([{ opacity: 1 }, { opacity: 1 }], { duration: SCALING_MS, fill: 'both' });
  clock.id = 'lagrange-scaling-clock';
  const originalPaths = graphs.map(graph => graph.querySelector('.lagrange-curve')!.getAttribute('d')!);
  let raf = 0;
  const draw = () => {
    const time = Number(clock.currentTime ?? 0);
    const scaling = clamp((time - 1000) / 1000);
    scene.dataset.scalingStage = time < 1000 ? 'coefficients' : time < SCALING_MS ? 'scale' : 'complete';
    graphs.forEach((graph, i) => {
      const factor = mix(1, weights[i], scaling);
      graph.dataset.scaleFactor = String(factor);
      graph.querySelector('.lagrange-curve')!.setAttribute('d', curvePath(x => [72 + 48 * x, 112 - 48 * factor * lagrangeValue(i, x)]));
      graph.querySelectorAll<SVGCircleElement>('.lagrange-node').forEach((node, j) => node.setAttribute('cy', String(112 - 48 * factor * lagrangeValue(i, lagrangeNodes[j]))));
    });
    if (time < SCALING_MS) raf = requestAnimationFrame(draw);
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) clock.finish();
  draw();
  return () => {
    cancelAnimationFrame(raf);
    clock.cancel();
    delete scene.dataset.scalingStage;
    graphs.forEach((graph, i) => {
      delete graph.dataset.scaleFactor;
      graph.querySelector('.lagrange-curve')!.setAttribute('d', originalPaths[i]);
      graph.querySelectorAll<SVGCircleElement>('.lagrange-node').forEach((node, j) => node.setAttribute('cy', String(112 - 48 * lagrangeValue(i, lagrangeNodes[j]))));
    });
  };
}
