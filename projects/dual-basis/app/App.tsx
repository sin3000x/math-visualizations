import { ScenePlayer } from "@math-visualizations/scene-kit/ScenePlayer";
import { project, registry } from "../scenes/registry";

const scenes = registry.getConceptScenes(project.conceptId);

export default function App() {
  return <ScenePlayer title={project.title} scenes={scenes} />;
}
