// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * 07 号工单 Draft 预览链路测试缝：
 * - 取数层草稿分支：请求 URL 带 status=draft + Bearer 只读 token、不带缓存选项
 * - 取数层发布分支（回归）：force-cache + tag 'strapi' + 无 Authorization
 * - /api/preview：错 secret 401；对 secret enable draftMode 后 302 到映射路径
 * - /api/preview/exit：disable 后重定向，to 白名单防开放重定向
 * 验收 5（只读 token 无写权限）为运行时 curl 实测，见工单完成备注。
 */
const { draftMode } = vi.hoisted(() => ({ draftMode: vi.fn() }));
vi.mock('next/headers', () => ({ draftMode }));

// lib/preview 的 token 文件兜底走 node:fs——mock 掉保证「文件不存在」用例
// 在任何机器上都确定（本机 dev 可能真实存在 ../cn-strapi/.preview-token）
const { readFileSyncMock } = vi.hoisted(() => ({ readFileSyncMock: vi.fn() }));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, readFileSync: readFileSyncMock };
});

import { NextRequest } from 'next/server';
import { getPage, getLandingPage, getNews, STRAPI_URL } from '@/lib/strapi';
import { isPreviewMode } from '@/lib/preview';
import { GET as previewGET } from '@/app/api/preview/route';
import { GET as exitGET } from '@/app/api/preview/exit/route';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const enable = vi.fn();
const disable = vi.fn();

/** Strapi 集合查询响应（data 数组形态） */
function listResponse(data: unknown[], status = 200) {
  return { ok: status < 400, status, json: async () => ({ data }) };
}

/** Strapi 单条 documentId 端点响应（data 对象形态） */
function docResponse(data: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => ({ data }) };
}

function lastCall() {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  // URLSearchParams 会把 filters[slug] 编码为 filters%5Bslug%5D，断言前解码
  return {
    url: decodeURIComponent(String(url)),
    rawUrl: String(url),
    init: (init ?? {}) as Record<string, unknown>,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  enable.mockClear();
  disable.mockClear();
  draftMode.mockReset();
  draftMode.mockResolvedValue({ isEnabled: true, enable, disable });
  vi.stubEnv('STRAPI_PREVIEW_TOKEN', 'test-preview-token');
  vi.stubEnv('PREVIEW_SECRET', 'test-preview-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('取数层草稿分支（status=draft + 只读 token + 不缓存）', () => {
  it('getPage draft：URL 带 status=draft/locale，headers 带 Bearer，无 force-cache', async () => {
    fetchMock.mockResolvedValueOnce(listResponse([{ documentId: 'd1', slug: 'home' }]));
    await getPage('home', 'main', { draft: true });
    const { url, init } = lastCall();
    expect(url).toContain('filters[slug]=home');
    expect(url).toContain('filters[site]=main');
    expect(url).toContain('status=draft');
    expect(url).toContain('locale=zh-Hans');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-preview-token',
    );
    // 不传缓存选项（no-store 语义）——预览必须绕过 ISR/Data 缓存
    expect(init.cache).toBeUndefined();
    expect(init.next).toBeUndefined();
  });

  it('getLandingPage draft：landing-pages 端点同样带 status=draft 与 Bearer', async () => {
    fetchMock.mockResolvedValueOnce(listResponse([{ documentId: 'd2', slug: 'whitepaper' }]));
    await getLandingPage('whitepaper', 'main', { draft: true });
    const { url, init } = lastCall();
    expect(url).toContain('/api/landing-pages?');
    expect(url).toContain('status=draft');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-preview-token',
    );
    expect(init.cache).toBeUndefined();
  });

  it('getNews draft：news 端点同样带 status=draft 与 Bearer', async () => {
    fetchMock.mockResolvedValueOnce(listResponse([{ documentId: 'd3', slug: 'n1' }]));
    await getNews('n1', { draft: true });
    const { url, init } = lastCall();
    expect(url).toContain('/api/news?');
    expect(url).toContain('status=draft');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-preview-token',
    );
  });

  it('draft 但 token 未配置 → 显式报错（不静默降级到发布态）', async () => {
    vi.stubEnv('STRAPI_PREVIEW_TOKEN', '');
    readFileSyncMock.mockImplementation(() => { throw new Error('ENOENT'); });
    // 隔离模块图重载 lib/preview（绕开 cachedFileToken 模块级缓存）
    vi.resetModules();
    try {
      const { getPage: getPageFresh } = await import('@/lib/strapi');
      await expect(getPageFresh('home', 'main', { draft: true })).rejects.toThrow(/token/i);
    } finally {
      readFileSyncMock.mockReset();
      vi.resetModules();
    }
  });
});

describe('取数层发布分支回归（访客路径不受 draft 接入影响）', () => {
  it('getPage 默认：force-cache + tag strapi + 无 Authorization + 无 status 参数', async () => {
    fetchMock.mockResolvedValueOnce(listResponse([{ documentId: 'd1', slug: 'home' }]));
    await getPage('home');
    const { url, init } = lastCall();
    expect(url).not.toContain('status=');
    expect((init as { headers?: Record<string, string> }).headers).toBeUndefined();
    expect(init.cache).toBe('force-cache');
    expect((init.next as { tags: string[] }).tags).toEqual(['strapi']);
  });

  it('getNews 默认仍走缓存（既有调用面零变化）', async () => {
    fetchMock.mockResolvedValueOnce(listResponse([]));
    await getNews('n1');
    const { init } = lastCall();
    expect(init.cache).toBe('force-cache');
  });
});

