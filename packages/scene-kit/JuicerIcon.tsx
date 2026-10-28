import type { SVGProps } from "react";

/** Filled juicer with apple and banana slices; outline inherits currentColor. */
export function JuicerIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return <svg width={140} height={160} viewBox="0 0 140 160" role="img" aria-label="榨汁机" {...props} className={`juicer-icon ${className}`.trim()}>
    <path d="M104 33h15q12 0 12 14v30q0 14-14 14h-20" fill="none" stroke="currentColor" strokeWidth="5" />
    <path d="M29 27h77l-9 74H39Z" fill="#141b19" />
    <path d="M29 27h77l-9 74H39Z" fill="#62d2c3" fillOpacity=".45" />
    <path d="M29 27h77l-9 74H39Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <g aria-label="苹果切片">
      <path d="M39 40 59 45 43 60Q34 52 39 40Z" fill="#f8dfb4" />
      <path d="M39 40Q34 52 43 60" fill="none" stroke="#ed6a5a" strokeWidth="4" strokeLinecap="round" />
      <path d="M57 59 75 69 55 77Q49 68 57 59Z" fill="#f8dfb4" />
      <path d="M57 59Q49 68 55 77" fill="none" stroke="#ed6a5a" strokeWidth="4" strokeLinecap="round" />
    </g>
    <g aria-label="香蕉切片" fill="#f9e6a0" stroke="#f4c95d" strokeWidth="2.5">
      <ellipse cx="78" cy="44" rx="9" ry="7" transform="rotate(-20 78 44)" />
      <ellipse cx="88" cy="65" rx="8" ry="6.5" transform="rotate(18 88 65)" />
    </g>
    <g fill="none" stroke="#bc8e42" strokeWidth="1.5" strokeLinecap="round">
      <path d="m75 43 3 1 2-3m-2 3 1 3M85 64l3 1 2-2m-2 2v3" />
    </g>
    <path d="M23 27h89v-9H23ZM56 10h22v8H56Z" fill="#252525" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M39 106h58l13 42H26Z" fill="#252525" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <circle cx="68" cy="128" r="9" fill="#62d2c3" />
    <path d="M26 151h84" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </svg>;
}
