export function FruitIcon({ kind }: { kind: "apple" | "banana" }) {
  if (kind === "apple") {
    return <svg viewBox="0 0 64 64" role="img" aria-label="卡通苹果">
      <path className="fruit-leaf" d="M34 17c3-9 12-12 19-8-3 8-10 12-19 8Z" />
      <path className="fruit-stem" d="M32 19c0-7 2-11 6-15" />
      <path className="fruit-body" d="M32 20c-7-7-20-5-24 6-6 16 6 34 18 34 3 0 5-2 7-2s5 2 8 2c12 0 23-19 17-34-4-11-18-13-26-6Z" />
      <path className="fruit-shine" d="M17 30c2-4 5-6 9-6" />
    </svg>;
  }

  return <svg viewBox="0 0 72 64" role="img" aria-label="卡通香蕉">
    <path className="banana-tip" d="M15 11l-5 3 3 6 5-3Z" />
    <path className="fruit-body" d="M16 16c8 23 27 31 47 17 0 16-10 27-25 27C19 60 7 43 9 23c0-4 2-6 7-7Z" />
    <path className="banana-inner" d="M18 23c10 16 25 22 39 14-5 10-13 15-23 14-10-2-16-12-16-28Z" />
    <path className="fruit-shine" d="M18 29c5 9 11 14 19 17" />
    <circle className="banana-end" cx="64" cy="33" r="3" />
  </svg>;
}
