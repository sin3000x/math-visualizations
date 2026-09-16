import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const repository = fileURLToPath(new URL("../", import.meta.url));
const projects = ["dual-space", "double-dual", "basis-coordinates"];
const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  output: { type: "string" },
  browser: { type: "string", default: process.env.VIDEO_BROWSER ?? "chrome" },
} });
if (positionals.length > 1 || (positionals[0] && !projects.includes(positionals[0]))) {
  throw new Error(`用法：node scripts/export-cover.mjs [${projects.join("|")}] [--output 路径.png] [--browser chrome|chromium]`);
}
if (values.output && !positionals[0]) throw new Error("指定 --output 时必须选择一个项目");
if (values.output && path.extname(values.output).toLowerCase() !== ".png") throw new Error("输出文件必须是 PNG");

for (const project of positionals.length ? positionals : projects) {
  const root = path.join(repository, project);
  // 从项目声明解析依赖，兼容 workspace 提升到根目录的安装布局。
  const require = createRequire(path.join(root, "package.json"));
  const { build, preview } = await import(pathToFileURL(require.resolve("vite")).href);
  const { chromium } = require("playwright");
  const output = values.output ? path.resolve(values.output) : path.join(root, "public", `${project}-video-cover.png`);
  const snapshot = await mkdtemp(path.join(tmpdir(), `${project}-cover-`));
  const pending = `${output}.${process.pid}.partial.png`;
  let server;
  let browser;
  try {
    await build({ root, logLevel: "error", build: { outDir: snapshot, emptyOutDir: true } });
    server = await preview({ root, build: { outDir: snapshot }, preview: { host: "127.0.0.1", port: 0, open: false } });
    const address = server.httpServer.address();
    if (!address || typeof address === "string") throw new Error("无法取得封面预览端口");
    const url = `http://127.0.0.1:${address.port}/?cover=1`;
    if (!(await fetch(url)).ok) throw new Error("封面预览服务不可访问");
    browser = await chromium.launch({ headless: true, ...(values.browser === "chromium" ? {} : { channel: values.browser }) });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("requestfailed", request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.route("**/favicon.ico", route => route.fulfill({ status: 204 }));
    await page.goto(url, { waitUntil: "networkidle" });
    const cover = page.locator('[data-role="video-cover"]');
    await cover.waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    const problems = await page.evaluate(() => {
      const issues = [];
      const canvas = document.querySelector('[data-role="video-cover"]').getBoundingClientRect();
      if (Math.abs(canvas.x) > .1 || Math.abs(canvas.y) > .1 || Math.abs(canvas.width - 1920) > .1 || Math.abs(canvas.height - 1080) > .1) issues.push("封面必须完整覆盖 1920×1080");
      if (document.querySelector(".katex-error")) issues.push("KaTeX 渲染错误");
      if ([document.documentElement, document.body].some(el => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) issues.push("页面出现滚动或溢出");
      if ([...document.fonts].some(font => font.status === "error")) issues.push("字体加载失败");
      for (const el of document.querySelectorAll("[data-cover-object], .cover-space-label")) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0 || r.left < 0 || r.top < 0 || r.right > 1920 || r.bottom > 1080) issues.push(`对象越界：${el.getAttribute("data-cover-object") ?? "空间标记"}`);
      }
      return issues;
    });
    if (problems.length || errors.length) throw new Error([...problems, ...errors].join("\n"));
    await mkdir(path.dirname(output), { recursive: true });
    const png = await cover.screenshot({ path: pending, type: "png", animations: "disabled", caret: "hide" });
    if (png.readUInt32BE(16) !== 1920 || png.readUInt32BE(20) !== 1080) throw new Error("PNG 尺寸不正确");
    // 校验完成后替换成品，失败时保留上一张可用封面。
    await rename(pending, output);
    console.log(`${project}: ${output}（1920×1080，字体、KaTeX、边界与控制台检查通过）`);
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
    await rm(pending, { force: true });
    await rm(snapshot, { recursive: true, force: true });
  }
}
