// 在页面脚本启动前安装；CSS 动画和 rAF 共用由导出器推进的时间。
export function installRenderClock() {
  let now = 0;
  let nextId = 1;
  const callbacks = new Map();
  const starts = new WeakMap();
  window.requestAnimationFrame = callback => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = id => callbacks.delete(id);
  window.__videoClock = {
    tick(time) {
      now = time;
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback(time);
    },
    remainingAnimationMs() {
      return Math.max(0, ...document.getAnimations().map(animation => {
        const end = animation.effect?.getComputedTiming().endTime;
        // 无限循环的装饰动画继续播放，但不阻止教学步骤推进。
        return Number.isFinite(end) ? Math.max(0, end - Number(animation.currentTime ?? 0)) : 0;
      }));
    },
    sync() {
      for (const animation of document.getAnimations()) {
        if (!starts.has(animation)) {
          starts.set(animation, now);
          animation.pause();
        }
        animation.currentTime = now - starts.get(animation);
      }
    },
  };
}
