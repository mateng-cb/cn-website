import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPage, getHqNavPages, getSiteConfigHq } from '@/lib/strapi';
import { isPreviewMode } from '@/lib/preview';
import { buildHqPortalJsonLd, buildMetadata, jsonLdScript } from '@/lib/seo';
import { HqPageView } from '@/components/chrome/HqPageView';
import { PreviewBar } from '@/components/PreviewBar';

/**
 * 华侨数港子站门户（/huaqiao，url-plan.md 定稿：前缀根本身映射 slug=home）。
 * 静态前缀路由优先于主站一级动态段 [slug]，二者互不捕获。
 * 页面与全局件三路取数 Promise.all 并行（与主站首页模式一致，避免串行瀑布）。
 * 预览态（07 号工单）：draftMode cookie 在场走草稿取数 + 退出条
 * （导航派生 getHqNavPages 仍取发布态——预览对象是页面内容本身）。
 * 09 号工单：metadata 全要素 + JSON-LD Organization（华侨数港）+
 * parentOrganization（算力海洋，常量桥接见 lib/seo.ts，映射表 §2）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const [page, config] = await Promise.all([
    getPage('home', 'hq', { draft: await isPreviewMode() }),
    getSiteConfigHq(),
  ]);
  if (!page) return {};
  return buildMetadata({
    path: '/huaqiao',
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    ogImage: page.seo?.ogImage,
    defaultOgImage: config?.ogImageDefault,
    noindex: page.seo?.noindex,
  });
}

export default async function HqHomePage() {
  const draft = await isPreviewMode();
  const [page, config, nav] = await Promise.all([
    getPage('home', 'hq', { draft }),
    getSiteConfigHq(),
    getHqNavPages(),
  ]);
  if (!page) notFound();
  return (
    <>
      <HqPageView page={page} config={config} nav={nav} />
      {draft ? <PreviewBar /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildHqPortalJsonLd(config)) }}
      />
    </>
  );
}
