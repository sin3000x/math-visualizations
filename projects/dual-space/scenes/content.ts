export const introSteps = [
  "single-bag",
  "single-checkout",
  "quote",
  "bag-collection",
  "checkout-collection",
  "linear-space-name",
  "dual-space-name",
] as const;

export type IntroStepId = (typeof introSteps)[number];

export function getIntroFlags(step: number) {
  const reached = (id: IntroStepId) => step >= introSteps.indexOf(id);
  return {
    showCheckout: reached("single-checkout"),
    showQuote: reached("quote"),
    showBagsWorld: reached("bag-collection"),
    showCheckoutsWorld: reached("checkout-collection"),
    showLinearSpaceName: reached("linear-space-name"),
    showDualSpaceName: reached("dual-space-name"),
  };
}

export const vectorSpaceSteps = [
  { id: "addition-commutative", title: "加法交换律" },
  { id: "addition-associative", title: "加法结合律" },
  { id: "zero", title: "零元存在" },
  { id: "inverse", title: "负元存在" },
  { id: "scalar-associative", title: "标量乘法结合律" },
  { id: "scalar-identity", title: "标量单位元" },
  { id: "scalar-distributes-over-vectors", title: "标量分配袋子和" },
  { id: "vector-distributes-over-scalars", title: "袋子分配标量和" },
] as const;

export const bagVectorSpaceStepCount = vectorSpaceSteps.length + 2;
