"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };

const VIEW_W = 760;
const VIEW_H = 520;
const MIN = -2.8;
const MAX = 2.8;
const PLOT_SCALE = VIEW_H / (MAX - MIN);
const PLOT_W = (MAX - MIN) * PLOT_SCALE;
const PLOT_X = (VIEW_W - PLOT_W) / 2;

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
    eyebrow: "03 · 驻点条件",
    title: "约束力抵消下降动力",
    body: "拖动 λ。蓝色约束力达到合适大小时，两支箭头首尾抵消，系统达到一阶平衡。",
  },
  {
    eyebrow: "04 · 互补松弛",
    title: "没有接触，就没有约束力",
    body: "把粒子拖进可行域内部，再增大 λ，观察互补松弛为什么会失败。",
  },
  {
    eyebrow: "05 · 法向锥",
    title: "拐角能同时提供两股约束力",
    body: "在拐角处，负梯度落进两个外法向量张成的锥。KKT 不再只是两条曲线相切。",
  },
];

const presets = [
  { point: { x: 1.55, y: 1.2 }, lambda: 0 },
  { point: { x: 0.5, y: 0.5 }, lambda: 0 },
  { point: { x: 0.5, y: 0.5 }, lambda: 1 },
  { point: { x: 1.25, y: 1.05 }, lambda: 0 },
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

function Arrow({
  from,
  vector,
  tone,
  label,
  dashed = false,
}: {
  from: Point;
  vector: Point;
  tone: "red" | "blue" | "amber";
  label: string;
  dashed?: boolean;
}) {
  const end = { x: from.x + vector.x, y: from.y + vector.y };
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
      <text x={sx(end.x) + 10} y={sy(end.y) - 10}>
        {label}
      </text>
    </g>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [point, setPoint] = useState<Point>(presets[0].point);
  const [lambda, setLambda] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const isCorner = step === 4;
  const hasWall = step > 0 && !isCorner;

  const selectStep = useCallback((next: number) => {
    setStep(next);
    setPoint(presets[next].point);
    setLambda(presets[next].lambda);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((current) => {
        const next = (current + 1) % steps.length;
        setPoint(presets[next].point);
        setLambda(presets[next].lambda);
        return next;
      });
    }, 4800);
    return () => window.clearInterval(timer);
  }, [playing]);

  const center = isCorner ? { x: -1.1, y: -0.72 } : { x: 0, y: 0 };
  const grad = {
    x: 2 * (point.x - center.x),
    y: 2 * (point.y - center.y),
  };
  const driveScale = isCorner ? 0.36 : 0.44;
  const drive = { x: -grad.x * driveScale, y: -grad.y * driveScale };

  const wallG = 1 - point.x - point.y;
  const onWall = Math.abs(wallG) < 0.035;
  const lambdaEffective = hasWall ? lambda : 0;
  const reaction = {
    x: lambdaEffective * 0.88,
    y: lambdaEffective * 0.88,
  };
  const stationarity = hasWall
    ? Math.hypot(grad.x - lambda, grad.y - lambda)
    : isCorner
      ? 0
      : Math.hypot(grad.x, grad.y);
  const primalOk = !hasWall || wallG <= 0.035;
  const compValue = hasWall ? Math.abs(lambda * wallG) : 0;
  const compOk = compValue < 0.04;
  const stationarityOk = stationarity < 0.08;

  const contours = useMemo(() => [0.48, 0.86, 1.25, 1.67, 2.12, 2.58], []);

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
    if (isCorner) {
      x = Math.max(0, x);
      y = Math.max(0, y);
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
        <h1>当下降方向撞上边界</h1>
        <p>把 KKT 条件看成一场力的平衡。拖动粒子，亲手感受“可行”如何改变最优。</p>
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
            <div>
              <span className="chapter-label">{steps[step].eyebrow}</span>
              <h2>{steps[step].title}</h2>
            </div>
            <div className="live-coordinates" aria-live="polite">
              x = ({fmt(point.x)}, {fmt(point.y)})
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
                <radialGradient id="plot-glow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#273346" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#0d1119" stopOpacity="0" />
                </radialGradient>
                {(["red", "blue", "amber"] as const).map((tone) => (
                  <marker
                    key={tone}
                    id={`arrow-${tone}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
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
                  <text x={sx(1.65)} y={sy(-0.48)} className="constraint-label">g(x)=1−x₁−x₂=0</text>
                  <text x={sx(1.55)} y={sy(1.75)} className="region-label">可行域 · g(x) ≤ 0</text>
                </g>
              )}

              {isCorner && (
                <g data-role="corner-feasible-region">
                  <polygon
                    points={`${sx(0)},${sy(0)} ${sx(2.8)},${sy(0)} ${sx(2.8)},${sy(2.8)} ${sx(0)},${sy(2.8)}`}
                    className="feasible-fill corner-fill"
                  />
                  <line x1={sx(0)} y1={sy(0)} x2={sx(2.8)} y2={sy(0)} className="constraint-line" />
                  <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(2.8)} className="constraint-line" />
                  <path
                    d={`M ${sx(0)} ${sy(0)} L ${sx(-1.15)} ${sy(0)} A 107 107 0 0 1 ${sx(0)} ${sy(-1.15)} Z`}
                    className="normal-cone"
                  />
                  <text x={sx(-1.25)} y={sy(-0.92)} className="cone-label">法向锥 N<tspan baselineShift="sub">F</tspan>(x*)</text>
                  <text x={sx(1.38)} y={sy(1.78)} className="region-label">可行域</text>
                </g>
              )}

              <g className="axes">
                <line x1={sx(MIN)} y1={sy(0)} x2={sx(MAX)} y2={sy(0)} />
                <line x1={sx(0)} y1={0} x2={sx(0)} y2={VIEW_H} />
                <text x={sx(MAX) - 24} y={sy(0) - 10}>x₁</text>
                <text x={sx(0) + 10} y={20}>x₂</text>
              </g>

              <g className="contours" data-role="objective-contours">
                {contours.map((r, index) => (
                  <circle
                    key={r}
                    cx={sx(center.x)}
                    cy={sy(center.y)}
                    r={r * PLOT_SCALE}
                    className={index === 1 && step === 1 ? "contour emphasis" : "contour"}
                  />
                ))}
                <text x={sx(center.x + 1.42)} y={sy(center.y + 1.42)} className="contour-label">f(x) 等高线</text>
              </g>

              {hasWall && onWall && (
                <line
                  x1={sx(point.x - 0.72)} y1={sy(point.y + 0.72)}
                  x2={sx(point.x + 0.72)} y2={sy(point.y - 0.72)}
                  className="tangent-line"
                />
              )}

              <Arrow from={point} vector={drive} tone="red" label="−∇f" />
              {hasWall && lambda > 0.015 && (
                <Arrow from={point} vector={reaction} tone="blue" label="约束力" />
              )}
              {isCorner && (
                <>
                  <Arrow from={point} vector={{ x: 0.82, y: 0 }} tone="blue" label="−λ₁∇g₁" />
                  <Arrow from={point} vector={{ x: 0, y: 0.54 }} tone="amber" label="−λ₂∇g₂" />
                </>
              )}

              <g className="particle" data-role="draggable-point">
                <circle cx={sx(point.x)} cy={sy(point.y)} r="21" className="particle-halo" />
                <circle cx={sx(point.x)} cy={sy(point.y)} r="9" className="particle-core" />
                <text x={sx(point.x) + 15} y={sy(point.y) + 25}>x</text>
              </g>
            </svg>

            <div className="plot-legend" aria-hidden="true">
              <span><i className="legend-red" />下降动力</span>
              <span><i className="legend-blue" />约束反力</span>
              <span><i className="legend-cyan" />可行域</span>
            </div>
          </div>

          <p className="scene-copy">{steps[step].body}</p>

          {(step === 2 || step === 3) && (
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
                  setLambda(Number(event.target.value));
                  setPlaying(false);
                }}
              />
              <div className="range-labels"><span>0 · 没有推力</span><span>2 · 强推力</span></div>
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
            <strong>{isCorner ? "f=(x₁+1.1)²+(x₂+0.72)²" : "f=x₁²+x₂²"}</strong>
          </div>

          <div className="metrics">
            <div><span>g(x)</span><strong>{hasWall ? fmt(wallG) : "—"}</strong></div>
            <div><span>λ</span><strong>{isCorner ? "λ₁, λ₂" : lambda.toFixed(2)}</strong></div>
            <div><span>‖∇ₓL‖</span><strong>{isCorner ? "0.00" : stationarity.toFixed(2)}</strong></div>
          </div>

          <div className="checklist">
            <h3>KKT 检查器</h3>
            <CheckRow label="原始可行" formula={isCorner ? "x₁,x₂ ≥ 0" : "g(x) ≤ 0"} ok={primalOk} neutral={step === 0} />
            <CheckRow label="对偶可行" formula="λ ≥ 0" ok />
            <CheckRow label="互补松弛" formula="λg(x) = 0" ok={compOk} neutral={step === 0} />
            <CheckRow label="驻点条件" formula="∇f + λ∇g = 0" ok={stationarityOk || isCorner} />
          </div>

          <div className={`verdict ${((stationarityOk && compOk && primalOk) || isCorner) ? "verdict-ok" : ""}`}>
            <span>{((stationarityOk && compOk && primalOk) || isCorner) ? "✓" : "↗"}</span>
            <div>
              <strong>{((stationarityOk && compOk && primalOk) || isCorner) ? "KKT 平衡成立" : "系统仍想移动"}</strong>
              <small>{((stationarityOk && compOk && primalOk) || isCorner) ? "当前点满足一阶最优条件" : "继续观察箭头与约束"}</small>
            </div>
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
        <strong>−∇f(x*) ∈ N<sub>F</sub>(x*)</strong>
        <span>下降方向落入可行域的法向锥</span>
      </footer>
    </main>
  );
}

function CheckRow({ label, formula, ok, neutral = false }: { label: string; formula: string; ok: boolean; neutral?: boolean }) {
  return (
    <div className={`check-row ${neutral ? "neutral" : ok ? "ok" : "fail"}`}>
      <span className="check-icon">{neutral ? "·" : ok ? "✓" : "×"}</span>
      <div><strong>{label}</strong><small>{formula}</small></div>
    </div>
  );
}
