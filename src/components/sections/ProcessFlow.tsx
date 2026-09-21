import type { ProcessFlowData } from '@/types/strapi';
import { SectionHead } from '@/components/elements/SectionHead';

/** 纵向变体的中文序号（横向为 01 起阿拉伯，序号均不入库） */
const CN_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/**
 * 流程步骤（v0.3 首页形态）：section.section.service-method >
 * .method-flow > article > b(序号) + h3 + p + span(交付行，footnote 承载)
 * orientation=vertical 为内容页 steps 形态，皮肤样式 03 号工单对齐；
 * theme=tint 灰底（05 号子站 cloud 服务流程 pale 形态）。
 * 序号不入库：横向渲染 01 起两位阿拉伯，纵向渲染中文数字（ADR-0008）；
 * gov 皮肤下横向形态的序号由 CSS 重绘——组件序号文本 sr-only 视觉隐藏、
   article::before 以 counter（cjk-decimal）输出中文数字，任意步数可用，组件零分支。
 */
export function ProcessFlow({ data }: { data: ProcessFlowData }) {
  const steps = data.steps ?? [];
  const vertical = (data.orientation ?? 'horizontal') === 'vertical';
  const sectionClass = [
    'section',
    vertical ? 'process-flow-vertical' : 'service-method',
    data.theme === 'tint' ? 'tint' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <section className={sectionClass}>
      {data.head ? <SectionHead data={data.head} /> : null}
      <div className={vertical ? 'method-flow vertical' : 'method-flow'}>
        {steps.map((step, i) => (
          <article key={step.id ?? i}>
            <b>{vertical ? (CN_NUMERALS[i] ?? String(i + 1)) : String(i + 1).padStart(2, '0')}</b>
            <h3>{step.heading}</h3>
            {step.body ? <p>{step.body}</p> : null}
            {step.footnote ? <span>{step.footnote}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
