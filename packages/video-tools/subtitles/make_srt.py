"""旁白字幕：识别录音的逐字时间，把文案逐字对齐上去，按断行规则写出 SRT。

字幕文字取自文案（不用识别结果），时间取自 faster-whisper 的逐字时间戳。
识别结果缓存在 --cache 指定的 JSON（默认放在项目 exports/qa/subtitles/），
录音没有变化时重复运行只做对齐与断行，几秒完成。
"""

__all__ = ["main"]

import argparse
import difflib
import json
import sys
import time
from pathlib import Path

import jieba

MAX_LEN = 18  # 每条字幕最多字数
MIN_LEN = 6  # 过短的片段并回上一条
LEAD_LEN = 4  # 引导语（因为、意思是、也就是说）并入下一条
BREAKS = "，。？！：；"
SENTENCE_END = "。？！—"
PUNCT = set("，。？！：；、——“”‘’（）《》,.?!:;\"'()- ")
HEAD_PARTICLES = "的了地得"  # 不放在行首
TAIL_PREPOSITIONS = "把按被从在给对向"  # 不留在行尾
TAIL_DETERMINERS = ("任何", "这个", "那个", "一个", "每个")  # 不和后面的名词拆开
TERMS_FILE = Path(__file__).with_name("terms.txt")
PROMPT = "线性映射，矩阵，榨汁机，托盘，果汁空间，水果袋，收银台，行向量，列向量，基底，对偶空间。"


def is_content(ch):
    return ch not in PUNCT and not ch.isspace()


def content_len(text):
    return sum(1 for ch in text if is_content(ch))


def load_terms(extra_files):
    for terms_path in [TERMS_FILE, *extra_files]:
        for line in Path(terms_path).read_text(encoding="utf-8").splitlines():
            term = line.split("#", 1)[0].strip()
            if term:
                jieba.add_word(term, freq=10**6)


def load_script(script_path):
    """文案：第一行若是“标题”（含“ - ”），去掉；其余段落拼成一段。"""
    lines = [
        ln.strip()
        for ln in Path(script_path).read_text(encoding="utf-8").splitlines()
        if ln.strip()
    ]
    if lines and " - " in lines[0]:
        lines = lines[1:]
    return "".join(lines)


def transcribe(audio_path, cache_path):
    audio = Path(audio_path)
    cache = Path(cache_path)
    if cache.exists() and cache.stat().st_mtime >= audio.stat().st_mtime:
        print(f"使用识别缓存：{cache}")
        return json.loads(cache.read_text(encoding="utf-8"))
    from faster_whisper import WhisperModel

    model = WhisperModel("medium", device="cpu", compute_type="int8")
    started = time.time()
    segments, info = model.transcribe(
        str(audio),
        language="zh",
        word_timestamps=True,
        initial_prompt=PROMPT,
        vad_filter=True,
        beam_size=5,
    )
    recognized = []
    for seg in segments:
        print(f"[{seg.start:7.2f} -> {seg.end:7.2f}] {seg.text}", flush=True)
        recognized.extend({"w": w.word, "s": w.start, "e": w.end} for w in seg.words)
    data = {"duration": info.duration, "words": recognized}
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"识别完成：{time.time() - started:.0f}s，{len(recognized)} 个词", flush=True)
    return data


def char_times(recognized):
    chars, spans = [], []
    for item in recognized:
        text = [ch for ch in item["w"] if is_content(ch)]
        if not text:
            continue
        step = (item["e"] - item["s"]) / len(text)
        for k, ch in enumerate(text):
            chars.append(ch.lower())
            spans.append((item["s"] + k * step, item["s"] + (k + 1) * step))
    return chars, spans


def align(script, recognized):
    """返回 {文案字符下标: (开始, 结束)}、匹配率与差异列表。"""
    positions = [i for i, ch in enumerate(script) if is_content(ch)]
    expected = [script[i].lower() for i in positions]
    heard, spans = char_times(recognized)
    matcher = difflib.SequenceMatcher(None, expected, heard, autojunk=False)
    timed = [None] * len(expected)
    diffs = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                timed[i1 + k] = spans[j1 + k]
            continue
        at = spans[j1][0] if j1 < len(spans) else None
        diffs.append((tag, "".join(expected[i1:i2]), "".join(heard[j1:j2]), at))
        if tag == "replace":
            # 同音字识别错误：按比例映射到识别出的时间段
            lo, hi, n = spans[j1][0], spans[j2 - 1][1], i2 - i1
            for k in range(n):
                timed[i1 + k] = (lo + (hi - lo) * k / n, lo + (hi - lo) * (k + 1) / n)
    known = [k for k, span in enumerate(timed) if span]
    for k, span in enumerate(timed):
        if span is None:
            before = max((p for p in known if p < k), default=None)
            after = min((q for q in known if q > k), default=None)
            lo = timed[before][1] if before is not None else 0.0
            hi = timed[after][0] if after is not None else lo + 0.3
            timed[k] = (lo, hi)
    return dict(zip(positions, timed)), matcher.ratio(), diffs


def clauses(script):
    """按标点与破折号切成分句：(起点, 终点, 文字)。"""
    found, current, begin = [], "", 0
    for i, ch in enumerate(script):
        if ch in BREAKS or ch == "—":
            if current.strip():
                found.append((begin, i, current))
            current, begin = "", i + 1
        else:
            if not current:
                begin = i
            current += ch
    if current.strip():
        found.append((begin, len(script), current))
    return found


