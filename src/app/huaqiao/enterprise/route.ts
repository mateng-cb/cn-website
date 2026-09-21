import { HQ_ENTERPRISE_PAGE_HTML } from '@/lib/hq-static/enterprise';

/**
 * /huaqiao/enterprise 静态单文件页（2026-09 新版二级页）。
 * 分工：CMS 的 Page 条目（site=hq, slug=enterprise）承载页面级信息——后台可见、
 * 可管理 title/navTitle/ctaLabel/seo 与发布态（门户导航联动）；内容主体
 * （区块组件）不经 CMS 维护，由本路由内嵌的设计侧单文件 HTML 渲染
 * （scripts/build-hq-static-pages.mjs 生成，互链与主视觉已改写站内路径）。
 * 静态段优先于同名 [slug] 动态段；force-static 构建期预渲染，
 * OpenNext 下走边缘静态资源、不占 Worker 体积。
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(HQ_ENTERPRISE_PAGE_HTML, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
