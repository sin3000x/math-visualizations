"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { currentScene } from "@/lib/scenes/registry";

type Point = { x: number; y: number };

const VIEW_W = 760;
const VIEW_H = 520;
const MIN = -2.8;
const MAX = 2.8;
const PLOT_SCALE = VIEW_H / (MAX - MIN);
const PLOT_W = (MAX - MIN) * PLOT_SCALE;
const PLOT_X = (VIEW_W - PLOT_W) / 2;
const WALL_TOLERANCE = 0.035;
const CURVE_A = 0.32;

const steps = [
  {
    eyebrow: "01 · 无约束",
    title: "坡会把粒子推向谷底",
    body: "红色箭头是下降方向 −∇f。只要它还不为零，粒子就有继续下降的空间。",
  },
  {
    eyebrow: "02 · 边界接触",
    title: "下降方向被可行域挡住",
    body: "现在只能留在蓝色区域。最陡的下降方向仍然存在，但它穿过了边界。",
  },
  {
    eyebrow: "03 · 驻点与互补松弛",
    title: "接触才有约束力",
    body: "边界上调节 λ，让约束力抵消下降动力；把 x 拖进可行域内部，λ 会立即归零。",
  },
  {
    eyebrow: "04 · 多重接触",
    title: "直边与曲边分别提供支持力",
    body: "两条边分别提供法向支持力；它们的合力抵消下降动力。离开某条边，对应的 λ 会立即归零。",
  },
  {
    eyebrow: "05 · 法向锥",
    title: "所有外法向组合成一个锥",
    body: "在拐角处，两股外法向量的所有非负组合铺满法向锥。最优时，负梯度正好落在这个锥里。",
  },
];

const presets = [
  { point: { x: 1.55, y: 1.2 }, lambda: 0 },
  { point: { x: 0.5, y: 0.5 }, lambda: 0 },
  { point: { x: 0.5, y: 0.5 }, lambda: 1 },
  { point: { x: 0, y: 0 }, lambda: 1 },
  { point: { x: 0, y: 0 }, lambda: 1 },
];

function sx(x: number) {
  return PLOT_X + (x - MIN) * PLOT_SCALE;
}

function sy(y: number) {
  return VIEW_H - (y - MIN) * PLOT_SCALE;
}

function fmt(value: number) {
  const clean = Math.abs(value) < 0.005 ? 0 : value;
  return clean.toFixed(2);
}

function curveBoundary(x: number) {
  return -CURVE_A * x * x;
}

function cornerConstraintValues(point: Point) {
  return {
    g1: -point.x,
    g2: curveBoundary(point.x) - point.y,
  };
}

function cornerKktLambdas(point: Point) {
  const { g1, g2 } = cornerConstraintValues(point);
  const grad = {
    x: 2 * (point.x + 1.1),
    y: 2 * (point.y + 0.72),
  };
  const onG1 = Math.abs(g1) < WALL_TOLERANCE;
  const onG2 = Math.abs(g2) < WALL_TOLERANCE;

  if (onG1 && onG2) {
    const lambda2 = Math.max(0, grad.y);
    return {
      lambda1: Math.max(0, grad.x - 2 * CURVE_A * point.x * lambda2),
      lambda2,
    };
  }

  const gradG2 = { x: -2 * CURVE_A * point.x, y: -1 };
  const lambda2 = onG2
    ? Math.max(0, -(grad.x * gradG2.x + grad.y * gradG2.y) / (gradG2.x ** 2 + gradG2.y ** 2))
    : 0;
  return {
    lambda1: onG1 ? Math.max(0, grad.x) : 0,
    lambda2,
  };
}

function MathFormula({ latex }: { latex: string }) {
  return (
    <span
      className="math-formula"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(latex, {
          throwOnError: false,
          strict: false,
        }),
      }}
    />
  );
}

function SvgFormula({
  x,
  y,
  width,
  latex,
  prefix,
  suffix,
  className = "",
}: {
  x: number;
  y: number;
  width: number;
  latex: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height="32" className={`svg-formula ${className}`}>
      <div>
        {prefix && <span className="svg-formula-copy">{prefix}</span>}
        <MathFormula latex={latex} />
        {suffix && <span className="svg-formula-copy">{suffix}</span>}
      </div>
    </foreignObject>
  );
}

