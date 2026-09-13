import { CheckoutIcon } from "../components/CheckoutIcon";
import { UnitPrices } from "../components/UnitPrices";
import { MathFormula } from "../components/MathFormula";
import { basisPrices } from "../lib/math/prices";
import "../components/FruitBag.css";
import "./cover.css";

export default function Cover() {
  return <div className="cover-preview"><div className="cover-frame">
    <main className="video-cover row-vector-cover" data-role="video-cover" aria-label="行向量封面">
      <div className="cover-machine" data-cover-object="checkout">
        <CheckoutIcon accent="#62d2c3" largeScreen />
        <UnitPrices {...basisPrices} bold />
      </div>
      <div className="cover-correspondence" data-cover-object="arrow"><MathFormula latex={"\\longleftrightarrow"} /></div>
      <div className="cover-row" data-cover-object="row"><MathFormula latex={`\\begin{pmatrix}${basisPrices.apples}&${basisPrices.bananas}\\end{pmatrix}`} /></div>
    </main>
  </div></div>;
}
