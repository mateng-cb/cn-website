import type { HeroData } from '@/types/strapi';
import { MediaPanel } from '@/components/elements/MediaPanel';
import { RichText } from '@/components/elements/RichText';

/**
 * 标记结构对齐 v0.3 hero 段（ADR-0004：legacy CSS 即组件契约）。
 * theme：home=首页大图形态（.home-hero 为首页专属皮肤钩子），
 *        content=内容页形态（v0.3 .content-hero：min-height 收窄），
 *        cover=白皮书封面形态（06 号：.cover-hero，右栏配 kind=cover 书封面板，
 *        形态重绘全在 globals.css landing 段，组件零皮肤分支原则不变）。
 */
export function Hero({ data }: { data: HeroData }) {
  const heroClass = [
    'hero',
    data.theme === 'content'
      ? 'content-hero'
      : data.theme === 'cover'
        ? 'cover-hero'
        : 'home-hero',
  ].join(' ');
  return (
    <section className={heroClass}>
      <div className="hero-copy">
        {data.eyebrow ? <p className="eyebrow">{data.eyebrow}</p> : null}
        {data.heading ? <RichText as="h1" html={data.heading} /> : null}
        {data.lead ? <p className="lead">{data.lead}</p> : null}
        {data.detail ? <p className="hero-detail">{data.detail}</p> : null}

        {data.metaRows && data.metaRows.length > 0 ? (
          <dl className="hero-meta">
            {data.metaRows.map((row, i) => (
              <div key={row.id ?? i}>
                <dt>{row.label}</dt>
                <dd>{row.text}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {data.actions && data.actions.length > 0 ? (
          <div className="actions">
            {data.actions.map((action, i) => (
              <a
                key={action.id ?? i}
                className={action.type ?? 'primary'}
                href={action.url ?? '#'}
                {...(/^https?:\/\//.test(action.url ?? '')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {action.label}
              </a>
            ))}
          </div>
        ) : null}

        {data.badges && data.badges.length > 0 ? (
          <div className="trust">
            {data.badges.map((badge, i) => (
              <span key={badge.id ?? i}>{badge.text}</span>
            ))}
          </div>
        ) : null}
      </div>

      {data.rightPanel ? <MediaPanel panel={data.rightPanel} /> : null}
    </section>
  );
}
