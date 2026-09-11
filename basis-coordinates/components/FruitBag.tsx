import { FruitIcon } from "./FruitIcon";
import { MathFormula } from "./MathFormula";
import { formatQuantity } from "../lib/math/bags";
import "./FruitBag.css";
type Quantity = number | "a" | "b";
export function FruitBag({ apples, bananas }: { apples: Quantity; bananas: Quantity }) {
  return <div className="fruit-bag" aria-label={`水果袋：${apples} 斤苹果，${bananas} 斤香蕉`}>
    <div className="bag-handle" />
    <div className="bag-fruit-list">{([apples, bananas] as const).map((value, i) => value === 0 ? null : <div key={i} className="fruit-measure">
      <span className={`fruit ${i === 0 ? "apple" : "banana"}${typeof value === "number" && value < 0 ? " negative-fruit" : ""}`}><FruitIcon kind={i === 0 ? "apple" : "banana"} /></span>
      <MathFormula latex={`${typeof value === "number" ? formatQuantity(value) : value}\\,\\text{斤}`} />
    </div>)}</div>
  </div>;
}
