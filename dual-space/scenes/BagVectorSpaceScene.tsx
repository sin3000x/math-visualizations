import { useEffect, useImperativeHandle, useState, type Ref, type CSSProperties, type ReactNode } from "react";
import "./BagVectorSpaceAnimation.css";
import { MathFormula } from "../components/MathFormula";
import { HorizontalArrangement } from "../components/HorizontalArrangement";
import type { BagVector } from "../lib/model/bagSpace";
import { FruitBag } from "./FruitBag";
import { vectorSpaceSteps } from "./content";

type BagTerm = Readonly<{ label: string; bag: BagVector }>;

const U = { apples: 2, bananas: 1 } as const;
const V = { apples: 1, bananas: 2 } as const;
const W = { apples: 1, bananas: 1 } as const;
const ZERO = { apples: 0, bananas: 0 } as const;

const propertyDisplays = [
  { title: "加法交换律", law: "u+v=v+u" },
  { title: "加法结合律", law: "(u+v)+w=u+(v+w)" },
  { title: "存在零元", law: "u+0=u" },
  { title: "存在负元", law: "u+(-u)=0" },
  { title: "标量乘法结合律", law: "a(bu)=(ab)u" },
  { title: "标量单位元", law: "1u=u" },
  { title: "标量对袋子加法的分配律", law: "a(u+v)=au+av" },
  { title: "袋子对标量加法的分配律", law: "(a+b)u=au+bu" },
] as const;

function ExampleBag({ term }: { term: BagTerm }) {
  return (
    <div className="axiom-bag">
      <div className="axiom-bag-label"><MathFormula latex={term.label} /></div>
      <div className="bag-visual"><FruitBag apples={term.bag.apples} bananas={term.bag.bananas} compact /></div>
    </div>
  );
}

function DefinitionBag({ bag }: { bag: BagVector }) {
  return (
    <div className="definition-bag">
      <FruitBag apples={bag.apples} bananas={bag.bananas} compact />
    </div>
  );
}

function OperationDefinition() {
  return (
    <div className="operation-definition" aria-label="袋子加法与标量数乘">
      <HorizontalArrangement className="definition-row">
        <DefinitionBag bag={U} />
        <span className="definition-operator"><MathFormula latex={"+"} /></span>
        <DefinitionBag bag={V} />
        <span className="definition-operator"><MathFormula latex={"="} /></span>
        <DefinitionBag bag={{ apples: 3, bananas: 3 }} />
      </HorizontalArrangement>
      <HorizontalArrangement className="definition-row">
        <span className="definition-operator definition-scalar"><MathFormula latex={"2~\\times"} /></span>
        <DefinitionBag bag={U} />
        <span className="definition-operator"><MathFormula latex={"="} /></span>
        <DefinitionBag bag={{ apples: 4, bananas: 2 }} />
      </HorizontalArrangement>
    </div>
  );
}

function SetupBag({ label, bag }: { label: string; bag: BagVector }) {
  return (
    <div className="setup-bag">
      <div className="setup-bag-label"><MathFormula latex={label} /></div>
      <div className="setup-bag-visual"><FruitBag apples={bag.apples} bananas={bag.bananas} compact /></div>
    </div>
  );
}

function SpaceSetup() {
  return (
    <div className="space-setup" aria-label="袋子空间与实数域">
      <section className="setup-set bag-set">
        <div className="setup-set-name"><MathFormula latex={"V"} /></div>
        <HorizontalArrangement className="setup-bags">
          <SetupBag label="u" bag={U} />
          <SetupBag label="v" bag={V} />
          <SetupBag label="w" bag={W} />
        </HorizontalArrangement>
        <div className="setup-membership"><MathFormula latex={"u,v,w\\in V"} /></div>
      </section>
      <section className="setup-set scalar-set">
        <div className="setup-set-name"><MathFormula latex={"\\mathbb R"} /></div>
        <div className="scalar-members">
          <span><MathFormula latex={"a"} /></span>
          <span><MathFormula latex={"b"} /></span>
        </div>
        <div className="setup-membership"><MathFormula latex={"a,b\\in\\mathbb R"} /></div>
      </section>
    </div>
  );
}

