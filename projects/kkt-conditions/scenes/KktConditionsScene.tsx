"use client";

import { useState } from "react";
import { MathFormula } from "@/components/math/MathFormula";
import { CopyrightNotice } from "@/components/site/CopyrightNotice";
import { conditionsAssemblyScene } from "@/lib/scenes/registry";

export const conditionSteps = [
  {
    eyebrow: "01 · 原始可行",
    title: "不能穿墙",
    body: "不等式要求位置始终留在可行域内。点可以在区域内部，也可以贴着边界，但不能越过边界。",
  },
  {
    eyebrow: "02 · 对偶可行",
    title: "墙只能推，不能吸",
    body: "约束乘子必须非负，所以墙的支持力只能沿内法线把点推回可行域，不能反向把点吸向墙。",
  },
  {
    eyebrow: "03 · 互补松弛",
    title: "不接触就没有支持力",
    body: "在区域内部，约束有余量，所以乘子必须为零；乘子非零时，约束必定恰好处于边界。",
  },
  {
    eyebrow: "04 · 驻点条件",
    title: "最优点处所有力平衡",
    body: "目标函数的下降力与所有激活约束的支持力相加为零，这就是一阶平衡条件。",
  },
  {
    eyebrow: "05 · 等式约束",
    title: "小球穿在一根光滑杆上",
    body: "等式约束像一根无厚度的光滑杆：小球只能沿杆运动，杆可以从法线两侧施力，因此对应乘子可以取任意实数。",
  },
] as const;

type Props = {
  step: number;
  isRecordingMode: boolean;
  onSelectStep: (step: number) => void;
  onToggleFullscreen: () => void;
  onNextScene: () => void;
};

const inequalityConditions = [
  { key: "primal", name: "不能穿墙", term: "原始可行", formula: "g_i(x)\\le 0" },
  { key: "dual", name: "墙只能推，不能吸", term: "对偶可行", formula: "\\lambda_i\\ge 0" },
  { key: "comp", name: "不接触就没有支持力", term: "互补松弛", formula: "\\lambda_i g_i(x)=0" },
  { key: "stationary", name: "最优点处所有力平衡", term: "驻点条件", formula: "\\nabla f(x)+\\sum_i\\lambda_i\\nabla g_i(x)=0" },
] as const;

const contactCases = [
  { kind: "inside", title: "没靠墙", formula: "\\lambda_i=0,\\quad g_i(x)<0", explanation: "点在可行域内部，墙没有接触它，因此没有支持力。" },
  { kind: "pressed", title: "有外力挤压墙", formula: "\\lambda_i>0,\\quad g_i(x)=0", explanation: "点贴住边界并受到外力挤压，墙产生反向支持力。" },
  { kind: "touching", title: "轻轻接触墙", formula: "\\lambda_i=0,\\quad g_i(x)=0", explanation: "点恰好位于边界，但没有外力压墙，所以支持力仍为零。" },
] as const;

