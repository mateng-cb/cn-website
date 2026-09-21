import type { NewsData } from '@/types/strapi';

/**
 * News 时间槽显示文本（列表卡 time 与详情页共用）：
 * displayDate 覆盖 > publishDate 中式日期格式化（2026 年 6 月 30 日）。
 */
export function newsDisplayDate(news: Pick<NewsData, 'displayDate' | 'publishDate'>): string {
  if (news.displayDate) return news.displayDate;
  if (!news.publishDate) return '';
  const d = new Date(news.publishDate);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}
