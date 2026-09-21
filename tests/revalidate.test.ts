// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag }));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/revalidate/route';

const TOKEN = 'dev-webhook-shared-token';

function makeRequest(headers: Record<string, string>, body?: unknown): NextRequest {
  return new NextRequest('http://localhost:3001/api/revalidate', {
    method: 'POST',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** Strapi 5 webhook payload 形态（document-service events.js：model+uid+entry） */
function webhookPayload(uid: string) {
  return { event: 'entry.update', model: uid.split('.').pop(), uid, entry: {} };
}

describe('/api/revalidate（辅缝：request → response）', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it('无 Authorization → 401，不触发失效', async () => {
    const res = await POST(makeRequest({ 'x-strapi-event': 'entry.publish' }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('错误 token → 401', async () => {
    const res = await POST(
      makeRequest({ authorization: 'Bearer wrong', 'x-strapi-event': 'entry.publish' }),
    );
    expect(res.status).toBe(401);
  });

  it('page 的 entry.update → 200 但跳过（D&P 类型保存草稿不失效，防编辑器双触发）', async () => {
    const res = await POST(
      makeRequest(
        { authorization: `Bearer ${TOKEN}`, 'x-strapi-event': 'entry.update' },
        webhookPayload('api::page.page'),
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revalidated).toBe(false);
    expect(body.message).toContain('entry.update');
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('landing-page 的 entry.update → 同样跳过；entry.create（新建草稿）也跳过', async () => {
    for (const event of ['entry.update', 'entry.create']) {
      revalidateTag.mockClear();
      const res = await POST(
        makeRequest(
          { authorization: `Bearer ${TOKEN}`, 'x-strapi-event': event },
          webhookPayload('api::landing-page.landing-page'),
        ),
      );
      expect(res.status).toBe(200);
      expect((await res.json()).revalidated).toBe(false);
      expect(revalidateTag).not.toHaveBeenCalled();
    }
  });

  it('news-item 的 entry.update → 触发失效（draftAndPublish:false 保存即生效，10 号复审修正）', async () => {
    const res = await POST(
      makeRequest(
        { authorization: `Bearer ${TOKEN}`, 'x-strapi-event': 'entry.update' },
        webhookPayload('api::news-item.news-item'),
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revalidated).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('strapi');
  });

  it('news-item 的 entry.create → 触发失效（新建即前台可见）', async () => {
    const res = await POST(
      makeRequest(
        { authorization: `Bearer ${TOKEN}`, 'x-strapi-event': 'entry.create' },
        webhookPayload('api::news-item.news-item'),
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).revalidated).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('strapi');
  });

  it('entry.update 无 body/坏 JSON → 保守跳过（与 D&P 行为一致）', async () => {
    const res = await POST(
      makeRequest({ authorization: `Bearer ${TOKEN}`, 'x-strapi-event': 'entry.update' }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).revalidated).toBe(false);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('entry.publish → 200 并 revalidateTag("strapi")', async () => {
    const res = await POST(
      makeRequest({ authorization: `Bearer ${TOKEN}`, 'x-strapi-event': 'entry.publish' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revalidated).toBe(true);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith('strapi');
  });

  it('media.create → 同样触发失效', async () => {
    const res = await POST(
      makeRequest({ authorization: `Bearer ${TOKEN}`, 'x-strapi-event': 'media.create' }),
    );
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('strapi');
  });

  it('entry.unpublish / entry.delete → 触发失效', async () => {
    for (const event of ['entry.unpublish', 'entry.delete']) {
      revalidateTag.mockClear();
      const res = await POST(
        makeRequest({ authorization: `Bearer ${TOKEN}`, 'x-strapi-event': event }),
      );
      expect(res.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('strapi');
    }
  });
});
