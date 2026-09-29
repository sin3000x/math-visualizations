import { useCallback, useEffect, useState } from "react";
import { moveStep } from "./navigation.ts";
import { createSceneLink, positionFromSearch } from "./sceneLink.ts";
import type { SceneDefinition } from "./types.ts";
import "./ScenePlayer.css";

export function ScenePlayer({ title, scenes }: { title: string; scenes: readonly SceneDefinition[] }) {
  const [position, setPosition] = useState(() => positionFromSearch(scenes, window.location.search));
  const [recording, setRecording] = useState(() => new URLSearchParams(window.location.search).get("export") === "1");
  const [copyResult, setCopyResult] = useState<{ url: string; copied: boolean } | null>(null);
  const { sceneIndex, step } = position;
  const scene = scenes[sceneIndex];
  const sceneLink = createSceneLink(window.location.href, scene.id, step);
  const currentCopy = copyResult?.url === sceneLink ? copyResult : null;
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
      if (/^[0-9]$/.test(event.key)) {
        const next = event.key === "0" ? 9 : Number(event.key) - 1;
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

  async function copySceneLink() {
    try {
      await navigator.clipboard.writeText(sceneLink);
      setCopyResult({ url: sceneLink, copied: true });
    } catch {
      setCopyResult({ url: sceneLink, copied: false });
    }
  }

  const Scene = scene.component;
  return <main className={`experience scene-player${recording ? " recording-mode" : ""}`} aria-label={title} data-video-scenes={JSON.stringify(scenes.map(({ id, stepCount }) => ({ id, stepCount })))} data-scene-id={scene.id} data-step={step}>
    <div className="page-toolbar">
      <nav className="scene-navigation" aria-label="场景导航">
        {scenes.map((item, index) => <button
          key={item.id}
          type="button"
          aria-current={index === sceneIndex ? "step" : undefined}
          onClick={() => setPosition({ sceneIndex: index, step: 0 })}
        >{item.title}</button>)}
      </nav>
      <button type="button" onClick={() => void copySceneLink()}>复制当前步骤链接</button>
      <button type="button" onClick={() => void enterRecording()}>全屏录制</button>
      {currentCopy && <div className="scene-link-feedback">
        <span role="status">{currentCopy.copied ? "链接已复制" : "未能自动复制，请手动复制链接"}</span>
        {!currentCopy.copied && <input
          aria-label="当前步骤链接"
          type="text"
          readOnly
          value={sceneLink}
          onFocus={event => event.currentTarget.select()}
        />}
      </div>}
    </div>
    <div className="scene-frame">
      <div className="scene-design">
        <div className="scene-content"><Scene key={scene.id} step={step} /></div>
      </div>
    </div>
  </main>;
}
