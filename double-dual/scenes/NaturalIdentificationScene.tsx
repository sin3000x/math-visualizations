import { CheckoutIcon } from '../components/CheckoutIcon';
import { FruitBag } from '../components/FruitBag';
import { MathFormula } from '../components/MathFormula';
import type { SceneProps } from '../lib/scenes/types';
import './NaturalIdentificationScene.css';

const bag = { apples: 2, bananas: 1 };

export function NaturalIdentificationScene({ step }: SceneProps) {
  return <section className={`identification-scene double-dual-scene ${step >= 1 ? 'is-paired' : ''}`} aria-label="有限维水果重量空间与其双对偶自然同构，同一袋水果对应对收银台的评价泛函">
    <div className="space-row">
      <div className="space bag-space" data-role="original-vector">
        <div className="space-symbol"><MathFormula latex="V" /></div>
        <div className="space-element"><FruitBag {...bag} /></div>
      </div>
      <div className="space checkout-space identification-checkout" aria-hidden={step >= 1}>
        <div className="space-symbol"><MathFormula latex="V^*" /></div>
        <div className="space-element"><CheckoutIcon accent="#62d2c3" /></div>
      </div>
      <div className="space mystery-space" data-role="evaluation-functional">
        <div className="space-symbol"><MathFormula latex="V^{**}" /></div>
        <div className="space-element"><FruitBag {...bag} /></div>
      </div>
    </div>
    <div className={`identification-arrow reveal ${step >= 1 ? 'shown' : ''}`} aria-hidden={step < 1}>
      <svg width="200" height="60" viewBox="0 0 200 60" aria-label="自然的一一对应">
        <path d="M 12 30 H 188 M 30 12 L 12 30 L 30 48 M 170 12 L 188 30 L 170 48" fill="none" stroke="#f6f2e7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className={`identification-result reveal ${step >= 2 ? 'shown' : ''}`} aria-hidden={step < 2} data-role="natural-isomorphism">
      <MathFormula latex={"V \\cong V^{**}"} />
    </div>
    <div className={`identification-limit reveal ${step >= 3 ? 'shown' : ''}`} aria-hidden={step < 3} data-role="infinite-dimensional-caveat">
      （无限维：<MathFormula latex={"V \\subseteq V^{**}"} />）
    </div>
  </section>;
}
