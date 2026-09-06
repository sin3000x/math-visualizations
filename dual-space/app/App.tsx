import { useCallback, useEffect, useState } from "react";
import { getConceptScenes } from "../lib/scenes/registry";
import { BagVectorSpaceScene } from "../scenes/BagVectorSpaceScene";
import { bagVectorSpaceStepCount, introSteps } from "../scenes/content";
import { DualSpaceIntroScene } from "../scenes/DualSpaceIntroScene";

const conceptScenes = getConceptScenes("dual-space-episode-1");
const sceneStepCounts = [introSteps.length, bagVectorSpaceStepCount] as const;

export default function App() {
  const [recording, setRecording] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [step, setStep] = useState(0);
  const scene = conceptScenes[sceneIndex];
  const stepCount = sceneStepCounts[sceneIndex];

  const navigate = useCallback((direction: 1 | -1) => {
    const next = step + direction;
    if (next >= 0 && next < sceneStepCounts[sceneIndex]) {
      setStep(next);
      return;
    }
    if (direction === 1 && sceneIndex < conceptScenes.length - 1) {
      setSceneIndex(sceneIndex + 1);
      setStep(0);
      return;
    }
    if (direction === -1 && sceneIndex > 0) {
      const previousScene = sceneIndex - 1;
      setSceneIndex(previousScene);
      setStep(sceneStepCounts[previousScene] - 1);
    }
  }, [sceneIndex, step]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select") || target?.isContentEditable) return;

      if (event.key === "Escape" && recording) {
        setRecording(false);
        if (document.fullscreenElement) void document.exitFullscreen();
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const next = Number(event.key) - 1;
        if (next < sceneStepCounts[sceneIndex]) {
          event.preventDefault();
          setStep(next);
        }
        return;
      }

      const forward = event.key === "ArrowRight" || event.key === "PageDown";
      const backward = event.key === "ArrowLeft" || event.key === "PageUp";
      if (!forward && !backward) return;

      event.preventDefault();
      navigate(forward ? 1 : -1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, recording, sceneIndex]);

  useEffect(() => {
    const syncFullscreenState = () => {
      if (!document.fullscreenElement) setRecording(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  async function enterRecording() {
    setStep(0);
    setRecording(true);
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // CSS recording mode remains available when native fullscreen is blocked.
      }
    }
  }

  return (
    <main className={recording ? "experience recording-mode" : "experience"} data-scene-id={scene.id}>
      <div className="page-toolbar">
        <div>
          <span>对偶空间 · 第{sceneIndex + 1}节</span>
          <h1>{scene.title}</h1>
        </div>
        <div className="toolbar-controls">
          <button type="button" onClick={() => navigate(-1)} disabled={sceneIndex === 0 && step === 0}>←</button>
          <span className="step-count">{step + 1} / {stepCount}</span>
          <button type="button" onClick={() => navigate(1)} disabled={sceneIndex === conceptScenes.length - 1 && step === stepCount - 1}>→</button>
          <button className="record-button" type="button" onClick={() => void enterRecording()}>全屏录制</button>
        </div>
      </div>
      {sceneIndex === 0 ? <DualSpaceIntroScene step={step} /> : <BagVectorSpaceScene step={step} />}
    </main>
  );
}
