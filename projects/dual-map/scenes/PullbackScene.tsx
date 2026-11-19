import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { vars } from "../lib/style";
import { FRAME } from "./layout";
import { NoWayBack } from "./NoPushforwardScene";
import { PULLBACK_STEPS } from "./steps";
import "./PullbackScene.css";

const px = (n: number) => `${n}px`;

/**
 * 框：draw 时先框住“榨汁机 → 托盘 → 果汁收银台 → 结果”这一整套，再移到水果收银台上；
 * still 时直接停在水果收银台上。本幕最后一步与下一幕第 1 步共用。
 */
export function CompositeFrame({ className = "" }: { className?: string }) {
  const { composite: a, fruit: b } = FRAME;
  return <div className={`composite-frame ${className}`} aria-hidden="true" style={vars({
    "--x0": px(a.x), "--y0": px(a.y), "--w0": px(a.width), "--h0": px(a.height),
    "--x1": px(b.x), "--y1": px(b.y), "--w1": px(b.width), "--h1": px(b.height),
  })} />;
}

/**
 * 反过来，给定果汁收银台就能给水果定价：先把这袋水果榨成汁，再给果汁结账。
 * 第 7 步：把榨汁机到结果这一整套框起来，框移到水果收银台上——这一整套就是一台合格的水果收银台。
 */
export function PullbackScene({ step }: SceneProps) {
  return <section className="lesson" data-step={step} aria-label="把一袋水果榨成汁，再给果汁结账，就得到这袋水果的价格">
    <Board {...PULLBACK_STEPS[step]} />
    {step <= 1 && <div className={step === 1 ? "fade-out" : ""}><NoWayBack back="still" cross="" /></div>}
    {step >= 6 && <CompositeFrame className="draw" />}
  </section>;
}
