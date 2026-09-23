import type { CtaBandData } from '@/types/strapi';
import { MultiLineHeading } from '@/components/elements/SectionHead';
import { openInNewTab } from '@/lib/link-target';

/**
 * 行动号召条（v0.3）：section#<anchor>.cta > p.eyebrow + h2 + p + a。
 * anchor 缺省 contact（首页/industry 形态）；resources=inquiry、alliance=join、
 * government=cooperate（v0.3 各页锚点名，hero 按钮与 nav-cta 指向它）。
 * 按钮链接解析（逐级回退）：按钮自身 url → 区块 formUrlOverride
 *   → site-config 全局 formUrl——按钮 url 在后台可见可填，不能静默丢弃；
 * 外链（http 开头）自动 target=_blank + noopener（对齐 v0.3 cta 按钮）。
 * 标题字段自带 eyebrow/heading/text，head 作备用来源。
 */
export function CtaBand({ data, formUrl }: { data: CtaBandData; formUrl?: string }) {
  const eyebrow = data.eyebrow ?? data.head?.eyebrow;
  const heading = data.heading ?? data.head?.heading;
  const text = data.text ?? data.head?.lead;

  return (
    <section id={data.anchor ?? 'contact'} className="cta">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {heading ? <MultiLineHeading text={heading} /> : null}
      {text ? <p>{text}</p> : null}
      {(data.buttons ?? []).map((button, i) => {
        const href = button.url || data.formUrlOverride || formUrl || '#';
        const external = openInNewTab(href);
        return (
          <a
            key={button.id ?? i}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {button.label}
          </a>
        );
      })}
      {data.tip ? <p className="cta-tip">{data.tip}</p> : null}
    </section>
  );
}
