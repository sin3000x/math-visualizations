/** 所有水果袋落到收银台托盘的动画共用此时序；结束后停住，队列可在结算后淡出。 */
export function checkoutPlacementFrames(from: string, to: string, exit = false): Keyframe[] {
  return [
    { transform: from, opacity: 1, offset: 0 },
    { transform: to, opacity: 1, offset: exit ? .7 : 1 },
    ...(exit ? [{ transform: to, opacity: 1, offset: .85 }, { transform: to, opacity: 0, offset: 1 }] : []),
  ];
}
export function animateCheckoutPlacement(element: HTMLElement, { from, to = "none", duration = 1100, delay = 0, exit = false }: {
  from: string; to?: string; duration?: number; delay?: number; exit?: boolean;
}) {
  return element.animate(checkoutPlacementFrames(from, to, exit), { duration, delay, easing: "ease-in-out", fill: "backwards" });
}
