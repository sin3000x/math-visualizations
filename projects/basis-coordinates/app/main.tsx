import { mountConcept } from "@math-visualizations/scene-kit/mount";
import { concept } from "../scenes/registry";

await mountConcept(concept, { cover: () => import("../cover/Cover") });
