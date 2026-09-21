import type { ReactNode } from 'react';
import type { CardGridData } from '@/types/strapi';
import { SectionHead } from '@/components/elements/SectionHead';
import { List } from '@/components/elements/List';
import { strapiMediaUrl } from '@/lib/strapi';

/** 序号前置零：01 / 02 / …（序号不入库，由 index 渲染） */
function pad(index: number) {
  return String(index + 1).padStart(2, '0');
}

/**
 * 卡片网格（v0.3 形态轴 = layout，底色轴 = theme）：
 * - grid（默认）：
 *   - columns=3 → .three > article.feature：序号 span + h3 + p + 卡尾链接
 *   - columns=4 → .four > article：b 标题 + p
 * - detail → .detail-grid > article.detail-card：label(span 可选) + h3 + p + list(ul 可选)
 *   （services/resources/industry/alliance 内容页服务卡）
 * - layer → .layer-stack > article：span「01 / label」+ h3 + p + b 结论行（industry 四层结构）
 * - deliverable → .deliverable-row > article：b 标题 + p（白卡蓝顶条，alliance 合作方式）
 * - numbered → .cooperation-six > article：b 序号 + h3 + p（government 六类合作，配 tint）
 * - research → .research-directions > article.research-card：icon img + 大序号
 *   .research-index(aria-hidden) + h3 + p（insights 六方向，配 navy + 背景图
 *   .research-section——皮肤资产走 web/public 而非 CMS）
 * - benefit → .benefit-grid(.four-cols)：i 单字图标（label 承载）+ h3 + p +
 *   strong 结果行（footnote）+ 可选卡尾链接（05 号子站收益卡，序号不入库）
 * - catalog → .service-catalog：b 短标签（label：编号/区域名）+ h3 + p
 *   （05 号子站服务清单/重点区域；label 空时由 CSS counter 补 01 起序号）
 * - partner → .partner-types：h3 + p 最简卡（05 号生态伙伴类型）
 * - row → .section.row（子站横向单排，05 号对齐）
 * theme: tint → .section.tint；navy → .section.navy
 * anchor（06 号）：渲染 section id，landing 极简导航锚点跳转目标（同 cta-band）
 */
export function CardGrid({ data }: { data: CardGridData }) {
  const cards = data.cards ?? [];
  const columns = data.columns ?? 'auto';
  const resolved = columns === 'auto' ? (cards.length === 3 ? '3' : '4') : columns;

  const sectionClass = [
    'section',
    data.theme === 'tint' ? 'tint' : '',
    data.theme === 'navy' ? 'navy' : '',
    data.layout === 'row' ? 'row' : '',
    data.layout === 'research' ? 'research-section' : '',
  ]
    .filter(Boolean)
    .join(' ');

  let grid: ReactNode;
  switch (data.layout) {
    case 'detail':
      grid = (
        <div className="detail-grid">
          {cards.map((card, i) => (
            <article className="detail-card" key={card.id ?? i}>
              {card.label ? <span>{card.label}</span> : null}
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
              {card.list ? <List data={card.list} /> : null}
            </article>
          ))}
        </div>
      );
      break;
    case 'layer':
      grid = (
        <div className="layer-stack">
          {cards.map((card, i) => (
            <article key={card.id ?? i}>
              {card.label ? <span>{`${pad(i)} / ${card.label}`}</span> : null}
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
              {card.footnote ? <b>{card.footnote}</b> : null}
            </article>
          ))}
        </div>
      );
      break;
    case 'deliverable':
      grid = (
        <div className="deliverable-row">
          {cards.map((card, i) => (
            <article key={card.id ?? i}>
              <b>{card.heading}</b>
              {card.body ? <p>{card.body}</p> : null}
            </article>
          ))}
        </div>
      );
      break;
    case 'numbered':
      grid = (
        <div className="cooperation-six">
          {cards.map((card, i) => (
            <article key={card.id ?? i}>
              <b>{pad(i)}</b>
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
            </article>
          ))}
        </div>
      );
      break;
    case 'research':
      grid = (
        <div className="research-directions">
          {cards.map((card, i) => (
            <article className="research-card" key={card.id ?? i}>
              <div className="research-card-top">
                {card.icon ? (
                  <img
                    src={strapiMediaUrl(card.icon)}
                    alt=""
                    width={52}
                    height={52}
                    loading="lazy"
                  />
                ) : null}
                <span className="research-index" aria-hidden="true">
                  {pad(i)}
                </span>
              </div>
              <div className="research-card-body">
                <h3>{card.heading}</h3>
                {card.body ? <p>{card.body}</p> : null}
              </div>
            </article>
          ))}
        </div>
      );
      break;
    case 'benefit':
      grid = (
        <div className={`benefit-grid${resolved === '4' ? ' four-cols' : ''}`}>
          {cards.map((card, i) => (
            <article key={card.id ?? i}>
              {card.label ? <i aria-hidden="true">{card.label}</i> : null}
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
              {card.footnote ? <strong>{card.footnote}</strong> : null}
              {card.link ? (
                <a
                  href={card.link}
                  {...(/^https?:\/\//.test(card.link)
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {card.ctaText ?? '了解详情 →'}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      );
      break;
    case 'catalog':
      grid = (
        <div className="service-catalog">
          {cards.map((card, i) => (
            <article key={card.id ?? i}>
              {card.label ? <b>{card.label}</b> : <b aria-hidden="true" />}
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
            </article>
          ))}
        </div>
      );
      break;
    case 'partner':
      grid = (
        <div className="partner-types">
          {cards.map((card, i) => (
            <article key={card.id ?? i}>
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
            </article>
          ))}
        </div>
      );
      break;
    default:
      grid =
        resolved === '3' ? (
          <div className="three">
            {cards.map((card, i) => (
              <article className="feature" key={card.id ?? i}>
                <span>{pad(i)}</span>
                <h3>{card.heading}</h3>
                {card.body ? <p>{card.body}</p> : null}
                {card.link ? <a href={card.link}>{card.ctaText ?? '了解详情 →'}</a> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="four">
            {cards.map((card, i) => (
              <article key={card.id ?? i}>
                <b>{card.heading}</b>
                {card.body ? <p>{card.body}</p> : null}
              </article>
            ))}
          </div>
        );
  }

  return (
    <section id={data.anchor ?? undefined} className={sectionClass}>
      {data.head ? <SectionHead data={data.head} /> : null}
      {grid}
      {data.footerAction ? (
        <div className="grid-footer-cta">
          <a
            className={data.footerAction.type ?? 'primary'}
            href={data.footerAction.url ?? '#'}
            {...(/^https?:\/\//.test(data.footerAction.url ?? '')
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {data.footerAction.label}
          </a>
        </div>
      ) : null}
    </section>
  );
}
