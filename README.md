# Math Visualizations

面向中文数学科普的交互式网页合集。每个主题独立运行，统一使用 Scene、固定 16:9 画布、步骤导航、全屏录制和 KaTeX。

## 创建新项目

需要 Node.js >= 22.13，在仓库根目录执行：

```sh
node scripts/create-project.mjs linear-map
cd linear-map
npm ci
npm run dev
```

创建命令复制 [工程模板](./templates/scene-project)，设置包名，并拒绝覆盖已有目录。不会安装依赖、启动服务或修改现有项目。

## 统一架构

```text
math-visualizations/
├── AGENTS.md                 # 全仓库工程与验收规范
├── scripts/create-project.mjs
├── templates/scene-project/  # 新项目的可运行起点
├── dual-space/               # 当前教学与视觉参考
└── kkt-conditions/           # 历史项目，不跟随新架构维护
```

每个新项目内部按三层组织：

| 层 | 文件 | 职责 |
| --- | --- | --- |
| 播放器 | `components/ScenePlayer.tsx` | 固定画布、Scene 和步骤导航、键盘、录屏 |
| 教学内容 | `scenes/registry.ts`、`scenes/*.tsx` | 名称、顺序、步骤数、组件及每一步的画面 |
| 数学与绘图 | `lib/math/`、`lib/geometry/`、公式组件 | 可核验的数学计算、统一坐标变换、KaTeX |

新建 Scene 只需编写教学组件并在注册表登记。播放器从同一份注册信息读取组件与步骤数，App 无需增加场景分支。Scene 名称保留在导航中，不重复显示大标题。

画布沿用 dual-space 的纯黑、固定 16:9 结构：在 1440×810 设计坐标中排版，统一等比缩放，按 1920×1080 验收。普通模式和录屏模式保持相同内部构图；录屏隐藏外部栏并保留底部步骤控制。

采用**模板复制**复用架构，各项目独立维护源码、依赖和锁文件。后续模板更新只影响新项目，现有项目按需同步，不依赖 dual-space 的文件，也不引入仓库级运行时包。

完整约定见 [AGENTS.md](./AGENTS.md)，添加 Scene 与验收说明见 [模板说明](./templates/scene-project/README.md)。

## 现有项目

- [对偶空间](./dual-space)：从水果袋与收银台理解线性空间、线性映射及对偶空间。
- [KKT 条件](./kkt-conditions)：历史可视化，保留原有运行方式。
