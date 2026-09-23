import { Fragment } from 'react';
import type { MediaPanelData, SlideData, StrapiMedia } from '@/types/strapi';
import { strapiMediaUrl } from '@/lib/strapi';
import { Carousel } from '@/components/elements/Carousel';
import { List } from '@/components/elements/List';
import { openInNewTab } from '@/lib/link-target';

/**
 * 媒体面板（v0.3 右栏全家桶），hero 与 split-media 共用。
 * DOM 结构按 ADR-0004 从 v0.3 逐类对齐：
 * - imageCard：div.hero-image-card（img + b 标题 + span 说明）
 * - carousel：hero-image-card 容器 + Carousel client 子树（2.0 PRD 1.2/5.1，
 *   1-5 张自动轮播 2s/3s 两档、上下居中；单张退化与 imageCard 同构。
 *   slides 在此预解析为可序列化纯数据，client 组件零依赖取数层）
 * - govCard：div.gov-card（span 眉题 + h3 + p + ul + 可选尾链），
 *   image 不参与渲染（政府/产业/洞察等多页共用的纯数据卡）；
 * - eventCard：事件卡（alliance hero 新闻事件形态）——视觉沿用 .gov-card，
 *   独有 img.gov-card-cover 卡内最顶封面 + 无要点清单（2026-09-21 与
 *   govCard 定界拆分：事件卡改动不再波及多页共用的 govCard）
 * - showcase：div.resource-showcase（深蓝容器单图）
 * - screen：div.agent-screen（标题条 + miniItems 应用格）
 * - compliance：div.compliance-card（米黄合规卡，span 眉题 + h3 +
 *   ✓ 列表（term 粗体词条）+ caption 脚注——05 号子站门户「受众+合规」右栏）
 * - panel：div.resource-panel（深藏青键值面板，h3 + kvRows 行 + 可选尾链
 *   ——05 号子站 cloud「典型部署组合」右栏）
 * - cover：div.cover-wrap > div.cover（06 号白皮书 CSS 书封：渐变底 + 3D 旋转 +
 *   缎带全在样式层；eyebrow=眉题、title=书名（\n 换行）、caption=年份副题、
 *   kvRows[0] 两端=出版方左右署名——封面无内容媒体，全部文案走结构化字段）
 */
