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

修改引擎后检查四个使用方的 `video:check`，并至少完成一次无截断的 debug MP4 编码。`video:check` 只检查截图和状态，不能代替实际编码验证。