function Arrow({
  from,
  vector,
  tone,
  label,
  latex,
  labelNormalOffset = 18,
  labelTangentOffset = 0,
  dashed = false,
  showLabel = true,
}: {
  from: Point;
  vector: Point;
  tone: "red" | "blue" | "amber" | "violet";
  label: string;
  latex?: string;
  labelNormalOffset?: number;
  labelTangentOffset?: number;
  dashed?: boolean;
  showLabel?: boolean;
}) {
  const end = { x: from.x + vector.x, y: from.y + vector.y };
  const midpoint = { x: from.x + vector.x / 2, y: from.y + vector.y / 2 };
  const screenVector = {
    x: sx(end.x) - sx(from.x),
    y: sy(end.y) - sy(from.y),
  };
  const screenLength = Math.hypot(screenVector.x, screenVector.y) || 1;
  const labelCenter = {
    x: sx(midpoint.x)
      - (screenVector.y / screenLength) * labelNormalOffset
      + (screenVector.x / screenLength) * labelTangentOffset,
    y: sy(midpoint.y)
      + (screenVector.x / screenLength) * labelNormalOffset
      + (screenVector.y / screenLength) * labelTangentOffset,
  };
  const marker = `url(#arrow-${tone})`;
  return (
    <g className={`vector vector-${tone}`} data-role={label}>
      <line
        x1={sx(from.x)}
        y1={sy(from.y)}
        x2={sx(end.x)}
        y2={sy(end.y)}
        markerEnd={marker}
        strokeDasharray={dashed ? "7 6" : undefined}
      />
      {showLabel && latex ? (
        <SvgFormula x={labelCenter.x - 75} y={labelCenter.y - 16} width={150} latex={latex} className={`svg-vector-${tone}`} />
      ) : showLabel ? (
        <text x={sx(end.x) + 10} y={sy(end.y) - 10}>{label}</text>
      ) : null}
    </g>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [point, setPoint] = useState<Point>(presets[0].point);
  const [lambda, setLambda] = useState(0);
  const [cornerLambdas, setCornerLambdas] = useState(() => cornerKktLambdas(presets[3].point));
  const [playing, setPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasCornerConstraints = step >= 3;
  const showsNormalCone = step === 4;
  const hasWall = step > 0 && !hasCornerConstraints;

  const selectStep = useCallback((next: number) => {
    setStep(next);
    setPoint(presets[next].point);
    setLambda(presets[next].lambda);
    if (next >= 3) setCornerLambdas(cornerKktLambdas(presets[next].point));
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((current) => {
        const next = (current + 1) % steps.length;
        setPoint(presets[next].point);
        setLambda(presets[next].lambda);
        if (next >= 3) setCornerLambdas(cornerKktLambdas(presets[next].point));
        return next;
      });
    }, 4800);
    return () => window.clearInterval(timer);
  }, [playing]);

  const center = hasCornerConstraints ? { x: -1.1, y: -0.72 } : { x: 0, y: 0 };
  const grad = {
    x: 2 * (point.x - center.x),
    y: 2 * (point.y - center.y),
  };
  const driveScale = hasCornerConstraints ? 0.36 : 0.44;
  const drive = { x: -grad.x * driveScale, y: -grad.y * driveScale };

  const wallG = 1 - point.x - point.y;
  const onWall = Math.abs(wallG) < WALL_TOLERANCE;
  const cornerConstraints = cornerConstraintValues(point);
  const cornerOnG1 = Math.abs(cornerConstraints.g1) < WALL_TOLERANCE;
  const cornerOnG2 = Math.abs(cornerConstraints.g2) < WALL_TOLERANCE;
  const cornerGradG1 = { x: -1, y: 0 };
  const cornerGradG2 = { x: -2 * CURVE_A * point.x, y: -1 };
  const normalConeFormula = cornerOnG1 && cornerOnG2
    ? "N_F(x)=\\left\\{\\lambda_1\\nabla g_1(x)+\\lambda_2\\nabla g_2(x)\\mid\\lambda_1,\\lambda_2\\ge0\\right\\}"
    : cornerOnG1
      ? "N_F(x)=\\left\\{\\lambda_1\\nabla g_1(x)\\mid\\lambda_1\\ge0\\right\\}"
      : cornerOnG2
        ? "N_F(x)=\\left\\{\\lambda_2\\nabla g_2(x)\\mid\\lambda_2\\ge0\\right\\}"
        : "N_F(x)=\\{0\\}";
  const coneRayScale = 4.8;
  const coneRay1End = {
    x: point.x + cornerGradG1.x * coneRayScale,
    y: point.y + cornerGradG1.y * coneRayScale,
  };
  const coneRay2End = {
    x: point.x + cornerGradG2.x * coneRayScale,
    y: point.y + cornerGradG2.y * coneRayScale,
  };
  const coneFarCorner = {
    x: point.x + (cornerGradG1.x + cornerGradG2.x) * coneRayScale,
    y: point.y + (cornerGradG1.y + cornerGradG2.y) * coneRayScale,
  };
  const coneLabelDirection = cornerOnG1 && cornerOnG2
    ? { x: -0.72, y: -0.72 }
    : cornerOnG1
      ? cornerGradG1
      : cornerGradG2;
  const lambdaEffective = hasWall ? lambda : 0;
  const reaction = {
    x: lambdaEffective * driveScale,
    y: lambdaEffective * driveScale,
  };
  const cornerReaction1 = {
    x: -cornerLambdas.lambda1 * cornerGradG1.x * driveScale,
    y: -cornerLambdas.lambda1 * cornerGradG1.y * driveScale,
  };
  const cornerReaction2 = {
    x: -cornerLambdas.lambda2 * cornerGradG2.x * driveScale,
    y: -cornerLambdas.lambda2 * cornerGradG2.y * driveScale,
  };
  const cornerReactionTotal = {
    x: cornerReaction1.x + cornerReaction2.x,
    y: cornerReaction1.y + cornerReaction2.y,
  };
  const stationarity = hasCornerConstraints
    ? Math.hypot(
        grad.x + cornerLambdas.lambda1 * cornerGradG1.x + cornerLambdas.lambda2 * cornerGradG2.x,
        grad.y + cornerLambdas.lambda1 * cornerGradG1.y + cornerLambdas.lambda2 * cornerGradG2.y,
      )
    : hasWall
      ? Math.hypot(grad.x - lambda, grad.y - lambda)
      : Math.hypot(grad.x, grad.y);
  const primalOk = hasCornerConstraints
    ? cornerConstraints.g1 <= WALL_TOLERANCE && cornerConstraints.g2 <= WALL_TOLERANCE
    : !hasWall || wallG <= WALL_TOLERANCE;
  const compValue = hasCornerConstraints
    ? Math.abs(cornerLambdas.lambda1 * cornerConstraints.g1) + Math.abs(cornerLambdas.lambda2 * cornerConstraints.g2)
    : hasWall ? Math.abs(lambda * wallG) : 0;
  const compOk = compValue < 0.04;
  const dualOk = hasCornerConstraints
    ? cornerLambdas.lambda1 >= 0 && cornerLambdas.lambda2 >= 0
    : lambda >= 0;
  const stationarityOk = stationarity < 0.08;
  const equilibriumOk = stationarityOk && compOk && primalOk && dualOk;
  const showDrive = hasWall || hasCornerConstraints || !stationarityOk;

  const contours = useMemo(() => [0.48, 0.86, 1.25, 1.67, 2.12, 2.58], []);
  const curvePoints = useMemo(
    () => Array.from({ length: 41 }, (_, index) => {
      const x = (Math.sqrt(-MIN / CURVE_A) * index) / 40;
      return { x, y: curveBoundary(x) };
    }),
    [],
  );

  function pointerToWorld(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    const svgY = ((event.clientY - rect.top) / rect.height) * VIEW_H;
    let x = MIN + (svgX - PLOT_X) / PLOT_SCALE;
    let y = MAX - svgY / PLOT_SCALE;
    x = Math.max(MIN, Math.min(MAX, x));
    y = Math.max(MIN, Math.min(MAX, y));

    if (hasWall && x + y < 1) {
      const shift = (1 - x - y) / 2;
      x += shift;
      y += shift;
    }
    if (hasCornerConstraints) {
      x = Math.max(0, x);
      x = Math.min(MAX, x);
      y = Math.max(curveBoundary(x), y);
      y = Math.min(MAX, y);
      setCornerLambdas(cornerKktLambdas({ x, y }));
    }
    if (step === 2) {
      const nextOnWall = Math.abs(1 - x - y) < WALL_TOLERANCE;
      if (!nextOnWall) setLambda(0);
      else if (!onWall) setLambda(1);
    }
    setPoint({ x, y });
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerToWorld(event);
    setPlaying(false);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">∇</span>
          <span>KKT · 几何实验室</span>
        </div>
        <div className="header-actions">
          <button className="ghost-button" onClick={() => setShowHelp((v) => !v)}>
            {showHelp ? "收起说明" : "如何操作"}
          </button>
          <button className="play-button" onClick={() => setPlaying((v) => !v)}>
            <span>{playing ? "Ⅱ" : "▶"}</span>
            {playing ? "暂停演示" : "自动演示"}
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="kicker">INTERACTIVE MATHEMATICS · 交互数学</p>
        <h1>{currentScene.title}</h1>
        <p>{currentScene.summary}</p>
      </section>

      {showHelp && (
        <aside className="help-strip">
          <span>拖动图中的白色粒子</span>
          <span>切换下方五个章节</span>
          <span>在第 3、4 章调节 λ</span>
          <span>绿色亮起表示条件成立</span>
        </aside>
      )}

      <section className="lab-layout">
        <div className="canvas-card">
          <div className="canvas-head">
            <div className="canvas-heading-copy">
              <span className="chapter-label">{steps[step].eyebrow}</span>
              <div className="canvas-title-row">
                <h2>{steps[step].title}</h2>
                <div className={`canvas-verdict ${equilibriumOk ? "canvas-verdict-ok" : ""}`}>
                  <span>{equilibriumOk ? "✓" : "↗"}</span>
                  <div>
                    <strong>{equilibriumOk ? "KKT 平衡成立" : "系统仍想移动"}</strong>
                    <small>{equilibriumOk ? "满足一阶最优条件" : "继续观察箭头与约束"}</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="live-coordinates" aria-live="polite">
              <MathFormula latex={`x=(${fmt(point.x)},\\,${fmt(point.y)})`} />
            </div>
          </div>

          <div className="plot-wrap">
            <svg
              ref={svgRef}
              className="math-plot"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label="可拖动的 KKT 几何示意图"
              onPointerDown={handlePointerDown}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) pointerToWorld(event);
              }}
              onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
            >
              <defs>
                <clipPath id="plot-clip">
                  <rect width={VIEW_W} height={VIEW_H} rx="18" />
                </clipPath>
                <radialGradient id="plot-glow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#273346" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#0d1119" stopOpacity="0" />
                </radialGradient>
                {(["red", "blue", "amber", "violet"] as const).map((tone) => (
                  <marker
                    key={tone}
                    id={`arrow-${tone}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth={tone === "violet" ? "5" : "7"}
                    markerHeight={tone === "violet" ? "5" : "7"}
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                ))}
                <pattern id="dot-grid" width="46.4" height="46.4" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#8290a5" fillOpacity="0.22" />
                </pattern>
              </defs>

              <rect width={VIEW_W} height={VIEW_H} fill="#0d1119" rx="18" />
              <rect width={VIEW_W} height={VIEW_H} fill="url(#plot-glow)" rx="18" />
              <rect width={VIEW_W} height={VIEW_H} fill="url(#dot-grid)" rx="18" />

              {hasWall && (
                <g data-role="feasible-region">
                  <polygon
                    points={`${sx(-1.8)},${sy(2.8)} ${sx(2.8)},${sy(2.8)} ${sx(2.8)},${sy(-1.8)}`}
                    className="feasible-fill"
                  />
                  <line
                    x1={sx(-1.8)} y1={sy(2.8)} x2={sx(2.8)} y2={sy(-1.8)}
                    className="constraint-line"
                  />
                  <SvgFormula x={sx(1.52)} y={sy(-0.48) - 18} width={175} latex="g(x)=1-x_1-x_2=0" className="constraint-formula" />
                  <SvgFormula
                    x={sx(1.55)}
                    y={sy(1.75) - 18}
                    width={170}
                    latex={"g(x)\\le 0"}
                    prefix="可行域"
                    className="region-formula"
                  />
                </g>
              )}

              {hasCornerConstraints && (
                <g data-role="corner-feasible-region">
                  <polygon
                    points={`${curvePoints.map((sample) => `${sx(sample.x)},${sy(sample.y)}`).join(" ")} ${VIEW_W},${VIEW_H} ${VIEW_W},0 ${sx(0)},0`}
                    className="feasible-fill corner-fill"
                  />
                  <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={0} className="constraint-line" />
                  <path
                    d={`M ${curvePoints.map((sample) => `${sx(sample.x)} ${sy(sample.y)}`).join(" L ")}`}
                    className="constraint-line corner-curve"
                  />
                  <SvgFormula x={sx(0.08)} y={sy(2.25) - 18} width={140} latex={"g_1(x)=-x_1=0"} className="constraint-formula" />
                  <SvgFormula x={sx(1.38)} y={sy(curveBoundary(1.38)) - 27} width={205} latex={"g_2(x)=-0.32x_1^2-x_2=0"} className="constraint-formula" />
                  <text x={sx(1.05)} y={sy(1.92)} className="region-label">可行域</text>
                </g>
              )}

              {showsNormalCone && (
                <g data-role="normal-cone" clipPath="url(#plot-clip)">
                  {cornerOnG1 && cornerOnG2 ? (
                    <path
                      d={`M ${sx(point.x)} ${sy(point.y)} L ${sx(coneRay1End.x)} ${sy(coneRay1End.y)} L ${sx(coneFarCorner.x)} ${sy(coneFarCorner.y)} L ${sx(coneRay2End.x)} ${sy(coneRay2End.y)} Z`}
                      className="normal-cone"
                    />
                  ) : cornerOnG1 || cornerOnG2 ? (
                    <line
                      x1={sx(point.x)}
                      y1={sy(point.y)}
                      x2={sx((cornerOnG1 ? coneRay1End : coneRay2End).x)}
                      y2={sy((cornerOnG1 ? coneRay1End : coneRay2End).y)}
                      className="normal-cone-ray"
                    />
                  ) : (
                    <circle cx={sx(point.x)} cy={sy(point.y)} r="6" className="normal-cone-zero" />
                  )}
                  <SvgFormula
                    x={sx(point.x + coneLabelDirection.x * 1.35) - 50}
                    y={sy(point.y + coneLabelDirection.y * 1.35) - 18}
                    width={150}
                    latex={"N_F(x)"}
                    className="cone-formula"
                  />
                </g>
              )}

              <g className="axes">
                <line x1={0} y1={sy(0)} x2={VIEW_W} y2={sy(0)} />
                <line x1={sx(0)} y1={0} x2={sx(0)} y2={VIEW_H} />
                <SvgFormula x={sx(MAX) - 28} y={sy(0) - 30} width={35} latex="x_1" />
                <SvgFormula x={sx(0) + 8} y={1} width={35} latex="x_2" />
              </g>

              <g className="contours" data-role="objective-contours">
                {contours.map((r) => (
                  <circle
                    key={r}
                    cx={sx(center.x)}
                    cy={sy(center.y)}
                    r={r * PLOT_SCALE}
                    className="contour"
                  />
                ))}
                <SvgFormula
                  x={sx(center.x + 1.42)}
                  y={sy(center.y + 1.42) - 18}
                  width={125}
                  latex="f(x)"
                  suffix="等高线"
                  className="contour-formula"
                />
              </g>

              {showDrive && <Arrow from={point} vector={drive} tone="red" label="−∇f" latex={"-\\nabla f"} />}
              {hasWall && lambda > 0.015 && (
                <Arrow
                  from={point}
                  vector={reaction}
                  tone="blue"
                  label="约束力"
                  latex={"\\text{约束力}=-\\lambda\\nabla g"}
                  labelNormalOffset={58}
                  labelTangentOffset={28}
                />
              )}
              {hasCornerConstraints && (
                <>
                  {cornerLambdas.lambda1 > 0.015 && (
                    <Arrow
                      from={point}
                      vector={cornerReaction1}
                      tone="blue"
                      label="−λ₁∇g₁"
                      latex={"-\\lambda_1\\nabla g_1"}
                      labelNormalOffset={34}
                      labelTangentOffset={10}
                    />
                  )}
                  {cornerLambdas.lambda2 > 0.015 && (
                    <Arrow
                      from={point}
                      vector={cornerReaction2}
                      tone="amber"
                      label="−λ₂∇g₂"
                      latex={"-\\lambda_2\\nabla g_2"}
                      labelNormalOffset={-38}
                      labelTangentOffset={8}
                    />
                  )}
                  {cornerLambdas.lambda1 > 0.015 && cornerLambdas.lambda2 > 0.015 && (
                    <Arrow
                      from={point}
                      vector={cornerReactionTotal}
                      tone="violet"
                      label="约束合力"
                      showLabel={false}
                    />
                  )}
                </>
              )}

              <g className="particle" data-role="draggable-point">
                <circle cx={sx(point.x)} cy={sy(point.y)} r="9" className="particle-core" />
                <SvgFormula x={sx(point.x) + 13} y={sy(point.y) + 9} width={28} latex="x" className="particle-formula" />
              </g>
            </svg>

            <div className="plot-legend" aria-hidden="true">
              <span><i className="legend-red" />下降动力</span>
              <span><i className="legend-blue" />约束反力</span>
              {hasCornerConstraints && <span><i className="legend-violet" />约束合力</span>}
              <span><i className="legend-cyan" />可行域</span>
            </div>
          </div>

          <p className="scene-copy">
            {step === 0 ? (
              <>红色箭头是下降方向 <MathFormula latex={"-\\nabla f"} />。只要它还不为零，粒子就有继续下降的空间。</>
            ) : steps[step].body}
          </p>

          {showsNormalCone && (
            <div className="normal-cone-definition" aria-label="法向锥的集合定义">
              <span>法向锥集合</span>
              <strong>
                <MathFormula latex={normalConeFormula} />
              </strong>
              <small>
                最优时：<MathFormula latex={"-\\nabla f(x)\\in N_F(x)"} />
              </small>
            </div>
          )}

          {step === 2 && (
            <div className="lambda-control">
              <div className="control-heading">
                <label htmlFor="lambda">约束力强度 λ</label>
                <output>{lambda.toFixed(2)}</output>
              </div>
              <input
                id="lambda"
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={lambda}
                onChange={(event) => {
                  setLambda(onWall ? Number(event.target.value) : 0);
                  setPlaying(false);
                }}
                disabled={!onWall}
              />
              <div className="range-labels"><span>0 · 没有推力</span><span>2 · 强推力</span></div>
              <small className="lambda-auto-note">
                {onWall ? (
                  <>
                    <MathFormula latex={"-\\nabla g"} /> 决定方向，
                    <MathFormula latex={"\\lambda"} /> 决定强度；本例接触时
                    <MathFormula latex={"\\lambda=1"} />
                  </>
                ) : (
                  <>
                    未接触边界，约束不施力：<MathFormula latex={"\\lambda=0"} />
                  </>
                )}
              </small>
            </div>
          )}

          {step === 3 && (
            <div className="lambda-control corner-lambda-controls">
              <div className="corner-lambda-row">
                <div className="control-heading">
                  <label htmlFor="lambda-1"><MathFormula latex={"\\lambda_1"} /> · 直边支持力</label>
                  <output>{cornerLambdas.lambda1.toFixed(2)}</output>
                </div>
                <input
                  id="lambda-1"
                  type="range"
                  min="0"
                  max="3"
                  step="0.01"
                  value={cornerLambdas.lambda1}
                  onChange={(event) => {
                    setCornerLambdas((current) => ({
                      ...current,
                      lambda1: cornerOnG1 ? Number(event.target.value) : 0,
                    }));
                    setPlaying(false);
                  }}
                  disabled={!cornerOnG1}
                />
              </div>
              <div className="corner-lambda-row">
                <div className="control-heading">
                  <label htmlFor="lambda-2"><MathFormula latex={"\\lambda_2"} /> · 曲边支持力</label>
                  <output>{cornerLambdas.lambda2.toFixed(2)}</output>
                </div>
                <input
                  id="lambda-2"
                  type="range"
                  min="0"
                  max="3"
                  step="0.01"
                  value={cornerLambdas.lambda2}
                  onChange={(event) => {
                    setCornerLambdas((current) => ({
                      ...current,
                      lambda2: cornerOnG2 ? Number(event.target.value) : 0,
                    }));
                    setPlaying(false);
                  }}
                  disabled={!cornerOnG2}
                />
              </div>
              <small className="lambda-auto-note">
                拖动时自动按接触状态更新：离开边界取 0，接触边界取法向平衡所需的 KKT 值。
              </small>
            </div>
          )}
        </div>

        <aside className="inspector">
          <div className="inspector-title">
            <span>实时状态</span>
            <span className="live-dot">LIVE</span>
          </div>

          <div className="equation-block">
            <span className="equation-label">目标函数</span>
            <strong>
              <MathFormula latex={hasCornerConstraints ? "f=(x_1+1.1)^2+(x_2+0.72)^2" : "f=x_1^2+x_2^2"} />
            </strong>
          </div>

          <div className="metrics">
            <div>
              <span><MathFormula latex={hasCornerConstraints ? "g_1,\\,g_2" : "g(x)"} /></span>
              <strong>{hasCornerConstraints ? `${fmt(cornerConstraints.g1)}, ${fmt(cornerConstraints.g2)}` : hasWall ? fmt(wallG) : "—"}</strong>
            </div>
            <div>
              <span><MathFormula latex={hasCornerConstraints ? "\\lambda_1,\\,\\lambda_2" : "\\lambda"} /></span>
              <strong>{hasCornerConstraints ? `${fmt(cornerLambdas.lambda1)}, ${fmt(cornerLambdas.lambda2)}` : lambda.toFixed(2)}</strong>
            </div>
            <div><span><MathFormula latex={"\\lVert\\nabla_x L\\rVert"} /></span><strong>{stationarity.toFixed(2)}</strong></div>
          </div>

          <div className="checklist">
            <h3>KKT 检查器</h3>
            <CheckRow label="原始可行" formula={hasCornerConstraints ? "g_1(x),g_2(x) \\le 0" : "g(x) \\le 0"} ok={primalOk} neutral={step === 0} />
            <CheckRow label="对偶可行" formula={hasCornerConstraints ? "\\lambda_1,\\lambda_2 \\ge 0" : "\\lambda \\ge 0"} ok={dualOk} />
            <CheckRow label="互补松弛" formula={hasCornerConstraints ? "\\lambda_i g_i(x)=0" : "\\lambda g(x) = 0"} ok={compOk} neutral={step === 0} />
            <CheckRow label="驻点条件" formula={hasCornerConstraints ? "\\nabla f+\\lambda_1\\nabla g_1+\\lambda_2\\nabla g_2=0" : "\\nabla f + \\lambda \\nabla g = 0"} ok={stationarityOk} />
          </div>

        </aside>
      </section>

      <nav className="chapter-nav" aria-label="KKT 演示章节">
        {steps.map((item, index) => (
          <button
            key={item.eyebrow}
            className={index === step ? "active" : ""}
            onClick={() => {
              selectStep(index);
              setPlaying(false);
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </nav>

      <footer>
        <span>KKT 的几何本质</span>
        <strong><MathFormula latex={"-\\nabla f(x^\\ast) \\in N_F(x^\\ast)"} /></strong>
        <span>下降方向落入可行域的法向锥</span>
      </footer>
    </main>
  );
}

function CheckRow({ label, formula, ok, neutral = false }: { label: string; formula: string; ok: boolean; neutral?: boolean }) {
  return (
    <div className={`check-row ${neutral ? "neutral" : ok ? "ok" : "fail"}`}>
      <span className="check-icon">{neutral ? "·" : ok ? "✓" : "×"}</span>
      <div><strong>{label}</strong><small><MathFormula latex={formula} /></small></div>
    </div>
  );
}
