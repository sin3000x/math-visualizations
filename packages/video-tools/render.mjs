import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { build, preview } from "vite";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { availableParallelism, tmpdir } from "node:os";
import { once } from "node:events";
import path from "node:path";
import { parseArgs } from "node:util";
import { presets, createTimeline, timing as defaultTiming } from "./timeline.mjs";
import { installRenderClock } from "./browser-clock.mjs";
import { createFcpxml } from "./fcpxml.mjs";

// h264 体积小、通用；prores 为 Final Cut Pro 的剪辑中间格式（ProRes 422，10 bit），体积大但剪辑更流畅。
const codecs = {
  h264: { extension: ".mp4", args: preset => ["-c:v", "libx264", "-preset", "fast", "-crf", String(preset.crf),
    // 1080p60 用 4.2，4K60 用 5.2。
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", preset.width > 1920 ? "5.2" : "4.2", "-bf", "0", "-tag:v", "avc1", "-movflags", "+faststart"] },
  prores: { extension: ".mov", args: () => ["-c:v", "prores_ks", "-profile:v", "2", "-pix_fmt", "yuv422p10le", "-vendor", "apl0"] },
};

export const defaultJobs = () => Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2)));

// 显式传入项目根目录，构建和输出不依赖调用者 cwd。
export async function renderVideo({ root, timing = defaultTiming, scriptedTimeline }, args = process.argv.slice(2)) {
  const scripted = scriptedTimeline !== undefined;
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    preset: { type: "string", default: "debug" },
    output: { type: "string" },
    codec: { type: "string", default: "h264" },
    jobs: { type: "string" },
    "limit-seconds": { type: "string" },
    "hold-seconds": { type: "string" },
    "scene-end-seconds": { type: "string" },
    check: { type: "boolean", default: false },
  } });
  const preset = presets[values.preset];
  if (!Object.hasOwn(presets, values.preset)) throw new Error("预设必须为 debug、production 或 4k");
  if (!Object.hasOwn(codecs, values.codec)) throw new Error("编码必须为 h264 或 prores");
  const codec = codecs[values.codec];
  const jobs = values.jobs === undefined ? defaultJobs() : Number(values.jobs);
  if (!Number.isInteger(jobs) || jobs < 1) throw new Error("jobs 必须为正整数");
  const limit = values["limit-seconds"] === undefined ? Infinity : Number(values["limit-seconds"]);
  if (values["limit-seconds"] !== undefined && (!Number.isFinite(limit) || limit <= 0)) throw new Error("limit-seconds 必须为有限正数");
  if (values["limit-seconds"] !== undefined && values.preset !== "debug") throw new Error("limit-seconds 仅可用于 debug 预设");
  if (scripted && (values["hold-seconds"] !== undefined || values["scene-end-seconds"] !== undefined)) throw new Error("固定时间线请直接修改项目 timeline.mjs 中的秒数");
  const config = { ...timing };
  for (const [option, key] of [["hold-seconds", "stepSeconds"], ["scene-end-seconds", "sceneEndSeconds"]]) {
    if (values[option] !== undefined) {
      const seconds = Number(values[option]);
      if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`${option} 必须为有限正数`);
      config[key] = seconds;
    }
  }
  const projectName = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).name;
  if (positionals.length > 1) throw new Error("最多指定一个场景 ID");
  const sceneName = positionals[0]?.replace(/\.tsx?$/, "");
  const suffix = sceneName ? `-${sceneName}` : "";
  const output = path.resolve(root, values.output ?? path.join("exports", "videos", `${projectName}-${values.preset}${suffix}${codec.extension}`));
  if (path.extname(output).toLowerCase() !== codec.extension) throw new Error(`${values.codec} 输出必须为 ${codec.extension}`);
  const stem = output.slice(0, -codec.extension.length);
  const temporary = `${stem}.partial${codec.extension}`;
  const fcpxmlPath = `${stem}.fcpxml`;
  // exports/videos 只放成片与 FCPXML；检查截图和渲染报告统一放在 exports/qa。
  const qaDirectory = path.resolve(root, "exports", "qa", `video-${values.preset}${suffix}`);
  const reportPath = path.resolve(root, "exports", "qa", `${path.basename(stem)}.json`);
  const ffmpeg = process.env.FFMPEG_PATH ?? ffmpegInstaller.path;
  if (!ffmpeg || spawnSync(ffmpeg, ["-version"]).status !== 0) throw new Error("FFmpeg 不可用，可通过 FFMPEG_PATH 指定编码器");
  await mkdir(path.dirname(output), { recursive: true });
  if (values.check) await mkdir(qaDirectory, { recursive: true });
  else await mkdir(path.dirname(reportPath), { recursive: true });

  const started = Date.now();
  const browsers = [];
  const encoders = [];
  const snapshot = await mkdtemp(path.join(tmpdir(), `${projectName}-video-`));
  const segmentDirectory = await mkdtemp(path.join(tmpdir(), `${projectName}-segments-`));
  let server;
  try {
    // 导出固定的生产构建，避免编辑源码或安装依赖时 HMR 重载中断长视频。
    await build({ root, logLevel: "error", build: { outDir: snapshot, emptyOutDir: true } });
    server = await preview({ root, build: { outDir: snapshot }, preview: { host: "127.0.0.1", port: 0, open: false } });
    const origin = `http://127.0.0.1:${server.httpServer.address().port}/`;
    const pageUrl = scene => `${origin}?export=1${scene ? `&scene=${encodeURIComponent(scene)}` : ""}`;
    if (!(await fetch(pageUrl())).ok) throw new Error("导出服务不可访问");
    const hasClicks = scripted && scriptedTimeline.some(shot => shot.action === "click");
    const launch = async () => {
      const browser = await chromium.launch({ channel: process.env.VIDEO_BROWSER ?? "chrome", headless: true });
      browsers.push(browser);
      return browser;
    };
    const open = (browser, scene) => openSession(browser, pageUrl(scene), preset, hasClicks);

    const first = await open(await launch(), sceneName);
    const shots = scripted ? scriptedTimeline : createTimeline(
      await first.page.evaluate(() => JSON.parse(document.querySelector("main").dataset.videoScenes)), config);
    const sceneIds = [...new Set(shots.map(shot => shot.scene))];
    if (sceneName !== undefined && !sceneIds.includes(sceneName)) {
      throw new Error(`未知场景：${sceneName}。可选：${sceneIds.join("、")}`);
    }
    // 单独渲染的场景从页面加载开始，第一镜不再按方向键。
    const startAt = list => list.map((shot, index) => index === 0 && shot.action === "next" ? { ...shot, action: "start" } : shot);
    const timeline = sceneName ? startAt(shots.filter(shot => shot.scene === sceneName)) : shots;
    // 时钟确定，各 Scene 可独立并行渲染再无损拼接；check 模式需要验证跨场景键盘导航，保持顺序播放。
    const parallel = !values.check && sceneName === undefined && limit === Infinity && jobs > 1 && sceneIds.length > 1;
    const segments = parallel
      ? sceneIds.map(id => ({ scene: id, shots: startAt(timeline.filter(shot => shot.scene === id)) }))
      : [{ scene: sceneName, shots: timeline }];
    segments.forEach((segment, index) => {
      segment.file = parallel ? path.join(segmentDirectory, `${String(index).padStart(3, "0")}${codec.extension}`) : temporary;
    });
    const total = timeline.length;
    const options = { preset, scripted, limit, check: values.check, qaDirectory, total, ffmpeg };
    const startEncoder = file => {
      const encoder = createEncoder(ffmpeg, preset, codec, file);
      encoders.push(encoder);
      return encoder;
    };

    if (!parallel) {
      const segment = segments[0];
      segment.result = await renderSegment(first, segment.shots, values.check ? undefined : startEncoder(segment.file), options);
      if (values.check) {
        const { page } = first;
        // 同一页面确认方向键可返回、Escape 能退出导出画面。
        const before = await page.locator("main").getAttribute("data-step");
        await page.keyboard.press("ArrowLeft");
        const after = await page.locator("main").getAttribute("data-step");
        if (!scripted && Number(before) > 0 && Number(after) !== Number(before) - 1) throw new Error("上一步未正确返回");
        await page.keyboard.press("Escape");
        if (await page.locator(".recording-mode").count()) throw new Error("Escape 未退出录制模式");
      }
    } else {
      await first.page.close();
      const queue = [...segments];
      const abort = { error: undefined };
      const worker = async browser => {
        for (let segment = queue.shift(); segment && !abort.error; segment = queue.shift()) {
          const session = await open(browser, segment.scene);
          segment.result = await renderSegment(session, segment.shots, startEncoder(segment.file), { ...options, abort });
          await session.page.close();
        }
      };
      const workers = Math.min(jobs, segments.length);
      console.log(`并行渲染 ${segments.length} 个场景，${workers} 个浏览器`);
      await Promise.all(Array.from({ length: workers }, async (_, index) => {
        try { await worker(index === 0 ? browsers[0] : await launch()); }
        catch (error) { abort.error ??= error; }
      }));
      if (abort.error) throw abort.error;
      await concatSegments(ffmpeg, segments.map(segment => ({ file: segment.file, frames: segment.result.frames })),
        preset.fps, temporary, segmentDirectory, codec);
    }

    // 各段帧号累加为整片帧号；秒数由帧号换算，标记与视频帧严格对齐。
    const report = [];
    let offset = 0;
    for (const segment of segments) {
      for (const entry of segment.result.report) {
        const startFrame = entry.startFrame + offset;
        const holdStartFrame = entry.holdStartFrame + offset;
        const endFrame = entry.endFrame + offset;
        report.push({ ...entry, startFrame, holdStartFrame, endFrame, startSeconds: startFrame / preset.fps,
          holdStartSeconds: holdStartFrame / preset.fps, endSeconds: endFrame / preset.fps });
      }
      offset += segment.result.frames;
    }
    const reused = segments.reduce((sum, segment) => sum + segment.result.reused, 0);
    const errors = [];
    const elapsed = (Date.now() - started) / 1000;
    const summary = { preset, codec: values.codec, jobs: parallel ? Math.min(jobs, segments.length) : 1,
      frames: offset, reusedFrames: reused, elapsedSeconds: elapsed, report, errors };
    if (values.check) {
      await writeFile(path.join(qaDirectory, "report.json"), JSON.stringify(summary, null, 2));
      console.log(`检查通过：${qaDirectory}`);
    } else {
      await rename(temporary, output);
      await writeFile(reportPath, JSON.stringify(summary, null, 2));
      await writeFile(fcpxmlPath, createFcpxml({ videoPath: output, name: path.basename(stem), fps: preset.fps,
        width: preset.width, height: preset.height, totalFrames: offset, shots: report }));
      console.log(`已导出 ${preset.width}×${preset.height} ${preset.fps}fps ${values.codec}：${output}`);
      console.log(`Final Cut Pro 标记：${fcpxmlPath}`);
      console.log(`渲染报告：${reportPath}`);
      console.log(`共 ${offset} 帧，静止帧复用 ${reused} 帧，耗时 ${elapsed.toFixed(1)}s`);
    }
  } finally {
    for (const encoder of encoders) encoder.kill();
    await Promise.all(browsers.map(browser => browser.close()));
    if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
    await rm(snapshot, { recursive: true, force: true });
    await rm(segmentDirectory, { recursive: true, force: true });
    await rm(temporary, { force: true });
  }
}

