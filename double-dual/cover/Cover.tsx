import { FruitBag } from "../components/FruitBag";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import "./cover.css";

export default function Cover() {
  return <div className="cover-preview"><div className="cover-frame">
    <main className="video-cover double-dual-cover" data-role="video-cover" aria-label="双对偶空间封面">
      <div className="cover-space cover-bags" style={{ left:60 }}>
        <div className="cover-space-label"><MathFormula latex="V" /></div>
        <div className="cover-object" data-cover-object="bag"><FruitBag apples={2} bananas={1} /></div>
      </div>
      <div className="cover-space cover-checkouts" style={{ left:680 }}>
        <div className="cover-space-label"><MathFormula latex={"V^*"} /></div>
        <div className="cover-object" data-cover-object="checkout"><CheckoutIcon accent="#62d2c3" /></div>
      </div>
      <div className="cover-space cover-mystery" style={{ left:1300 }}>
        <div className="cover-space-label"><MathFormula latex={"V^{**}"} /></div>
        <div className="cover-object cover-question" data-cover-object="question">?</div>
      </div>
    </main>
  </div></div>;
}
