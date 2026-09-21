import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLandingPage, getSiteConfigMain } from '@/lib/strapi';
import { isPreviewMode } from '@/lib/preview';
import { buildMetadata } from '@/lib/seo';
import { SectionRenderer } from '@/components/SectionRenderer';
import { LandingChrome } from '@/components/chrome/LandingChrome';
import { PreviewBar } from '@/components/PreviewBar';

/**
 * 白皮书专题页（06 号工单，/whitepaper 固定映射 landing-page slug=whitepaper）。
 * 静态前缀路由优先于主站一级动态段 [slug]（同 /huaqiao 先例）。
 * 页面与全局件两路取数并行；CTA 直链回退 site-config-main.formUrl。
 * 预览态（07 号工单）：draftMode cookie 在场走草稿取数 + 退出条
 * （退出条在 .landing 子树外渲染，浮条定位不依赖皮肤容器）。
 * 09 号工单（映射表「顺带补齐」项）：SEO 全套——description 06 号 seed 已配，
 * canonical、og 全家、twitter 卡与 og:image 站点默认图回退本次生成；白皮书不进
 * sitemap 且不加 noindex（url-plan §4：外投落地页允许自然收录）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const [page, config] = await Promise.all([
    getLandingPage('whitepaper', 'main', { draft: await isPreviewMode() }),
    getSiteConfigMain(),
  ]);
  if (!page) return {};
  return buildMetadata({
    path: '/whitepaper',
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    ogImage: page.seo?.ogImage,
    defaultOgImage: config?.ogImageDefault,
    noindex: page.seo?.noindex,
  });
}

export default async function WhitepaperPage() {
  const draft = await isPreviewMode();
  const [page, config] = await Promise.all([
    getLandingPage('whitepaper', 'main', { draft }),
    getSiteConfigMain(),
  ]);
  if (!page) notFound();
  return (
    <>
      <LandingChrome page={page} formUrl={config?.formUrl ?? undefined}>
        <SectionRenderer sections={page.sections} formUrl={config?.formUrl ?? undefined} />
      </LandingChrome>
      {draft ? <PreviewBar /> : null}
    </>
  );
}
