import assert from 'node:assert/strict';
import test from 'node:test';
import { contourSectionPath, project3d } from '../lib/geometry/projection3d.ts';

test('等高截线闭合，左右极值保持水平，输出精度不改变投影几何', () => {
  for (const radius of [0, 0.48, 1.25, 2.58]) {
    const path = contourSectionPath(radius);
    const points = [...path.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map(match => ({ x: Number(match[1]), y: Number(match[2]) }));
    assert.equal(points.length, 65);
    assert.deepEqual(points[0], points[64]);
    assert.equal(points[0].y, points[32].y);
    assert(Math.abs((points[0].x - points[32].x) - 124 * radius) < 1e-6);
    assert(!/\.\d{7}/.test(path), 'SVG 不应暴露不稳定浮点尾数');
    for (const [index, point] of points.entries()) {
      const angle = index / 64 * Math.PI * 2;
      const expected = project3d(radius * Math.cos(angle), radius * Math.sin(angle), radius * radius);
      assert(Math.abs(point.x - expected.x) <= 0.00000051);
      assert(Math.abs(point.y - expected.y) <= 0.00000051);
    }
  }
});
