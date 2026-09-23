/**
 * 站点绝对 URL 根（零依赖纯计算，seo.ts 与 next.config.ts 共用——后者不能
 * 引入带取数逻辑的 seo.ts）。优先级与注入纪律见 seo.ts 同款注释：
 * SITE_URL env > 生产默认测试域名（cn-test）> dev localhost:3001；
 * 正式站部署 suanlihaiyang.com 必须显式注入 SITE_URL，否则 canonical/
 * sitemap/robots 全部指向测试域名（QA T-101~103 根因）。
 */
export const SITE_URL = (
  process.env.SITE_URL
  ?? (process.env.NODE_ENV === 'production' ? 'https://cn-test.tokenocean.net' : 'http://localhost:3001')
).replace(/\/+$/, '');

/** 正式站域名：SITE_URL 指向它时全站可收录，其余部署（测试站）默认 noindex */
const PROD_DOMAIN = 'suanlihaiyang.com';

/**
 * 测试站防收录（QA T-104）：非正式域名的部署默认 X-Robots-Tag: noindex，
 * 避免测试环境与正式环境争抢收录；NOINDEX env 可显式覆盖（'0' 强制关，
 * '1' 强制开）。正式站上线配 SITE_URL=https://suanlihaiyang.com 即自动关闭，
 * 无需额外变量。
 */
export const ROBOTS_NOINDEX =
  process.env.NOINDEX !== undefined
    ? process.env.NOINDEX !== '0'
    : !SITE_URL.includes(PROD_DOMAIN);
