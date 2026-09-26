import { FruitBag } from "./FruitBag";

export function RollingFruitBag({ examples, sample }: { examples: readonly (readonly [number, number])[]; sample: number }) {
  const [apples, bananas] = examples[sample];
  return <div className="fruit-bag-reel" aria-label={`水果袋：${apples} 斤苹果，${bananas} 斤香蕉`}>
    <div className="bag-reel-window" aria-hidden="true"><div className="bag-reel-strip" data-role="bag-reel-strip">
      {examples.map(([a, b], index) => <div className="bag-reel-cell" key={index} style={{ visibility: index === sample || index === sample + 1 ? undefined : "hidden" }}>
        <FruitBag apples={a} bananas={b} />
      </div>)}
    </div></div>
  </div>;
}
