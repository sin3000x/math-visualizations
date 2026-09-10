import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { build, preview } from "vite";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { presets, createTimeline } from "./timeline.mjs";
import { installRenderClock } from "./browser-clock.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  preset: { type: "string", default: "debug" },
  output: { type: "string" },
  "limit-seconds": { type: "string" },
  check: { type: "boolean", default: false },
} });
const preset = presets[values.preset];
if (!preset) throw new Error("预设必须为 debug 或 production");
const limit = values["limit-seconds"] === undefined ? Infinity : Number(values["limit-seconds"]);
if (!(limit > 0)) throw new Error("limit-seconds 必须为正数");
const projectName = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).name;
if (positionals.length > 1) throw new Error("最多指定一个场景 ID");
const sceneName = positionals[0];
const suffix = sceneName ? `-${sceneName}` : "";
const output = path.resolve(root, values.output ?? `exports/${projectName}-${values.preset}${suffix}.mp4`);
const temporary = output.replace(/\.mp4$/, "") + ".partial.mp4";
const qaDirectory = path.resolve(root, `exports/qa-${values.preset}${suffix}`);
const ffmpeg = process.env.FFMPEG_PATH ?? ffmpegInstaller.path;
if (!values.check && (!ffmpeg || spawnSync(ffmpeg, ["-version"]).status !== 0)) throw new Error("FFmpeg 不可用，可通过 FFMPEG_PATH 指定编码器");
await mkdir(path.dirname(output), { recursive: true });
if (values.check) await mkdir(qaDirectory, { recursive: true });

let browser;
let encoder;
let encoding;
let encoderError;
let stderr = "";
const errors = [];
const report = [];
const snapshot = await mkdtemp(path.join(tmpdir(), `${projectName}-video-`));
let server;
try {
  // 导出固定的生产构建，避免编辑源码或安装依赖时 HMR 重载中断长视频。
  await build({ root, logLevel: "error", build: { outDir: snapshot, emptyOutDir: true } });
  server = await preview({ root, build: { outDir: snapshot }, preview: { host: "127.0.0.1", port: 0, open: false } });
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}/?export=1${sceneName ? `&scene=${encodeURIComponent(sceneName)}` : ""}`;
  if (!(await fetch(url)).ok) throw new Error("导出服务不可访问");
  browser = await chromium.launch({ channel: process.env.VIDEO_BROWSER ?? "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: preset.width / 1920 });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(installRenderClock);
  await page.route("**/favicon.ico", route => route.fulfill({ status: 204 }));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".recording-mode").waitFor();
  const scenes = await page.evaluate(() => JSON.parse(document.querySelector("main").dataset.videoScenes));
  const shots = createTimeline(scenes);
  const sceneIds = [...new Set(shots.map(shot => shot.scene))];
  if (sceneName !== undefined && !sceneIds.includes(sceneName)) {
    throw new Error(`未知场景：${sceneName}。可选：${sceneIds.join("、")}`);
  }
  const timeline = sceneName
    ? shots.filter(shot => shot.scene === sceneName).map((shot, index) =>
      index === 0 && shot.action === "next" ? { ...shot, action: "start" } : shot)
    : shots;
  const advance = async time => {
    await page.evaluate(time => window.__videoClock.tick(time), time);
    // 独立的往返使 React 有机会提交 rAF 触发的状态更新。
    await page.evaluate(() => window.__videoClock.sync());
  };
  await advance(0);
  if (!values.check) {
    encoder = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y",
      "-f", "image2pipe", "-framerate", String(preset.fps), "-vcodec", "png", "-i", "pipe:0",
      "-an", "-c:v", "libx264", "-preset", "fast", "-crf", String(preset.crf),
      "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1", "-bf", "0", "-tag:v", "avc1",
      "-movflags", "+faststart", temporary], { stdio: ["pipe", "ignore", "pipe"] });
    encoder.stderr.on("data", data => { stderr = (stderr + data).slice(-8000); });
    encoder.stdin.on("error", error => { encoderError = error; });
    encoding = new Promise(resolve => {
      encoder.on("error", error => { encoderError = error; resolve(-1); });
      encoder.on("close", resolve);
    });
  }
  let frame = 0;
  let time = 0;
  for (const [shotIndex, shot] of timeline.entries()) {
    if (time >= limit * 1000) break;
    if (shot.action === "next") await page.keyboard.press("ArrowRight");
    await advance(time);
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => {
      const main = document.querySelector("main");
      const frame = document.querySelector(".scene-frame").getBoundingClientRect();
      return { scene: main.dataset.sceneId, step: Number(main.dataset.step),
        phase: document.querySelector("[data-phase]")?.getAttribute("data-phase"),
        katexErrors: document.querySelectorAll(".katex-error").length,
        noScroll: document.documentElement.scrollHeight === document.documentElement.clientHeight,
        width: frame.width, height: frame.height };
    });
    if (state.scene !== shot.scene || state.step !== shot.step ||
      (shot.phase !== undefined && Number(state.phase) !== shot.phase) ||
      state.katexErrors || !state.noScroll || state.width !== 1920 || state.height !== 1080) {
      throw new Error(`播放状态不符：${JSON.stringify({ shot, state })}`);
    }
    const count = Math.min(Math.round(shot.seconds * preset.fps), Math.ceil(limit * preset.fps) - frame);
    const sampleFrames = new Set([0, Math.floor(count / 2), count - 1, Math.round(.75 * preset.fps)]);
    for (let i = 0; i < count; i++) {
      await advance((frame + i) * 1000 / preset.fps);
      if (values.check && !sampleFrames.has(i)) continue;
      const png = await page.screenshot({ type: "png", animations: "allow", scale: "device" });
      if (png.readUInt32BE(16) !== preset.width || png.readUInt32BE(20) !== preset.height) {
        throw new Error("渲染图像尺寸与预设不符");
      }
      if (values.check) await writeFile(path.join(qaDirectory, `${String(shotIndex).padStart(2, "0")}-${i}.png`), png);
      else {
        if (encoderError || encoder.exitCode !== null) throw encoderError ?? new Error(stderr);
        if (!encoder.stdin.write(png)) await once(encoder.stdin, "drain");
      }
    }
    frame += count;
    time = frame * 1000 / preset.fps;
    await advance(time);
    report.push({ ...shot, endSeconds: time / 1000, state });
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`[${shotIndex + 1}/${timeline.length}] ${shot.scene} 步骤 ${shot.step + 1} · ${time / 1000}s`);
  }
  if (values.check) {
    // 同一页面确认方向键可返回、Escape 能退出导出画面。
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Escape");
    if (await page.locator(".recording-mode").count()) throw new Error("Escape 未退出录制模式");
    await writeFile(path.join(qaDirectory, "report.json"), JSON.stringify({ preset, report, errors }, null, 2));
    console.log(`检查通过：${qaDirectory}`);
  } else {
    encoder.stdin.end();
    if (await encoding !== 0 || encoderError) throw encoderError ?? new Error(stderr);
    await rename(temporary, output);
    console.log(`已导出 ${preset.width}×${preset.height} ${preset.fps}fps：${output}`);
  }
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill();
  await browser?.close();
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  await rm(snapshot, { recursive: true, force: true });
  await rm(temporary, { force: true });
}
