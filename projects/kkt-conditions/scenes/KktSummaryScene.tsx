"use client";

import { MathFormula } from "@/components/math/MathFormula";
import { CopyrightNotice } from "@/components/site/CopyrightNotice";
import { summaryScene } from "@/lib/scenes/registry";

export const summarySteps = [
  {
    eyebrow: "01 · 几何意义",
    title: "所有可行方向都不能继续下降",
    shortTitle: "KKT 在判断什么",
  },
  {
    eyebrow: "02 · 必要性",
    title: "局部最优加 CQ，才能保证写出 KKT",
    shortTitle: "CQ 保证什么",
  },
  {
    eyebrow: "03 · 充分性",
    title: "凸问题加 KKT，直接得到全局最优",
    shortTitle: "凸性保证什么",
  },
] as const;

type Props = {
  step: number;
  isRecordingMode: boolean;
  onSelectStep: (step: number) => void;
  onToggleFullscreen: () => void;
};

export function KktSummaryScene({ step, isRecordingMode, onSelectStep, onToggleFullscreen }: Props) {
  return (
    <main className={`site-shell summary-scene ${isRecordingMode ? "recording-mode" : ""}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">∇</span><span>KKT · 几何实验室</span></div>
        <div className="header-actions">
          <button className="fullscreen-button" onClick={onToggleFullscreen} aria-label="进入全屏录屏模式">
            <span aria-hidden="true">⛶</span>全屏录制
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="kicker">INTERACTIVE MATHEMATICS · 总结</p>
        <h1>{summaryScene.title}</h1>
        <p>{summaryScene.summary}</p>
      </section>

      <section className="summary-stage">
        <div className="summary-card">
          <div className="canvas-head summary-head">
            <div className="canvas-heading-copy">
              <span className="chapter-label">{summarySteps[step].eyebrow}</span>
              <h2>{summarySteps[step].title}</h2>
            </div>
            <div className="summary-badge">回顾</div>
          </div>

          <div className="summary-board">
            <SummaryGeometry active={step === 0} />
            <SummaryLogic
              active={step === 1}
              index="02"
              label="CQ 保证必要性"
              formula={"x^*\\text{ 局部最优}+\\text{CQ}\\;\\Longrightarrow\\;\\exists(\\lambda^*,\\nu^*)\\text{ 满足 KKT}"}
              note="CQ 排除退化约束，保证最优点处存在一组有限的乘子。"
              tone="amber"
            />
            <SummaryLogic
              active={step === 2}
              index="03"
              label="凸性保证充分性"
              formula={"\\text{凸问题}+\\text{KKT}\\;\\Longrightarrow\\;x^*\\text{ 是全局最优}"}
              note="若问题非凸，满足 KKT 通常只能说明它是一个候选点。"
              tone="violet"
            />
          </div>
        </div>
      </section>

      <nav className="chapter-nav summary-nav" aria-label="KKT 总结章节">
        {summarySteps.map((item, index) => (
          <button key={item.eyebrow} className={index === step ? "active" : ""} onClick={() => onSelectStep(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.shortTitle}</strong>
          </button>
        ))}
      </nav>

      <footer>
        <span>一句话总结</span>
        <strong><MathFormula latex={"\\text{约束把下降方向挡住时，法向支持力让系统达到平衡}"} /></strong>
        <CopyrightNotice />
      </footer>
    </main>
  );
}

function SummaryGeometry({ active }: { active: boolean }) {
  return (
    <article className={`summary-lane geometry ${active ? "active" : ""}`}>
      <div className="summary-lane-index">01</div>
      <div className="summary-lane-copy">
        <span>KKT 在判断什么</span>
        <strong>所有可行方向都不能继续下降</strong>
        <p>下降方向被边界挡住，活跃约束的法向支持力恰好把它抵消。</p>
      </div>
      <svg className="summary-mini-plot" viewBox="0 0 370 150" role="img" aria-label="下降力被边界法向支持力抵消">
        <defs>
          <marker id="summary-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
          <marker id="summary-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
        </defs>
        <path d="M25 125 Q185 25 345 125 L345 0 L25 0 Z" className="summary-feasible" />
        <path d="M25 125 Q185 25 345 125" className="summary-boundary" />
        <circle cx="185" cy="75" r="10" className="summary-point" />
        <line x1="185" y1="75" x2="185" y2="132" className="summary-drive" markerEnd="url(#summary-arrow-red)" />
        <line x1="185" y1="75" x2="185" y2="18" className="summary-support" markerEnd="url(#summary-arrow-blue)" />
        <text x="150" y="145" className="summary-svg-label coral">下降力</text>
        <text x="202" y="27" className="summary-svg-label blue">支持力</text>
      </svg>
    </article>
  );
}

function SummaryLogic({ active, index, label, formula, note, tone }: {
  active: boolean;
  index: string;
  label: string;
  formula: string;
  note: string;
  tone: "amber" | "violet";
}) {
  return (
    <article className={`summary-lane logic ${tone} ${active ? "active" : ""}`}>
      <div className="summary-lane-index">{index}</div>
      <div className="summary-lane-copy">
        <span>{label}</span>
        <MathFormula latex={formula} />
        <p>{note}</p>
      </div>
      <div className="summary-verdict" aria-hidden="true">{index === "02" ? "最优 ⇒ KKT" : "KKT ⇒ 最优"}</div>
    </article>
  );
}
