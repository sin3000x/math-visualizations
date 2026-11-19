import type { ReactNode } from "react";
import { CheckoutIcon } from "@math-visualizations/scene-kit/CheckoutIcon";
import { JUICE_COLORS } from "@math-visualizations/scene-kit/JuiceTray";
import { MathFormula } from "@math-visualizations/scene-kit/MathFormula";
import { UnitPrices } from "@math-visualizations/scene-kit/UnitPrices";
import "./Checkouts.css";

type Prices<T> = { [K in keyof T]: number | null };

/**
 * 水果收银台（scene-kit 版）：大屏显示两项单价，右侧托板放一袋水果。
 * 自身坐标 610×400；单价数字带 data-source="price-0/1"，供复制飞入。
 */
export function FruitCheckout({ prices, children }: { prices: Prices<readonly [number, number]>; children?: ReactNode }) {
  return <div className="fruit-checkout" data-role="fruit-checkout" data-prices={prices.map(p => p ?? "?").join(",")}>
    <div className="fruit-checkout-machine">
      <CheckoutIcon accent="#62d2c3" largeScreen />
      <UnitPrices apples={prices[0]} bananas={prices[1]} valueSourcePrefix="price" />
    </div>
    <div className="fruit-checkout-shelf" />
    <div className="checkout-slot fruit-slot">{children}</div>
  </div>;
}

/**
 * 果汁收银台的机身：立杆上的一块平板屏，没有键盘和钱箱，暖色边框；托臂从立杆伸向右侧放托盘。
 * 轮廓和颜色都与水果收银台（灰色键盘式、青色屏）不同，表明它是另一个空间 W* 里的对象。
 * 与水果收银台同一比例：220 单位宽 = 460px。
 */
function JuiceCheckoutIcon() {
  return <svg className="juice-checkout-icon" viewBox="0 0 220 190" role="img" aria-label="果汁收银台">
    <path className="jc-shadow" d="M46 176h88l-8 8H54Z" />
    <path className="jc-pole" d="M80 100h20v56H80Z" />
    <rect className="jc-base" x="38" y="154" width="104" height="22" rx="11" />
    <rect className="jc-shell" x="18" y="2" width="144" height="100" rx="14" />
    <rect className="jc-screen" x="27" y="11" width="126" height="82" rx="7" />
    <circle className="jc-dot" cx="90" cy="165" r="4" />
  </svg>;
}

/** 屏幕上的一个小杯子：颜色区分 A、B、C 果汁。 */
export function MiniCup({ kind }: { kind: 0 | 1 | 2 }) {
  return <span className="mini-cup" style={{ color: JUICE_COLORS[kind] }} />;
}

/**
 * 果汁收银台：给一托盘三杯果汁结账，按三种果汁每份的单价（1 份 = 100 mL）。
 * 与水果收银台区分：立杆平板屏、暖色边框、三行单价；托盘放在右侧托臂上，读数落在托臂下方的空处。null 单价显示问号。
 */
export function JuiceCheckout({ prices, children }: { prices: Prices<readonly [number, number, number]>; children?: ReactNode }) {
  return <div className="juice-checkout" data-role="juice-checkout" data-prices={prices.map(p => p ?? "?").join(",")}>
    <JuiceCheckoutIcon />
    <div className="juice-prices" key={prices.join()}>
      {prices.map((value, i) => <div className="juice-price" key={i}>
        <MiniCup kind={i as 0 | 1 | 2} />
        <MathFormula latex={`${value ?? "?"}\\,\\text{元/份}`} />
      </div>)}
    </div>
    <div className="juice-checkout-shelf" />
    <div className="checkout-slot juice-slot">{children}</div>
  </div>;
}
