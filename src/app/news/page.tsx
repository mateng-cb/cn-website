import type { Metadata } from 'next';
import { getLatestNews, getMainNavPages, getSiteConfigMain } from '@/lib/strapi';
import { buildMetadata } from '@/lib/seo';
import { MainChrome } from '@/components/chrome/MainChrome';
import { ContentGrid } from '@/components/sections/ContentGrid';
import type { ContentGridData } from '@/types/strapi';

/**
 * 新闻动态列表页（2.0 PRD 7.1「查看全部动态」承接页）：
 * 全量 News 按 publishDate 倒序（getLatestNews(100) 首版上限，现量远低于此）；
 * 卡片形态复用 content-grid kind=news（externalUrl 二态直跳外链/进详情），
 * newsLayout=rows——一行一条行式列表（2026-09-21 用户指定；CMS 预览区块
 * 缺省三卡不变）。
 * 不传 currentSlug：动态与研究洞察是两个独立栏目（2026-09-21 用户定界），
 * 本页不高亮任何主导航项；/insights 的 news 区块仅是预览入口。
 * 2026-09-23 QA T-105/106：/news 固定进 sitemap；metadata 升 buildMetadata
 * 全要素（canonical/og/twitter + 站点默认图回退）；本页无 hero，区块标题
 * 升 H1（headLevel），title/description 扩写至规范长度。
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfigMain();
  return buildMetadata({
    path: '/news',
    title: '新闻动态与产业资讯｜算力海洋',
    description:
      '算力海洋新闻动态与产业资讯：平台合作签约、产业活动发布、研究成果与媒体报道，了解中国算力与 AI 应用出海的最新进展。',
    defaultOgImage: config?.ogImageDefault,
  });
}

export default async function NewsListPage() {
  const [news, config, nav] = await Promise.all([
    getLatestNews(100),
    getSiteConfigMain(),
    getMainNavPages(),
  ]);
  return (
    <MainChrome config={config} nav={nav}>
      <ContentGrid
        headLevel="h1"
        data={
          {
            __component: 'sections.content-grid',
            kind: 'news',
            newsLayout: 'rows',
            news,
            head: { eyebrow: 'NEWS', heading: '新闻动态' },
          } as ContentGridData
        }
      />
    </MainChrome>
  );
}
