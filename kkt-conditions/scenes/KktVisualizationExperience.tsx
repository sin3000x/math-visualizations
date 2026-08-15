"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MathFormula } from "@/components/math/MathFormula";
import { SvgFormula } from "@/components/math/SvgFormula";
import { Arrow } from "@/components/plot/Arrow";
import { CopyrightNotice } from "@/components/site/CopyrightNotice";
import {
  CONTOUR_RADII,
  MAX,
  MIN,
  PLOT_SCALE,
  PLOT_W,
  PLOT_X,
  VIEW_H,
  VIEW_W,
  fmt,
  sx,
  sy,
} from "@/lib/geometry/plot";
import type { Point } from "@/lib/geometry/plot";
import { contourSectionPath, project3d, SURFACE_LINES, surfacePath } from "@/lib/geometry/projection3d";
import { CURVE_A, WALL_TOLERANCE, cornerConstraintValues, cornerKktLambdas, curveBoundary } from "@/lib/math/kkt";
import { forceBalanceScene, gradientContourScene } from "@/lib/scenes/registry";
import { kktPresets as presets, kktSteps as steps, primerSteps } from "@/scenes/content";
import { conditionSteps, KktConditionsScene } from "@/scenes/KktConditionsScene";
import { cqSteps, KktConstraintQualificationsScene } from "@/scenes/KktConstraintQualificationsScene";
import { KktWorkedExampleScene, workedExampleSteps } from "@/scenes/KktWorkedExampleScene";
import { KktSummaryScene, summarySteps } from "@/scenes/KktSummaryScene";

