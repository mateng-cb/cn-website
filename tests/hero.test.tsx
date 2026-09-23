import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/sections/Hero';
import { STRAPI_URL } from '@/lib/strapi';
import seed from '../../content-seed/content/home.json';
import type { HeroData } from '@/types/strapi';

/**
 * 主测试缝：页面渲染。
 * fixture 单一源 = content-seed/content/home.json（导入脚本的同一份输入），
 * 仅做 seed 形状 → Strapi API 返回形状的变换（slides[].image 文件名 → 媒体对象；
 * 2.0 工单 02 起右栏为 carousel，面板级 image/alt 旧形态已退役）。
 */
function seedHeroToApi(): HeroData {
  const raw = seed.pages[0].sections[0] as Record<string, unknown>;
  const panel = raw.rightPanel as Record<string, unknown>;
  const slides = ((panel.slides ?? []) as Record<string, unknown>[]).map((s) => ({
    ...s,
    image: {
      // 真实 API 返回 /uploads/<文件名>（含后缀，带内容 hash）
      url: `/uploads/${s.image}`,
      alternativeText: s.imageAlt as string,
      mime: 'image/webp',
    },
  }));
  return {
    ...(raw as unknown as HeroData),
    rightPanel: {
      ...(panel as unknown as HeroData['rightPanel']),
      slides,
    },
  } as HeroData;
}

describe('Hero 渲染（fixture 复用 seed JSON）', () => {
  it('渲染 eyebrow / heading 富文本（含 <em> 强调）/ lead / detail', () => {
    render(<Hero data={seedHeroToApi()} />);
    expect(screen.getByText('中国算力与AI应用出海服务平台')).toBeTruthy();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.innerHTML).toContain('连接中国算力供给');
    expect(heading.innerHTML).toContain('<em>服务全球 AI 需求</em>');

    expect(screen.getByText(/面向地方政府、产业园区/)).toBeTruthy();
    expect(screen.getByText(/以服务和咨询为核心/)).toBeTruthy();
  });

  it('渲染两个行动按钮，链接指向 url-plan 的新干净 URL', () => {
    render(<Hero data={seedHeroToApi()} />);
    const cta1 = screen.getByRole('link', { name: '了解出海服务' });
    expect(cta1.getAttribute('href')).toBe('/services');
    // v0.3 class 契约：按钮类名恰为 type 值（primary/secondary），无前缀
    expect(cta1.className).toBe('primary');

    const cta2 = screen.getByRole('link', { name: '政府园区合作' });
    expect(cta2.getAttribute('href')).toBe('/government');
    expect(cta2.className).toBe('secondary');
  });

  it('渲染 4 枚信任徽标', () => {
    render(<Hero data={seedHeroToApi()} />);
    for (const text of ['产业咨询', '资源组织', '平台建设', '项目落地']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('渲染右侧轮播（2.0 PRD 1.2；seed 三张占位）：三图进 SSR、首帧 active、标题与首张副文案', () => {
    render(<Hero data={seedHeroToApi()} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    // 11 号：页内图走 WebP（og:image 的 PNG 版断言在 seo.test.tsx——双格式纪律）
    expect(imgs.map((i) => i.getAttribute('src'))).toEqual([
      `${STRAPI_URL}/uploads/china-global-network.webp`,
      `${STRAPI_URL}/uploads/shantou-global-overview.webp`,
      `${STRAPI_URL}/uploads/idc-finder-reference.webp`,
    ]);
    // 首帧（SSR index=0）active，其余不 active（opacity 叠放 crossfade）
    expect(imgs[0].getAttribute('class')).toBe('active');
    expect(imgs.slice(1).every((i) => i.getAttribute('class') === null || !i.getAttribute('class')!.includes('active'))).toBe(true);
    expect(screen.getByText('全球服务与资源协同网络')).toBeTruthy();
    // 副文案随 active 张切换，首帧 = 第 1 张 caption
    expect(screen.getByText('国内资源组织 · 海外需求连接 · 区域伙伴协同')).toBeTruthy();
    // 多张轮播形态：容器带 hero-carousel 类、指示点 3 个
    expect(document.querySelector('.hero-carousel')).not.toBeNull();
    expect(document.querySelectorAll('.hero-dots button')).toHaveLength(3);
  });

  it('slides 空图条目过滤（2026-09-23 cn-strapi 放开 image required）：漏传单条只少一张，全空不渲染轮播', () => {
    const base = seedHeroToApi();
    const panel = base.rightPanel as NonNullable<HeroData['rightPanel']>;
    // 运营漏传一条（image 空，后台不再拦保存）→ 有图 3 张照常渲染
    render(
      <Hero
        data={{ ...base, rightPanel: { ...panel, slides: [...(panel.slides ?? []), { caption: '漏传图条目' }] } }}
      />,
    );
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(document.querySelector('.hero-carousel')).not.toBeNull();

    // 全空（含残留脏数据）→ 轮播面板整体不渲染
    const { container } = render(
      <Hero data={{ ...base, rightPanel: { ...panel, slides: [{ caption: 'x' }, { caption: 'y' }] } }} />,
    );
    expect(container.querySelector('.hero-carousel')).toBeNull();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('缺省字段安全降级：空 hero 不渲染对应节点', () => {
    const { container } = render(
      <Hero data={{ __component: 'sections.hero' }} />,
    );
    expect(container.querySelector('.eyebrow')).toBeNull();
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('.actions')).toBeNull();
    expect(container.querySelector('.trust')).toBeNull();
    expect(container.querySelector('.hero-image-card')).toBeNull();
  });
});
