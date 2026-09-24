// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * appendSectionsPopulate 与 Strapi schema 的对齐测试（2026-09-24 线上 500 根因）：
 * cn-strapi「死字段清理」已从 hero / signal-band 组件删除 head 字段，
 * Strapi 5 对 populate 里的未知键整条查询回 400（ValidationError:
 * "Invalid key head at sections"），getPage / getLandingPage 走 fail-fast
 * throw → 全站 sections 动态页 server-side exception。
 * 契约：populate 集合与 schema 字段一一对应——死键不请求，活键不误删。
 */
import { getPage, getLandingPage } from '@/lib/strapi';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function listResponse(data: unknown[], status = 200) {
  return { ok: status < 400, status, json: async () => ({ data }) };
}

function lastUrl(): string {
  const [url] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  // URLSearchParams 把 [] 编码为 %5B%5D，断言前解码
  return decodeURIComponent(String(url));
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(listResponse([]));
});

describe('sections populate 与 schema 对齐（死字段不请求）', () => {
  it('getPage：不 populate 已删除的 hero.head / signal-band.head', async () => {
    await getPage('home', 'main');
    const url = lastUrl();
    expect(url).not.toContain('[sections.hero][populate][head]');
    expect(url).not.toContain('[sections.signal-band][populate][head]');
  });

  it('getLandingPage：共用 appendSectionsPopulate，同样不带两个死键', async () => {
    await getLandingPage('whitepaper', 'main');
    const url = lastUrl();
    expect(url).not.toContain('[sections.hero][populate][head]');
    expect(url).not.toContain('[sections.signal-band][populate][head]');
  });

  it('活字段回归护栏：其余组件 head 与 hero/signal-band 活键仍在', async () => {
    await getPage('home', 'main');
    const url = lastUrl();
    // 其余 8 个组件的 head 为活字段（2026-09-24 逐一对线上 schema 实测 200）
    expect(url).toContain('[sections.card-grid][populate][head]');
    expect(url).toContain('[sections.cta-band][populate][head]');
    expect(url).toContain('[sections.solution-list][populate][head]');
    // hero / signal-band 的其余活键未被误删
    expect(url).toContain('[sections.hero][populate][badges]');
    expect(url).toContain('[sections.hero][populate][rightPanel][populate][image]');
    expect(url).toContain('[sections.signal-band][populate][items]');
  });
});
