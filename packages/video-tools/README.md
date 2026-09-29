# 共享录屏工具

各项目的 `scripts/video/render.mjs` 只传入项目根目录与时间线配置，公共引擎负责临时构建、预览服务、Chrome、逐帧截图、FFmpeg 编码、检查报告和清理。

两种时间线：

- 默认从 ScenePlayer 的 `data-video-scenes` 读取顺序与步骤数；有限动画全部结束后开始停留，无限循环不阻止推进。项目 `timing` 可以设置普通步骤、场景尾和逐步覆盖时间。
- 第一集传入 `scriptedTimeline`，保留 `start`、`next`、`click`、`hold`、内部 `phase` 和固定时长。点击时保留光标移动、选中检查与释放焦点。固定时间线不会自动延长动画时长。

`--hold-seconds`、`--scene-end-seconds` 适用于默认时间线；固定时间线的时长直接在项目配置中修改。`--limit-seconds` 只允许 debug 预设，正式导出不得截断。

所有输出和临时资源按项目隔离；项目根目录通过参数传入，不依赖 shell 当前目录。默认输出 `exports/<项目名>-<预设>.mp4`，编码完成后才用 `.partial.mp4` 替换成品，并写入同名 JSON 报告。

```sh
# 仓库根目录
npm run test -w @math-visualizations/video-tools
npm run video:check -w basis-coordinates
npm run video:production -w double-dual
```

修改录屏引擎后检查全部使用方（含模板）的 `video:check`，并至少完成一次无截断的 debug MP4 编码。`video:check` 只检查截图和状态，不能代替实际编码验证。

## 共享布局验收

使用共享播放器的主题通过 `@math-visualizations/video-tools/layout` 的 `checkLayout({ root, beforeStep, checkStep })` 运行布局验收。它启动项目的已构建预览，在桌面、390px 窄屏和 1920×1080 录屏视口遍历所有 Scene 与步骤，检查比例、滚动、对象出界、KaTeX、控制台、画布外导航、数字键和跨场景前后导航；截图保存在 `exports/qa-layout/`，失败时额外保存 `*-failed.png`。

主题中的 `beforeStep` 在动画结束前检查连续性，`checkStep` 在有限动画结束后检查数学值、托盘接触等专属关系。两者接收 `{ page, state: { scene, step }, name, recording, output }`，其中 `step` 从 0 开始。公共工具不持有主题公式或布局选择器。

给需要保留字幕空间的实际教学对象添加 `data-layout-content`。工具统一检查这些对象在画布内且不进入底部 16%；公式和水果袋另有默认画布边界检查。标记应放在图形、公式行或实际内容组上，不要标记铺满画布的定位容器。对偶基已迁移全部 Scene；历史主题尚未添加标记的对象只检查画布边界，不宣称完成字幕验收。新 Scene 应在 JSX 中随内容添加标记。

在仓库根目录执行 `npm run check:visual` 可串行运行所有已登记的布局与录屏检查；`npm run check:all` 包含 lint、构建和数学测试。布局检查不编码视频，录屏引擎未修改时无需额外生成 MP4。
