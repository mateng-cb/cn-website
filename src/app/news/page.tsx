import type { Metadata } from 'next';
import { getLatestNews, getMainNavPages, getSiteConfigMain } from '@/lib/strapi';
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
 * /news 不进 sitemap（导航可达即可，seo.test 13 条基线不动——工单写死决策）。
 */
export const metadata: Metadata = {
  title: '新闻动态｜算力海洋',
  description: '算力海洋最新动态：产业合作、活动发布与媒体报道。',
};

export default async function NewsListPage() {
  const [news, config, nav] = await Promise.all([
    getLatestNews(100),
    getSiteConfigMain(),
    getMainNavPages(),
  ]);
  return (
    <MainChrome config={config} nav={nav}>
      <ContentGrid
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
