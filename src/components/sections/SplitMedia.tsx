import type { SplitMediaData } from '@/types/strapi';
import { MultiLineHeading } from '@/components/elements/SectionHead';
import { List } from '@/components/elements/List';
import { MediaPanel } from '@/components/elements/MediaPanel';
import { openInNewTab } from '@/lib/link-target';

/**
 * 图文分栏（v0.3 两种形态）：
 * - theme=dark：section.agent-visual（industry 深色独立区，两栏直排，右栏配 screen 面板）
 * - 其余：section.section(.tint) > .split（首页/government 形态），
 *   左栏 div(左：p.eyebrow + h2 + p + ul.checks + .actions) + 右侧媒体面板。
 * 左栏标题走 head（eyebrow/heading），lead 取 head.lead ?? 自身 lead。
 * 左栏内容全空时渲染单栏（.split.single，schema 定稿「overview-image→split-media
 * 无左栏」——按内容数据条件渲染，非皮肤分支；05 号子站 global 全宽概览图）。
 */
export function SplitMedia({ data }: { data: SplitMediaData }) {
  const lead = data.head?.lead ?? data.lead;
  const hasLeft = Boolean(
    data.head?.eyebrow || data.head?.heading || lead || data.checks || data.actions?.length,
  );
  const left = hasLeft ? (
    <div>
      {data.head?.eyebrow ? <p className="eyebrow">{data.head.eyebrow}</p> : null}
      {data.head?.heading ? <MultiLineHeading text={data.head.heading} /> : null}
      {lead ? <p>{lead}</p> : null}
      {data.checks ? <List data={data.checks} /> : null}
      {data.actions && data.actions.length > 0 ? (
        <div className="actions">
          {data.actions.map((action, i) => (
            <a
              key={action.id ?? i}
              className={action.type ?? 'primary'}
              href={action.url ?? '#'}
              {...(openInNewTab(action.url)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  ) : null;
  const right = data.rightPanel ? <MediaPanel panel={data.rightPanel} /> : null;

  if (data.theme === 'dark') {
    return (
      <section className="agent-visual">
        {left}
        {right}
      </section>
    );
  }

  const sectionClass = ['section', data.theme === 'tint' ? 'tint' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <section className={sectionClass}>
      <div className={hasLeft ? 'split' : 'split single'}>
        {left}
        {right}
      </div>
    </section>
  );
}
