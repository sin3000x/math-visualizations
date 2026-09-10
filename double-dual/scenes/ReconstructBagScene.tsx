import type { CSSProperties } from 'react';
import { CheckoutIcon } from '../components/CheckoutIcon';
import { FruitBag } from '../components/FruitBag';
import { FruitIcon } from '../components/FruitIcon';
import { MathFormula } from '../components/MathFormula';
import type { SceneProps } from '../lib/scenes/types';
import './ReconstructBagScene.css';

const recoveredBag = { apples: 2, bananas: 1 };
const probes = [
  { name: 'f_1', prices: ['1', '0'], reading: '2', color: '#62d2c3' },
  { name: 'f_2', prices: ['0', '1'], reading: '1', color: '#7baafa' },
  { name: 'f=af_1+bf_2', prices: ['a', 'b'], reading: '2a+b', color: '#ba91ef' },
] as const;

export function ReconstructBagScene({ step }: SceneProps) {
  const resolved = step >= 7;
  return <section className="reconstruct-scene" aria-label="线性评分依次作用于两个基础收银台与任意收银台，最后还原水果袋">
    <div className="reconstruct-functional" data-role="unknown-functional">
      <div className={`space-element answer ${resolved ? 'resolved' : ''}`}>
        <span className="question" aria-hidden={resolved}><MathFormula latex={"\\Phi"} /></span>
        <div className="answer-bag" aria-hidden={!resolved} data-role="recovered-bag"><FruitBag {...recoveredBag} /></div>
      </div>
    </div>
    {probes.map((probe, index) => {
      const y = 405 + (index - 1) * 250;
      const measured = step >= index + 4;
      return step >= index + 1 && <div className="reconstruct-lane" key={probe.name} style={{ '--lane-y': `${y}px`, '--probe-color': probe.color } as CSSProperties} data-role="probe-lane">
        <div className="reconstruct-probe" data-role="checkout-rule">
          <div className="reconstruct-probe-name"><MathFormula latex={probe.name} /></div>
          <CheckoutIcon accent={probe.color} />
          <div className="reconstruct-prices">
            {probe.prices.map((price, fruitIndex) => <div key={fruitIndex}>
              <span className={`fruit ${fruitIndex === 0 ? 'apple' : 'banana'}`}><FruitIcon kind={fruitIndex === 0 ? 'apple' : 'banana'} /></span>
              <MathFormula latex={`${price}\\,\\text{元/斤}`} />
            </div>)}
          </div>
        </div>
        {measured && <>
          <svg className="reconstruct-arrow" viewBox="0 0 1440 810" aria-hidden="true">
            <defs><marker id={`reconstruct-head-${index}`} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 9 5 L 0 10" fill="none" stroke="currentColor" strokeWidth="2" /></marker></defs>
            <path d={index === 1 ? "M 435 405 L 585 405" : `M 435 ${y} L 570 ${y} L 570 405 L 585 405`} />
            <path d={index === 1 ? "M 855 405 L 1050 405" : `M 855 405 L 905 405 L 905 ${y} L 1050 ${y}`} markerEnd={`url(#reconstruct-head-${index})`} />
          </svg>
          <div className="reconstruct-traveller" style={{ '--travel-y': `${405 - y}px` } as CSSProperties} aria-hidden="true"><CheckoutIcon accent={probe.color} /></div>
          <div className="reconstruct-reading" data-role="coordinate-reading"><MathFormula latex={probe.reading} /></div>
        </>}
      </div>;
    })}
  </section>;
}
