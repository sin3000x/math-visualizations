import { FruitIcon } from "../components/FruitIcon";
import { MathFormula } from "../components/MathFormula";

export function FruitBag({ apples, bananas, compact = false }: { apples: number; bananas: number; compact?: boolean }) {
  const hasReturn = apples < 0 || bananas < 0;
  const isZero = apples === 0 && bananas === 0;
  const description = isZero ? "空袋子" : hasReturn ? "退货记录" : "购买记录";
  return <div className={`${compact ? "fruit-bag compact" : "fruit-bag"}${hasReturn ? " return-bag" : ""}${isZero ? " empty-bag" : ""}`} aria-label={isZero ? description : `${description}：${apples.toFixed(1)} 斤苹果和 ${bananas.toFixed(1)} 斤香蕉`}>
    <div className="bag-handle" />
    {isZero ? null : <div className="bag-fruit-list">
      <div className="fruit-measure"><span className="fruit apple"><FruitIcon kind="apple" /></span><MathFormula latex={`${apples.toFixed(1)}\\,\\text{斤}`} /></div>
      <div className="fruit-measure"><span className="fruit banana"><FruitIcon kind="banana" /></span><MathFormula latex={`${bananas.toFixed(1)}\\,\\text{斤}`} /></div>
    </div>}
  </div>;
}
