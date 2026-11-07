export const presets = {
  debug: { width: 640, height: 360, fps: 30, crf: 22 },
  // 抽帧检查与快速预览用；布局与 production 相同，只是像素少。
  "1080p": { width: 1920, height: 1080, fps: 60, crf: 18 },
  // 正式交付默认 4K：以 2 倍像素渲染（同 Retina），平台二次压缩后小字仍清晰。
  production: { width: 3840, height: 2160, fps: 60, crf: 18 },
};

// 秒数仅表示动画全部结束后的停留时间，动画时长由浏览器自动测量。以稳定 Scene ID 为键，数组下标对应从零开始的步骤。
// 例如："my-scene": [3, 5, 4]；新增 Scene 或步骤无需修改脚本。
export const timing = { stepSeconds: 1, sceneEndSeconds: 1, overrides: {} };

export function createTimeline(scenes, config = timing) {
  return scenes.flatMap((scene, sceneIndex) =>
    Array.from({ length: scene.stepCount }, (_, step) => {
      const seconds = config.overrides[scene.id]?.[step]
        ?? (step === scene.stepCount - 1 ? config.sceneEndSeconds : config.stepSeconds);
      if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`无效停留时间：${scene.id}/${step}`);
      return { scene: scene.id, step, action: sceneIndex === 0 && step === 0 ? "start" : "next", seconds };
    }));
}
