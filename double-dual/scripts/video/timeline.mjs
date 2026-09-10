export const presets = {
  debug: { width: 640, height: 360, fps: 30, crf: 22 },
  production: { width: 1920, height: 1080, fps: 60, crf: 18 },
};

// 秒数包含动画和停留时间。以稳定 Scene ID 为键，数组下标对应从零开始的步骤。
// 例如："my-scene": [3, 5, 4]；新增 Scene 或步骤无需修改脚本。
export const timing = { stepSeconds: 3, sceneEndSeconds: 4, overrides: {} };

export function createTimeline(scenes, config = timing) {
  return scenes.flatMap((scene, sceneIndex) =>
    Array.from({ length: scene.stepCount }, (_, step) => {
      const seconds = config.overrides[scene.id]?.[step]
        ?? (step === scene.stepCount - 1 ? config.sceneEndSeconds : config.stepSeconds);
      if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`无效停留时间：${scene.id}/${step}`);
      return { scene: scene.id, step, action: sceneIndex === 0 && step === 0 ? "start" : "next", seconds };
    }));
}
