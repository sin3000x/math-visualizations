# KKT Conditions · 几何实验室

用二维几何和物理直觉解释 Karush–Kuhn–Tucker 条件的交互网页。

## What you can explore

- 无约束下降：观察粒子沿 `−∇f` 移动
- 边界接触：理解下降方向如何被可行域阻挡
- 驻点条件：调节 `λ`，让目标驱动力与约束反力平衡
- 互补松弛：验证“没有接触，就没有约束力”
- 法向锥：观察多个活跃约束在拐角处共同作用

页面会实时检查原始可行、对偶可行、互补松弛和驻点条件。所有二维数学坐标均使用相同像素尺度，屏幕上的平行、垂直与夹角保持真实。

## Run locally

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

打开终端中显示的本地地址。

## Validate

```bash
npm run build
```

主要页面代码位于 `app/page.tsx`，样式位于 `app/globals.css`。
