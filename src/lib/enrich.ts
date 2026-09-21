import type { ContentGridData, SectionData } from '@/types/strapi';
import { getInsightEntries, getLatestNews } from '@/lib/strapi';

/**
 * 页面层数据注入（04 号工单）：kind=news 的 content-grid 区块在渲染前
 * 由本函数拉取 News 集合最新 newsLimit 条，塞进 data.news——
 * ContentGrid 保持纯同步展示组件（数据获取归页面/容器，jsdom 测试零 mock）。
 * 2.0 PRD 6.1 增 kind=insightList 平行分支（insights 页内容列表，
 * 洞察集合最新 newsLimit 条塞 data.insights，语义同 news）。
 * 其余区块原样透传；无注入区块的页面零开销直接返回原数组。
 */
export async function enrichSections(sections: SectionData[]): Promise<SectionData[]> {
  let enriched = false;
  const out = [...sections];
  for (let i = 0; i < out.length; i++) {
    const section = out[i];
    if (section.__component !== 'sections.content-grid') continue;
    const grid = section as ContentGridData;
    if (grid.kind === 'news') {
      out[i] = { ...grid, news: await getLatestNews(grid.newsLimit ?? 3) };
      enriched = true;
    } else if (grid.kind === 'insightList') {
      out[i] = { ...grid, insights: await getInsightEntries(grid.newsLimit ?? 8) };
      enriched = true;
    }
  }
  return enriched ? out : sections;
}
