import "./CheckoutIcon.css";

export function CheckoutIcon({ accent, largeScreen = false }: { accent: string; largeScreen?: boolean }) {
  return <svg className="checkout-icon" viewBox="0 0 220 190" role="img" aria-label="卡通收银台">
    <path className="checkout-shadow" d="M26 170h176l-12 12H36Z" />
    <rect className="checkout-screen-shell" x={largeScreen ? 22 : 28} y={largeScreen ? 8 : 18} width={largeScreen ? 132 : 112} height={largeScreen ? 90 : 76} rx="12" />
    <rect className="checkout-screen" x={largeScreen ? 32 : 40} y={largeScreen ? 18 : 30} width={largeScreen ? 112 : 88} height={largeScreen ? 68 : 48} rx="6" style={{ fill: accent }} />
    <path className="checkout-neck" d="M64 94h44l9 27H55Z" />
    <path className="checkout-body" d="M24 116h171l16 54H10Z" />
    <rect className="checkout-drawer" x="28" y="136" width="164" height="23" rx="5" />
    <circle className="checkout-knob" cx="110" cy="148" r="5" style={{ fill: accent }} />
    <g className="checkout-keys">
      {Array.from({ length: 12 }, (_, index) => <rect key={index} x={39 + (index % 6) * 23} y={104 + Math.floor(index / 6) * 13} width="14" height="8" rx="2" />)}
    </g>
    <path className="checkout-highlight" d={largeScreen ? "M40 25h24" : "M48 39h34"} />
  </svg>;
}
