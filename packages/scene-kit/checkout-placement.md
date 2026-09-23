# 放袋到收银台

`CheckoutPlacement` 统一负责水果袋从源位置移动、等比缩放到托盘，并在结束后停住。动作默认 1.1 秒；录屏器可以直接读取它的 Web Animation，等待完成后再停留。

```tsx
import { CheckoutPlacement } from '@math-visualizations/scene-kit/CheckoutPlacement';

<CheckoutPlacement className="tray-bag" source='[data-basis="1"] .fruit-bag'>
  <FruitBag apples={1} bananas={0} />
</CheckoutPlacement>
```

- Scene 用 CSS 布局最终袋子和托盘，袋底与托盘顶边重合。组件容器应具有袋子缩放后的宽高；内容在容器内缩放，原点为左上角。
- `source` 在最近的 `section` 内查找源对象，使用实际 DOM 边界自动转换播放器与局部缩放。不要隐藏源对象的布局。
- 无现成源对象时使用 `from` 指定相对终点的起始变换；默认从右上方落袋。`to` 默认为 `none`。
- `active={false}` 停在起点；变为 true 开始放袋。更换袋子时用 `key` 表达一次新结算，避免内容变了但动画不重播。
- 排队结算可设置 `delay`（毫秒）及 `exit`（结算后淡出）。结果的显示时机由 Scene 决定，不自动推进教学步骤。
- 不要给这个容器叠加 transform transition 或自定义飞行 keyframes；主题可保留独立的谜底揭示、报价、坐标飞行等动画。

已统一接入：对偶空间的线性结算、双对偶开场与超市队列、基坐标的基袋/一般袋/换基结算，以及对偶基四次配对。

回归检查：在根目录运行 `node scripts/check-checkout-placement.mjs`，检查四个项目的真实动画起点、托盘接触、快速回退及 KaTeX/控制台，并在各项目的 `exports/qa-placement` 保存截图。
