import { FruitBag } from "../scenes/FruitBag";
import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import "./cover.css";

// 位置采用 1920×1080 设计坐标；组件自身的大小与配色来自教学页面。
const positions = [{ x: 220, y: 285 }, { x: 580, y: 285 }, { x: 400, y: 610 }];
const accents = ["#62d2c3", "#77aee9", "#ba91ef"];
export default function Cover() {
  return <div className="cover-preview"><div className="cover-frame">
    <main className="video-cover dual-space-cover" data-role="video-cover" aria-label="对偶空间封面">
      <div className="cover-space cover-bags" style={{ left: 70 }}>
        <div className="cover-space-label"><MathFormula latex="V" /></div>
        {positions.map(({ x, y }, index) => <div className="cover-object cover-bag" data-cover-object="bag" key={index} style={{ left: x - 160, top: y - 142.5 }}>
          <FruitBag apples={2} bananas={1} />
        </div>)}
      </div>
      <div className="cover-space cover-checkouts" style={{ left: 1030 }}>
        <div className="cover-space-label"><MathFormula latex={"V^*"} /></div>
        {positions.map(({ x, y }, index) => <div className="cover-object cover-checkout" data-cover-object="checkout" key={index} style={{ left: x - 162.5, top: y - 142.5 }}>
          <CheckoutIcon accent={accents[index]} />
        </div>)}
      </div>
    </main>
  </div></div>;
}
