import { useLayoutEffect, useRef, type ReactNode } from "react";

/** 两份相同输入沿弧线移出托盘，并在共同输入处重合；不是把水果数量相加。 */
export function ExtractSharedInput({ children }: { children: ReactNode }) {
  const layer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = layer.current!;
    const layerVisibility = root.style.visibility;
    // StrictMode 会先清理再初始化同一 DOM；每次都恢复移动层。
    root.style.visibility = "visible";
    const scene = root.closest("section")!;
    const target = scene.querySelector<HTMLElement>(".spanning-argument")!;
    const destination = target.getBoundingClientRect();
    const scale = scene.getBoundingClientRect().width / 1440;
    const visibility = target.style.visibility;
    target.style.visibility = "hidden";
    const animations = [...root.children].map((node, index) => {
      const source = scene.querySelector<HTMLElement>(`.dual-${index + 1} [data-role=morphed-input] .fruit-bag`)!;
      const origin = source.getBoundingClientRect();
      const dx = (origin.left - destination.left) / scale;
      const dy = (origin.top - destination.top) / scale;
      const size = origin.width / destination.width;
      const lift = index === 0 ? 135 : 85;
      return node.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${size})`, offset: 0 },
        { transform: `translate(${dx * .72}px, ${dy - lift}px) scale(${size})`, offset: .35 },
        { transform: `translate(${dx * .2}px, -65px) scale(.9)`, offset: .75 },
        { transform: "none", offset: 1 },
      ], { duration: 1100, easing: "ease-in-out", fill: "both" });
    });
    let disposed = false;
    const settle = () => { root.style.visibility = "hidden"; target.style.visibility = visibility; };
    void Promise.all(animations.map(animation => animation.finished)).then(() => { if (!disposed) settle(); }, () => {});
    return () => {
      disposed = true;
      animations.forEach(animation => animation.cancel());
      root.style.visibility = layerVisibility;
      target.style.visibility = visibility;
    };
  }, []);
  return <div ref={layer} className="spanning-extraction" aria-hidden="true">
    {[1, 2].map(index => <div key={index} className="spanning-extracted-bag" data-extraction-source={index}>{children}</div>)}
  </div>;
}
