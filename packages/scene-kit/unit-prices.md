# 收银台屏幕单价

沿用 basis-coordinates 的大屏收银台与 UnitPrices，所有单价在屏幕内显示。组件从 scene-kit 导入：

```tsx
import { CheckoutIcon } from '@math-visualizations/scene-kit/CheckoutIcon';
import { UnitPrices } from '@math-visualizations/scene-kit/UnitPrices';

<div className="machine">
  <CheckoutIcon accent="#62d2c3" largeScreen />
  <UnitPrices apples={1} bananas={0} />
</div>
```

`.machine` 使用 `position: relative; width: 460px`，图标宽度为 100%。这与既有 Scene 的设计坐标一致；如需调整大小，将整个组合等比缩放，不分别改动屏幕和单价位置。托盘与袋子也可以放入同一容器。

- `null` 表示尚未揭示的单价，显示问号；`0` 是有效单价。
- `bold` 保留既有封面的加粗显示。
- `valueSourcePrefix="price"` 将数字单独标记为 `data-source="price-0"` 和 `price-1`，供换基动画复制；单位不随数字飞行。
- 保留 `.probe-prices`、`.probe-price` 类名，已有封面样式继续生效。
- 水果图形使用同一个公共 FruitIcon；各主题继续沿用水果的颜色样式。

验收时检查两个单价行都完整位于 `.checkout-screen` 的真实屏幕边界内。不要在收银台旁另画一份单价表，结算结果与单位价格分别展示。
