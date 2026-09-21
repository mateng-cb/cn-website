import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMainNavPages, getPage, getSiteConfigMain } from '@/lib/strapi';
import { enrichSections } from '@/lib/enrich';
import { isPreviewMode } from '@/lib/preview';
import { buildHomeJsonLd, buildMetadata, jsonLdScript } from '@/lib/seo';
import { SectionRenderer } from '@/components/SectionRenderer';
import { MainChrome } from '@/components/chrome/MainChrome';
import { PreviewBar } from '@/components/PreviewBar';

/**
 * 09 号工单：metadata 升级全要素（canonical、og 全家、twitter 卡、noindex、og:image
 * 站点默认图回退，见 lib/seo.ts）；首页另注入 JSON-LD @graph
 * （Organization + WebSite，数据来自 site-config-main，映射表 §2）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const [page, config] = await Promise.all([
    getPage('home', 'main', { draft: await isPreviewMode() }),
    getSiteConfigMain(),
  ]);
  if (!page) return {};
  return buildMetadata({
    path: '/',
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    ogImage: page.seo?.ogImage,
    defaultOgImage: config?.ogImageDefault,
    noindex: page.seo?.noindex,
  });
}

export default async function HomePage() {
  const draft = await isPreviewMode();
  // 导航派生恒走发布态（与 hq 侧一致：预览对象是页面内容本身）
  const [page, config, nav] = await Promise.all([
    getPage('home', 'main', { draft }),
    getSiteConfigMain(),
    getMainNavPages(),
  ]);
  if (!page) notFound();
  const sections = await enrichSections(page.sections);
  return (
    <MainChrome
      config={config}
      nav={nav}
      currentSlug="home"
      ctaLabel={page.ctaLabel}
      ctaUrl={page.ctaUrl}
    >
      {draft ? <PreviewBar /> : null}
      <SectionRenderer sections={sections} formUrl={config?.formUrl ?? undefined} />
      {/* JSON-LD：jsonLdScript 序列化并转义 <（防 </script> 提前闭合），dangerouslySetInnerHTML 标准做法 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildHomeJsonLd(config)) }}
      />
    </MainChrome>
  );
}
