import { FruitBag } from "../components/FruitBag";
import { MathFormula } from "../components/MathFormula";
import { basis, combine } from "../lib/math/bags";
import type { SceneProps } from "../lib/scenes/types";
import "./BasisScene.css";

const examples = [{ apples: 2, bananas: 1 }, { apples: 1, bananas: 2 }, { apples: .5, bananas: 1.5 }, { apples: -1, bananas: 1 }, { apples: 0, bananas: 0 }];

export function BasisScene({ step }: SceneProps) {
  const equation = step >= 2;
  const general = step >= 3;
  const result = combine(2, 1);
  return <section className={`basis-scene stage-${step}`} aria-label="水果袋空间中的两个基袋与线性组合" data-role="basis-scene">
    {!equation && <>
      <div className="bag-universe"><span className="universe-symbol"><MathFormula latex="V" /></span></div>
      <div className="space-examples">
        {examples.map((bag, index) => <div className={`space-sample sample-${index}`} key={index}><FruitBag {...bag} /></div>)}
        <div className="space-dots"><MathFormula latex={"\\cdots"} /></div>
      </div>
      {step === 1 && <div className="basis-pair" data-role="basis-pair">
        {basis.map((bag, index) => <div key={index} className={`basis-term term-${index}`}>
          <div className="basis-label"><MathFormula latex={`e_${index + 1}`} /></div>
          <FruitBag {...bag} />
        </div>)}
      </div>}
    </>}
    {equation && <div className="combination-equation" data-role="combination-equation">
      <div className="combination-formula"><MathFormula latex={general ? "ae_1+be_2=" : "2e_1+e_2="} /></div>
      <div data-role="combination-result" data-apples={general ? "a" : result.apples} data-bananas={general ? "b" : result.bananas}>
        <FruitBag apples={general ? "a" : result.apples} bananas={general ? "b" : result.bananas} />
      </div>
    </div>}
    {general && <div className="general-domain"><MathFormula latex={"a,b\\in\\mathbb R"} /></div>}
  </section>;
}
