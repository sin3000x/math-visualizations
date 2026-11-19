# JuiceTray

果汁托盘：三杯果汁放在同一个托盘上，是果汁空间 W 的一个元素。三杯从左到右固定为 A、B、C，颜色为青、蓝、紫（`JUICE_COLORS`），读数在托盘下方。第 5、6 集共用。

```tsx
import { JuiceTray, JUICE_COLORS, type Juice } from "@math-visualizations/scene-kit/JuiceTray";

<JuiceTray values={[5, 4, 3]} />
```

- `pouring` + `sources`：来源托盘依次倒进这个托盘，结束后读数变为总和（托盘相加）。
- `scaledFrom`：液面从 `scaledFrom` 连续伸缩到 `values`（数乘）。
- `readings={false}` 只画杯子；外层带 `data-role="juice"` 与 `data-values`，供布局检查读出当前读数。
- 液面每单位 13px，每杯最多 9 个单位。位置、缩放和入场动画由使用方负责。
