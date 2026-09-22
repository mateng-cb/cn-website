import type { SolutionListData } from '@/types/strapi';
import { SectionHead } from '@/components/elements/SectionHead';
import { RichText } from '@/components/elements/RichText';
import { strapiMediaUrl } from '@/lib/strapi';

/**
 * 共同体核心解决方案折叠列表（2.0 PRD 7.2）：
 * 原生 details/summary 零 JS——默认收起、点击展开、禁 JS 也可开合
 * （本单定义性验收）。summary 上部左右分栏：左 = logo（空则方案名首字
 * 文字标）+ 方案名（展开提示紧随标题后，纯 CSS 箭头 ::after，不用
 * button——summary 自身就是开关，嵌 button 会吞 toggle，12 号
 * pointer-events 教训）+ 简介；右 = 方案封面图。展开详情 body 落在
 * 整体下方（details 原生流），走 RichText 受信直注（同 news body 先例）。
 */
export function SolutionList({ data }: { data: SolutionListData }) {
  const solutions = data.solutions ?? [];
  return (
    <section className="section solution-list">
      {data.head ? <SectionHead data={data.head} /> : null}
      <div className="solution-items">
        {solutions.map((item, i) => (
          <details className="solution-item" key={item.id ?? i}>
            <summary>
              <div className="solution-row">
                <div className="solution-left">
                  {item.logo ? (
                    <img
                      className="solution-logo"
                      src={strapiMediaUrl(item.logo)}
                      alt={item.title}
                      loading="lazy"
                    />
                  ) : (
                    <span className="solution-logo solution-logo-text" aria-hidden="true">
                      {item.title.slice(0, 2)}
                    </span>
                  )}
                  <span className="solution-info">
                    <span className="solution-title">
                      <b>{item.title}</b>
                      {/* 展开提示紧随标题后：文字双态 + 箭头 ::after 均由 CSS
                          [open] 切换（收起「向下展开 ↓」↔ 展开「收起 ↑」，零 JS） */}
                      <span className="solution-toggle" aria-hidden="true">
                        <span className="solution-toggle-expand">向下展开</span>
                        <span className="solution-toggle-collapse">收起</span>
                      </span>
                    </span>
                    {item.summary ? (
                      <small className="solution-summary">{item.summary}</small>
                    ) : null}
                  </span>
                </div>
                {item.cover ? (
                  <img
                    className="solution-cover"
                    src={strapiMediaUrl(item.cover)}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
              </div>
            </summary>
            {item.body ? (
              <RichText as="div" className="solution-body" html={item.body} />
            ) : null}
          </details>
        ))}
      </div>
    </section>
  );
}
