import type { CSSProperties } from 'react';
import { CheckoutIcon } from '../components/CheckoutIcon';
import { FruitBag } from '../components/FruitBag';
import { MathFormula } from '../components/MathFormula';
import type { SceneProps } from '../lib/scenes/types';
import './SupermarketScene.css';

const bags = [{ apples: 1, bananas: 1 }, { apples: 2, bananas: 1 }, { apples: 1, bananas: 2 }];
const checkouts = [
  { color: '#62d2c3', apples: 5, bananas: 6 },
  { color: '#7baafa', apples: 4, bananas: 5 },
  { color: '#ba91ef', apples: 6, bananas: 7 },
];
function Register({ color }: { color: string }) {
  return <div className="sequence-register"><CheckoutIcon accent={color} /><span className="sequence-tray" /></div>;
}
export function SupermarketScene({ step }: SceneProps) {
  const official = step >= 3;
  const phase = step % 3;
  const running = phase === 2;
  return <section className={`supermarket-scene ${official ? 'survey-sequence' : 'shopping-sequence'}`} aria-label={official ? '同一袋水果依次测量不同收银台' : '不同水果袋依次进入同一个收银台'}>
    <img className="sequence-character" src={`./characters/${official ? 'inspector' : 'shopper'}-chibi.png`} alt={official ? '制服红袖箍调查员' : 'Q 版购物者'} draggable={false} />
    {official ? <div className="sequence-fixed-bag"><FruitBag {...bags[1]} /></div> : <div className="sequence-fixed-register"><Register color={checkouts[0].color} /></div>}
    {phase >= 1 && <div key={official ? 'register-column' : 'bag-column'} className="sequence-inputs" data-role="measurement-input-column">
      {bags.map((bag, index) => {
        const row = 110 + index * 220;
        const checkout = official ? checkouts[index] : checkouts[0];
        const measuredBag = official ? bags[1] : bag;
        const destinationY = official ? row + 12 : 337;
        const delay = index * (official ? 0.4 : 1.35);
        const motion = {
          '--source-x': `${official ? 400 : 440}px`, '--source-y': `${official ? 330 : row}px`,
          '--target-x': '970px', '--target-y': `${destinationY}px`,
          '--result-source-y': `${official ? row + 90 : 385}px`, '--result-y': `${row + 45}px`,
          '--lag': `${delay}s`, '--price-lag': `${0.95 + delay}s`,
        } as CSSProperties;
        return <div key={index} style={motion} data-role="measurement-lane">
          {official && <div className="sequence-column-register" style={{ top: row }}><Register color={checkout.color} /></div>}
          {(!official || running) && <div key={`${official}-${phase}`} className={`sequence-bag ${running ? 'is-moving' : ''}`} data-role="measurement-travelling-bag"><FruitBag {...measuredBag} /></div>}
          {running && <div className="sequence-price" style={{ color: official ? checkout.color : '#f6f2e7' }} data-role="market-result"><MathFormula latex={`${measuredBag.apples * checkout.apples + measuredBag.bananas * checkout.bananas}\\,\\text{元}`} /></div>}
        </div>;
      })}
    </div>}
  </section>;
}