const motionCaptions = [
  ["两袋交换位置", "沿上下两条路径交换，袋内水果保持不变", "顺序变了，总量不变"],
  ["先把前两袋看成一组", "括号移向后两袋，三袋水果都不变", "先合并哪两袋，结果都一样"],
  ["加入一个空袋", "两袋靠拢、合成一袋，水果数量不变", "加上零，仍是原来的袋子"],
  ["购买与等量退货相加", "实心水果与退货轮廓重合、抵消", "净数量归零，只留下空袋"],
  ["先乘三，再乘二", "把两次缩放的系数组合起来", "连续数乘等于乘上系数的积"],
  ["把一袋乘以一", "系数一退出，水果的数量不变", "乘以一，仍是原来的袋子"],
  ["两袋合起来乘以二", "系数二分送到两袋，括号展开", "每一袋都乘以二"],
  ["一袋乘以两个系数的和", "展开为两项，分别带上系数二与三", "两份加三份，仍是五份原来的袋子"],
] as const;

export type PropertyAnimationHandle = { navigate: (direction: 1 | -1) => boolean };

function PropertyAnimation({ property, animationRef }: { property: number; animationRef: Ref<PropertyAnimationHandle> }) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  useImperativeHandle(animationRef, () => ({
    navigate(direction) {
      if (direction === -1) {
        if (progress === 0 && !playing) return false;
        setPlaying(false);
        setProgress(0);
        return true;
      }
      if (playing) return true;
      if (progress === 1) return false;
      setPlaying(true);
      return true;
    },
  }), [playing, progress]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const next = Math.min(1, (now - start) / 1000);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const t = progress * progress * (3 - 2 * progress);
  const fade = Math.max(0, 1 - t * 2);
  const appear = Math.max(0, (t - .65) / .35);
  const move = (from: number, to: number) => from + (to - from) * t;
  const node = (key: string, x: number, content: ReactNode, opacity = 1, y = 0) => (
    <div key={key} data-motion-id={key} className="law-motion-node" style={{ left: `${x}%`, opacity, transform: `translate(-50%, calc(-50% + ${y}px))` }} aria-hidden={opacity === 0}>{content}</div>
  );
  const bag = (key: string, x: number, label: string, value: BagVector, opacity = 1, y = 0) =>
    node(key, x, <div style={{ transform: `scale(${property === 0 ? 1 - .2 * Math.sin(Math.PI * t) : 1})` }}><ExampleBag term={{ label, bag: value }} /></div>, opacity, y);
  const symbol = (key: string, x: number, latex: string, opacity = 1, y = 0) =>
    node(key, x, <MathFormula latex={latex} />, opacity, y);
  const bracket = (key: string, x: number, side: "(" | ")", opacity = 1) =>
    node(key, x, <span className="law-bracket" style={{ fontSize: property === 7 ? 64 : property === 4 ? move(170, 64) : 170 }}><MathFormula latex={side} /></span>, opacity, property === 7 ? -5 : property === 4 ? move(-14, -5) : -14);
  let objects;
  switch (property) {
    case 0:
      objects = [bag("u", move(30, 70), "u", U, 1, -125 * Math.sin(Math.PI * t)), symbol("plus", 50, "+"), bag("v", move(70, 30), "v", V, 1, 160 * Math.sin(Math.PI * t))];
      break;
    case 1:
      objects = [bag("u", 22, "u", U), bag("v", 50, "v", V), bag("w", 78, "w", W), symbol("plus1", 34, "+"), symbol("plus2", 66, "+"), bracket("open", move(10, 38), "("), bracket("close", move(62, 90), ")")];
      break;
    case 2:
      objects = [bag("zero", move(70, 50), "0", ZERO, progress === 1 ? 0 : 1), bag("u", move(30, 50), "u", U), symbol("plus", 50, "+", fade)];
      break;
    case 3: {
      const merge = Math.min(1, t / .65);
      const vanish = 1 - Math.max(0, (t - .65) / .2);
      objects = [bag("positive", 30 + 20 * merge, "u", U, Math.max(0, vanish)), bag("negative", 70 - 20 * merge, "-u", { apples: -2, bananas: -1 }, Math.max(0, vanish)), symbol("plus", 50, "+", fade), bag("zero", 50, "0", ZERO, appear)];
      break;
    }
    case 4:
      objects = [bag("u", 72, "u", U), symbol("a", 31, "2"), symbol("times", 39, "\\times"), symbol("b", 47, "3"), symbol("times2", 58, "\\times"), bracket("open", move(43, 25), "("), bracket("close", move(85, 53), ")")];
      break;
    case 5:
      objects = [bag("u", 50, "u", U), symbol("unit", 37, "1\\times", 1 - t)];
      break;
    case 6:
      objects = [bag("u", 35, "u", U), bag("v", 75, "v", V), symbol("plus", 55, "+"), symbol("a", move(13, 20), "2\\times"), symbol("copy", move(13, 60), "2\\times", t), bracket("open", 23, "(", progress === 0 ? 1 : 0), bracket("close", 87, ")", progress === 0 ? 1 : 0)];
      break;
    default:
      objects = [bag("u", move(72, 35), "u", U), bag("copy", move(72, 80), "u", U, t), symbol("a", move(22, 19), "2"), symbol("plus", move(33, 52), "+"), symbol("b", move(44, 64), "3"), symbol("times", move(56, 69), "\\times"), symbol("times-copy", move(56, 24), "\\times", t), bracket("open", 15, "(", progress === 0 ? 1 : 0), bracket("close", 51, ")", progress === 0 ? 1 : 0)];
  }
  const caption = motionCaptions[property][progress === 0 ? 0 : progress === 1 ? 2 : 1];
  return (
    <div className={`law-animation law-animation-${property}`} data-progress={progress} style={{ "--merge": Math.min(1, t / .65) } as CSSProperties}>
      <div className="law-motion-stage" aria-label={caption}>{objects}</div>

    </div>
  );
}

