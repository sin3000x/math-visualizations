import type { Point } from "@/lib/geometry/plot";

export const primerSteps = [
  {
    eyebrow: "01 · 等高线",
    title: "同一条线上，函数值相同",
    body: "每一条圆环都是一条等高线：沿着它移动，函数值保持不变；跨过圆环，函数值才会改变。",
  },
  {
    eyebrow: "02 · 梯度",
    title: "梯度指向上升最快的方向",
    body: "梯度 ∇f 指向函数增大最快的方向，箭头长度表示坡度大小；离谷底越远，坡越陡。",
  },
  {
    eyebrow: "03 · 二者关系",
    title: "梯度始终垂直于等高线",
    body: "沿等高线的切向移动不会改变函数值，所以梯度与切线正交；负梯度 −∇f 则指向下降最快的方向。",
  },
] as const;

export const kktSteps = [
  {
    eyebrow: "01 · 无约束",
    title: "坡会把粒子推向谷底",
    body: "红色箭头是下降方向 −∇f。只要它还不为零，粒子就有继续下降的空间。",
  },
  {
    eyebrow: "02 · 边界接触",
    title: "下降方向被可行域挡住",
    body: "现在只能留在蓝色区域。最陡的下降方向仍然存在，但它穿过了边界。",
  },
  {
    eyebrow: "03 · 驻点与互补松弛",
    title: "接触才有约束力",
    body: "边界上调节 λ，让约束力抵消下降动力；把 x 拖进可行域内部，λ 会立即归零。",
  },
  {
    eyebrow: "04 · 多重接触",
    title: "直边与曲边分别提供支持力",
    body: "两条边分别提供法向支持力；它们的合力抵消下降动力。离开某条边，对应的 λ 会立即归零。",
  },
  {
    eyebrow: "05 · 法向锥",
    title: "所有外法向组合成一个锥",
    body: "在拐角处，两股外法向量的所有非负组合铺满法向锥。最优时，负梯度正好落在这个锥里。",
  },
] as const;

export type ScenePreset = { point: Point; lambda: number };

export const kktPresets: readonly ScenePreset[] = [
  { point: { x: 1.55, y: 1.2 }, lambda: 0 },
  { point: { x: 1.15, y: 0.75 }, lambda: 0 },
  { point: { x: 1.15, y: 0.75 }, lambda: 0 },
  { point: { x: 0.85, y: 0.45 }, lambda: 0 },
  { point: { x: 0.85, y: 0.45 }, lambda: 0 },
];
