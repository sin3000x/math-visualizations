import { FruitIcon } from "./FruitIcon.tsx";
import { MathFormula } from "./MathFormula.tsx";
import "./FruitBag.css";

/** 斤数；字符串用于符号系数，例如 "a"。 */
export type FruitQuantity = number | string;
export type FruitBagProps = Readonly<{
  apples: FruitQuantity;
  bananas: FruitQuantity;
  /** 袋子轮廓颜色：默认 --vector-color，基袋可用苹果或香蕉色。 */
  tone?: "apple" | "banana";
  compact?: boolean;
  /** 显示 0 斤的分量；默认省略，全零时为空袋。 */
  showZero?: boolean;
  format?: (value: number) => string;
}>;

const formatQuantity = (value: number) => Object.is(value, -0) ? "0" : String(value);

/** 共享水果袋：负分量用虚线水果表示，袋子轮廓不随正负改变。 */
export function FruitBag({ apples, bananas, tone, compact = false, showZero = false, format = formatQuantity }: FruitBagProps) {
  const quantities = [apples, bananas] as const;
  const text = (value: FruitQuantity) => typeof value === "number" ? format(value) : value;
  const negative = quantities.some(value => typeof value === "number" && value < 0);
  const empty = quantities.every(value => value === 0);
  const classes = ["fruit-bag", compact && "compact", negative && "return-bag", empty && "empty-bag"].filter(Boolean).join(" ");
  return <div className={classes} data-tone={tone} aria-label={empty ? "空袋子" : `水果袋：${text(apples)} 斤苹果，${text(bananas)} 斤香蕉`}>
    <div className="bag-handle" />
    {!empty && <div className="bag-fruit-list">{quantities.map((value, i) => value === 0 && !showZero ? null : <div key={i} className="fruit-measure">
      <span className={`fruit ${i === 0 ? "apple" : "banana"}${typeof value === "number" && value < 0 ? " negative-fruit" : ""}`}><FruitIcon kind={i === 0 ? "apple" : "banana"} /></span>
      <MathFormula latex={`${text(value)}\\,\\text{斤}`} />
    </div>)}</div>}
  </div>;
}
