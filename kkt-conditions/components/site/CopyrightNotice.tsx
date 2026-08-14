const CREATOR_URL = "https://space.bilibili.com/20883932";

export function CopyrightNotice() {
  return (
    <a
      className="copyright-notice"
      href={CREATOR_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="访问轩兔的 Bilibili 主页"
    >
      © 轩兔
    </a>
  );
}
