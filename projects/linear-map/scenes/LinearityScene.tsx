import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { Juice } from "../components/Juice";
import { Formula, MapArrow } from "../components/Notation";
import { juiceOf } from "../lib/math/map";
import "./LinearityScene.css";
export function LinearityScene({ step }: { step: number }) {
  const merged = step === 1;
  const scaled = step >= 2;
  return <section className={`lesson linearity ${merged ? "merged" : ""}`} data-step={step} aria-label="映射保持加法和数乘">
    {!scaled ? <>
      <div className="sum-source first" data-layout-content><FruitBag apples={1} bananas={0} tone="apple" /></div>
      <div className="sum-source second" data-layout-content><FruitBag apples={0} bananas={1} tone="banana" /></div>
      {merged && <div className="merged-bag" data-layout-content><FruitBag apples={1} bananas={1} /></div>}
      {!merged && <Formula className="input-plus" latex="+" />}
      <MapArrow className="vertical-map" vertical />
      <div className="sum-juice first" data-layout-content><Juice values={merged ? juiceOf([1, 1]) : juiceOf([1, 0])} /></div>
      {!merged && <Formula className="output-plus" latex="+" />}<div className="sum-juice second" data-layout-content><Juice values={juiceOf([0, 1])} /></div>
    </> : <>
      <div className="scale-input" data-layout-content><FruitBag apples={step === 3 ? 2 : 1} bananas={0} tone="apple" /></div>
      <MapArrow className="horizontal-map" />
      <div className="scale-output" data-layout-content><Juice values={juiceOf([step === 3 ? 2 : 1, 0])} /></div>
      {step === 3 && <><Formula className="times-input" latex={"\\times 2"} /><Formula className="times-output" latex={"\\times 2"} /></>}
    </>}
    {/* 等式作为结论，在合并或加倍完成后才出现。 */}
    {(step === 1 || step === 3) && <Formula className="foot-equation" latex={scaled ? "T(2v)=2T(v)" : "T(v+w)=T(v)+T(w)"} />}
  </section>;
}
