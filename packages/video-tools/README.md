# 共享录屏工具

各项目的 `scripts/video/render.mjs` 只传入项目根目录与时间线配置，公共引擎负责临时构建、预览服务、Chrome、逐帧截图、FFmpeg 编码、检查报告和清理。

两种时间线：

- 默认从 ScenePlayer 的 `data-video-scenes` 读取顺序与步骤数；有限动画全部结束后开始停留，无限循环不阻止推进。项目 `timing` 可以设置普通步骤、场景尾和逐步覆盖时间。
- 第一集传入 `scriptedTimeline`，保留 `start`、`next`、`click`、`hold`、内部 `phase` 和固定时长。点击时保留光标移动、选中检查与释放焦点。固定时间线不会自动延长动画时长。

`--hold-seconds`、`--scene-end-seconds` 适用于默认时间线；固定时间线的时长直接在项目配置中修改。`--limit-seconds` 只允许 debug 预设，正式导出不得截断。

所有输出和临时资源按项目隔离；项目根目录通过参数传入，不依赖 shell 当前目录。默认输出 `exports/videos/<项目名>-<预设>.mp4`，编码完成后才用 `.partial.mp4` 替换成品，并在旁边写入同名 `.fcpxml`；渲染报告写入 `exports/qa/<名称>.json`，检查截图写入 `exports/qa/video-<预设>[-场景]/`。

### 剪辑交付（Final Cut Pro）

- **FCPXML 标记**：每次导出同时生成 `exports/videos/<名称>.fcpxml`（FCPXML 1.10）。在 Final Cut Pro 中「文件 → 导入 → XML」，得到一个放好整段视频的项目：每一步打两个点：步骤开始（`<Scene ID> · <步骤>`，即上一步停顿结束；每个 Scene 第一步用章节标记，名为 Scene ID）和动画结束（`<Scene ID> · <步骤> 动画结束`，即停顿开始）。没有动画的步骤两点重合，只保留开始标记。标记按整帧对齐。视频移动位置后需在 Final Cut Pro 中重新链接。
- **分辨率**：`npm run video:production -w <项目>` 是正式交付，默认以 2 倍像素（同 Retina）渲染 3840×2160 60fps；1080p 成品在平台二次压缩后小字发虚。`npm run video:1080p -w <项目>` 导出 1920×1080，只用于快速预览；`video:check` 也按 1080p 抽帧。4K 截图像素是 1080p 的 4 倍，渲染更慢。
- **字幕**：`npm run subtitles -- --project <项目> --audio <录音> --script <文案>`（仓库根目录）用 faster-whisper 识别旁白的逐字时间，把文案对齐上去，写出 `exports/videos/<录音名>.srt`；断行规则与术语表在 `subtitles/`。完整流程见 `.claude/skills/subtitles/SKILL.md`。
- **ProRes**：`--codec prores` 输出 ProRes 422（10 bit）`.mov`，体积是 h264 的数百倍（2 分钟 4K 约数 GB 到十几 GB），一般不需要；Final Cut Pro 剪辑卡顿时，优先在其中「转码媒体 → 创建优化的媒体」。

### 加速

- **静止帧复用**：时钟报告没有未结束或无限循环的动画、也没有待执行的 rAF 回调时，画面视为静止，只截一次图，后续帧复用。点击段（光标移动）始终逐帧截图。`--check` 会抽样实拍复用帧并与缓存比对，PSNR 低于 60 dB 即失败（Chrome 动画结束后重新栅格化图层，边缘像素会有 1 级以内的抖动）。
- **按 Scene 并行**：导出整片时默认用 `min(4, CPU 线程数 / 2)` 个浏览器分别渲染各 Scene，再用 FFmpeg 无损拼接（写入每段精确时长，时间戳保持在帧网格上）。`--jobs 1` 恢复顺序播放；`--check`、单 Scene 导出和 `--limit-seconds` 始终顺序执行，以便验证跨 Scene 的键盘导航。
- **截图**：直接调用 CDP `Page.captureScreenshot`（`optimizeForSpeed`，显式裁剪到 1920×1080 并按预设缩放）。

```sh
# 仓库根目录
npm run test -w @math-visualizations/video-tools
npm run video:check -w basis-coordinates
npm run video:production -w double-dual
npm run video:production -w linear-map -- --codec prores
npm run video:production -w linear-map -- --jobs 1
```

修改录屏引擎后检查全部使用方（含模板）的 `video:check`，并至少完成一次无截断的 debug MP4 编码。`video:check` 只检查截图和状态，不能代替实际编码验证。

## 共享布局验收

使用共享播放器的主题通过 `@math-visualizations/video-tools/layout` 的 `checkLayout({ root, beforeStep, checkStep })` 运行布局验收。它先把项目构建到临时目录（不读取、不覆盖 `dist/`）并启动预览，在桌面、390px 窄屏和 1920×1080 录屏视口遍历所有 Scene 与步骤，检查比例、滚动、对象出界、KaTeX、控制台、画布外导航、数字键和跨场景前后导航；截图保存在 `exports/qa/layout/`，失败时额外保存 `*-failed.png`。

主题中的 `beforeStep` 在动画结束前检查连续性，`checkStep` 在有限动画结束后检查数学值、托盘接触等专属关系。两者接收 `{ page, state: { scene, step }, name, recording, output }`，其中 `step` 从 0 开始。公共工具不持有主题公式或布局选择器。

给需要保留字幕空间的实际教学对象添加 `data-layout-content`。工具统一检查这些对象在画布内且不进入底部 16%；公式和水果袋另有默认画布边界检查。标记应放在图形、公式行或实际内容组上，不要标记铺满画布的定位容器。对偶基已迁移全部 Scene；历史主题尚未添加标记的对象只检查画布边界，不宣称完成字幕验收。新 Scene 应在 JSX 中随内容添加标记。

在仓库根目录执行 `npm run check:visual` 可并行运行所有已登记的布局与录屏检查（每个项目内先布局后录屏，`--jobs N` 控制并行数，`--only a,b` 只跑指定项目），日志写入各项目 `exports/qa/check-visual.log`；`npm run check:all` 包含 lint、构建和数学测试。布局检查不编码视频，录屏引擎未修改时无需额外生成 MP4。
