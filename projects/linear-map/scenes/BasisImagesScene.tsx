import { column } from "../lib/math/notation";
import { FruitBag } from "@math-visualizations/scene-kit/FruitBag";
import { Juice } from "../components/Juice";
import { Formula, MapArrow } from "../components/Notation";
import { juiceOf } from "../lib/math/map";
import "./BasisImagesScene.css";
export function BasisImagesScene({ step }: { step: number }) {
  return <section className="lesson basis-images" data-step={step} aria-label="两个基袋的像决定整个映射">
    {[0, 1].filter(i => i === 0 || step >= 2).map(i => <div className={`basis-row row-${i}`} key={i} data-layout-content>
      <Formula className={i ? "banana-color" : "apple-color"} latex={`e_${i + 1}`} />
      <FruitBag apples={i === 0 ? 1 : 0} bananas={i === 1 ? 1 : 0} tone={i ? "banana" : "apple"} />
      {(i === 0 ? step >= 1 : step >= 3) && <><MapArrow className="basis-map" /><Juice values={juiceOf(i ? [0, 1] : [1, 0])} /><Formula latex={`[T(e_${i + 1})]_{\\mathcal U}=${column(juiceOf(i ? [0, 1] : [1, 0]))}`} /></>}
    </div>)}
  </section>;
}
