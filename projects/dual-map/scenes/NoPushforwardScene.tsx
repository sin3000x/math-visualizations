import type { SceneProps } from "@math-visualizations/scene-kit/types";
import { Board } from "../components/Board";
import { Arrows, Op } from "../components/Stage";
import type { Arrow } from "../lib/arrows";
import { BACK, BOARD } from "./layout";
import { NO_PUSHFORWARD_STEPS } from "./steps";
import "./NoPushforwardScene.css";

const backArrow = (className: string): Arrow => {
  const { from, c1, c2, to } = BACK;
  return { id: "back", d: `M${from}C${c1} ${c2} ${to}`, head: [to[0], to[1], Math.atan2(to[1] - c2[1], to[0] - c2[0])], color: "var(--coral)", className: `dashed ${className}` };
};

/** 往回的虚线、问号与叉：本幕与下一幕第 1 步共用。 */
export function NoWayBack({ back, cross }: { back: string; cross: string | false }) {
  const { mid } = BOARD, y = BACK.crossY;
  return <>
    <Arrows arrows={[backArrow(back)]} />
    <Op latex="?" size={120} x={BACK.question[0]} y={BACK.question[1]} className={`no-way ${back}`} />
    {cross !== false && <svg className={`no-way-cross ${cross}`} viewBox="0 0 1440 810" aria-hidden="true">
      <path d={`M${mid - 30} ${y - 30}L${mid + 30} ${y + 30}M${mid + 30} ${y - 30}L${mid - 30} ${y + 30}`} pathLength={1} />
    </svg>}
  </>;
}

/**
 * 给定水果收银台与榨汁机，能否给果汁定价？要先把一托盘还原成一袋水果，而榨汁机只能往前走。
 * 第 4、5 步：往回的虚线指向问号，再在虚线上打叉。
 */
export function NoPushforwardScene({ step }: SceneProps) {
  return <section className="lesson" data-step={step} aria-label="榨汁机不能把果汁还原成水果，水果收银台无法自然地给果汁定价">
    <Board {...NO_PUSHFORWARD_STEPS[step]} />
    {step >= 3 && <NoWayBack back={step === 3 ? "" : "still"} cross={step >= 4 && (step === 4 ? "draw" : "")} />}
  </section>;
}
