import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPage, getHqNavPages, getSiteConfigHq } from '@/lib/strapi';
import { isPreviewMode } from '@/lib/preview';
import { buildMetadata } from '@/lib/seo';
import { HqPageView } from '@/components/chrome/HqPageView';
import { PreviewBar } from '@/components/PreviewBar';

/**
 * 华侨数港子站内页（/huaqiao/cloud 等，url-plan.md 定稿）：
 * slug 单级存于 Page（site=hq），/huaqiao 前缀是纯前端路由行为——
 * 与主站 [slug] 单级约定一致，仅 site 过滤不同。
 * 页面与全局件三路取数 Promise.all 并行（与主站首页模式一致，避免串行瀑布）。
 * 预览态（07 号工单）：draftMode cookie 在场走草稿取数 + 退出条。
 * 09 号工单：generateMetadata 升级全要素（og:image 回退子站默认图）。
 */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, config] = await Promise.all([
    getPage(slug, 'hq', { draft: await isPreviewMode() }),
    getSiteConfigHq(),
  ]);
  if (!page) return {};
  return buildMetadata({
    path: `/huaqiao/${slug}`,
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    ogImage: page.seo?.ogImage,
    defaultOgImage: config?.ogImageDefault,
    noindex: page.seo?.noindex,
  });
}

export default async function HqContentPage({ params }: Props) {
  const { slug } = await params;
  const draft = await isPreviewMode();
  const [page, config, nav] = await Promise.all([
    getPage(slug, 'hq', { draft }),
    getSiteConfigHq(),
    getHqNavPages(),
  ]);
  if (!page) notFound();
  return (
    <>
      <HqPageView page={page} config={config} nav={nav} />
      {draft ? <PreviewBar /> : null}
    </>
  );
}
