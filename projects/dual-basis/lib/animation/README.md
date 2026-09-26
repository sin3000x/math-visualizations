# 轮廓 Transform

`animateContourTransform({ layer, source, target, outlines, duration })` 用于将一个渲染对象的副本连续变成另一个对象。返回清理函数；组件退出或快速回退时必须调用。

- 闭合轮廓按弧长重采样，对齐绕向和起点，保证两端的路径命令与点数一致。
- 通过 Web Animations 插值 SVG 的 `d` 和填充色；默认 1000 毫秒，缓入缓出。录屏器可以暂停、跳帧并读取真实时长。
- 多余部件逐渐缩为点，新增部件从点长出；不使用可见性关键帧或透明度切换。
- 保留上方源对象。完成后，用原生 React/KaTeX 目标替换已经到达终点的轮廓；退出时移除所有动画图层。
- 目前坐标适配本项目固定的 1440×810 设计画布。资产按 DOM 对象本地坐标存储，运行时从真实 DOM 边界定位，因此桌面、窄屏、1920×1080 共用同一轮廓。

## 生成轮廓

`coordinate-shapes.json` 是轮廓数据，不是手工绘制的字形：由真实水果袋及 KaTeX 渲染截图提取，保留外轮廓、孔洞和颜色。截图只保存在忽略的 `exports/morph-source/`，运行时不需要 Python、截图或网络请求。

改变水果袋样式、字体、公式或颜色后，重新生成：

```sh
# Python 环境需安装 numpy、opencv-python-headless；MORPH_PYTHON 可指定独立虚拟环境。
MORPH_PYTHON=/path/to/venv/bin/python npm run morph:export -w dual-basis
```

生成器先启动构建预览，用 Chrome 在 2 倍像素密度下截取七组源与目标对象，再提取闭合轮廓。生成后再运行 `npm run check:layout -w dual-basis`。

验收脚本检查第一步七组对象、第二步仅两个系数的轮廓持续变化，其他符号不重播；无透明度/可见性关键帧，并保存 25%、50%、75%、接近结束的截图。纯数学测试检查闭合取样、绕向/起点匹配和资产点数、有限性。

方法暂放主题内；等第二个主题实际需要后，再提升到公共包。

思路参考 [Manim Transform](https://github.com/ManimCommunity/manim/blob/main/manim/animation/transform.py) 的轮廓对齐后逐点插值；这里使用浏览器原生 SVG/WAAPI，未引入 Manim 运行时。

## 线性无关的整项变形

`independence-shapes.json` 由 `scripts/export-independence-shapes.mjs` 从实际画面提取。每次代入各有三组完整结算项和两个运算符，共十组；源包含系数、收银台、托盘水果袋与标签。使用同一个 `animateContourTransform` 连续变形成下方结果，并保留上方等式。

重新生成：先构建，再执行 `MORPH_PYTHON=/path/to/venv/bin/python node projects/dual-basis/scripts/export-independence-shapes.mjs`。截图和 manifest 保存在忽略的 `exports/independence-morph-source/`。

## 张成场景的系数变形

`spanning-shapes.json` 保存 3、2 到完整 f₁(v)、f₂(v) 结算图标的两组轮廓，包含收银台、托盘水果袋和标签。使用 1 秒路径及颜色补间，不再复制左式水果袋或播放飞袋动画。换序与提取共同输入分为后续两个独立步骤。

先构建，再执行 `MORPH_PYTHON=/path/to/venv/bin/python node projects/dual-basis/scripts/export-spanning-shapes.mjs` 重新从实际渲染生成资产。`check-spanning.mjs` 验证两个完整轮廓在 25%、50%、75%、99.9% 处的持续变化和步骤分离。
