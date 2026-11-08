---
name: subtitles
description: 给旁白录音生成 SRT 字幕：文字取自备忘录（Apple Notes）里的文案，时间取自录音的逐字识别。用户给出录音（wav 等）并要求生成字幕、SRT 或对照文案打时间轴时使用。
---

# 旁白字幕（SRT）

字幕文字以文案为准（不会有识别错字），时间来自 faster-whisper 对录音的逐字时间戳。脚本在 `packages/video-tools/subtitles/make_srt.py`，从仓库根目录用 `npm run subtitles` 调用（内部是 `uv run --with`，不要自建虚拟环境）。

## 步骤

1. **确定项目和文案。** 录音对应哪个 `projects/<项目>`、备忘录里哪条笔记（文案按“系列 - 集数 标题”命名，例如《对偶空间 - 05 线性映射和矩阵》）。不确定就问用户。

2. **从备忘录取最新文案**，存到项目的 `exports/sources/<录音名>.txt`。必须指定 UTF-8，否则中文会乱码：

   ```bash
   osascript -e 'tell application "Notes" to get body of note "<笔记标题>"' \
     | textutil -stdin -convert txt -stdout -format html -inputencoding UTF-8 > projects/<项目>/exports/sources/<录音名>.txt
   ```

   第一行标题会被脚本自动去掉。不要修改备忘录本身。

3. **运行**（首次要识别录音，在用户这台 Intel Mac 上约为录音时长的 2 倍，放到后台运行；之后录音不变就复用缓存，几秒完成）：

   ```bash
   npm run subtitles -- --project <项目> --audio "<录音路径>" --script projects/<项目>/exports/sources/<录音名>.txt
   ```

   输出 `projects/<项目>/exports/videos/<录音名>.srt`；识别缓存在 `exports/qa/subtitles/`。

4. **看差异清单。** 绝大多数是同音字识别错误（份/分、基/机、向量/像量、收银台/收音台），不用管。若录音里实际说的与文案不同（多说、漏说、改说了几个字），把 `exports/sources/` 里那份文案改成实际说的，再运行一次；字幕应与口播一致。

5. **抽查断行。** 打印每条字幕检查：术语被拆开就把词加进 `packages/video-tools/subtitles/terms.txt` 再运行；其他断行规则（每条 ≤18 字、短引导语并入下一条、行首不放“的”、行尾不留介词、行末无标点、句中逗号变空格）已在脚本里。

6. **汇报**：SRT 路径、条数，以及第 4 步里按实际口播改动过的地方。提醒用户：字幕时间从录音第 0 秒算起，导入 Final Cut Pro 后要与配音开头对齐，而不是视频开头。
