"use client";

import { MathFormula } from "@/components/math/MathFormula";
import { SvgFormula } from "@/components/math/SvgFormula";
import { CopyrightNotice } from "@/components/site/CopyrightNotice";
import { workedExampleScene } from "@/lib/scenes/registry";

export const workedExampleSteps = [
  {
    eyebrow: "01 · 读题",
    title: "一个可以手算到底的例子",
    prompt: "先认清三件事：目标函数的谷底、不能越过的墙，以及必须待在上面的杆。",
  },
  {
    eyebrow: "02 · 写出条件",
    title: "把完整 KKT 条件列出来",
    prompt: "这道题有一个不等式约束和一个等式约束，因此需要同时写原始可行、对偶可行、互补松弛与驻点条件。",
  },
  {
    eyebrow: "03 · 直接求解",
    title: "解得最优点与两个乘子",
    prompt: "联立这些条件即可得到答案。把结果代回去，所有可行性条件成立，三股力也恰好相加为零。",
  },
] as const;

type Props = {
  step: number;
  isRecordingMode: boolean;
  onSelectStep: (step: number) => void;
  onToggleFullscreen: () => void;
  onNextScene: () => void;
};

const PX = (x: number) => 85 + (x + 0.5) * 105;
const PY = (y: number) => 330 - (y + 0.5) * 105;
const optimum = { x: 0.5, y: 0.5 };