async function openSession(browser, url, preset, hasClicks) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: preset.width / 1920 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(installRenderClock);
  await page.route("**/favicon.ico", route => route.fulfill({ status: 204 }));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".recording-mode").waitFor();
  if (hasClicks) {
    // 截图不会包含系统鼠标；这里用固定 CSS 坐标绘制点击指示。
    await page.evaluate(() => {
      const cursor = document.createElement("div");
      cursor.id = "video-cursor";
      cursor.style.cssText = "position:fixed;z-index:100;pointer-events:none;display:none;width:64px;height:84px;filter:drop-shadow(0 3px 4px #000)";
      cursor.innerHTML = '<svg width="64" height="84" viewBox="0 0 64 84" style="position:relative;overflow:visible"><path d="M 0 0 L 0 62 L 17 47 L 31 77 L 44 71 L 30 42 L 53 42 Z" fill="white" stroke="#171717" stroke-width="4" stroke-linejoin="round"/></svg>';
      document.body.append(cursor);
    });
  }
  // 直接走 CDP 截图并开启 optimizeForSpeed，省去 Playwright 截图的额外等待与较慢的 PNG 压缩。
  const cdp = await page.context().newCDPSession(page);
  // 必须显式给出画布裁剪与输出缩放：裸调用不跟随 Playwright 的视口与 deviceScaleFactor 模拟。
  const clip = { x: 0, y: 0, width: 1920, height: 1080, scale: preset.width / 1920 };
  const capture = async () => Buffer.from((await cdp.send("Page.captureScreenshot",
    { format: "png", optimizeForSpeed: true, clip })).data, "base64");
  return { page, errors, capture };
}

