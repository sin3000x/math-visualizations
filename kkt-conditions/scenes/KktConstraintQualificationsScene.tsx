"use client";

import { MathFormula } from "@/components/math/MathFormula";
import { SvgFormula } from "@/components/math/SvgFormula";
import { CopyrightNotice } from "@/components/site/CopyrightNotice";
import { constraintQualificationsScene } from "@/lib/scenes/registry";

export const cqSteps = [
  {
    eyebrow: "01 · 为什么需要 CQ",
    title: "先确认“墙”的描述没有退化",
    summary: "CQ 不负责求最优点；它排除坏掉的约束描述，让边界法向真的能够代表局部几何。",
  },
  {
    eyebrow: "02 · LICQ",
    title: "活跃约束的法向量不能重复",
    summary: "如果活跃约束的梯度线性无关，每一面墙都提供一个真正独立的法向方向。",
  },
  {
    eyebrow: "03 · MFCQ",
    title: "要能找到同时离开所有墙的方向",
    summary: "不要求所有法向都独立，只要求存在一个方向，在保持等式约束的同时严格走入每个活跃不等式的内部。",
  },
  {
    eyebrow: "04 · Slater",
    title: "凸问题里，找一个严格内点",
    summary: "只要能在所有不等式墙内找到一个留有余量的点，凸问题就满足最常用的全局 CQ。",
  },
  {
    eyebrow: "05 · 必要还是充分",
    title: "CQ 管必要性，凸性管充分性",
    summary: "CQ 回答“最优点是否一定能写出 KKT”；凸性回答“满足 KKT 是否就一定是全局最优”。",
  },
] as const;

type Props = {
  step: number;
  isRecordingMode: boolean;
  onSelectStep: (step: number) => void;
  onToggleFullscreen: () => void;
  onNextScene: () => void;
};