export function KktWorkedExampleScene({ step, isRecordingMode, onSelectStep, onToggleFullscreen, onNextScene }: Props) {
  return (
    <main className={`site-shell worked-example-scene ${isRecordingMode ? "recording-mode" : ""}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">∇</span><span>KKT · 几何实验室</span></div>
        <div className="header-actions">
          <button className="fullscreen-button" onClick={onToggleFullscreen} aria-label="进入全屏录屏模式">
            <span aria-hidden="true">⛶</span>全屏录制
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="kicker">INTERACTIVE MATHEMATICS · 手算例题</p>
        <h1>{workedExampleScene.title}</h1>
        <p>{workedExampleScene.summary}</p>
      </section>

      <section className="worked-example-stage">
        <div className="worked-example-card">
          <div className="canvas-head worked-example-head">
            <div className="canvas-heading-copy">
              <span className="chapter-label">{workedExampleSteps[step].eyebrow}</span>
              <h2>{workedExampleSteps[step].title}</h2>
            </div>
            <div className="constraint-kind with-equality">不等式 + 等式</div>
          </div>

          <div className="worked-example-board">
            <div className="worked-plot-column">
              <span className="board-label">题目与几何图景</span>
              <div className="worked-problem-formula">
                <MathFormula latex={"\\begin{aligned}\\min_{x_1,x_2}\\quad & (x_1-2)^2+(x_2-1)^2\\\\ \\text{s.t.}\\quad & g(x)=x_1+x_2-1\\le0\\\\ & h(x)=x_1-x_2=0\\end{aligned}"} />
              </div>
              <WorkedExamplePlot step={step} />
            </div>

            <aside className="worked-solution-column">
              <span className="board-label">跟着手算</span>
              <div className="worked-step-number">{String(step + 1).padStart(2, "0")}</div>
              <h3>{workedExampleSteps[step].title}</h3>
              <p>{workedExampleSteps[step].prompt}</p>
              <WorkedCalculation step={step} />
            </aside>
          </div>
        </div>
      </section>

      <nav className="chapter-nav worked-example-nav" aria-label="KKT 手算例题章节">
        {workedExampleSteps.map((item, index) => (
          <button key={item.eyebrow} className={index === step ? "active" : ""} onClick={() => onSelectStep(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
        <button className="next-scene" onClick={onNextScene}>
          <span>下一幕 →</span>
          <strong>什么时候 KKT 才可靠？</strong>
        </button>
      </nav>

      <footer>
        <span>手算答案</span>
        <strong><MathFormula latex={"x^*=(\\tfrac12,\\tfrac12),\\quad \\lambda^*=2,\\quad \\nu^*=1"} /></strong>
        <CopyrightNotice />
      </footer>
    </main>
  );
}

function WorkedCalculation({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="worked-calculation">
        <div><span>谷底</span><MathFormula latex={"(2,1)"} /></div>
        <div><span>墙</span><MathFormula latex={"x_1+x_2=1"} /></div>
        <div><span>杆</span><MathFormula latex={"x_1=x_2"} /></div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="worked-calculation worked-kkt-system">
        <div>
          <span>原始可行</span>
          <div className="worked-condition-stack">
            <MathFormula latex={"g(x)=x_1+x_2-1\\le0"} />
            <MathFormula latex={"h(x)=x_1-x_2=0"} />
          </div>
        </div>
        <div><span>对偶可行</span><MathFormula latex={"\\lambda\\ge0,\\qquad \\nu\\in\\mathbb R"} /></div>
        <div><span>互补松弛</span><MathFormula latex={"\\lambda\\bigl(x_1+x_2-1\\bigr)=0"} /></div>
        <div>
          <span>驻点条件</span>
          <MathFormula latex={"\\begin{bmatrix}2(x_1-2)\\\\2(x_2-1)\\end{bmatrix}+\\lambda\\begin{bmatrix}1\\\\1\\end{bmatrix}+\\nu\\begin{bmatrix}1\\\\-1\\end{bmatrix}=\\begin{bmatrix}0\\\\0\\end{bmatrix}"} />
        </div>
      </div>
    );
  }

  return (
    <div className="worked-calculation worked-calculation-final">
      <div className="worked-answer">
        <span>解得</span>
        <MathFormula latex={"x^*=(\\tfrac12,\\tfrac12),\\qquad \\lambda^*=2,\\qquad \\nu^*=1"} />
      </div>
      <MathFormula latex={"\\nabla f(x^*)=(-3,-1),\\quad \\nabla g=(1,1),\\quad \\nabla h=(1,-1)"} />
      <MathFormula latex={"(-3,-1)+\\lambda(1,1)+\\nu(1,-1)=(0,0)"} />
    </div>
  );
}

function WorkedExamplePlot({ step }: { step: number }) {
  const ox = PX(2);
  const oy = PY(1);
  const px = PX(optimum.x);
  const py = PY(optimum.y);
  const showKkt = step >= 1;
  const showOptimum = step >= 2;
  const showForces = step >= 2;

  return (
    <svg className="worked-example-plot" viewBox="0 0 620 360" role="img" aria-label="目标函数、等式约束、不等式约束与最优点的几何图">
      <defs>
        <marker id="worked-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
        <marker id="worked-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
        <marker id="worked-arrow-violet" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
      </defs>

      <path d={`M${PX(-0.5)} ${PY(-0.5)} L${PX(1.5)} ${PY(-0.5)} L${PX(-0.5)} ${PY(1.5)} Z`} className="worked-feasible-area" />
      <line x1={PX(-0.5)} y1={PY(1.5)} x2={PX(1.5)} y2={PY(-0.5)} className="worked-inequality-boundary" />
      <line x1={PX(-0.5)} y1={PY(-0.5)} x2={PX(2.6)} y2={PY(2.6)} className={`worked-equality-line ${showKkt ? "active" : ""}`} />
      {showKkt && <line x1={PX(-0.5)} y1={PY(-0.5)} x2={px} y2={py} className="worked-feasible-track" />}

      {[74, 116, 166].map((radius) => (
        <circle key={radius} cx={ox} cy={oy} r={radius} className={radius === 166 && showOptimum ? "worked-contour active" : "worked-contour"} />
      ))}
      <circle cx={ox} cy={oy} r="5" className="worked-objective-center" />
      <SvgFormula x={ox + 10} y={oy - 25} width={145} latex={"f\\text{ 的自由谷底}"} className="worked-label-muted" />

      <SvgFormula x={PX(-0.4)} y={PY(1.45) - 26} width={165} latex={"g(x)=0"} className="worked-label-cyan" />
      <SvgFormula x={PX(1.75)} y={PY(1.75) + 8} width={165} latex={"h(x)=0"} className="worked-label-violet" />
      {showKkt && <SvgFormula x={PX(-0.2)} y={PY(-0.2) + 16} width={165} latex={"x_1=x_2\\le\\tfrac12"} className="worked-label-cyan" />}

      {showOptimum && <circle cx={px} cy={py} r="9" className="worked-optimum-point" data-role="worked-example-optimum" />}
      {showOptimum && <SvgFormula x={px + 13} y={py + 5} width={170} latex={"x^*=(\\tfrac12,\\tfrac12)"} className="worked-label-amber" />}

      {showForces && (
        <>
          <line x1={px} y1={py} x2={px + 78} y2={py - 26} className="worked-force drive" markerEnd="url(#worked-arrow-red)" />
          <line x1={px} y1={py} x2={px - 52} y2={py + 52} className="worked-force support" markerEnd="url(#worked-arrow-blue)" />
          <line x1={px} y1={py} x2={px - 26} y2={py - 26} className="worked-force equality" markerEnd="url(#worked-arrow-violet)" />
          <SvgFormula x={px + 44} y={py - 58} width={115} latex={"-\\nabla f=(3,1)"} className="worked-label-red" />
          <SvgFormula x={px - 150} y={py + 48} width={155} latex={"-\\lambda\\nabla g=(-2,-2)"} className="worked-label-blue" />
          <SvgFormula x={px - 132} y={py - 58} width={145} latex={"-\\nu\\nabla h=(-1,1)"} className="worked-label-violet" />
        </>
      )}
    </svg>
  );
}
