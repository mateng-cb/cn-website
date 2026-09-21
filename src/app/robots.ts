import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt（09 号工单，url-plan.md §4 定稿）：
 * Allow / + Disallow /api/（保护 /api/revalidate、/api/preview 端点不进索引——
 * 二者另有 Bearer/secret 校验，robots 是第三道被动防线）+ sitemap 绝对 URL。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
