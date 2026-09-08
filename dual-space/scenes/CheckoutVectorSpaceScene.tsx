import { CheckoutIcon } from "../components/CheckoutIcon";
import { MathFormula } from "../components/MathFormula";
import "./CheckoutVectorSpaceScene.css";

const counters = {
  cyan: { accent: "#62d2c3", label: "青色收银台" },
  yellow: { accent: "#f4c95d", label: "黄色收银台" },
  blue: { accent: "#74a9ef", label: "蓝色收银台" },
  zero: { accent: "#999999", label: "零收银台：每袋报价为零" },
  inverse: { accent: "#62d2c3", label: "相反收银台：青色收银台的每袋报价取反" },
} as const;

type CounterKind = keyof typeof counters;
const properties = [
  { title: "加法交换律", tokens: ["cyan", "+", "yellow", "=", "yellow", "+", "cyan"] },
  { title: "加法结合律", tokens: ["(", "cyan", "+", "yellow", ")", "+", "blue", "=", "cyan", "+", "(", "yellow", "+", "blue", ")"] },
  { title: "零收银台", tokens: ["cyan", "+", "zero", "=", "cyan"] },
  { title: "相反收银台", tokens: ["cyan", "+", "inverse", "=", "zero"] },
  { title: "数乘结合律", tokens: ["2", "\\times", "(", "3", "\\times", "cyan", ")", "=", "6", "\\times", "cyan"] },
  { title: "数乘单位律", tokens: ["1", "\\times", "cyan", "=", "cyan"] },
  { title: "数乘对加法分配", tokens: ["2", "\\times", "(", "cyan", "+", "yellow", ")", "=", "2", "\\times", "cyan", "+", "2", "\\times", "yellow"] },
  { title: "标量和对数乘分配", tokens: ["(", "2", "+", "3", ")", "\\times", "cyan", "=", "2", "\\times", "cyan", "+", "3", "\\times", "cyan"] },
] as const;

function Counter({ kind }: { kind: CounterKind }) {
  const counter = counters[kind];
  return <span className={`overview-counter overview-counter-${kind}`} role="img" aria-label={counter.label}>
    <CheckoutIcon accent={counter.accent} />
  </span>;
}

export function CheckoutVectorSpaceScene() {
  return <section className="axiom-canvas checkout-vector-space" aria-label="收银台线性空间的八条性质总览">
    <div className="checkout-space-properties">
      {properties.map((property, index) => <article className="checkout-space-property" key={property.title}>
        <h3><span>{index + 1}</span>{property.title}</h3>
        <div className="checkout-space-diagram">
          {property.tokens.map((token, i) => token in counters
            ? <Counter key={i} kind={token as CounterKind} />
            : <span key={i} className={`overview-symbol ${token === "=" ? "equality" : ""}`}><MathFormula latex={token} /></span>)}
        </div>
      </article>)}
    </div>
  </section>;
}
