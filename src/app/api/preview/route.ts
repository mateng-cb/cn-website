import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { draftMode } from 'next/headers';
import { STRAPI_URL } from '@/lib/strapi';
import { previewSecret, getPreviewToken } from '@/lib/preview';

/**
 * Draft 预览入口（07 号工单）：Strapi 后台「Open preview」iframe 指向这里。
 * 链路：secret 校验 → 只读 token 查 Strapi 文档（拿 slug/site）→
 * draftMode().enable() → 307 到真实页面路径（页面层 isPreviewMode 走草稿取数）。
 *
 * 参数（由 cn-strapi config/admin.ts preview handler 生成）：
 * - secret：PREVIEW_SECRET（与 Strapi 侧同值；错值 401）
 * - type：CT 短名 page | landing-page | news-item（site-config 单例无独立页面，不提供预览）
 * - documentId：Strapi 5 文档 id（比 slug 稳定——草稿里改 slug 也能正确重定向）
 * - locale / status：透传编辑器状态（status 缺省 draft）
 */
const PLURAL_BY_TYPE: Record<string, string> = {
  'page': 'pages',
  'landing-page': 'landing-pages',
  'news-item': 'news',
};

type PreviewDocument = { slug?: string; site?: 'main' | 'hq' };

/** CT + 文档 → 前台路由路径（与 app 目录路由结构一一对应） */
function toPagePath(type: string, doc: PreviewDocument): string | null {
  const slug = doc.slug ?? '';
  if (!slug) return null;
  if (type === 'page') {
    if (doc.site === 'hq') return slug === 'home' ? '/huaqiao' : `/huaqiao/${slug}`;
    return slug === 'home' ? '/' : `/${slug}`;
  }
  // landing 走一级静态前缀路由：当前唯一实例是 whitepaper → /whitepaper；
  // 新增 landing 需同步 app 下静态路由（或并入动态段）与本表映射
  if (type === 'landing-page') return `/${slug}`;
  if (type === 'news-item') return `/news/${slug}`;
  return null;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get('secret') !== previewSecret()) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }

  const type = sp.get('type') ?? '';
  const documentId = sp.get('documentId') ?? '';
  const plural = PLURAL_BY_TYPE[type];
  if (!plural || !documentId) {
    return NextResponse.json({ message: 'bad request: type/documentId required' }, { status: 400 });
  }

  const token = getPreviewToken();
  if (!token) {
    return NextResponse.json(
      { message: 'preview token not configured (STRAPI_PREVIEW_TOKEN / .preview-token)' },
      { status: 500 },
    );
  }

  // 查文档拿 slug/site（预览解析期不缓存；单条 documentId 直查端点）
  const status = sp.get('status') === 'published' ? 'published' : 'draft';
  const locale = sp.get('locale') ?? 'zh-Hans';
  const params = new URLSearchParams({ status, locale });
  const res = await fetch(`${STRAPI_URL}/api/${plural}/${documentId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // 上游拒认 token 是链路配置故障（非文档缺失）：502 + 指向 token 通道，
    // 避免把 token 失效误报成 404 掩盖真因（审查修正 M-1）
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { message: 'strapi rejected preview token (check STRAPI_PREVIEW_TOKEN / .preview-token)' },
        { status: 502 },
      );
    }
    return NextResponse.json({ message: 'document not found' }, { status: 404 });
  }
  const { data } = (await res.json()) as { data: PreviewDocument };

  const target = toPagePath(type, data);
  if (!target) {
    return NextResponse.json({ message: 'no page route for document' }, { status: 404 });
  }

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(target, req.nextUrl.origin));
}