export default function KktVisualizationExperience() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [primerStep, setPrimerStep] = useState(0);
  const [primerPoint, setPrimerPoint] = useState<Point>({ x: 1.55, y: 1.2 });
  const [step, setStep] = useState(0);
  const [conditionsStep, setConditionsStep] = useState(0);
  const [workedExampleStep, setWorkedExampleStep] = useState(0);
  const [cqStep, setCqStep] = useState(0);
  const [summaryStep, setSummaryStep] = useState(0);
  const [point, setPoint] = useState<Point>(presets[0].point);
  const [lambda, setLambda] = useState(0);
  const [cornerLambdas, setCornerLambdas] = useState(() => cornerKktLambdas(presets[3].point));
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const primerSvgRef = useRef<SVGSVGElement>(null);
  const isPrimer = sceneIndex === 0;
  const isForceBalance = sceneIndex === 1;
  const isConditionsAssembly = sceneIndex === 2;
  const isWorkedExample = sceneIndex === 3;
  const isCq = sceneIndex === 4;
  const isSummary = sceneIndex === 5;
  const hasCornerConstraints = step >= 3;
  const showsNormalCone = step === 4;
  const hasWall = step > 0 && !hasCornerConstraints;

  const selectStep = useCallback((next: number) => {
    setStep(next);
    setPoint(presets[next].point);
    setLambda(presets[next].lambda);
    if (next >= 3) setCornerLambdas(cornerKktLambdas(presets[next].point));
  }, []);

  const selectPrimerStep = useCallback((next: number) => {
    setPrimerStep(next);
    setPrimerPoint({ x: 1.55, y: 1.2 });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select") || target?.isContentEditable) return;

      if (event.key === "Escape" && isRecordingMode) {
        setIsRecordingMode(false);
        if (document.fullscreenElement) void document.exitFullscreen();
        return;
      }

      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault();
        if (isPrimer) selectPrimerStep(Math.min(primerSteps.length - 1, Number(event.key) - 1));
        else if (isForceBalance) selectStep(Number(event.key) - 1);
        else if (isConditionsAssembly) setConditionsStep(Math.min(conditionSteps.length - 1, Number(event.key) - 1));
        else if (isWorkedExample) setWorkedExampleStep(Math.min(workedExampleSteps.length - 1, Number(event.key) - 1));
        else if (isCq) setCqStep(Math.min(cqSteps.length - 1, Number(event.key) - 1));
        else setSummaryStep(Math.min(summarySteps.length - 1, Number(event.key) - 1));
        return;
      }

      const forward = event.key === "ArrowRight" || event.key === "PageDown";
      const backward = event.key === "ArrowLeft" || event.key === "PageUp";
      if (!forward && !backward) return;

      event.preventDefault();
      if (isPrimer) {
        if (forward && primerStep === primerSteps.length - 1) setSceneIndex(1);
        else selectPrimerStep(Math.max(0, Math.min(primerSteps.length - 1, primerStep + (forward ? 1 : -1))));
      } else if (isForceBalance) {
        if (backward && step === 0) {
          setSceneIndex(0);
          setPrimerStep(primerSteps.length - 1);
        } else if (forward && step === steps.length - 1) {
          setSceneIndex(2);
          setConditionsStep(0);
        } else {
          selectStep(Math.max(0, Math.min(steps.length - 1, step + (forward ? 1 : -1))));
        }
      } else if (isConditionsAssembly) {
        if (backward && conditionsStep === 0) {
          setSceneIndex(1);
          selectStep(steps.length - 1);
        } else if (forward && conditionsStep === conditionSteps.length - 1) {
          setSceneIndex(3);
          setWorkedExampleStep(0);
        } else {
          setConditionsStep(Math.max(0, Math.min(conditionSteps.length - 1, conditionsStep + (forward ? 1 : -1))));
        }
      } else if (isWorkedExample) {
        if (backward && workedExampleStep === 0) {
          setSceneIndex(2);
          setConditionsStep(conditionSteps.length - 1);
        } else if (forward && workedExampleStep === workedExampleSteps.length - 1) {
          setSceneIndex(4);
          setCqStep(0);
        } else {
          setWorkedExampleStep(Math.max(0, Math.min(workedExampleSteps.length - 1, workedExampleStep + (forward ? 1 : -1))));
        }
      } else if (isCq) {
        if (backward && cqStep === 0) {
          setSceneIndex(3);
          setWorkedExampleStep(workedExampleSteps.length - 1);
        } else if (forward && cqStep === cqSteps.length - 1) {
          setSceneIndex(5);
          setSummaryStep(0);
        } else {
          setCqStep(Math.max(0, Math.min(cqSteps.length - 1, cqStep + (forward ? 1 : -1))));
        }
      } else if (isSummary) {
        if (backward && summaryStep === 0) {
          setSceneIndex(4);
          setCqStep(cqSteps.length - 1);
        } else {
          setSummaryStep(Math.max(0, Math.min(summarySteps.length - 1, summaryStep + (forward ? 1 : -1))));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [conditionsStep, cqStep, isConditionsAssembly, isCq, isForceBalance, isPrimer, isRecordingMode, isSummary, isWorkedExample, primerStep, selectPrimerStep, selectStep, step, summaryStep, workedExampleStep]);

  async function toggleFullscreen() {
    (document.activeElement as HTMLElement | null)?.blur();
    if (isRecordingMode) {
      setIsRecordingMode(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }

    setIsRecordingMode(true);
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // The 16:9 recording layout still works when browser fullscreen is unavailable.
      }
    }
  }

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

  const contours = useMemo(() => CONTOUR_RADII, []);
  const curvePoints = useMemo(
    () => Array.from({ length: 41 }, (_, index) => {
      const x = (Math.sqrt(-MIN / CURVE_A) * index) / 40;
      return { x, y: curveBoundary(x) };
    }),
    [],
  );

  if (sceneIndex === 2) {
    return (
      <KktConditionsScene
        step={conditionsStep}
        isRecordingMode={isRecordingMode}
        onSelectStep={setConditionsStep}
        onToggleFullscreen={toggleFullscreen}
        onNextScene={() => { setSceneIndex(3); setWorkedExampleStep(0); }}
      />
    );
  }

  if (sceneIndex === 3) {
    return (
      <KktWorkedExampleScene
        step={workedExampleStep}
        isRecordingMode={isRecordingMode}
        onSelectStep={setWorkedExampleStep}
        onToggleFullscreen={toggleFullscreen}
        onNextScene={() => { setSceneIndex(4); setCqStep(0); }}
      />
    );
  }

  if (sceneIndex === 4) {
    return (
      <KktConstraintQualificationsScene
        step={cqStep}
        isRecordingMode={isRecordingMode}
        onSelectStep={setCqStep}
        onToggleFullscreen={toggleFullscreen}
        onNextScene={() => { setSceneIndex(5); setSummaryStep(0); }}
      />
    );
  }

  if (sceneIndex === 5) {
    return (
      <KktSummaryScene
        step={summaryStep}
        isRecordingMode={isRecordingMode}
        onSelectStep={setSummaryStep}
        onToggleFullscreen={toggleFullscreen}
      />
    );
  }

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
  }

  function pointerToPrimerWorld(event: React.PointerEvent<SVGSVGElement>) {
    const svg = primerSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = PLOT_X + ((event.clientX - rect.left) / rect.width) * PLOT_W;
    const svgY = ((event.clientY - rect.top) / rect.height) * VIEW_H;
    const x = Math.max(MIN, Math.min(MAX, MIN + (svgX - PLOT_X) / PLOT_SCALE));
    const y = Math.max(MIN, Math.min(MAX, MAX - svgY / PLOT_SCALE));
    setPrimerPoint({ x, y });
  }

  function handlePrimerPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerToPrimerWorld(event);
  }

  if (isPrimer) {
    const primerRadius = Math.hypot(primerPoint.x, primerPoint.y);
    const primerValue = primerRadius ** 2;
    const primerGrad = { x: 2 * primerPoint.x, y: 2 * primerPoint.y };
    const vectorScale = 0.34;
    const gradientVector = { x: primerGrad.x * vectorScale, y: primerGrad.y * vectorScale };
    const descentVector = { x: -primerGrad.x * vectorScale, y: -primerGrad.y * vectorScale };
    const radiusSafe = primerRadius || 1;
    const normal = { x: primerPoint.x / radiusSafe, y: primerPoint.y / radiusSafe };
    const tangent = { x: -primerPoint.y / radiusSafe, y: primerPoint.x / radiusSafe };
    const showVectors = primerStep >= 1 && primerRadius > 0.12;
    const showRelationship = primerStep === 2 && primerRadius > 0.12;
    const primerScene = gradientContourScene;
    const contourColors = ["#43e2d7", "#42cde4", "#54aef0", "#718bf2", "#9b70e8", "#ca63c8"];
    const point3d = project3d(primerPoint.x, primerPoint.y, primerValue);
    const floorPoint3d = project3d(primerPoint.x, primerPoint.y, 0);
    const gradLength = Math.hypot(primerGrad.x, primerGrad.y) || 1;
    const grad3dStep = 1.05;
    const grad3dEndX = primerPoint.x + (primerGrad.x / gradLength) * grad3dStep;
    const grad3dEndY = primerPoint.y + (primerGrad.y / gradLength) * grad3dStep;
    const grad3dEnd = project3d(grad3dEndX, grad3dEndY, 0);

    return (
      <main className={`site-shell primer-scene ${isRecordingMode ? "recording-mode" : ""}`}>
        <header className="topbar">
          <div className="brand"><span className="brand-mark">∇</span><span>KKT · 几何实验室</span></div>
          <div className="header-actions">
            <button className="fullscreen-button" onClick={toggleFullscreen} aria-label="进入全屏录屏模式">
              <span aria-hidden="true">⛶</span>全屏录制
            </button>
          </div>
        </header>

        <section className="hero-copy">
          <p className="kicker">INTERACTIVE MATHEMATICS · 预备知识</p>
          <h1>{primerScene.title}</h1>
          <p>{primerScene.summary}</p>
        </section>

        <section className="lab-layout">
          <div className="canvas-card">
            <div className="canvas-head">
              <div className="canvas-heading-copy">
                <span className="chapter-label">{primerSteps[primerStep].eyebrow}</span>
                <div className="canvas-title-row"><h2>{primerSteps[primerStep].title}</h2></div>
              </div>
              <div className="live-coordinates"><MathFormula latex={`x=(${fmt(primerPoint.x)},\\,${fmt(primerPoint.y)})`} /></div>
            </div>

            <div className="plot-wrap primer-plot-wrap">
              <div className="primer-views">
                <div className="primer-panel primer-panel-2d">
                  <span className="primer-panel-title">俯视 · 等高线</span>
                  <svg
                ref={primerSvgRef}
                className="math-plot primer-2d-plot"
                viewBox={`${PLOT_X} 0 ${PLOT_W} ${VIEW_H}`}
                role="img"
                aria-label="等高线与梯度的可拖动示意图"
                onPointerDown={handlePrimerPointerDown}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) pointerToPrimerWorld(event);
                }}
                onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
              >
                <defs>
                  <radialGradient id="primer-glow" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#273346" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#0d1119" stopOpacity="0" />
                  </radialGradient>
                  {(["red", "blue", "amber"] as const).map((tone) => (
                    <marker key={tone} id={`arrow-${tone}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                  ))}
                  <pattern id="primer-dot-grid" width="46.4" height="46.4" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#8290a5" fillOpacity="0.22" />
                  </pattern>
                </defs>
                <rect width={VIEW_W} height={VIEW_H} fill="#0d1119" rx="18" />
                <rect width={VIEW_W} height={VIEW_H} fill="url(#primer-glow)" rx="18" />
                <rect width={VIEW_W} height={VIEW_H} fill="url(#primer-dot-grid)" rx="18" />

                <g className="axes">
                  <line x1={0} y1={sy(0)} x2={VIEW_W} y2={sy(0)} />
                  <line x1={sx(0)} y1={0} x2={sx(0)} y2={VIEW_H} />
                  <SvgFormula x={sx(MAX) - 28} y={sy(0) - 30} width={35} latex="x_1" />
                  <SvgFormula x={sx(0) + 8} y={1} width={35} latex="x_2" />
                </g>

                <g className="contours primer-contours">
                  {contours.map((radius, index) => (
                    <circle
                      key={radius}
                      cx={sx(0)} cy={sy(0)} r={radius * PLOT_SCALE}
                      className="contour primer-value-contour"
                      style={{ stroke: contourColors[index] }}
                      data-level={fmt(radius * radius)}
                    />
                  ))}
                  {primerRadius > 0.12 && <circle cx={sx(0)} cy={sy(0)} r={primerRadius * PLOT_SCALE} className="active-contour" />}
                  <SvgFormula x={sx(1.5)} y={sy(1.62) - 18} width={130} latex="f(x)=c" suffix="等高线" className="contour-formula" />
                </g>

                {showRelationship && (
                  <g className="tangent-guide" data-role="tangent-line">
                    <line
                      x1={sx(primerPoint.x - tangent.x * 1.35)} y1={sy(primerPoint.y - tangent.y * 1.35)}
                      x2={sx(primerPoint.x + tangent.x * 1.35)} y2={sy(primerPoint.y + tangent.y * 1.35)}
                    />
                    <SvgFormula x={sx(primerPoint.x + tangent.x * 1.05) - 30} y={sy(primerPoint.y + tangent.y * 1.05) - 26} width={80} latex="t" className="tangent-formula" />
                    <path
                      d={`M ${sx(primerPoint.x + normal.x * 0.13)} ${sy(primerPoint.y + normal.y * 0.13)} L ${sx(primerPoint.x + (normal.x + tangent.x) * 0.13)} ${sy(primerPoint.y + (normal.y + tangent.y) * 0.13)} L ${sx(primerPoint.x + tangent.x * 0.13)} ${sy(primerPoint.y + tangent.y * 0.13)}`}
                      className="right-angle-mark"
                    />
                  </g>
                )}

                {showVectors && <Arrow from={primerPoint} vector={gradientVector} tone="amber" label="∇f" latex={"\\nabla f"} labelNormalOffset={18} />}
                {showRelationship && <Arrow from={primerPoint} vector={descentVector} tone="red" label="−∇f" latex={"-\\nabla f"} labelNormalOffset={20} />}

                <g className="particle" data-role="draggable-point">
                  <circle cx={sx(primerPoint.x)} cy={sy(primerPoint.y)} r="9" className="particle-core" />
                  <SvgFormula x={sx(primerPoint.x) + 13} y={sy(primerPoint.y) + 9} width={28} latex="x" className="particle-formula" />
                </g>
                  </svg>
                  <div className="plot-legend primer-legend" aria-hidden="true">
                    <span><i className="legend-contour" />等高线</span>
                    {primerStep >= 1 && <span><i className="legend-amber" />梯度</span>}
                    {primerStep === 2 && <span><i className="legend-red" />负梯度</span>}
                  </div>
                </div>

                <div className="primer-panel primer-panel-3d">
                  <span className="primer-panel-title">立体 · 函数曲面</span>
                  <svg className="primer-3d-plot" viewBox="0 0 520 520" role="img" aria-label="与等高线同步的三维函数曲面">
                    <defs>
                      <radialGradient id="surface-glow" cx="50%" cy="58%" r="65%">
                        <stop offset="0%" stopColor="#273346" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#0d1119" stopOpacity="0" />
                      </radialGradient>
                      <marker id="arrow-primer-3d" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                      </marker>
                    </defs>
                    <rect width="520" height="520" rx="18" fill="#0d1119" />
                    <rect width="520" height="520" rx="18" fill="url(#surface-glow)" />
                    <g className="surface-grid">
                      {SURFACE_LINES.map((fixed) => <path key={`x-${fixed}`} d={surfacePath(fixed, true)} />)}
                      {SURFACE_LINES.map((fixed) => <path key={`y-${fixed}`} d={surfacePath(fixed, false)} />)}
                    </g>
                    <g className="surface-contour-sections" aria-label="与左侧等高线对应的水平截线">
                      {contours.map((radius, index) => (
                        <path
                          key={radius}
                          d={contourSectionPath(radius)}
                          style={{ stroke: contourColors[index] }}
                          data-level={fmt(radius * radius)}
                        />
                      ))}
                    </g>
                    {primerRadius > 0.12 && (
                      <path
                        className="surface-active-contour"
                        d={contourSectionPath(primerRadius)}
                        data-level={fmt(primerValue)}
                      />
                    )}
                    <g className="surface-axes">
                      <line x1={project3d(MIN, 0, 0).x} y1={project3d(MIN, 0, 0).y} x2={project3d(MAX, 0, 0).x} y2={project3d(MAX, 0, 0).y} />
                      <line x1={project3d(0, MIN, 0).x} y1={project3d(0, MIN, 0).y} x2={project3d(0, MAX, 0).x} y2={project3d(0, MAX, 0).y} />
                      <line x1={project3d(0, 0, 0).x} y1={project3d(0, 0, 0).y} x2={project3d(0, 0, 14).x} y2={project3d(0, 0, 14).y} />
                      <SvgFormula x={project3d(MAX, 0, 0).x + 7} y={project3d(MAX, 0, 0).y - 17} width={36} latex="x_1" className="surface-formula" />
                      <SvgFormula x={project3d(0, MAX, 0).x - 26} y={project3d(0, MAX, 0).y - 17} width={36} latex="x_2" className="surface-formula" />
                      <SvgFormula x={project3d(0, 0, 14).x + 7} y={project3d(0, 0, 14).y - 17} width={55} latex="f(x)" className="surface-formula" />
                    </g>
                    <line className="height-guide" x1={floorPoint3d.x} y1={floorPoint3d.y} x2={point3d.x} y2={point3d.y} />
                    <circle className="surface-floor-point" cx={floorPoint3d.x} cy={floorPoint3d.y} r="4" />
                    {showVectors && (
                      <g className="surface-gradient">
                        <line x1={floorPoint3d.x} y1={floorPoint3d.y} x2={grad3dEnd.x} y2={grad3dEnd.y} markerEnd="url(#arrow-primer-3d)" />
                        <SvgFormula
                          x={(floorPoint3d.x + grad3dEnd.x) / 2 - 23}
                          y={(floorPoint3d.y + grad3dEnd.y) / 2 - 30}
                          width={70}
                          latex={"\\nabla f"}
                          className="surface-gradient-formula"
                        />
                      </g>
                    )}
                    <g className="surface-particle">
                      <circle cx={point3d.x} cy={point3d.y} r="9" />
                      <SvgFormula x={point3d.x + 13} y={point3d.y - 25} width={95} latex={`z=${fmt(primerValue)}`} className="surface-particle-formula" />
                    </g>
                  </svg>
                  <div className="surface-equation"><MathFormula latex="z=f(x_1,x_2)=x_1^2+x_2^2" /></div>
                </div>
              </div>
            </div>
            <p className="scene-copy">
              {primerStep === 0 ? (
                <>每一条圆环都是一条等高线：沿着它移动，<MathFormula latex={"f(x)"} /> 保持不变；跨过圆环，函数值才会改变。</>
              ) : primerStep === 1 ? (
                <>梯度 <MathFormula latex={"\\nabla f"} /> 指向函数增大最快的方向，箭头长度表示坡度大小；离谷底越远，坡越陡。</>
              ) : (
                <>沿等高线的切向移动不会改变函数值，所以梯度与切线正交；负梯度 <MathFormula latex={"-\\nabla f"} /> 则指向下降最快的方向。</>
              )}
            </p>
          </div>

          <aside className="inspector primer-inspector">
            <div className="inspector-title"><span>当前位置</span><span className="live-dot">LIVE</span></div>
            <div className="equation-block">
              <span className="equation-label">目标函数</span>
              <strong><MathFormula latex="f(x_1,x_2)=x_1^2+x_2^2" /></strong>
            </div>
            <div className="primer-metrics">
              <div><span>函数值</span><strong><MathFormula latex={`f(x)=${fmt(primerValue)}`} /></strong></div>
              <div><span>梯度</span><strong><MathFormula latex={`\\nabla f(x)=(${fmt(primerGrad.x)},\\,${fmt(primerGrad.y)})`} /></strong></div>
            </div>
            <div className="relationship-card">
              <span className={primerStep >= 0 ? "active" : ""}>① <MathFormula latex="f(x)=c" /> 描出等高线</span>
              <span className={primerStep >= 1 ? "active" : ""}>② <MathFormula latex={"\\nabla f"} /> 指向上升最快方向</span>
              <span className={primerStep >= 2 ? "active" : ""}>③ <MathFormula latex={"\\nabla f\\perp t"} />，切向变化为零</span>
            </div>
            {primerStep === 2 && (
              <div className="primer-conclusion">
                <strong><MathFormula latex={"D_t f=\\nabla f\\cdot t=0"} /></strong>
                <span>沿等高线走，函数值不变</span>
              </div>
            )}
          </aside>
        </section>

        <nav className="chapter-nav primer-nav" aria-label="等高线与梯度演示章节">
          {primerSteps.map((item, index) => (
            <button key={item.eyebrow} className={index === primerStep ? "active" : ""} onClick={() => selectPrimerStep(index)}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong>
            </button>
          ))}
          <button className="next-scene" onClick={() => setSceneIndex(1)}><span>下一幕 →</span><strong>进入 KKT 力的平衡</strong></button>
        </nav>

        <footer><span>核心关系</span><strong><MathFormula latex={"\\nabla f(x)\\perp\\{f(x)=c\\}"} /></strong><span>负梯度指向下降最快方向</span><CopyrightNotice /></footer>
      </main>
    );
  }

  return (
    <main className={`site-shell force-balance-scene ${isRecordingMode ? "recording-mode" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">∇</span>
          <span>KKT · 几何实验室</span>
        </div>
        <div className="header-actions">
          <button className="fullscreen-button" onClick={toggleFullscreen} aria-label="进入全屏录屏模式">
            <span aria-hidden="true">⛶</span>
            全屏录制
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <p className="kicker">INTERACTIVE MATHEMATICS · 交互数学</p>
        <h1>{forceBalanceScene.title}</h1>
        <p>{forceBalanceScene.summary}</p>
      </section>

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
                  labelNormalOffset={78}
                  labelTangentOffset={38}
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
                      labelNormalOffset={-55}
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

      <nav className="chapter-nav force-nav" aria-label="KKT 演示章节">
        {steps.map((item, index) => (
          <button
            key={item.eyebrow}
            className={index === step ? "active" : ""}
            onClick={() => selectStep(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
        <button className="next-scene" onClick={() => { setSceneIndex(2); setConditionsStep(0); }}>
          <span>下一幕 →</span>
          <strong>把图景写成 KKT 条件</strong>
        </button>
      </nav>

      <footer>
        <span>KKT 的几何本质</span>
        <strong><MathFormula latex={"-\\nabla f(x^\\ast) \\in N_F(x^\\ast)"} /></strong>
        <span>下降方向落入可行域的法向锥</span>
        <CopyrightNotice />
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
