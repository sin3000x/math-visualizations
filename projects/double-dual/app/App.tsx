import { ScenePlayer } from "@math-visualizations/scene-kit/ScenePlayer";
import { concept } from "../scenes/registry";

export default function App() {
  return <ScenePlayer title={concept.title} scenes={concept.scenes} />;
}
