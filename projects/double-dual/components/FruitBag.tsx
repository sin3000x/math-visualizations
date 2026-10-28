import { FruitBag as SharedFruitBag, type FruitBagProps } from "@math-visualizations/scene-kit/FruitBag";

// 本集读数统一保留一位小数，并显示 0 斤的分量。
export function FruitBag(props: FruitBagProps) {
  return <SharedFruitBag showZero format={value => value.toFixed(1)} {...props} />;
}
