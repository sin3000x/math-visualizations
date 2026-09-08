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
