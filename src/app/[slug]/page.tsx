import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getLandingPage,
  getMainNavPages,
  getPage,
  getSiteConfigMain,
} from '@/lib/strapi';
import { enrichSections } from '@/lib/enrich';
import { isPreviewMode } from '@/lib/preview';
import { buildMetadata } from '@/lib/seo';
import { SectionRenderer } from '@/components/SectionRenderer';
import { MainChrome } from '@/components/chrome/MainChrome';
import { LandingChrome } from '@/components/chrome/LandingChrome';
import { PreviewBar } from '@/components/PreviewBar';

/**
 * 主站内容页（site=main，单级 slug：/services /industry /resources /alliance /government）。
 * 一级动态段会捕获任意路径：查不到 main 页面即 404；
 * 子站 /huaqiao 前缀路由 05 号工单接入（静态前缀优先于本动态段）。
 * SEO 字段从 Page.seo 派生（title/description 对照 v0.3 各页 head）。
 * 预览态（07 号工单）：draftMode cookie 在场走草稿取数 + 退出条。
 * 08 号工单：MainChrome 全局件包裹（导航派生恒走发布态）；navHidden 页
 * 不入导航但仍可 URL 直访（导航过滤与页面路由取数互不相关）。
 * 09 号工单：generateMetadata 升级全要素（canonical、og 全家、twitter 卡、og:image
 * 站点默认图回退，见 lib/seo.ts buildMetadata）。
 * 2026-09-23：landing 回退链——main Page 未命中时按 landing-page（site=main）
 * 渲染 LandingChrome（运营后台自建专题落地页直挂根路径 /<slug>，与
 * /whitepaper 同形态；白皮书本体仍由静态段固定路由优先承接）。landing
 * 分支 sections 走 enrichSections（支持 news/insightList 动态区块注入；
 * /whitepaper 固定路由维持 06 号行为不 enrich）。
 */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const draft = await isPreviewMode();
  const [page, landing, config] = await Promise.all([
    getPage(slug, 'main', { draft }),
    getLandingPage(slug, 'main', { draft }),
    getSiteConfigMain(),
  ]);
  const source = page ?? landing;
  if (!source) return {};
  const seo = source.seo;
  return buildMetadata({
    path: `/${slug}`,
    title: seo?.title ?? source.title,
    description: seo?.description,
    ogImage: seo?.ogImage,
    defaultOgImage: config?.ogImageDefault,
    noindex: seo?.noindex,
  });
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const draft = await isPreviewMode();
  const [page, landing, config, nav] = await Promise.all([
    getPage(slug, 'main', { draft }),
    getLandingPage(slug, 'main', { draft }),
    getSiteConfigMain(),
    getMainNavPages(),
  ]);
  if (page) {
    const sections = await enrichSections(page.sections);
    return (
      <MainChrome
        config={config}
        nav={nav}
        currentSlug={slug}
        ctaLabel={page.ctaLabel}
        ctaUrl={page.ctaUrl}
      >
        {draft ? <PreviewBar /> : null}
        <SectionRenderer sections={sections} formUrl={config?.formUrl ?? undefined} />
      </MainChrome>
    );
  }
  if (landing) {
    const sections = await enrichSections(landing.sections);
    return (
      <>
        <LandingChrome page={landing} formUrl={config?.formUrl ?? undefined}>
          {draft ? <PreviewBar /> : null}
          <SectionRenderer sections={sections} formUrl={config?.formUrl ?? undefined} />
        </LandingChrome>
      </>
    );
  }
  notFound();
}
