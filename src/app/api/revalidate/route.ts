import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Strapi webhook 落点（发布链路核心）。
 * 约定见 docs/research/strapi-next-revalidation.md 与工单 10 复审修正：
 * - Authorization: Bearer <REVALIDATE_TOKEN>（strapi/.env WEBHOOK_TOKEN 同值；
 *   dev 默认 'dev-webhook-shared-token' 两侧一致，生产必须注入强随机值）
 * - X-Strapi-Event + body.uid 区分内容类型（Strapi 5 webhook payload 含
 *   { event, model, uid, entry }，uid 形如 api::news-item.news-item）：
 *   - page / landing-page 为 draftAndPublish 类型——entry.update/entry.create
 *     只发生在保存草稿/新建草稿，发布另有 entry.publish → 跳过（防编辑器每次
 *     保存草稿打穿缓存）
 *   - news-item 为 draftAndPublish:false（保存即生效）——保存/新建只发
 *     entry.update/entry.create，必须执行失效，否则 named volume 持久化的
 *     force-cache 永不陈旧翻转
 *   - 其余事件（publish/unpublish/delete/media.*）一律失效
 * - 命中即 revalidateTag('strapi') 全量失效
 */

/**
 * 无草稿态（保存即发布）的即时集合：update/create 即前台可见的内容变化。
 * 维护点：未来新增 draftAndPublish:false 且被前台缓存取数的内容类型须登记
 * 于此，否则保存后前台缓存永不失效（site-config 系走 no-store 不需要）。
 */
const INSTANT_UIDS = new Set(['api::news-item.news-item', 'api::insight-entry.insight-entry']);

/** payload 缺失/坏 JSON 时保守视作 D&P 类型（跳过 update/create，与旧行为一致） */
function isInstantContent(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) return false;
  const uid = (payload as { uid?: unknown }).uid;
  return typeof uid === 'string' && INSTANT_UIDS.has(uid);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.REVALIDATE_TOKEN ?? 'dev-webhook-shared-token'}`;
  if (auth !== expected) {
    return NextResponse.json({ revalidated: false, message: 'unauthorized' }, { status: 401 });
  }

  const event = req.headers.get('x-strapi-event') ?? '';
  if (event === 'entry.update' || event === 'entry.create') {
    let payload: unknown = null;
    try {
      payload = await req.json();
    } catch {
      payload = null;
    }
    if (!isInstantContent(payload)) {
      return NextResponse.json({ revalidated: false, message: `skipped: ${event}` });
    }
  }

  revalidateTag('strapi');
  return NextResponse.json({ revalidated: true, event });
}
