# 视频封面：修改组件，导出 PNG

封面的最终交付文件是 **1920×1080 PNG**。编辑源是每个子工程的 `cover/Cover.tsx` 和 `cover/cover.css`，直接引用该项目的水果袋、收银台、KaTeX 公式组件。无需手画一份 SVG，也不需要把教学步骤截到刚好合适的时刻。

## 导出

在仓库根目录一次生成四张：

```sh
node scripts/export-cover.mjs
```

只生成一个项目（仓库根目录）：

```sh
npm --prefix basis-coordinates run cover:export
```

在任一支持封面的子工程中：

```sh
npm run cover:export
```

默认覆盖对应项目的 `public/<项目名>-video-cover.png`。已有 SVG 是旧版静态文件，导出脚本不读取或更新它；后续以 React 封面源码和 PNG 为准。

指定其他输出位置时，路径相对于执行命令的当前目录：

```sh
node scripts/export-cover.mjs basis-coordinates --output /tmp/row-vector.png
```

脚本使用各项目现有的 Vite、Playwright 依赖，默认使用本机 Chrome。若已安装 Playwright 的 Chromium，可以传 `--browser chromium`。无需增加根目录的 npm 依赖。中文字体使用系统黑体字体栈；需要跨机器逐像素一致时，应使用相同的系统字体和浏览器版本。

## 预览与修改

在对应子工程运行 `npm run dev`，打开终端显示的网址，并在末尾加上 `?cover=1`。预览会按窗口等比缩放，导出始终是 1920×1080。保存源码后可以直接看到修改。

| 要修改什么 | 修改位置 |
| --- | --- |
| 封面对象、数量、示例值 | 各项目 `cover/Cover.tsx` |
| 封面位置、大小、颜色、屏幕字体 | 各项目 `cover/cover.css` |
| 水果袋、收银台自身的造型 | 原有组件及样式，Scene 与封面一起生效 |
| 行向量示例的苹果、香蕉单价 | `basis-coordinates/lib/math/prices.ts` |
| 单价屏幕的共用结构 | `basis-coordinates/components/UnitPrices.tsx` |
| PNG 导出流程 | `scripts/export-cover.mjs` |

`UnitPrices` 接收两种水果的单价，`null` 显示问号；Scene 用它逐步揭示单价，封面直接展示两项读数。封面的黑体加粗只在 `.row-vector-cover` 下生效。

封面是一张静态画面，不登记进 Scene 注册表，也不增加教学步骤。入口按 `?cover=1` 单独加载封面及其样式，因此正常播放和键盘导航仍属于原来的 ScenePlayer。

## 手机缩略图标准（用户已确认）

封面以 **320×180** 的小图辨识度为准：黑底、无标题和说明、少元素，放大关键符号与对象，使用清晰的粗轮廓和粗箭头，并压缩多余留白。屏幕单价使用加粗黑体。水果袋保留 Scene 的浅棕金色，亮黄色用于空间标记与箭头等强调元素。

当前版本在 1920×1080 设计坐标下采用以下参考值：

| 元素 | 当前参考值 |
| --- | --- |
| 空间标记字号 | 150px |
| 空间圈线宽 | 10px，全色显示 |
| 双对偶问号 | 360px，字重 700 |
| 收银台单价 | 62px，黑体字重 700 |
| 行向量字号 | 168px |
| 双向箭头字号 | 128px，并加粗笔画 |

这些是本次构图的参考值，不是所有主题都必须采用的固定尺寸。调整后必须同时查看原图和 320×180 缩略图，重点看空间标记、对象身份和对应关系是否清楚。封面样式仅作用于 `.video-cover`，不能影响教学画面。

## 导出时检查什么

脚本先建立临时生产构建并启动本地预览，等待页面和字体加载完成，检查 KaTeX、控制台、网络失败、对象边界和页面滚动，再截图并验证 PNG 尺寸。只有检查通过才替换成品，失败会保留上一次的 PNG。临时构建、浏览器和服务在结束后清理。

调整构图后仍应打开 PNG 检查一次：自动检查能发现越界，却不能代替对重叠、对齐、文字醒目程度的目视判断。

## KKT 封面

`kkt-conditions/cover/` 复用教学页的 `Arrow`、数学坐标变换和 KaTeX 组件，用边界上的等长反向箭头表示力平衡。为适配该项目的 vinext 服务端架构，封面采用独立 Vite 入口：`npm run cover:dev -w kkt-conditions`，导出运行 `npm run cover:export -w kkt-conditions`。成品为 `kkt-conditions/public/kkt-conditions-video-cover.png`；旧 SVG/JPG 保留为历史版本。

图中使用目标函数 `f=((x-1.4)^2+(y-1.4)^2)/2`、约束 `g=x+y≤0`，在原点取乘子 `λ=1.4`。两支箭头分别是下降方向与约束反力，其和为零；目标等高线与约束边界在最优点相切。
