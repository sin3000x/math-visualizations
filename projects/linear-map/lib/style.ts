import type { CSSProperties } from "react";

/** 带 CSS 自定义属性的内联样式。 */
export const vars = (style: Record<string, string | number | undefined>) => style as CSSProperties;
