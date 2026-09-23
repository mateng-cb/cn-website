import { Fragment } from 'react';
import type { JSX } from 'react';
import type { SectionHeadData } from '@/types/strapi';

/**
 * 纯文本标题的换行渲染：seed 中以 \n 表达 v0.3 的 <br /> 换行
 * （section-head.heading 是纯 string 字段，非富文本）。
 */
export function MultiLineHeading({ text, as = 'h2' }: { text: string; as?: 'h1' | 'h2' | 'h3' }) {
  const Tag = as as keyof JSX.IntrinsicElements;
  const lines = text.split('\n');
  return (
    <Tag>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </Tag>
  );
}

/** 区块标题：结构对齐 v0.3 div.section-head > p.eyebrow + h2 + p（align=left 加 .left）。
 * headingAs：页面级唯一 H1 场景（/news 列表页无 hero，区块标题升 H1，QA T-106），
 * 缺省 h2 与其余页面「hero h1 + 区块 h2」的层级纪律不变。 */
export function SectionHead({
  data,
  headingAs = 'h2',
}: {
  data: SectionHeadData;
  headingAs?: 'h1' | 'h2' | 'h3';
}) {
  const align = data.align ?? 'center';
  return (
    <div className={`section-head${align === 'left' ? ' left' : ''}`}>
      {data.eyebrow ? <p className="eyebrow">{data.eyebrow}</p> : null}
      {data.heading ? <MultiLineHeading text={data.heading} as={headingAs} /> : null}
      {data.lead ? <p>{data.lead}</p> : null}
    </div>
  );
}