export function KktConditionsScene({ step, isRecordingMode, onSelectStep, onToggleFullscreen, onNextScene }: Props) {
  const [contactCaseIndex, setContactCaseIndex] = useState(0);
  const hasEquality = step === conditionSteps.length - 1;
  const activeConditionCount = Math.min(4, step + 1);
  const diagramMode = step === 0 ? "feasible" : step === 1 ? "one-way" : step === 3 ? "balance" : "equality";

  return (
    <main className={`site-shell conditions-scene ${isRecordingMode ? "recording-mode" : ""}`}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">∇</span><span>KKT · 几何实验室</span></div>
        <div className="header-actions">
          <button className="fullscreen-button" onClick={onToggleFullscreen} aria-label="进入全屏录屏模式">
            <span aria-hidden="true">⛶</span>全屏录制
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="kicker">INTERACTIVE MATHEMATICS · 条件组装</p>
        <h1>{conditionsAssemblyScene.title}</h1>
        <p>{conditionsAssemblyScene.summary}</p>
      </section>

      <section className="conditions-stage">
        <div className="conditions-main-card">
          <div className="canvas-head conditions-head">
            <div className="canvas-heading-copy">
              <span className="chapter-label">{conditionSteps[step].eyebrow}</span>
              <h2>{conditionSteps[step].title}</h2>
            </div>
            <div className={`constraint-kind ${hasEquality ? "with-equality" : ""}`}>
              <span>{hasEquality ? "不等式 + 等式" : "仅不等式"}</span>
            </div>
          </div>

          <div className="conditions-board">
            <div className="problem-column">
              <span className="board-label">优化问题</span>
              <div className="problem-formula">
                <MathFormula latex={hasEquality
                  ? "\\begin{aligned}\\min_x\\quad & f(x)\\\\ \\text{s.t.}\\quad & g_i(x)\\le0,\\quad i=1,\\ldots,m\\\\ & h_j(x)=0,\\quad j=1,\\ldots,p\\end{aligned}"
                  : "\\begin{aligned}\\min_x\\quad & f(x)\\\\ \\text{s.t.}\\quad & g_i(x)\\le0,\\quad i=1,\\ldots,m\\end{aligned}"
                } />
              </div>

              {step === 2 ? (
                <div className="contact-cases" aria-label="互补松弛的三种接触情况">
                  <div className="contact-case-tabs" role="tablist" aria-label="选择接触状态">
                    {contactCases.map((item, index) => (
                      <button
                        key={item.kind}
                        type="button"
                        role="tab"
                        aria-selected={index === contactCaseIndex}
                        className={index === contactCaseIndex ? "active" : ""}
                        onClick={() => setContactCaseIndex(index)}
                      >
                        <span>{index + 1}</span>{item.title}
                      </button>
                    ))}
                  </div>
                  <ContactCase {...contactCases[contactCaseIndex]} featured />
                  <div className="contact-conclusion">
                    <span>三种允许情况统一写成</span>
                    <strong><MathFormula latex={"\\lambda_i g_i(x)=0"} /></strong>
                  </div>
                </div>
              ) : (
              <div className={`force-analogy diagram-${diagramMode}`} aria-label={`${conditionSteps[step].title}的示意图`}>
                <svg viewBox="0 0 440 210" role="img">
                  <defs>
                    <marker id="condition-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0 0 L10 5 L0 10z" />
                    </marker>
                    <marker id="condition-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0 0 L10 5 L0 10z" />
                    </marker>
                    <marker id="condition-arrow-violet" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0 0 L10 5 L0 10z" />
                    </marker>
                  </defs>
                  {step === 3 ? (
                    <>
                      <path d="M32 18 L224 18 L224 126 L32 126 Z" className="condition-feasible-fill" />
                      <line x1="32" y1="126" x2="224" y2="126" className="condition-boundary" />
                      <line x1="224" y1="18" x2="224" y2="126" className="condition-boundary" />
                      <circle cx="224" cy="126" r="9" className="condition-particle" />
                      <line x1="224" y1="126" x2="284" y2="186" className="condition-drive" markerEnd="url(#condition-arrow-red)" />
                      <line x1="224" y1="126" x2="224" y2="66" className="condition-reaction" markerEnd="url(#condition-arrow-blue)" />
                      <line x1="224" y1="126" x2="164" y2="126" className="condition-reaction" markerEnd="url(#condition-arrow-blue)" />
                    </>
                  ) : (
                    <>
                      <line x1="32" y1="126" x2="408" y2="126" className="condition-boundary" />
                      <path d="M32 126 L408 126 L408 18 L32 18 Z" className="condition-feasible-fill" />
                      {hasEquality && <line x1="64" y1="46" x2="384" y2="206" className="equality-track" />}
                      <circle cx="224" cy={step === 0 ? 72 : 126} r="9" className="condition-particle" />
                      {hasEquality ? (
                        <>
                          <line x1="224" y1="126" x2="249" y2="156" className="condition-drive" markerEnd="url(#condition-arrow-red)" />
                          <line x1="224" y1="126" x2="224" y2="46" className="condition-reaction" markerEnd="url(#condition-arrow-blue)" />
                          <line x1="224" y1="126" x2="199" y2="176" className="condition-equality-force" markerEnd="url(#condition-arrow-violet)" />
                        </>
                      ) : (
                        <>
                          {step >= 1 && <line x1="224" y1="126" x2="224" y2="188" className="condition-drive" markerEnd="url(#condition-arrow-red)" />}
                          {step >= 1 && <line x1="224" y1="126" x2="224" y2="64" className="condition-reaction" markerEnd="url(#condition-arrow-blue)" />}
                        </>
                      )}
                    </>
                  )}
                </svg>
                {step === 0 && <div className="diagram-message"><strong>区域内部：没有支持力</strong><MathFormula latex={"g_i(x)<0,\\quad \\lambda_i=0"} /></div>}
                {step >= 1 && <div className="force-caption red"><MathFormula latex={"-\\nabla f"} /><span>下降力</span></div>}
                {step >= 1 && <div className="force-caption blue"><MathFormula latex={step === 3 ? "-\\lambda_1\\nabla g_1,\\;-\\lambda_2\\nabla g_2" : "-\\lambda_i\\nabla g_i"} /><span>{step === 1 ? "只能向可行域一侧推" : step === 3 ? "两条边各自提供法向支持力" : "单向支持力"}</span></div>}
                {hasEquality && <div className="force-caption violet"><MathFormula latex={"-\\nu_j\\nabla h_j"} /><span>双向约束力</span></div>}
              </div>
              )}
            </div>

            <div className="conditions-column">
              <span className="board-label">整套条件可以理解为</span>
              <div className="condition-list">
                {inequalityConditions.map((condition, index) => (
                  <div key={condition.key} className={`condition-item ${index < activeConditionCount || hasEquality ? "active" : "pending"}`}>
                    <span className="condition-index">{index + 1}</span>
                    <div>
                      <strong>{condition.name}</strong>
                      <div className="condition-formula"><MathFormula latex={condition.formula} /></div>
                      <small>{condition.term}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {hasEquality ? (
            <div className="equality-addition">
              <div><span>等式可行</span><strong><MathFormula latex={"h_j(x)=0"} /></strong></div>
              <div><span>乘子自由</span><strong><MathFormula latex={"\\nu_j\\in\\mathbb{R}"} /></strong></div>
              <div className="equality-lagrangian"><span>完整拉格朗日函数</span><strong><MathFormula latex={"L(x,\\lambda,\\nu)=f(x)+\\sum_i\\lambda_i g_i(x)+\\sum_j\\nu_j h_j(x)"} /></strong></div>
            </div>
          ) : (
            <div className="inequality-lagrangian">
              <span>当前拉格朗日函数</span>
              <strong><MathFormula latex={"L(x,\\lambda)=f(x)+\\sum_i\\lambda_i g_i(x)"} /></strong>
            </div>
          )}

          <p className="scene-copy">{conditionSteps[step].body}</p>
        </div>

      </section>

      <nav className="chapter-nav conditions-nav" aria-label="KKT 条件组装章节">
        {conditionSteps.map((item, index) => (
          <button key={item.eyebrow} className={index === step ? "active" : ""} onClick={() => onSelectStep(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
        <button className="next-scene" onClick={onNextScene}>
          <span>下一幕 →</span>
          <strong>一起手算完整例题</strong>
        </button>
      </nav>

      <footer><span>完整 KKT 驻点条件</span><strong><MathFormula latex={"\\nabla f+\\sum_i\\lambda_i\\nabla g_i+\\sum_j\\nu_j\\nabla h_j=0"} /></strong><CopyrightNotice /></footer>
    </main>
  );
}

function ContactCase({
  kind,
  title,
  formula,
  explanation,
  featured = false,
}: {
  kind: "inside" | "pressed" | "touching";
  title: string;
  formula: string;
  explanation?: string;
  featured?: boolean;
}) {
  const particleY = kind === "inside" ? 30 : 56;
  return (
    <div className={`contact-case contact-${kind} ${featured ? "featured" : ""}`}>
      <svg viewBox="0 0 120 92" aria-hidden="true">
        <line x1="12" y1="64" x2="108" y2="64" />
        <circle cx="60" cy={particleY} r="8" />
        {kind === "pressed" && (
          <>
            <line x1="60" y1="56" x2="60" y2="80" className="external-force" />
            <polygon points="54,76 66,76 60,87" className="external-tip" />
            <line x1="60" y1="56" x2="60" y2="32" className="support-force" />
            <polygon points="54,36 66,36 60,25" className="support-tip" />
          </>
        )}
      </svg>
      <strong>{title}</strong>
      <MathFormula latex={formula} />
      {explanation && <p>{explanation}</p>}
    </div>
  );
}
