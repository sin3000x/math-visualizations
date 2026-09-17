export function CheckoutIcon({ accent }: { accent: string }) {
  return <svg className="checkout-icon" viewBox="0 0 220 190" role="img" aria-label="卡通收银台">
    <path className="checkout-shadow" d="M26 170h176l-12 12H36Z" />
    <path className="checkout-receipt" d="M145 8h48v72l-8-6-8 6-8-6-8 6-8-6-8 6Z" />
    <rect className="checkout-screen-shell" x="28" y="18" width="112" height="76" rx="12" />
    <rect className="checkout-screen" x="40" y="30" width="88" height="48" rx="6" style={{ fill: accent }} />
    <path className="checkout-neck" d="M64 94h44l9 27H55Z" />
    <path className="checkout-body" d="M24 116h171l16 54H10Z" />
    <rect className="checkout-drawer" x="28" y="136" width="164" height="23" rx="5" />
    <circle className="checkout-knob" cx="110" cy="148" r="5" style={{ fill: accent }} />
    <g className="checkout-keys">
      {Array.from({ length: 12 }, (_, index) => <rect key={index} x={39 + (index % 6) * 23} y={104 + Math.floor(index / 6) * 13} width="14" height="8" rx="2" />)}
    </g>
    <path className="checkout-highlight" d="M48 39h34" />
  </svg>;
}
