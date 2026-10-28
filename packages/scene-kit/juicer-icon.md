# JuicerIcon

共享榨汁机图标，使用完整杯身填色、苹果片和香蕉切片。无需项目 CSS 或额外资源。

```tsx
import { JuicerIcon } from "@math-visualizations/scene-kit/JuicerIcon";

<JuicerIcon width={140} height={160} style={{ color: "#f6f2e7" }} />
```

默认尺寸 140×160，固定 viewBox 保持比例。轮廓继承 currentColor；支持标准 SVG 属性（例如 width、height、className、style 和 aria-label）。水果和果汁保留统一配色。箭头、位置、动画和 Scene 语义由使用方提供。
