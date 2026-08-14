# KKT Conditions 子项目维护指南

本文件补充仓库根目录的 `AGENTS.md`。目标是让小范围视觉反馈可以直接定位，不必重新阅读整个项目。

## 先判断改动属于哪一幕

| Scene | 内部 ID | 主要代码 | 主要样式 |
|---|---|---|---|
| 等高线与梯度 | `gradient-contour-primer` | `scenes/KktVisualizationExperience.tsx` 中 `PRIMER SCENE` 区域 | `app/globals.css` 中 `.primer-*`、`.surface-*` |
| KKT 力平衡 | `kkt-force-balance` | `scenes/KktVisualizationExperience.tsx` 中 `FORCE BALANCE SCENE` 区域 | `app/globals.css` 中基础画布、`.lambda-*`、`.normal-cone-*` |
| KKT 条件组装 | `kkt-conditions-assembly` | `scenes/KktConditionsScene.tsx` | `app/globals.css` 中 `KKT conditions assembly Scene` 区域 |
| KKT 手算例题 | `kkt-worked-example` | `scenes/KktWorkedExampleScene.tsx` | `app/globals.css` 中 `Complete hand-calculation Scene` 区域 |
| 约束资格条件 | `kkt-constraint-qualifications` | `scenes/KktConstraintQualificationsScene.tsx` | `app/globals.css` 中 `Constraint qualifications Scene` 区域 |

Scene 的稳定 ID、标题和顺序只在 `lib/scenes/registry.ts` 修改。

## 按反馈类型定位

- “第三幕 01–05 的标题、正文、公式”：只读 `scenes/KktConditionsScene.tsx` 顶部的 `conditionSteps` 和 `inequalityConditions`。
- “第三幕图里的点、墙、杆、箭头”：只读 `scenes/KktConditionsScene.tsx` 的 `force-analogy` SVG 或 `ContactCase`。
- “第三幕全屏左右比例、字号、间距”：优先只改 `app/globals.css` 的 `.conditions-scene` 变量；不要先读 JSX。
- “03 三种接触状态”：只读 `contactCases`、`ContactCase` 与 `.contact-*` 样式。
- “第四幕题目、推导步骤、答案”：只读 `KktWorkedExampleScene.tsx` 的 `workedExampleSteps` 和 `WorkedCalculation`。
- “第四幕边界、等高线、最优点、三股力”：只读 `KktWorkedExampleScene.tsx` 的 `WorkedExamplePlot`。
- “第四幕全屏比例、字号、间距”：只改 `.worked-example-*` 与 `.recording-mode .worked-*` 样式。
- “第五幕 LICQ、MFCQ、Slater 文案或公式”：只读 `KktConstraintQualificationsScene.tsx` 的 `cqSteps` 和 `CqExplanation`。
- “第五幕法向、共同内移方向、严格内点图示”：只读 `KktConstraintQualificationsScene.tsx` 的 `CqDiagram` 及其子图。
- “第五幕全屏比例、字号、间距”：只改 `.cq-*` 与 `.recording-mode .cq-*` 样式。
- “跨 Scene 键盘导航”：只读 `KktVisualizationExperience.tsx` 顶部的导航状态和 `handleKeyDown`。
- “KaTeX 公共渲染”：读 `components/math/MathFormula.tsx` 和 `SvgFormula.tsx`。
- “二维坐标比例或指针反变换”：读 `lib/geometry/plot.ts`。
- “3D 视角或等高截线”：读 `lib/geometry/projection3d.ts`。
- “KKT 乘子或边界计算”：读 `lib/math/kkt.ts`。

## 第三幕高频设计变量

第三幕常改尺寸集中在 `.conditions-scene`：

```css
--conditions-board-columns;
--conditions-recording-columns;
--condition-card-gap;
--condition-title-size;
--condition-formula-size;
--condition-term-size;
```

普通布局使用第一组值，`.recording-mode.conditions-scene` 只覆盖录屏值。调整这些变量时，不要同时改 JSX。

## 小改动工作流

1. 用上面的路由表只打开目标文件和相关 CSS 区段。
2. 视觉尺寸优先改变量；文案优先改数据数组；只有图形语义变化才改 SVG。
3. 同一批反馈完成后统一运行：

```bash
npm run lint
npm run build
git diff --check
```

4. 涉及力平衡时额外用数值检查向量和；涉及法线时检查点积为零。

## 不要做的事

- 不要为改第三幕字号而通读 `KktVisualizationExperience.tsx`。
- 不要在 JSX 中新增临时内联字号或宽度；写入集中变量或对应 Scene 样式区。
- 不要复制 KaTeX、箭头或坐标转换组件。
- 不要把录屏模式的特例影响到普通响应式页面。
