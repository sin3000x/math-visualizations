import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

async function render() {
  const { default: worker } = await import(new URL("../dist/server/index.js", import.meta.url));
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("生产 Worker 输出实际 KKT 首幕、公式和交互入口", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>KKT.*几何实验室<\/title>/);
  assert.match(html, /class="[^"]*primer-scene/);
  assert.match(html, /先看懂等高线与梯度/);
  assert.match(html, /data-role="draggable-point"/);
  assert.match(html, /进入全屏录屏模式/);
  assert.match(html, /class="katex(?:\s|")/);
  assert.doesNotMatch(html, /class="[^"]*\bkatex-error\b/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);

  // 依赖提升后仍应生成真实可加载的浏览器资源，而不是只有 SSR HTML。
  const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)[^"]*"/g)].map(match => match[1]);
  assert(assets.some(asset => asset.endsWith('.js')), '缺少客户端脚本');
  assert(assets.some(asset => asset.endsWith('.css')), '缺少样式资源');
  for (const asset of new Set(assets)) {
    await access(new URL(`../dist/client${asset}`, import.meta.url));
  }
});
