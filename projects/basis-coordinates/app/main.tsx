import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./globals.css";
import App from "./App";

// 封面按需加载，封面样式不进入普通教学页面。
const View = new URLSearchParams(location.search).has("cover")
  ? (await import("../cover/Cover")).default
  : App;
createRoot(document.getElementById("root")!).render(<StrictMode><View /></StrictMode>);