def word_cuts(text):
    cuts, pos = set(), 0
    for word in jieba.cut(text):
        pos += len(word)
        cuts.add(pos)
    return cuts


def cut_score(text, cut, begin, times):
    left, right = text[:cut], text[cut:]
    before = max((begin + i for i in range(cut) if begin + i in times), default=None)
    after = min(
        (begin + i for i in range(cut, len(text)) if begin + i in times), default=None
    )
    gap = (
        times[after][0] - times[before][1]
        if before is not None and after is not None
        else 0
    )
    balance = abs(content_len(left) - content_len(right)) / content_len(text)
    penalty = (
        (right[0] in HEAD_PARTICLES)
        + (left[-1] in TAIL_PREPOSITIONS)
        + left.endswith(TAIL_DETERMINERS)
    )
    return gap - 0.6 * balance - penalty


def split_long(begin, end, text, times):
    """过长分句在词边界切开：优先选朗读停顿长、又靠近中间、不违反断行规则的位置（递归）。"""
    if content_len(text) <= MAX_LEN:
        return [(begin, end, text)]
    candidates = [
        cut
        for cut in word_cuts(text)
        if content_len(text[:cut]) >= 5 and content_len(text[cut:]) >= 5
    ]
    if not candidates:
        return [(begin, end, text)]
    best = max(candidates, key=lambda cut: cut_score(text, cut, begin, times))
    return split_long(begin, begin + best, text[:best].strip(), times) + split_long(
        begin + best, end, text[best:].strip(), times
    )


def build_cues(script, times):
    pieces = []
    for begin, end, text in clauses(script):
        pieces.extend(split_long(begin, end, text.strip(), times))
    cues, k = [], 0
    while k < len(pieces):
        begin, end, text = pieces[k]
        following = pieces[k + 1] if k + 1 < len(pieces) else None
        limit = MAX_LEN + (2 if content_len(text) <= 3 else 1)
        if (
            following
            and content_len(text) <= LEAD_LEN
            and script[end] not in SENTENCE_END
            and content_len(text) + content_len(following[2]) <= limit
        ):
            pieces[k + 1] = (begin, following[1], f"{text} {following[2]}")
        elif (
            cues
            and content_len(text) < MIN_LEN
            and script[cues[-1][1]] not in SENTENCE_END
            and content_len(cues[-1][2]) + content_len(text) <= MAX_LEN
        ):
            cues[-1] = (cues[-1][0], end, f"{cues[-1][2]} {text}")
        else:
            cues.append((begin, end, text))
        k += 1
    return cues


def stamp(sec):
    ms = round(sec * 1000)
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    seconds, ms = divmod(ms, 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{ms:03}"


def write_srt(script, data, times, out_path):
    timed_cues = []
    for begin, end, text in build_cues(script, times):
        spans = [times[i] for i in range(begin, end) if i in times]
        timed_cues.append([spans[0][0], spans[-1][1], text])
    for k, cue in enumerate(timed_cues):
        next_start = (
            timed_cues[k + 1][0] if k + 1 < len(timed_cues) else data["duration"]
        )
        cue[1] = min(max(cue[1] + 0.2, cue[0] + 0.8), next_start - 0.05)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "".join(
            f"{k}\n{stamp(s)} --> {stamp(e)}\n{text}\n\n"
            for k, (s, e, text) in enumerate(timed_cues, 1)
        ),
        encoding="utf-8",
    )
    return timed_cues


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="项目目录名，例如 linear-map")
    parser.add_argument("--audio", required=True, help="旁白录音（wav 等）")
    parser.add_argument("--script", required=True, help="文案文本（与实际朗读一致）")
    parser.add_argument(
        "--out", help="输出 SRT；默认 projects/<项目>/exports/videos/<录音名>.srt"
    )
    parser.add_argument(
        "--cache",
        help="识别缓存；默认 projects/<项目>/exports/qa/subtitles/<录音名>.words.json",
    )
    parser.add_argument(
        "--terms",
        action="append",
        default=[],
        help="额外术语文件（每行一个词，不在词中间换行）",
    )
    args = parser.parse_args(argv)

    repo = Path(__file__).resolve().parents[3]
    project_dir = repo / "projects" / args.project
    if not project_dir.is_dir():
        sys.exit(f"找不到项目：{project_dir}")
    stem = Path(args.audio).stem
    out_path = (
        Path(args.out)
        if args.out
        else project_dir / "exports" / "videos" / f"{stem}.srt"
    )
    cache_path = (
        Path(args.cache)
        if args.cache
        else project_dir / "exports" / "qa" / "subtitles" / f"{stem}.words.json"
    )

    jieba.setLogLevel(60)
    load_terms(args.terms)
    script = load_script(args.script)
    data = transcribe(args.audio, cache_path)
    times, ratio, diffs = align(script, data["words"])
    timed_cues = write_srt(script, data, times, out_path)

    print(f"\n已写出 {len(timed_cues)} 条字幕：{out_path}")
    print(
        f"文案与识别的字符匹配率 {ratio:.3f}；差异（多为同音字，若是实际口播与文案不同，改文案后重跑）："
    )
    for tag, expected, heard, at in diffs:
        when = f"{at:7.2f}s" if at is not None else "    末尾"
        print(f"{when} {tag:7} 文案「{expected}」 识别「{heard}」")
    longest = max(content_len(text) for _, _, text in timed_cues)
    print(f"最长一条 {longest} 字")


if __name__ == "__main__":
    main()
