import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { PricedCheckout } from "../components/PricedCheckout";
import { FruitBag } from "../components/FruitBag";
import { basis, probes } from "../lib/math/bags";
import "./cover.css";

export default function Cover() {
  return <div className="cover-preview"><div className="cover-frame">
    <main className="video-cover dual-basis-cover" data-role="video-cover" aria-label="对偶基封面：对应取一，其余取零">
      <div className="cover-space cover-bags"><div className="cover-space-label"><MathFormula latex="V" /></div></div>
      <div className="cover-space cover-checkouts"><div className="cover-space-label"><MathFormula latex={"V^*"} /></div></div>
      {basis.map((bag, index) => <div className="cover-bag-row" data-cover-object={`basis-${index}`} key={index} style={{ top: 260 + index * 360, color: probes[index].color }}>
        <MathFormula latex={`e_${index + 1}`} /><div className="cover-bag"><FruitBag {...bag} tone={index === 0 ? "apple" : "banana"} /></div>
      </div>)}
      {probes.map((probe, index) => <div className="cover-probe-row" data-cover-object={`probe-${index}`} key={index} style={{ top: 220 + index * 340, color: probe.color }}>
        <MathFormula latex={`e_${index + 1}^*`} /><div className="cover-machine">
          <PricedCheckout apples={probe.applePrice} bananas={probe.bananaPrice} color={probe.color} scale={.85} />
        </div>
      </div>)}
    </main>
  </div></div>;
}
