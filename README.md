# Math Visualizations

面向中文数学科普的交互式网页合集。每个主题独立运行，统一使用 Scene、固定 16:9 画布、步骤导航、全屏录制和 KaTeX。

后续构建遵循 [默认构建偏好](./AGENTS.md#默认构建偏好从-dual-space-提炼)：极简、图形优先、少公式、无标题和说明、无可见导航，以键盘触发动画渐进展现。此处记录构建标准，现有页面和模板实现按后续任务逐步对齐。

## 创建新项目

需要 Node.js >= 22.13，在仓库根目录执行：

```sh
node scripts/create-project.mjs linear-map
npm ci
npm run dev -w linear-map
```

创建命令复制 [工程模板](./templates/scene-project)，设置包名，并拒绝覆盖已有目录。自动登记到根目录 npm workspaces 并更新统一锁文件（此步需要 npm registry 或本地缓存可用），不安装依赖或启动服务。随后在根目录运行 `npm ci`。

## 统一架构

```text
math-visualizations/
├── AGENTS.md                 # 全仓库工程与验收规范
├── package.json              # workspaces 与批量检查入口
├── package-lock.json         # 三个主题与模板共用的锁文件
├── node_modules/             # 兼容依赖统一安装（不提交）
├── scripts/create-project.mjs
├── templates/scene-project/  # 新项目的可运行起点
├── dual-space/               # 当前教学与视觉参考
├── double-dual/              # 第二集：双对偶
├── basis-coordinates/        # 第三集：基、坐标、行向量
└── kkt-conditions/           # 历史项目，不跟随新架构维护
```

每个新项目内部按三层组织：

| 层 | 文件 | 职责 |
| --- | --- | --- |
| 播放器 | `components/ScenePlayer.tsx` | 固定画布、Scene 和步骤导航、键盘、录屏 |
| 教学内容 | `scenes/registry.ts`、`scenes/*.tsx` | 名称、顺序、步骤数、组件及每一步的画面 |
| 数学与绘图 | `lib/math/`、`lib/geometry/`、公式组件 | 可核验的数学计算、统一坐标变换、KaTeX |

新建 Scene 只需编写教学组件并在注册表登记。播放器从同一份注册信息读取组件与步骤数，App 无需增加场景分支。Scene 名称与目标保留为元数据，默认不显示标题、说明和导航栏。

画布沿用 dual-space 的纯黑、固定 16:9 结构：在 1440×810 设计坐标中排版，统一等比缩放，按 1920×1080 验收。普通模式和录屏模式保持相同内部构图；后续构建默认通过键盘渐进触发动画，不显示导航栏；普通模式保留画布外的全屏录制入口。

采用 **npm workspaces + 模板复制**：各项目独立维护源码、依赖声明和运行命令，根目录统一安装并维护一份锁文件。兼容版本的依赖共享安装，冲突版本由 npm 按需隔离；不要手工链接 `node_modules`。模板更新只影响新项目，现有项目按需同步。

`kkt-conditions/` 暂不加入 workspaces，继续使用自己的锁文件和安装命令。各项目 `dist/` 与 Vite 缓存保持独立，构建产物不提交 Git。

## 安装与检查

使用 Node.js >= 22.13；`.nvmrc` 选择 Node 22，使用 nvm 时可执行 `nvm install`、`nvm use`。以下命令均在仓库根目录运行：

```sh
npm ci                              # 安装全部 workspace 依赖
npm run dev -w dual-space            # 启动指定主题
npm run build -w basis-coordinates   # 只构建一个主题
npm run check                       # 全部 workspace 的 lint、测试、构建
```

进入子项目后仍可执行 `npm run dev`、`npm test` 等命令。新增依赖用 `npm install <包名> -w <项目名>`，将项目声明和根锁文件一起提交。不要为 workspace 单独生成锁文件。首次从旧结构迁移时，可先删除三个主题及模板内旧的 `node_modules`，再在根目录执行 `npm ci`；无需处理 KKT 的依赖。

完整约定见 [AGENTS.md](./AGENTS.md)，添加 Scene 与验收说明见 [模板说明](./templates/scene-project/README.md)。

## 现有项目

- [对偶的对偶](./double-dual)：独立第二集，从测量水果袋回顾到“谁来测量收银台”的悬念。

- [对偶空间](./dual-space)：从水果袋与收银台理解线性空间、线性映射及对偶空间。
- [KKT 条件](./kkt-conditions)：历史可视化，保留原有运行方式。