function createEncoder(ffmpeg, preset, codec, file) {
  let error;
  let stderr = "";
  const child = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y",
    "-f", "image2pipe", "-framerate", String(preset.fps), "-vcodec", "png", "-i", "pipe:0",
    "-an", ...codec.args(preset), file], { stdio: ["pipe", "ignore", "pipe"] });
  child.stderr.on("data", data => { stderr = (stderr + data).slice(-8000); });
  child.stdin.on("error", failure => { error = failure; });
  const closed = new Promise(resolve => {
    child.on("error", failure => { error = failure; resolve(-1); });
    child.on("close", resolve);
  });
  return {
    async write(png) {
      if (error || child.exitCode !== null) throw error ?? new Error(stderr);
      if (!child.stdin.write(png)) await once(child.stdin, "drain");
    },
    async finish() {
      child.stdin.end();
      if (await closed !== 0 || error) throw error ?? new Error(stderr);
    },
    kill() { if (child.exitCode === null) child.kill(); },
  };
}

// 显式写入每段的精确时长；否则 concat 读取按毫秒取整的容器时长，段界时间戳会偏离帧网格。
async function concatSegments(ffmpeg, segments, fps, target, directory, codec) {
  const list = path.join(directory, "segments.txt");
  await writeFile(list, segments.map(({ file, frames }) =>
    `file '${file.replaceAll("'", "'\\''")}'\nduration ${frames / fps}`).join("\n"));
  const faststart = codec.extension === ".mp4" ? ["-movflags", "+faststart"] : [];
  const result = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
    "-i", list, "-c", "copy", ...faststart, target], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`拼接失败：${result.stderr}`);
}

