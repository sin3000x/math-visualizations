# KKT Conditions · 几何实验室

用几何和物理直觉逐步解释 Karush–Kuhn–Tucker 条件。整个概念由六个 1920×1080 Scene 组成：

1. `gradient-contour-primer`：等高线、梯度和负梯度。
2. `kkt-force-balance`：不等式边界的支持力、互补松弛和法向锥。
3. `kkt-conditions-assembly`：逐条组装 KKT 条件，最后加入等式约束。
4. `kkt-worked-example`：手算一个同时含不等式与等式约束的完整例题。
5. `kkt-constraint-qualifications`：用退化法向、共同内移方向和严格内点直观解释 LICQ、MFCQ 与 Slater。
6. `kkt-summary`：用几何意义、必要性与充分性收束整套 KKT 逻辑。

方向键可跨步骤、跨 Scene 导航；数字键跳转当前 Scene 内步骤；全屏录制模式保证一幕完整进入 1920×1080。

## Architecture

```text
app/page.tsx                         # 极薄页面入口
scenes/KktVisualizationExperience   # Scene 状态与跨 Scene 编排
scenes/KktConditionsScene           # Scene 3，独立维护
scenes/KktWorkedExampleScene        # Scene 4，完整手算例题
scenes/KktConstraintQualificationsScene # Scene 5，约束资格条件
scenes/KktSummaryScene              # Scene 6，三句话总结
scenes/content.ts                    # Scene 1/2 的步骤文案和预设
lib/scenes/registry.ts               # 稳定 Scene ID、顺序和元数据
lib/math/kkt.ts                      # 无副作用 KKT/边界计算
lib/geometry/plot.ts                 # 统一二维比例尺和坐标转换
lib/geometry/projection3d.ts         # 三维 SVG 投影与路径
components/math/*                    # KaTeX 渲染
components/plot/Arrow.tsx            # 公共向量箭头
app/globals.css                      # 全局视觉及各 Scene 样式区
```

状态边界：

- `KktVisualizationExperience` 只持有 Scene 导航、录屏状态和各幕的当前步骤。
- 第三幕的接触案例选择由 `KktConditionsScene` 自己持有。
- 第四幕的题目、推导和 SVG 几何集中在 `KktWorkedExampleScene`。
- 第五幕的 CQ 文案、公式和示意图集中在 `KktConstraintQualificationsScene`。
- 数学派生量由纯函数或源状态实时计算，不维护重复副本。
- 所有公式通过 `MathFormula` / `SvgFormula` 渲染。

具体的“某类反馈读哪些文件”见 [AGENTS.md](./AGENTS.md)。

## Run locally

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

打开终端中显示的本地地址。

## Validate

```bash
npm run lint
npm run build
git diff --check
```

涉及力平衡或几何关系时，还必须进行向量和、点积或比例尺的数值验证。
