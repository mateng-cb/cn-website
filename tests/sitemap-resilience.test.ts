// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

/**
 * 10 号复审 Important 1：sitemap 取数网络容错。
 * getPublished* 在 next build 期执行（sitemap 无动态 API、build 期固化），
 * fetch reject（连接拒绝/DNS 失败）若上抛则「Strapi 不可达 → 构建失败」；
 * 容错为 [] 后 Strapi 可达从构建硬前提降为软前提（镜像可先行构建）。
 */

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import {
  getPage,
  getPublishedPages,
  getPublishedLandingPages,
  getPublishedNews,
} from '@/lib/strapi';

describe('页面取数容错（getPage 同经 fetchOrNull，10 号复审核对点 2）', () => {
  it('fetch reject（网络异常）→ null 走 notFound（原为 throw→500，语义对齐 docblock 意图）', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(getPage('services', 'main')).resolves.toBeNull();
  });

  it('服务在线但异常（非 404 的 !ok）→ 仍 fail-fast 上抛（不静默 404）', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(getPage('services', 'main')).rejects.toThrow('500');
  });
});

describe('sitemap 取数容错（fetchSitemapList）', () => {
  it('fetch reject（网络异常）→ 三个 getPublished* 均返回 [] 不上抛', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(getPublishedPages()).resolves.toEqual([]);
    await expect(getPublishedLandingPages()).resolves.toEqual([]);
    await expect(getPublishedNews()).resolves.toEqual([]);
  });

  it('非 2xx 响应 → []（既有 !res.ok 语义回归）', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    await expect(getPublishedPages()).resolves.toEqual([]);
  });

  it('正常响应 → data 数组透传', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ slug: 'services', site: 'main', publishedAt: '2026-09-19' }] }),
    });
    await expect(getPublishedPages()).resolves.toHaveLength(1);
  });

  it('请求带 force-cache + tag strapi（缓存语义不因容错丢失）', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await getPublishedNews();
    const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1];
    expect(init.cache).toBe('force-cache');
    expect(init.next).toEqual({ tags: ['strapi'] });
  });
});
