# Math Visualizations

一个面向数学科普的交互式网页合集。每个主题都是独立子工程，目标是把公式、几何图像、参数变化和可验证的数学状态放在同一个页面中。

## Projects

### [KKT Conditions](./kkt-conditions)

通过可拖动粒子、目标函数等高线、可行域、约束反力和法向锥，直观解释 KKT 条件。

- 四段式交互讲解
- 实时 KKT 条件检查器
- 支持拖动点与调节 Lagrange 乘子
- 横纵坐标等比例映射，保留真实几何角度

## Repository layout

```text
math-visualizations/
├── README.md
└── kkt-conditions/
    ├── app/
    ├── public/
    └── package.json
```

每个子工程独立管理依赖和运行命令。进入对应目录后，按照其 README 启动即可。