export function KktConstraintQualificationsScene({ step, isRecordingMode, onSelectStep, onToggleFullscreen, onNextScene }: Props) {
  return (
    <main className={`site-shell cq-scene ${isRecordingMode ? "recording-mode" : ""}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">∇</span><span>KKT · 几何实验室</span></div>
        <div className="header-actions">
          <button className="fullscreen-button" onClick={onToggleFullscreen} aria-label="进入全屏录屏模式">
            <span aria-hidden="true">⛶</span>全屏录制
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="kicker">INTERACTIVE MATHEMATICS · CONSTRAINT QUALIFICATIONS</p>
        <h1>{constraintQualificationsScene.title}</h1>
        <p>{constraintQualificationsScene.summary}</p>
      </section>

      <section className="cq-stage">
        <div className="cq-card">
          <div className="canvas-head cq-head">
            <div className="canvas-heading-copy">
              <span className="chapter-label">{cqSteps[step].eyebrow}</span>
              <h2>{cqSteps[step].title}</h2>
            </div>
            <div className="cq-purpose">KKT 的使用许可证</div>
          </div>

          <div className="cq-board">
            <div className="cq-visual-column">
              <span className="board-label">几何直觉</span>
              <CqDiagram step={step} />
            </div>
            <aside className="cq-explanation-column">
              <span className="board-label">这一条在检查什么？</span>
              <div className="cq-step-number">{String(step + 1).padStart(2, "0")}</div>
              <h3>{cqSteps[step].title}</h3>
              <p>{cqSteps[step].summary}</p>
              <CqExplanation step={step} />
            </aside>
          </div>
        </div>
      </section>

      <nav className="chapter-nav cq-nav" aria-label="约束资格条件章节">
        {cqSteps.map((item, index) => (
          <button key={item.eyebrow} className={index === step ? "active" : ""} onClick={() => onSelectStep(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
        <button className="next-scene" onClick={onNextScene}>
          <span>下一幕 →</span>
          <strong>最后带走这三句话</strong>
        </button>
      </nav>

      <footer>
        <span>CQ 的作用</span>
        <strong><MathFormula latex={"\\text{局部最优}+\\text{CQ}\\;\\Longrightarrow\\;\\text{KKT 乘子存在}"} /></strong>
        <CopyrightNotice />
      </footer>
    </main>
  );
}

function CqExplanation({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="cq-explanation">
        <div className="cq-formula-card">
          <span>同一个可行域</span>
          <MathFormula latex={"x\\ge0"} />
        </div>
        <div className="cq-contrast-list">
          <div><strong>正常描述</strong><MathFormula latex={"\\begin{aligned}g(x)&=-x\\\\ \\nabla g(0)&=-1\\end{aligned}"} /></div>
          <div className="bad"><strong>退化描述</strong><MathFormula latex={"\\begin{aligned}\\tilde g(x)&=-x^3\\\\ \\nabla \\tilde g(0)&=0\\end{aligned}"} /></div>
        </div>
        <div className="cq-failure"><strong>为什么会无法平衡？</strong><span>退化后 <MathFormula latex={"\\nabla \\tilde g(0)=0"} />，无论把 <MathFormula latex={"\\lambda"} /> 调多大，约束力 <MathFormula latex={"-\\lambda\\nabla\\tilde g"} /> 都是零，无法抵消非零下降力。</span></div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="cq-explanation">
        <div className="cq-definition">
          <span>LICQ</span>
          <MathFormula latex={"\\{\\nabla g_i(x^*)\\}_{i\\in\\mathcal A(x^*)}\\cup\\{\\nabla h_j(x^*)\\}_j\\;\\text{线性无关}"} />
        </div>
        <div className="cq-plain-language"><strong>直白地说</strong><span>每个活跃约束都要贡献一个新方向，不能只是把同一面墙重复写几遍。</span></div>
        <div className="cq-failure"><strong>不满足就无法平衡吗？</strong><span>不一定。重复法向仍可能合成平衡力，但同一股支持力能被多组 <MathFormula latex={"\\lambda_i"} /> 拆分，乘子不再唯一；更严重的退化还可能让 KKT 乘子不存在。</span></div>
        <div className="cq-consequence"><span>局部最优时</span><MathFormula latex={"\\text{LICQ}\\;\\Longrightarrow\\;\\text{乘子存在且唯一}"} /></div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="cq-explanation">
        <div className="cq-definition">
          <span>MFCQ</span>
          <MathFormula latex={"\\begin{aligned}&\\{\\nabla h_j(x^*)\\}_{j=1}^p\\text{ 线性无关},\\\\ &\\exists d\\text{ 使得}\\\\ &\\nabla h_j(x^*)^\\top d=0\\quad(j=1,\\ldots,p),\\\\ &\\nabla g_i(x^*)^\\top d<0\\quad(i\\in\\mathcal A(x^*))\\end{aligned}"} />
        </div>
        <div className="cq-plain-language"><strong>直白地说</strong><span>沿着等式约束允许的方向，必须能一步同时离开所有正在接触的墙。</span></div>
        <div className="cq-failure"><strong>为什么平衡会失去保证？</strong><span>没有共同内移方向时，几面墙的法向可能先彼此形成“自平衡”。乘子可以无限放大，下降力也未必能被一组有限支持力可靠地分解。</span></div>
        <div className="cq-consequence"><span>局部最优时</span><MathFormula latex={"\\text{MFCQ}\\;\\Longrightarrow\\;\\text{乘子存在且有界}"} /></div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="cq-explanation">
        <div className="cq-definition">
          <span>Slater</span>
          <MathFormula latex={"\\exists \\bar x:\\quad g_i(\\bar x)<0,\\qquad A\\bar x=b"} />
        </div>
        <div className="cq-convex-note"><strong>什么是凸问题？</strong><span>目标函数和不等式函数都是“碗形”的凸函数，等式约束是直线或平面；任取两个可行点，它们之间的整条线段仍然可行。</span></div>
        <div className="cq-plain-language"><strong>直白地说</strong><span>在凸可行域里找到一个不贴任何不等式边界、仍满足等式约束的点。</span></div>
        <div className="cq-failure"><strong>没有严格内点会怎样？</strong><span>可行域可能被压在边界上，分离超平面与强对偶证明会断掉；最优点仍可能平衡，但不能再由 Slater 保证存在有限的 KKT 支持力。</span></div>
        <div className="cq-consequence"><span>满足时</span><MathFormula latex={"\\text{强对偶，且 KKT 必要且充分}"} /></div>
      </div>
    );
  }

  return (
    <div className="cq-explanation cq-kkt-logic">
      <div className="cq-logic-card necessity">
        <strong>必要性：需要 CQ</strong>
        <MathFormula latex={"x^*\\text{ 局部最优}+\\text{CQ}\\;\\Longrightarrow\\;\\exists(\\lambda^*,\\nu^*)\\text{ 满足 KKT}"} />
        <span>没有 CQ，最优点仍然可能满足 KKT，但“一定存在乘子”这条保证消失。</span>
      </div>
      <div className="cq-logic-card sufficiency">
        <strong>充分性：依靠凸性</strong>
        <MathFormula latex={"\\text{凸问题}+\\text{KKT}\\;\\Longrightarrow\\;x^*\\text{ 是全局最优}"} />
        <span>这个方向不靠 CQ：凸问题里，只要找到一个 KKT 点，它就已经是全局最优。</span>
      </div>
      <div className="cq-logic-card equivalence">
        <strong>凸问题 + Slater</strong>
        <MathFormula latex={"x^*\\text{ 最优}\\;\\Longleftrightarrow\\;\\exists(\\lambda^*,\\nu^*)\\text{ 满足 KKT}"} />
      </div>
    </div>
  );
}

function CqDiagram({ step }: { step: number }) {
  if (step === 0) return <DegenerateConstraintDiagram />;
  if (step === 1) return <LicqDiagram />;
  if (step === 2) return <MfcqDiagram />;
  if (step === 3) return <SlaterDiagram />;
  return <CqRelationshipDiagram />;
}

function CqSvgFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return <svg className="cq-diagram" viewBox="0 0 760 470" preserveAspectRatio="xMidYMin meet" role="img" aria-label={label}>{children}</svg>;
}

function DiagramDefs() {
  return (
    <defs>
      <marker id="cq-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
      <marker id="cq-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
      <marker id="cq-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker>
    </defs>
  );
}

function DegenerateConstraintDiagram() {
  return (
    <CqSvgFrame label="相同可行域的正常约束描述与退化约束描述对比">
      <DiagramDefs />
      <text x="185" y="45" className="cq-panel-title">正常描述</text>
      <text x="565" y="45" className="cq-panel-title">退化描述</text>
      <g transform="translate(0 -88)">
        {[190, 570].map((cx) => <g key={cx}>
          <line x1={cx - 125} y1="265" x2={cx + 125} y2="265" className="cq-axis" />
          <line x1={cx} y1="245" x2={cx} y2="285" className="cq-boundary" />
          <line x1={cx} y1="265" x2={cx + 120} y2="265" className="cq-feasible-ray" />
          <circle cx={cx} cy="265" r="9" className="cq-point" />
          <line x1={cx} y1="265" x2={cx - 80} y2="265" className="cq-drive-arrow" markerEnd="url(#cq-arrow-red)" />
        </g>)}
        <line x1="190" y1="265" x2="270" y2="265" className="cq-support-arrow" markerEnd="url(#cq-arrow-blue)" />
        <circle cx="570" cy="265" r="25" className="cq-zero-gradient" />
        <SvgFormula x={90} y={305} width={205} latex={"\\begin{aligned}g(x)&=-x\\\\ \\nabla g(0)&=-1\\end{aligned}"} className="cq-label-good" />
        <SvgFormula x={470} y={305} width={235} latex={"\\begin{aligned}\\tilde g(x)&=-x^3\\\\ \\nabla\\tilde g(0)&=0\\end{aligned}"} className="cq-label-bad" />
        <SvgFormula x={84} y={190} width={145} latex={"-\\nabla f"} className="cq-label-red" />
        <SvgFormula x={235} y={220} width={170} latex={"-\\lambda\\nabla g"} className="cq-label-blue" />
        <text x="570" y="500" textAnchor="middle" className="cq-diagram-note bad">没有法向，支持力无从产生</text>
      </g>
    </CqSvgFrame>
  );
}

function LicqDiagram() {
  return (
    <CqSvgFrame label="LICQ 成立与失败时活跃约束法向量的对比">
      <DiagramDefs />
      <text x="190" y="45" className="cq-panel-title">LICQ 成立</text>
      <text x="570" y="45" className="cq-panel-title">LICQ 失败</text>
      <path d="M75 350 L305 350 L305 120 L75 120 Z" className="cq-feasible-fill" />
      <line x1="305" y1="110" x2="305" y2="350" className="cq-wall" />
      <line x1="75" y1="350" x2="315" y2="350" className="cq-wall" />
      <circle cx="305" cy="350" r="9" className="cq-point" />
      <line x1="305" y1="350" x2="225" y2="350" className="cq-normal-arrow" markerEnd="url(#cq-arrow-blue)" />
      <line x1="305" y1="350" x2="305" y2="430" className="cq-normal-arrow" markerEnd="url(#cq-arrow-blue)" />
      <SvgFormula x={170} y={300} width={155} latex={"\\nabla g_1"} className="cq-label-blue" />
      <SvgFormula x={325} y={415} width={145} latex={"\\nabla g_2"} className="cq-label-blue" />

      <path d="M520 110 L700 110 L700 420 L520 420 Z" className="cq-feasible-fill" />
      <line x1="520" y1="100" x2="520" y2="430" className="cq-wall" />
      <circle cx="520" cy="265" r="9" className="cq-point" />
      <line x1="520" y1="250" x2="440" y2="250" className="cq-normal-arrow" markerEnd="url(#cq-arrow-blue)" />
      <line x1="520" y1="280" x2="440" y2="280" className="cq-normal-arrow duplicate" markerEnd="url(#cq-arrow-blue)" />
      <SvgFormula x={370} y={190} width={270} latex={"\\nabla g_2=2\\nabla g_1"} className="cq-label-blue" />
      <text x="570" y="450" textAnchor="middle" className="cq-diagram-note bad">同一面墙被重复编码</text>
    </CqSvgFrame>
  );
}

function MfcqDiagram() {
  return (
    <CqSvgFrame label="MFCQ 的共同内移方向存在与不存在的对比">
      <DiagramDefs />
      <text x="190" y="45" className="cq-panel-title">存在共同内移方向</text>
      <text x="570" y="45" className="cq-panel-title">不存在共同方向</text>
      <path d="M80 360 L310 360 L310 120 L80 120 Z" className="cq-feasible-fill" />
      <line x1="310" y1="110" x2="310" y2="360" className="cq-wall" />
      <line x1="70" y1="360" x2="320" y2="360" className="cq-wall" />
      <circle cx="310" cy="360" r="9" className="cq-point" />
      <line x1="310" y1="360" x2="220" y2="270" className="cq-escape-arrow" markerEnd="url(#cq-arrow-amber)" />
      <SvgFormula x={205} y={220} width={160} latex={"d"} className="cq-label-amber" />
      <text x="190" y="445" textAnchor="middle" className="cq-diagram-note good">一步同时离开两面墙</text>

      <line x1="570" y1="110" x2="570" y2="360" className="cq-wall" />
      <circle cx="570" cy="265" r="9" className="cq-point" />
      <line x1="570" y1="250" x2="480" y2="250" className="cq-conflict-arrow" markerEnd="url(#cq-arrow-red)" />
      <line x1="570" y1="280" x2="660" y2="280" className="cq-conflict-arrow" markerEnd="url(#cq-arrow-red)" />
      <SvgFormula x={425} y={205} width={145} latex={"d_1<0"} className="cq-label-bad cq-conflict-formula" />
      <SvgFormula x={590} y={300} width={155} latex={"-d_1<0"} className="cq-label-bad cq-conflict-formula" />
      <text x="570" y="445" textAnchor="middle" className="cq-diagram-note bad">两个要求互相冲突</text>
    </CqSvgFrame>
  );
}

function SlaterDiagram() {
  return (
    <CqSvgFrame label="凸可行域中的 Slater 严格内点">
      <path d="M150 385 Q110 255 205 130 Q340 55 525 125 Q650 215 585 365 Q390 435 150 385 Z" className="cq-slater-region" />
      <path d="M150 385 Q110 255 205 130 Q340 55 525 125 Q650 215 585 365 Q390 435 150 385 Z" className="cq-slater-boundary" />
      <circle cx="365" cy="255" r="13" className="cq-slater-point" />
      <circle cx="365" cy="255" r="58" className="cq-slater-margin" />
      <SvgFormula x={392} y={235} width={180} latex={"\\bar x"} className="cq-label-amber" />
      <SvgFormula x={275} y={315} width={205} latex={"g_i(\\bar x)<0"} className="cq-label-good" />
      <text x="365" y="45" textAnchor="middle" className="cq-panel-title">存在严格内点：与每一面墙都有余量</text>
      <text x="365" y="450" textAnchor="middle" className="cq-diagram-note good">（不是要求最优点在内部）</text>
    </CqSvgFrame>
  );
}

function CqRelationshipDiagram() {
  return (
    <div className="cq-relationship-diagram" role="img" aria-label="LICQ、MFCQ、ACQ、GCQ 与 Slater 的关系">
      <div className="cq-chain">
        <span>更强、更容易直接检查</span>
        <div><strong>LICQ</strong><b>⇒</b><strong>MFCQ</strong><b>⇒</b><strong>ACQ</strong><b>⇒</b><strong>GCQ</strong></div>
        <small>越往右条件越弱，但会用到切锥、线性化锥等更抽象的集合。</small>
      </div>
      <div className="cq-slater-lane">
        <strong>Slater</strong>
        <span>凸问题的另一条捷径</span>
        <MathFormula latex={"\\text{严格可行}\\;\\Longrightarrow\\;\\text{强对偶与 KKT}"} />
      </div>
      <div className="cq-license-result">
        <span>共同目标</span>
        <MathFormula latex={"\\text{把几何法向可靠地变成 KKT 乘子}"} />
      </div>
    </div>
  );
}
