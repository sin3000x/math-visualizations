import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@math-visualizations/scene-kit/ScenePlayer.css";
import "./globals.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
