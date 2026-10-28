import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { ScenePlayer } from "./ScenePlayer.tsx";
import type { Concept } from "./registry.ts";

type CoverModule = { default: ComponentType };

/**
 * 挂载一个概念的播放器。项目入口先导入本模块，再导入自己的 globals.css，
 * 以保证主题样式在播放器样式之后加载。`?cover` 时按需加载封面，封面样式不进入教学页面。
 */
export async function mountConcept(concept: Concept, options: { cover?: () => Promise<CoverModule> } = {}) {
  const Cover = options.cover && new URLSearchParams(location.search).has("cover") ? (await options.cover()).default : null;
  const view = Cover ? <Cover /> : <ScenePlayer title={concept.title} scenes={concept.scenes} />;
  createRoot(document.getElementById("root")!).render(<StrictMode>{view}</StrictMode>);
}