export function BagVectorSpaceScene({ step, animationRef }: { step: number; animationRef: Ref<PropertyAnimationHandle> }) {
  const isDefinition = step === 0;
  const isSpaceSetup = step === 1;
  const display = propertyDisplays[step - 2] ?? propertyDisplays[0];
  const activeProperty = step - 2;

  if (isDefinition) {
    return (
      <section className="axiom-canvas definition-only" aria-label="定义袋子加法与标量数乘">
        <OperationDefinition />
      </section>
    );
  }

  if (isSpaceSetup) {
    return (
      <section className="axiom-canvas setup-only" aria-label="袋子构成空间并选取实数域">
        <SpaceSetup />
      </section>
    );
  }

  return (
    <section className="axiom-canvas" aria-label="验证袋子组成的空间是线性空间">
      <aside className="axiom-index" aria-label="八条线性空间性质">
        <ol>
          {vectorSpaceSteps.map((item, index) => (
            <li key={item.id} className={index === activeProperty ? "active" : index < activeProperty ? "passed" : ""}>
              <span>{index + 1}</span>
              <strong>{item.title}</strong>
              {index < activeProperty ? <i>✓</i> : null}
            </li>
          ))}
        </ol>
      </aside>

      <div className="axiom-stage">
        <header className="axiom-heading"><h2>{display.title}</h2></header>
        <div className="axiom-equation"><MathFormula latex={display.law} /></div>
        <PropertyAnimation key={activeProperty} property={activeProperty} animationRef={animationRef} />
      </div>
    </section>
  );
}
