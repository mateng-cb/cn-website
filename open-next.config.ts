import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// 默认配置（本期不上 R2 增量缓存，与参考部署记录一致）。
// 代价：ISR force-cache + revalidateTag('strapi')（ADR-0003）退化为每请求现取
// Strapi（华为云国内，跨境延迟进 TTFB）。后续要完整按需再生语义时升级：
// R2 incremental cache + D1NextModeTagCache（opennext.js.org/cloudflare/caching，
// 小站推荐组合），届时 wrangler.jsonc 需补 r2_buckets/d1_databases 绑定。
export default defineCloudflareConfig();
