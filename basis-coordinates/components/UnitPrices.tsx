import { FruitIcon } from "./FruitIcon";
import { MathFormula } from "./MathFormula";
import "./UnitPrices.css";

// Scene 和封面共用显示结构；未知单价通过 null 表示。
export function UnitPrices({ apples, bananas, bold = false }: {
  apples: number | null; bananas: number | null; bold?: boolean;
}) {
  return <div className="probe-prices" data-role="internal-prices">
    {(["apple", "banana"] as const).map((kind, index) => {
      const value = [apples, bananas][index] ?? "?";
      const latex = bold
        ? `\\textbf{${value} 元/斤}`
        : `${value}\\,\\text{元/斤}`;
      return <div className="probe-price" key={kind} data-role={`unit-price-${kind}`}>
        <span className={`fruit ${kind}`}><FruitIcon kind={kind} /></span>
        <MathFormula latex={latex} />
      </div>;
    })}
  </div>;
}
