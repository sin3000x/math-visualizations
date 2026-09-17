import { fileURLToPath } from "node:url";
import { renderVideo } from "@math-visualizations/video-tools/render";
import { createTimeline } from "./timeline.mjs";

await renderVideo({ root: fileURLToPath(new URL("../../", import.meta.url)), scriptedTimeline: createTimeline() });