function framePsnr(ffmpeg, first, second) {
  const result = spawnSync(ffmpeg, ["-hide_banner", "-i", first, "-i", second,
    "-lavfi", "[0]format=rgb24[a];[1]format=rgb24[b];[a][b]psnr", "-f", "null", "-"], { encoding: "utf8" });
  const value = result.stderr.match(/average:(\S+)/)?.[1];
  return value === "inf" ? Infinity : Number(value);
}

// 播放一段连续镜头，返回本段帧数与以本段第 0 帧为起点的报告。
async function renderSegment({ page, errors, capture }, shots, encoder, { preset, scripted, limit, check, qaDirectory, total, abort, ffmpeg }) {
  const advance = async time => {
    await page.evaluate(time => window.__videoClock.tick(time), time);
    // 独立的往返使 React 有机会提交 rAF 触发的状态更新；返回画面是否已静止。
    return page.evaluate(() => window.__videoClock.sync());
  };
  await advance(0);
  const report = [];
  let frame = 0;
  let reused = 0;
  let cursorPoint = { x: 960, y: 900 };
  for (const shot of shots) {
    if (abort?.error || frame >= limit * preset.fps) break;
    const shotIndex = report.length;
    await page.evaluate(() => { const cursor = document.getElementById("video-cursor"); if (cursor) cursor.style.display = "none"; });
    if (shot.action === "next") await page.keyboard.press("ArrowRight");
    let clickTarget;
    let destination;
    const origin = cursorPoint;
    if (shot.action === "click") {
      clickTarget = page.locator(shot.selector).nth(shot.index);
      const bounds = await clickTarget.boundingBox();
      if (!bounds) throw new Error("点击对象不可见");
      destination = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    }
    await advance(frame * 1000 / preset.fps);
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => {
      const main = document.querySelector("main");
      const sceneFrame = document.querySelector(".scene-frame").getBoundingClientRect();
      return { scene: main.dataset.sceneId, step: Number(main.dataset.step),
        phase: document.querySelector("[data-phase]")?.getAttribute("data-phase"),
        katexErrors: document.querySelectorAll(".katex-error").length,
        noScroll: document.documentElement.scrollHeight === document.documentElement.clientHeight,
        width: sceneFrame.width, height: sceneFrame.height };
    });
    if (state.scene !== shot.scene || state.step !== shot.step ||
      (shot.phase !== undefined && Number(state.phase) !== shot.phase) ||
      state.katexErrors || !state.noScroll || state.width !== 1920 || state.height !== 1080) {
      throw new Error(`播放状态不符：${JSON.stringify({ shot, state })}`);
    }
    const startFrame = frame;
    const animationMs = scripted ? 0 : await page.evaluate(() => window.__videoClock.remainingAnimationMs());
    const animationFrames = Math.ceil(animationMs * preset.fps / 1000);
    const holdFrames = scripted ? Math.round(shot.seconds * preset.fps) : Math.ceil(shot.seconds * preset.fps);
    const count = Math.min(animationFrames + holdFrames, Math.ceil(limit * preset.fps) - frame);
    const sampleFrames = new Set([0, Math.floor(count / 2), count - 1, Math.round(.75 * preset.fps), animationFrames]);
    const movementFrames = Math.round(shot.seconds * preset.fps);
    const clickFrame = movementFrames - 1;
    let held;
    for (let i = 0; i < count; i++) {
      if (clickTarget) {
        // 点击段仅包含移动；到达时点击，下一帧直接进入下一个动作。
        const progress = Math.min(1, i / Math.max(1, movementFrames - 1));
        const eased = progress * progress * (3 - 2 * progress);
        cursorPoint = { x: origin.x + (destination.x - origin.x) * eased,
          y: origin.y + (destination.y - origin.y) * eased };
        await page.mouse.move(cursorPoint.x, cursorPoint.y);
        if (i === clickFrame) {
          await page.mouse.click(destination.x, destination.y);
          if (await clickTarget.getAttribute("aria-pressed") !== "true") throw new Error("点击没有生效");
          // 保留选中高亮，释放鼠标点击焦点，避免下一次方向键触发浏览器蓝色焦点框。
          await clickTarget.evaluate(element => element.blur());
        }
        await page.evaluate(({ x, y }) => {
          const cursor = document.getElementById("video-cursor");
          Object.assign(cursor.style, { display: "block", left: `${x}px`, top: `${y}px` });
        }, cursorPoint);
      }
      // 光标移动由 Node 侧驱动，时钟无法感知，点击段始终逐帧截图。
      const still = await advance((frame + i) * 1000 / preset.fps) && !clickTarget;
      if (!scripted && i === animationFrames) {
        const remaining = await page.evaluate(() => window.__videoClock.remainingAnimationMs());
        if (remaining > 1) throw new Error(`停留开始时动画尚未结束：${shot.scene}/${shot.step}，剩余 ${remaining}ms`);
      }
      // 画面静止后（停留段）截一次即可，后续帧复用同一张图；check 模式抽样实拍并逐字节核对。
      const reuse = still && held !== undefined;
      let png;
      if (check) {
        if (!sampleFrames.has(i) && !(still && held === undefined)) continue;
        png = await capture();
        if (reuse && !png.equals(held)) {
          // Chrome 在动画结束后可能重新栅格化图层，边缘像素有 1 级以内的抖动；肉眼不可见的差异（≥ 60 dB）可以接受。
          const base = path.join(qaDirectory, `${String(shotIndex).padStart(2, "0")}-${i}-reuse`);
          await writeFile(`${base}-held.png`, held);
          await writeFile(`${base}-actual.png`, png);
          const psnr = framePsnr(ffmpeg, `${base}-held.png`, `${base}-actual.png`);
          if (!(psnr >= 60)) throw new Error(`静止帧复用与实际画面不一致：${shot.scene}/${shot.step} 第 ${i} 帧，PSNR ${psnr} dB，对比图 ${base}-*.png`);
          await rm(`${base}-held.png`);
          await rm(`${base}-actual.png`);
        }
      } else png = reuse ? held : await capture();
      if (reuse) reused++;
      if (still && held === undefined) held = png;
      if (png.readUInt32BE(16) !== preset.width || png.readUInt32BE(20) !== preset.height) {
        throw new Error("渲染图像尺寸与预设不符");
      }
      if (check) {
        if (sampleFrames.has(i)) await writeFile(path.join(qaDirectory, `${String(shotIndex).padStart(2, "0")}-${i}.png`), png);
      } else await encoder.write(png);
    }
    frame += count;
    await advance(frame * 1000 / preset.fps);
    const remainingAnimationMs = await page.evaluate(() => window.__videoClock.remainingAnimationMs());
    const truncated = count < animationFrames + holdFrames;
    if (!scripted && !truncated && remainingAnimationMs > 1) throw new Error(`动画未完整播放：${shot.scene}/${shot.step}，剩余 ${remainingAnimationMs}ms`);
    if (await page.evaluate(() => document.activeElement?.matches(".object-card"))) throw new Error("对象仍有鼠标点击焦点");
    report.push({ ...shot, timingMode: scripted ? "fixed" : "animation-then-hold", startFrame,
      holdStartFrame: startFrame + Math.min(animationFrames, count), endFrame: frame,
      remainingAnimationMs, truncated, animationSeconds: animationMs / 1000, holdSeconds: shot.seconds, state });
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`[${shot.scene} ${report.length}/${shots.length}${total !== shots.length ? ` · 全片 ${total} 镜` : ""}] 步骤 ${shot.step + 1} · 动画 ${animationMs / 1000}s + 停留 ${shot.seconds}s${truncated ? "（限时截断）" : ""}`);
  }
  if (encoder && !abort?.error) await encoder.finish();
  return { report, frames: frame, reused };
}
