import path from "node:path";
import { pathToFileURL } from "node:url";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" };
const escapeXml = text => String(text).replace(/[&<>"']/g, character => entities[character]);
const standardFormats = { "1920x1080": "1080p", "1280x720": "720p", "3840x2160": "2160p" };

// 生成 Final Cut Pro 可导入的 FCPXML：一条时间线放入整段视频。每一步打两个点：
// 步骤开始（即上一步停顿结束；每个 Scene 第一步用章节标记）与动画结束（即停顿开始）。
// 没有动画的步骤两点重合，只保留开始标记。时间均以整帧有理数表示，标记与视频帧严格对齐。
export function createFcpxml({ videoPath, name, fps, width, height, totalFrames, shots }) {
  const at = frames => frames === 0 ? "0s" : `${frames}/${fps}s`;
  const duration = at(totalFrames);
  const standard = standardFormats[`${width}x${height}`];
  const formatName = standard ? ` name="FFVideoFormat${standard}${fps}"` : "";
  const markers = [];
  const startedSteps = new Set();
  const scenes = new Set();
  for (const shot of shots) {
    const key = `${shot.scene}\u0000${shot.step}`;
    if (!startedSteps.has(key) && shot.startFrame < totalFrames) {
      startedSteps.add(key);
      const chapter = !scenes.has(shot.scene);
      scenes.add(shot.scene);
      markers.push({ frame: shot.startFrame, chapter, label: chapter ? shot.scene : `${shot.scene} · ${shot.step + 1}` });
    }
    const holdStart = shot.holdStartFrame ?? shot.startFrame;
    if (holdStart > shot.startFrame && holdStart < totalFrames) {
      markers.push({ frame: holdStart, chapter: false, label: `${shot.scene} · ${shot.step + 1} 动画结束` });
    }
  }
  markers.sort((first, second) => first.frame - second.frame);
  const markerXml = markers.map(marker => marker.chapter
    ? `              <chapter-marker start="${at(marker.frame)}" duration="${at(1)}" value="${escapeXml(marker.label)}" posterOffset="0s"/>`
    : `              <marker start="${at(marker.frame)}" duration="${at(1)}" value="${escapeXml(marker.label)}"/>`).join("\n");
  const fileName = escapeXml(path.basename(videoPath));
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1"${formatName} frameDuration="${at(1)}" width="${width}" height="${height}" colorSpace="1-1-1 (Rec. 709)"/>
    <asset id="r2" name="${fileName}" start="0s" duration="${duration}" hasVideo="1" format="r1" videoSources="1">
      <media-rep kind="original-media" src="${escapeXml(pathToFileURL(videoPath).href)}"/>
    </asset>
  </resources>
  <library>
    <event name="${escapeXml(name)}">
      <project name="${escapeXml(name)}">
        <sequence format="r1" duration="${duration}" tcStart="0s" tcFormat="NDF">
          <spine>
            <asset-clip ref="r2" offset="0s" name="${fileName}" duration="${duration}" format="r1" tcFormat="NDF">
${markerXml}
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