export function MediaPanel({ panel }: { panel: MediaPanelData }) {
  switch (panel.kind) {
    case 'imageCard':
      if (!panel.image) return null;
      return (
        <div className="hero-image-card">
          <img
            src={strapiMediaUrl(panel.image)}
            alt={panel.image.alternativeText ?? panel.title ?? ''}
            loading="eager"
          />
          {panel.title || panel.caption ? (
            <div>
              {panel.title ? <b>{panel.title}</b> : null}
              {panel.caption ? <span>{panel.caption}</span> : null}
            </div>
          ) : null}
        </div>
      );

    case 'carousel': {
      // 2026-09-23 cn-strapi 放开 slide.image required（后台不再被空图条目
      // 拦保存）：空图条目在此过滤——单条漏传只少一张，不整面板消失；全空回退 null
      const slides = (panel.slides ?? []).filter(
        (s): s is SlideData & { image: StrapiMedia } => Boolean(s.image),
      );
      if (slides.length === 0) return null;
      return (
        <Carousel
          slides={slides.map((s) => ({
            url: strapiMediaUrl(s.image),
            alt: s.image.alternativeText ?? panel.title ?? '',
            caption: s.caption,
          }))}
          intervalMs={Number(panel.interval ?? '3000')}
          title={panel.title}
        />
      );
    }

    case 'govCard':
      return (
        <div className="gov-card">
          {panel.eyebrow ? <span>{panel.eyebrow}</span> : null}
          {panel.title ? <h3>{panel.title}</h3> : null}
          {panel.caption ? <p>{panel.caption}</p> : null}
          {panel.checks ? <List data={panel.checks} /> : null}
          {panel.link && panel.ctaText ? (
            <a
              href={panel.link}
              {...(panel.linkPrimary ? { className: 'primary' } : {})}
              {...(openInNewTab(panel.link)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {panel.ctaText}
            </a>
          ) : null}
        </div>
      );

    // 事件卡（alliance hero 新闻事件形态，2026-09-21 与 govCard 定界拆分）：
    // 视觉沿用 .gov-card 白卡蓝顶，独有「卡内最顶封面 + 无要点清单」形态——
    // image 在此为封面；govCard 的 image 不参与渲染（多页共用，行为不受本卡影响）
    case 'eventCard':
      return (
        <div className="gov-card">
          {panel.image ? (
            <img
              className="gov-card-cover"
              src={strapiMediaUrl(panel.image)}
              alt={panel.image.alternativeText ?? panel.title ?? ''}
              loading="lazy"
            />
          ) : null}
          {panel.eyebrow ? <span>{panel.eyebrow}</span> : null}
          {panel.title ? <h3>{panel.title}</h3> : null}
          {panel.caption ? <p>{panel.caption}</p> : null}
          {panel.link && panel.ctaText ? (
            <a
              href={panel.link}
              {...(panel.linkPrimary ? { className: 'primary' } : {})}
              {...(openInNewTab(panel.link)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {panel.ctaText}
            </a>
          ) : null}
        </div>
      );

    case 'showcase':
      if (!panel.image) return null;
      return (
        <div className="resource-showcase">
          <img
            src={strapiMediaUrl(panel.image)}
            alt={panel.image.alternativeText ?? panel.title ?? ''}
          />
        </div>
      );

    case 'screen':
      return (
        <div className="agent-screen">
          <div className="agent-screen-head">
            <span>{panel.title}</span>
            <span>{panel.caption}</span>
          </div>
          <div className="agent-apps">
            {(panel.miniItems ?? []).map((item, i) => (
              <article key={item.id ?? i}>
                <b>{item.label}</b>
                <span>{item.text}</span>
              </article>
            ))}
          </div>
        </div>
      );

    case 'compliance':
      return (
        <div className="compliance-card">
          {panel.eyebrow ? <span>{panel.eyebrow}</span> : null}
          {panel.title ? <h3>{panel.title}</h3> : null}
          {panel.checks?.items?.length ? (
            <ul>
              {panel.checks.items.map((item, i) => (
                <li key={item.id ?? i}>
                  {item.term ? <b>{item.term}</b> : null}
                  {item.text}
                </li>
              ))}
            </ul>
          ) : null}
          {panel.caption ? <p>{panel.caption}</p> : null}
        </div>
      );

    case 'panel':
      return (
        <div className="resource-panel">
          {panel.title ? <h3>{panel.title}</h3> : null}
          {(panel.kvRows ?? []).map((row, i) => (
            <div key={row.id ?? i}>
              <span>{row.key}</span>
              <b>{row.value}</b>
            </div>
          ))}
          {panel.link && panel.ctaText ? (
            <a
              href={panel.link}
              {...(openInNewTab(panel.link)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {panel.ctaText}
            </a>
          ) : null}
        </div>
      );

    case 'cover': {
      const kv = panel.kvRows?.[0];
      const lines = (panel.title ?? '').split('\n');
      return (
        <div className="cover-wrap">
          <div className="cover">
            {panel.eyebrow ? (
              <div className="c-top">
                <span className="c-dot" aria-hidden="true" />
                {panel.eyebrow}
              </div>
            ) : null}
            {panel.title ? (
              <div className="c-title">
                {lines.map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
                {panel.caption ? <span>{panel.caption}</span> : null}
              </div>
            ) : null}
            <div className="c-line" aria-hidden="true" />
            {kv ? (
              <div className="c-foot">
                <span>{kv.key}</span>
                <span>{kv.value}</span>
              </div>
            ) : null}
            <div className="c-tag" aria-hidden="true">
              JOINT RELEASE
            </div>
          </div>
        </div>
      );
    }

    default:
      // image 等其余 kind 由后续工单补皮肤
      return null;
  }
}
