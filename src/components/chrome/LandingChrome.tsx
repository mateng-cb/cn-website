import type { ReactNode } from 'react';
import type { LandingPageData } from '@/types/strapi';

/**
 * 专题落地页全局件（06 号工单，v0.3 index-v1 骨架）：极简导航 → main（动态区）
 * → 页脚。根节点挂 .landing——landing 样式自成类名段（globals.css 尾部），
 * 不动 [data-skin] 体系，内容区块组件零皮肤分支原则不变。
 *
 * navSimple（默认 true）：极简导航 = brand logo + navLinks 锚点 + 获取按钮，
 * 无主导航下拉（对照子站 HqChrome 的 details 菜单与主站导航）。锚点目标由
 * 各区块自身 anchor 字段承担（card-grid/cta-band），navLinks 人工可控。
 * logo 为品牌皮肤资产走 web/public/logo 静态文件（research-section 同例），
 * 原 v0.3 引 suanlihaiyang.com 绝对地址——本地化后零第三方外链。
 * v0.3 的「获取白皮书」模态实为外链跳转包装（openModal 即 location.href），
 * 故简化为 CTA 直链：ctaUrl 逐页配置，回退 site-config-main 全局表单。
 */
export function LandingChrome({
  page,
  formUrl,
  children,
}: {
  page: LandingPageData;
  formUrl?: string;
  children: ReactNode;
}) {
  const ctaLabel = page.ctaLabel ?? '获取白皮书';
  const ctaUrl = page.ctaUrl || formUrl || '#';
  const external = /^https?:\/\//.test(ctaUrl);

  return (
    // id="top"：cta-band「返回顶部」锚点的显式落点（不依赖 #top 规范隐式行为）
    <div className="landing" id="top">
      {page.navSimple !== false ? (
        <nav className="landing-nav">
          <div className="landing-nav-in">
            <a className="landing-brand" href="/">
              <img src="/logo/logo_cn_en.svg" alt="算力海洋" />
            </a>
            <div className="landing-nav-links">
              {(page.navLinks ?? []).map((link, i) =>
                link.url ? (
                  <a
                    key={link.id ?? i}
                    href={link.url}
                    {...(/^https?:\/\//.test(link.url)
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {link.label}
                  </a>
                ) : (
                  // url 空 = 纯文本占位项（08 号 footer-link url 转非必填）
                  <span key={link.id ?? i}>{link.label}</span>
                ),
              )}
            </div>
            <a
              className="landing-nav-cta"
              href={ctaUrl}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {ctaLabel}
            </a>
          </div>
        </nav>
      ) : null}

      <main>{children}</main>

      <footer className="landing-foot">
        <div className="landing-foot-in">
          <a className="landing-foot-brand" href="/">
            <img src="/logo/logo_en.png" alt="算力海洋" />
          </a>
          {page.disclaimer ? <div>{page.disclaimer}</div> : null}
        </div>
      </footer>
    </div>
  );
}
