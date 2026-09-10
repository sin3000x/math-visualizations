import { useCallback, useEffect, useState } from "react";
import { moveStep } from "../lib/scenes/navigation";
import type { SceneDefinition } from "../lib/scenes/types";

export function ScenePlayer({ title, scenes }: { title: string; scenes: readonly SceneDefinition[] }) {
  const [position, setPosition] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("scene");
    return { sceneIndex: Math.max(0, scenes.findIndex(item => item.id === requested)), step: 0 };
  });
  const [recording, setRecording] = useState(() => new URLSearchParams(window.location.search).get("export") === "1");
  const { sceneIndex, step } = position;
  const scene = scenes[sceneIndex];
  const navigate = useCallback((direction: 1 | -1) => {
    setPosition(current => moveStep(scenes.map(item => item.stepCount), current, direction));
  }, [scenes]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select") || target?.isContentEditable) return;
      if (event.key === "Escape") {
        setRecording(false);
        if (document.fullscreenElement) void document.exitFullscreen();
        return;
      }
      if (/^[1-9]$/.test(event.key)) {
        const next = Number(event.key) - 1;
        if (next < scene.stepCount) {
          event.preventDefault();
          setPosition(current => ({ ...current, step: next }));
        }
        return;
      }
      const forward = event.key === "ArrowRight" || event.key === "PageDown";
      const backward = event.key === "ArrowLeft" || event.key === "PageUp";
      if (forward || backward) {
        event.preventDefault();
        if (!event.repeat) navigate(forward ? 1 : -1);
      }
    };
    const syncFullscreen = () => {
      if (!document.fullscreenElement) setRecording(false);
    };
    window.addEventListener("keydown", handleKey);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, [navigate, scene.stepCount]);

  async function enterRecording() {
    setRecording(true);
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      // 浏览器不支持原生全屏时，保留 CSS 录屏模式。
    }
  }

  const Scene = scene.component;
  return <main className={recording ? "experience recording-mode" : "experience"} data-video-scenes={JSON.stringify(scenes.map(({ id, stepCount }) => ({ id, stepCount })))} data-scene-id={scene.id} data-step={step}>
    <div className="page-toolbar">
      <span>{title} · 第{sceneIndex + 1}节</span>
      <nav className="toolbar-step-navigation" aria-label="步骤导航">
        <button type="button" aria-label="上一步" onClick={() => navigate(-1)} disabled={sceneIndex === 0 && step === 0}>←</button>
        <span aria-live="polite">{step + 1} / {scene.stepCount}</span>
        <button type="button" aria-label="下一步" onClick={() => navigate(1)} disabled={sceneIndex === scenes.length - 1 && step === scene.stepCount - 1}>→</button>
      </nav>
      <button type="button" onClick={() => void enterRecording()}>全屏录制</button>
    </div>
    <nav className="scene-navigation" aria-label="场景导航">
      {scenes.map((item, index) => <button key={item.id} type="button"
        aria-current={index === sceneIndex ? "page" : undefined}
        onClick={() => setPosition({ sceneIndex: index, step: 0 })}>{item.title}</button>)}
    </nav>
    <div className="scene-frame">
      <div className="scene-design">
        <div className="scene-content"><Scene key={scene.id} step={step} /></div>
      </div>
    </div>
  </main>;
}
