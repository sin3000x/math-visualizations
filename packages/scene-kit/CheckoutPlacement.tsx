import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { animateCheckoutPlacement } from "./checkoutPlacement.ts";

export type CheckoutPlacementProps = HTMLAttributes<HTMLDivElement> & {
  /** 袋子的最终位置由 className/style 布局，动画结束后停在该位置。 */
  active?: boolean;
  from?: string;
  to?: string;
  /** 从同一 Scene 内已有的袋子出发，自动处理播放器与局部缩放。 */
  source?: string;
  duration?: number;
  delay?: number;
  exit?: boolean;
};

export function CheckoutPlacement({ active = true, from = "translate(260px, -110px)", to = "none", source, duration = 1100, delay = 0, exit = false, style, children, ...props }: CheckoutPlacementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const wasActive = useRef(active);
  useLayoutEffect(() => {
    const target = ref.current!;
    const reversing = wasActive.current && !active;
    wasActive.current = active;
    if (!active) {
      if (!reversing || source) return;
      const animation = animateCheckoutPlacement(target, { from: to, to: from, duration });
      return () => animation.cancel();
    }
    let start = from;
    if (source) {
      const origin = target.closest("section")?.querySelector(source);
      if (!origin) throw new Error(`找不到放袋动画的源对象：${source}`);
      const a = origin.getBoundingClientRect(), b = target.getBoundingClientRect();
      const scale = b.width / target.offsetWidth;
      start = `translate(${(a.x - b.x) / scale}px, ${(a.y - b.y) / scale}px) scale(${a.width / b.width})`;
    }
    const animation = animateCheckoutPlacement(target, { from: start, to, duration, delay, exit });
    return () => animation.cancel();
  }, [active, from, to, source, duration, delay, exit]);
  return <div {...props} ref={ref} data-checkout-placement="" data-placement-source={source} style={{ transformOrigin: "top left", ...style, transform: active ? to : from, opacity: active && exit ? 0 : style?.opacity } as CSSProperties}>{children}</div>;
}
