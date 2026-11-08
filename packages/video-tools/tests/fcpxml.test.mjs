import assert from 'node:assert/strict';
import test from 'node:test';
import { createFcpxml } from '../fcpxml.mjs';

test('每步标出开始（上一步停顿结束）与动画结束；无动画时不重复，时间为整帧有理数', () => {
  const xml = createFcpxml({ videoPath: '/tmp/a b&c.mp4', name: 'demo', fps: 60, width: 1920, height: 1080, totalFrames: 300,
    shots: [
      { scene: 'first', step: 0, startFrame: 0, holdStartFrame: 0 },
      { scene: 'first', step: 1, startFrame: 60, holdStartFrame: 90 },
      { scene: 'first', step: 1, startFrame: 120, holdStartFrame: 120 },
      { scene: 'second', step: 0, startFrame: 180, holdStartFrame: 240 },
    ] });
  assert.match(xml, /<format id="r1" name="FFVideoFormat1080p60" frameDuration="1\/60s"/);
  assert.match(xml, /duration="300\/60s"/);
  assert.match(xml, /src="file:\/\/\/tmp\/a%20b&amp;c\.mp4"/);
  assert.deepEqual([...xml.matchAll(/<(chapter-marker|marker) start="([^"]+)"[^>]*value="([^"]+)"/g)].map(match => match.slice(1)), [
    ['chapter-marker', '0s', 'first'],
    ['marker', '60/60s', 'first · 2'],
    ['marker', '90/60s', 'first · 2 动画结束'],
    ['chapter-marker', '180/60s', 'second'],
    ['marker', '240/60s', 'second · 1 动画结束'],
  ]);
});

test('非标准尺寸不写格式名', () => {
  const xml = createFcpxml({ videoPath: '/tmp/x.mp4', name: 'x', fps: 30, width: 640, height: 360, totalFrames: 30, shots: [] });
  assert.match(xml, /<format id="r1" frameDuration="1\/30s" width="640"/);
});