describe('/api/preview 路由', () => {
  function makeUrl(query: Record<string, string>) {
    const sp = new URLSearchParams(query).toString();
    return new NextRequest(`http://localhost:3001/api/preview?${sp}`);
  }

  it('错 secret → 401，不启用 draftMode、不查 Strapi', async () => {
    const res = await previewGET(makeUrl({ secret: 'wrong', type: 'page', documentId: 'd1' }));
    expect(res.status).toBe(401);
    expect(enable).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('缺 secret → 401', async () => {
    const res = await previewGET(makeUrl({ type: 'page', documentId: 'd1' }));
    expect(res.status).toBe(401);
  });

  it('对 secret + page(main) → enable 后 302 到 /{slug}', async () => {
    fetchMock.mockResolvedValueOnce(
      docResponse({ documentId: 'd1', slug: 'services', site: 'main' }),
    );
    const res = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'page', documentId: 'd1' }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3001/services');
    expect(enable).toHaveBeenCalledTimes(1);
    // 解析期查询带 status=draft 与 Bearer，且不缓存
    const { url, init } = lastCall();
    expect(url).toBe(`${STRAPI_URL}/api/pages/d1?status=draft&locale=zh-Hans`);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-preview-token',
    );
  });

  it('page(hq, slug=home) → /huaqiao；hq 内页 → /huaqiao/{slug}', async () => {
    fetchMock.mockResolvedValueOnce(
      docResponse({ documentId: 'd2', slug: 'home', site: 'hq' }),
    );
    const home = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'page', documentId: 'd2' }),
    );
    expect(home.headers.get('location')).toBe('http://localhost:3001/huaqiao');

    fetchMock.mockResolvedValueOnce(
      docResponse({ documentId: 'd3', slug: 'cloud', site: 'hq' }),
    );
    const inner = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'page', documentId: 'd3' }),
    );
    expect(inner.headers.get('location')).toBe('http://localhost:3001/huaqiao/cloud');
  });

  it('landing-page → /{slug}（whitepaper 静态前缀路由）；news-item → /news/{slug}', async () => {
    fetchMock.mockResolvedValueOnce(docResponse({ slug: 'whitepaper' }));
    const landing = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'landing-page', documentId: 'd4' }),
    );
    expect(landing.headers.get('location')).toBe('http://localhost:3001/whitepaper');

    fetchMock.mockResolvedValueOnce(docResponse({ slug: 'some-news' }));
    const news = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'news-item', documentId: 'd5' }),
    );
    expect(news.headers.get('location')).toBe('http://localhost:3001/news/some-news');
  });

  it('未知 type / 缺 documentId → 400；文档不存在 → 404；均不 enable', async () => {
    const badType = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'site-config-main', documentId: 'd' }),
    );
    expect(badType.status).toBe(400);

    const noDoc = await previewGET(makeUrl({ secret: 'test-preview-secret', type: 'page' }));
    expect(noDoc.status).toBe(400);

    fetchMock.mockResolvedValueOnce(docResponse(null, 404));
    const notFound = await previewGET(
      makeUrl({ secret: 'test-preview-secret', type: 'page', documentId: 'gone' }),
    );
    expect(notFound.status).toBe(404);
    expect(enable).not.toHaveBeenCalled();
  });

  it('上游拒认 token（401/403）→ 502 且 message 指向 token 通道（非 404 掩盖）', async () => {
    for (const status of [401, 403]) {
      fetchMock.mockResolvedValueOnce(docResponse(null, status));
      const res = await previewGET(
        makeUrl({ secret: 'test-preview-secret', type: 'page', documentId: 'd1' }),
      );
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.message).toMatch(/token/i);
      expect(enable).not.toHaveBeenCalled();
    }
  });
});

describe('/api/preview/exit 路由', () => {
  function makeUrl(to?: string) {
    const sp = to === undefined ? '' : `?to=${encodeURIComponent(to)}`;
    return new NextRequest(`http://localhost:3001/api/preview/exit${sp}`);
  }

  it('disable 后 307 回原路径', async () => {
    const res = await exitGET(makeUrl('/services'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3001/services');
    expect(disable).toHaveBeenCalledTimes(1);
  });

  it('协议相对地址拒绝（防开放重定向），回首页', async () => {
    const res = await exitGET(makeUrl('//evil.example.com'));
    expect(res.headers.get('location')).toBe('http://localhost:3001/');
  });

  it('反斜杠变体 /\\evil.com 拒绝（WHATWG URL 把 \\ 规范化为 / → 外域 host），回首页', async () => {
    // 审查修正 I-1：/\evil.com 不以 // 开头，字符串前缀挡不住；
    // new URL('/\evil.com/x', origin) 输出 http://evil.com/x，须 origin 反校验拦截
    const res = await exitGET(makeUrl('/\\evil.com/x'));
    expect(res.headers.get('location')).toBe('http://localhost:3001/');
    expect(disable).toHaveBeenCalledTimes(1);
  });

  it('缺 to → 回首页', async () => {
    const res = await exitGET(makeUrl());
    expect(res.headers.get('location')).toBe('http://localhost:3001/');
  });
});

describe('isPreviewMode（draftMode 判定兜底）', () => {
  it('draftMode() 抛错（非请求上下文契约）→ catch 返回 false', async () => {
    draftMode.mockRejectedValueOnce(new Error('`draftMode` was called outside a request scope'));
    await expect(isPreviewMode()).resolves.toBe(false);
  });

  it('isEnabled=false → false；isEnabled=true → true', async () => {
    draftMode.mockResolvedValueOnce({ isEnabled: false });
    await expect(isPreviewMode()).resolves.toBe(false);
    draftMode.mockResolvedValueOnce({ isEnabled: true });
    await expect(isPreviewMode()).resolves.toBe(true);
  });
});
