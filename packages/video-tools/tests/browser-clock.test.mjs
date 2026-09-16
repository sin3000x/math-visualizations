import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { installRenderClock } from '../browser-clock.mjs';

test('有限动画含延迟重复时长，无限循环不阻止推进；rAF 可取消', () => {
  const makeAnimation = endTime => ({ currentTime: 0, paused: false, pause() { this.paused = true; }, effect: { getComputedTiming() { return { endTime }; } } });
  const animations = [makeAnimation(1200), makeAnimation(3000), makeAnimation(Infinity)];
  const window = {};
  vm.runInNewContext(`(${installRenderClock.toString()})()`, { window, document: { getAnimations: () => animations } });
  const clock = window.__videoClock;
  clock.sync();
  assert(animations.every(animation => animation.paused));
  assert.equal(clock.remainingAnimationMs(), 3000);
  let timestamp;
  window.requestAnimationFrame(time => { timestamp = time; });
  const cancelled = window.requestAnimationFrame(() => assert.fail('已取消的回调不能执行'));
  window.cancelAnimationFrame(cancelled);
  clock.tick(1200); clock.sync();
  assert.equal(timestamp, 1200);
  assert.equal(clock.remainingAnimationMs(), 1800);
  clock.tick(3000); clock.sync();
  assert.equal(clock.remainingAnimationMs(), 0);
  animations.push(makeAnimation(500)); clock.sync();
  assert.equal(clock.remainingAnimationMs(), 500);
});
