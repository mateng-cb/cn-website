import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMainNavPages, getNews, getSiteConfigMain, strapiMediaUrl } from '@/lib/strapi';
import { isPreviewMode } from '@/lib/preview';
import { buildMetadata, buildNewsArticleJsonLd, jsonLdScript } from '@/lib/seo';
import { newsDisplayDate } from '@/lib/format';
import { RichText } from '@/components/elements/RichText';
import { MainChrome } from '@/components/chrome/MainChrome';
import { PreviewBar } from '@/components/PreviewBar';

/**
 * 新闻详情（externalUrl 二态的站内态；v0.3 无此页，最简自设计模板）：
 * 标题 / 日期 / 封面 / 正文 / 返回锚点（回 /news 动态列表）。
 * 无相关推荐、无分页。externalUrl 有值的条目直访本页一律 404
 * （外链态无站内详情页，防止「假详情页」与外链内容分叉）。
 * 预览态（07 号工单）：news 无草稿副本（draftAndPublish:false），预览 =
 * 只读 token 实时取（绕开前台 force-cache 看最新保存内容）+ 退出条。
 * 08 号工单：MainChrome 包裹；2026-09-21 用户定界——动态与研究洞察是
 * 两个独立栏目，不传 currentSlug（导航不高亮洞察），返回链回 /news。
 * 09 号工单：metadata 全要素（og:image=cover，无 cover 回退主站默认图）+
 * Article JSON-LD（title/excerpt/cover/date，映射表 §2 新增能力）。
 */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [news, config] = await Promise.all([
    getNews(slug, { draft: await isPreviewMode() }),
    getSiteConfigMain(),
  ]);
  if (!news) return {};
  return buildMetadata({
    path: `/news/${news.slug}`,
    title: `${news.title}｜算力海洋`,
    description: news.excerpt,
    ogImage: news.cover,
    defaultOgImage: config?.ogImageDefault,
  });
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const draft = await isPreviewMode();
  const [news, config, nav] = await Promise.all([
    getNews(slug, { draft }),
    getSiteConfigMain(),
    getMainNavPages(),
  ]);
  if (!news || news.externalUrl) notFound();
  return (
    <MainChrome config={config} nav={nav}>
      {draft ? <PreviewBar /> : null}
      <article className="section news-detail">
        <time>{newsDisplayDate(news)}</time>
        <h1>{news.title}</h1>
        {news.cover ? (
          <img
            src={strapiMediaUrl(news.cover)}
            alt={news.cover.alternativeText ?? news.title}
          />
        ) : null}
        {news.body ? <RichText as="div" className="news-body" html={news.body} /> : null}
        <a className="back" href="/news">
          ← 返回动态列表
        </a>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildNewsArticleJsonLd(news)) }}
      />
    </MainChrome>
  );
}
