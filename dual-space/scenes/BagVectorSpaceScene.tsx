import { Fragment } from "react";
import { MathFormula } from "../components/MathFormula";
import { HorizontalArrangement } from "../components/HorizontalArrangement";
import type { BagVector } from "../lib/model/bagSpace";
import { FruitBag } from "./FruitBag";
import { vectorSpaceSteps } from "./content";

type BagTerm = Readonly<{
  label: string;
  bag: BagVector;
  operatorBefore?: string;
  scalarBefore?: string;
  openBefore?: boolean;
  closeAfter?: boolean;
}>;

type ExpressionGroup = readonly BagTerm[];

type AlgebraDisplay = Readonly<{
  title: string;
  law: string;
  rows: readonly (readonly ExpressionGroup[])[];
}>;

function equationDensity(groups: readonly ExpressionGroup[]) {
  const termCount = groups.reduce((count, group) => count + group.length, 0);
  if (termCount <= 3) return "short-equation";
  if (termCount === 4) return "medium-equation";
  return "long-equation";
}

const U = { apples: 2, bananas: 1 } as const;
const V = { apples: 1, bananas: 2 } as const;
const W = { apples: 1, bananas: 1 } as const;
const ZERO = { apples: 0, bananas: 0 } as const;

const propertyDisplays: readonly AlgebraDisplay[] = [
  {
    title: "加法交换律",
    law: "u+v=v+u",
    rows: [[
      [
        { label: "u", bag: U },
        { label: "v", bag: V, operatorBefore: "+" },
      ],
      [
        { label: "v", bag: V },
        { label: "u", bag: U, operatorBefore: "+" },
      ],
    ]],
  },
  {
    title: "加法结合律",
    law: "(u+v)+w=u+(v+w)",
    rows: [
      [[
        { label: "u", bag: U, openBefore: true },
        { label: "v", bag: V, operatorBefore: "+", closeAfter: true },
        { label: "w", bag: W, operatorBefore: "+" },
      ]],
      [[
        { label: "u", bag: U },
        { label: "v", bag: V, operatorBefore: "+", openBefore: true },
        { label: "w", bag: W, operatorBefore: "+", closeAfter: true },
      ]],
    ],
  },
  {
    title: "存在零元",
    law: "u+0=u",
    rows: [[
      [
        { label: "u", bag: U },
        { label: "0", bag: ZERO, operatorBefore: "+" },
      ],
      [{ label: "u", bag: U }],
    ]],
  },
  {
    title: "存在负元",
    law: "u+(-u)=0",
    rows: [[
      [
        { label: "u", bag: U },
        { label: "-u", bag: { apples: -2, bananas: -1 }, operatorBefore: "+" },
      ],
      [{ label: "0", bag: ZERO }],
    ]],
  },
  {
    title: "标量乘法结合律",
    law: "a(bu)=(ab)u",
    rows: [
      [[
        { label: "u", bag: U, scalarBefore: "2\\times3\\times" },
      ]],
      [[
        { label: "u", bag: U, scalarBefore: "(2\\times3)\\times" },
      ]],
    ],
  },
  {
    title: "标量单位元",
    law: "1u=u",
    rows: [[
      [{ label: "u", bag: U, scalarBefore: "1\\times" }],
      [{ label: "u", bag: U }],
    ]],
  },
  {
    title: "标量对袋子加法的分配律",
    law: "a(u+v)=au+av",
    rows: [
      [[
        { label: "u", bag: U, scalarBefore: "2\\times", openBefore: true },
        { label: "v", bag: V, operatorBefore: "+", closeAfter: true },
      ]],
      [[
        { label: "u", bag: U, scalarBefore: "2\\times" },
        { label: "v", bag: V, operatorBefore: "+", scalarBefore: "2\\times" },
      ]],
    ],
  },
  {
    title: "袋子对标量加法的分配律",
    law: "(a+b)u=au+bu",
    rows: [
      [[
        { label: "u", bag: U, scalarBefore: "(2+3)\\times" },
      ]],
      [[
        { label: "u", bag: U, scalarBefore: "2\\times" },
        { label: "u", bag: U, operatorBefore: "+", scalarBefore: "3\\times" },
      ]],
    ],
  },
];

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
        <span className="definition-operator"><MathFormula latex={"2\\times"} /></span>
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

function VisualEquation({ rows }: { rows: AlgebraDisplay["rows"] }) {
  return (
    <div className={`axiom-example${rows.length > 1 ? " stacked-equation" : ""}`}>
      {rows.map((groups, rowIndex) => (
        <Fragment key={rowIndex}>
          {rowIndex > 0 ? <div className="stacked-equality"><MathFormula latex={"="} /></div> : null}
          <HorizontalArrangement className={`axiom-row ${equationDensity(groups)}`}>
            {groups.map((group, groupIndex) => (
              <HorizontalArrangement className="expression-group-wrap" key={groupIndex}>
                {groupIndex > 0 ? <span className="group-equality"><MathFormula latex={"="} /></span> : null}
                <HorizontalArrangement className="expression-group">
                  {group.map((term, termIndex) => (
                    <HorizontalArrangement className="axiom-term-wrap" key={`${term.label}-${termIndex}`}>
                      {termIndex > 0 ? <span className="bag-operator"><MathFormula latex={term.operatorBefore ?? "+"} /></span> : null}
                      {term.scalarBefore ? <span className="bag-coefficient"><MathFormula latex={term.scalarBefore} /></span> : null}
                      {term.openBefore ? <span className="bag-parenthesis"><MathFormula latex={"("} /></span> : null}
                      <ExampleBag term={term} />
                      {term.closeAfter ? <span className="bag-parenthesis"><MathFormula latex={")"} /></span> : null}
                    </HorizontalArrangement>
                  ))}
                </HorizontalArrangement>
              </HorizontalArrangement>
            ))}
          </HorizontalArrangement>
        </Fragment>
      ))}
    </div>
  );
}

export function BagVectorSpaceScene({ step }: { step: number }) {
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
        <VisualEquation rows={display.rows} />
      </div>
    </section>
  );
}
