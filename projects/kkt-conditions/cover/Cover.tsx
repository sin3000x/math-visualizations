import { Arrow } from "../components/plot/Arrow";
import { MathFormula } from "../components/math/MathFormula";
import { sx, sy, PLOT_SCALE } from "../lib/geometry/plot";
import "./cover.css";

// f = ((x-1.4)^2+(y-1.4)^2)/2, g = x+y <= 0.
// At x*=0: -grad f=(1.4,1.4), -lambda grad g=(-1.4,-1.4), lambda=1.4.
const boundaryTop = (370 + 1.4 * sx(0)) - (320 + 1.4 * sy(0));
const boundaryBottom = boundaryTop + 1080;

// Equal radial spacing; the third contour is tangent at the optimum.
// These circles represent non-uniform objective levels of the quadratic.
const contourRadii = Array.from({ length: 18 }, (_, index) => (index + 1) * Math.SQRT2 * 1.4 / 3);

export default function Cover() {
  return <div className="cover-preview"><div className="cover-frame">
    <main className="video-cover kkt-cover" data-role="video-cover" aria-label="KKT：约束边界上的力平衡">
      <svg className="cover-geometry" viewBox="0 0 1920 1080" aria-label="两支等长反向的力在约束边界处平衡">
        <defs>
          {(["red", "blue"] as const).map(tone => <marker key={tone} id={`arrow-${tone}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.8" markerHeight="3.8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={tone === "red" ? "#ff7569" : "#78b7ff"} /></marker>)}
        </defs>
        <path d={`M 0 0 H ${boundaryTop} L ${boundaryBottom} 1080 H 0 Z`} className="cover-feasible" />
        <g transform="translate(370 320) scale(1.4)">
          {contourRadii.map(radius => <circle key={radius} cx={sx(1.4)} cy={sy(1.4)} r={radius * PLOT_SCALE} className="cover-contour" />)}
          <line x1={(boundaryTop - 370) / 1.4} y1={-320 / 1.4} x2={(boundaryBottom - 370) / 1.4} y2={(1080 - 320) / 1.4} className="cover-boundary" />
          <Arrow from={{ x: 0, y: 0 }} vector={{ x: 1.4, y: 1.4 }} tone="red" label="下降方向" showLabel={false} />
          <Arrow from={{ x: 0, y: 0 }} vector={{ x: -1.4, y: -1.4 }} tone="blue" label="约束反力" showLabel={false} />
          <circle cx={sx(0)} cy={sy(0)} r="10" fill="#ffff00" stroke="#000" strokeWidth="3" />
        </g>
      </svg>
      <div className="cover-label cover-descent" data-cover-object="descent"><MathFormula latex={"-\\nabla f"} /></div>
      <div className="cover-label cover-reaction" data-cover-object="reaction"><MathFormula latex={"-\\lambda\\nabla g"} /></div>
      <div className="cover-title" data-cover-object="title">KKT 条件</div>
    </main>
  </div></div>;
}
