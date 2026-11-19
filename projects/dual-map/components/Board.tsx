import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CheckoutPlacement } from "@math-visualizations/scene-kit/CheckoutPlacement";
import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { JuiceTray } from "@math-visualizations/scene-kit/JuiceTray";
import { flyFrom } from "../lib/fly";
import type { BoardProps } from "../lib/board";
import { BOARD, juicerArrows } from "../scenes/layout";
import { FruitCheckout, JuiceCheckout } from "./Checkouts";
import { Arrows, Bag, FLOW, Juicer, Place, Price } from "./Stage";

const cls = (anim: string) => anim === "in" ? "fade-in" : anim === "out" ? "fade-out" : "";

/** 放上收银台：静止时直接画在终点。 */
function Placed({ anim, source, className, delay, children }: { anim: string; source: string; className: string; delay?: number; children: ReactNode }) {
  if (anim === "place" || anim === "drop") return <CheckoutPlacement className={className} source={anim === "place" ? source : undefined} delay={delay ? delay * 1000 : 0}>{children}</CheckoutPlacement>;
  return <div className={`${className} ${cls(anim)}`}>{children}</div>;
}

export function Board({ fruitPrices, juicePrices, juicer, topBag, topTray, fruitBag, juiceTray, fruitPrice, juicePrice, priceFly, topBagOut, fruitCheckout = "still", juiceCheckout = "still" }: BoardProps) {
  const { left, right, mid, top, bottom, priceY, objectScale, juicerScale, checkoutScale } = BOARD;
  const fruitRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!priceFly || !fruitRef.current) return;
    const section = fruitRef.current!.closest("section")!;
    const target = fruitRef.current!.querySelector<HTMLElement>(`[data-source="price-${priceFly.index}"]`)!;
    const source = section.querySelector("[data-role=juice-price] .price-value .katex .mord")!;
    const animation = flyFrom(target, source, { delay: priceFly.delay });
    return () => animation.cancel();
  }, [priceFly]);
  const runAt = juicer?.delay ?? 0;
  return <>
    {juicer && <Arrows arrows={juicerArrows(runAt, juicer.run ? "" : juicer.anim === "out" ? "still fade-out" : juicer.anim === "in" ? "" : "still")} />}
    {juicer && <Juicer x={mid} y={top} scale={juicerScale} running={juicer.run} delay={juicer.run ? runAt + FLOW.run : undefined}
      className={juicer.anim === "out" ? "fade-out" : juicer.anim === "in" ? "fade-in" : ""} key={`juicer-${juicer.run ? "run" : "rest"}`} />}
    {topBagOut && <Bag key={`bag-out-${topBagOut.bag.join()}`} bag={topBagOut.bag} tone={topBagOut.tone} x={left} y={top} scale={objectScale} className="fade-out" />}
    {topBag && <Bag key={`bag-${topBag.bag.join()}`} bag={topBag.bag} tone={topBag.tone} x={left} y={top} scale={objectScale} data-slot-source="top-bag"
      className={topBag.anim === "in" ? "emerge" : cls(topBag.anim)} delay={topBag.delay} />}
    {topTray && <Place key={`tray-${topTray.values.join()}`} x={right} y={top} scale={objectScale} data-slot-source="top-tray" data-layout-content
      className={topTray.anim === "juiced" ? "emerge" : topTray.anim === "moved" ? "gone" : topTray.anim === "in" ? "emerge" : cls(topTray.anim)}
      delay={topTray.anim === "juiced" ? runAt + FLOW.result : undefined}>
      <JuiceTray values={topTray.values} />
    </Place>}

    {fruitCheckout && <Place x={left} y={bottom} scale={checkoutScale} className={cls(fruitCheckout)} data-layout-content>
      <div ref={fruitRef}>
        <FruitCheckout prices={fruitPrices}>
          {fruitBag && <Placed anim={fruitBag.anim} source='[data-slot-source="top-bag"] .fruit-bag' className="slot-object" delay={fruitBag.delay}>
            <div data-role="bag" data-values={fruitBag.bag.join(",")}><FruitBag apples={fruitBag.bag[0]} bananas={fruitBag.bag[1]} tone={fruitBag.tone} /></div>
          </Placed>}
        </FruitCheckout>
      </div>
    </Place>}
    {juiceCheckout && <Place x={right} y={bottom} scale={checkoutScale} className={juiceCheckout === "emerge" ? "emerge" : cls(juiceCheckout)} data-layout-content>
      <JuiceCheckout prices={juicePrices}>
        {juiceTray && <Placed anim={juiceTray.anim} source='[data-slot-source="top-tray"] .juice-tray' className="slot-object">
          <JuiceTray values={juiceTray.values} />
        </Placed>}
      </JuiceCheckout>
    </Place>}

    {fruitPrice && <Price key={`fruit-price-${fruitPrice.value}`} value={fruitPrice.value} x={left} y={priceY} fly={fruitPrice.fly} flyDelay={fruitPrice.delay}
      className={fruitPrice.fly ? "" : cls(fruitPrice.anim)} delay={fruitPrice.delay} />}
    {juicePrice && <Price key={`juice-price-${juicePrice.value}`} value={juicePrice.value} breakdown={juicePrice.breakdown} x={right} y={priceY} className={cls(juicePrice.anim)} delay={juicePrice.delay} data-role="juice-price" />}
  </>;
}
