export const presets = {
  debug: { width: 640, height: 360, fps: 30, crf: 22 },
  production: { width: 1920, height: 1080, fps: 60, crf: 18 },
};

// 秒数是播放时间，不是机器渲染所需的时间。两种预设共用这份脚本。
export function createTimeline() {
  const shots = [];
  const add = (scene, step, action = "next", seconds = 2.5, extra = {}) =>
    shots.push({ scene, step, action, seconds, ...extra });
  for (let step = 0; step < 7; step++) {
    add("DualSpaceIntroScene", step, step === 0 ? "start" : "next");
    if (step === 3 || step === 4) {
      for (const index of [1, 2]) add("DualSpaceIntroScene", step, "click", 1.2,
        { selector: step === 3 ? ".bag-card" : ".checkout-card", index });
    }
    if (step === 4) add("DualSpaceIntroScene", step, "hold");
  }
  for (let step = 0; step < 10; step++) {
    add("BagVectorSpaceScene", step);
    if (step >= 2) add("BagVectorSpaceScene", step, "next", 3, { animated: true });
  }
  add("CheckoutLinearityScene", 0);
  for (const step of [1, 2]) {
    for (let phase = 0; phase <= 6; phase++) {
      add("CheckoutLinearityScene", step, "next", 2.5, { phase });
    }
  }
  for (let step = 0; step < 4; step++) add("CheckoutOperationsScene", step);
  add("CheckoutVectorSpaceScene", 0, "next", 4);
  add("DualSpaceSummaryScene", 0, "next", 4);
  return shots;
}
