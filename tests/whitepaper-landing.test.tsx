import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SectionRenderer } from '@/components/SectionRenderer';
import { LandingChrome } from '@/components/chrome/LandingChrome';
import type { LandingPageData, SectionData } from '@/types/strapi';
import whitepaper from '../../content-seed/content/whitepaper.json';

/**
 * 06 号工单主测试缝：白皮书专题页（fixture 单一源 = content-seed/content/whitepaper.json）。
 * 覆盖：hero theme=cover 封面形态（CSS 书封 + metaRows 键值行）、stat-strip 指标、
 * navSimple 极简导航（brand + 锚点 + 获取按钮，无主导航下拉）、锚点目标
 * （card-grid anchor）、零飞书 CDN 外链（v0.3 index-v1 唯一外链的本地化验收）。
 */
const landing = whitepaper.landingPages[0] as unknown as LandingPageData;
const CTA_URL = landing.ctaUrl ?? '';

/** SectionRenderer 注册表支持的 8 个区块（纯拼装：landing 不得出现注册外组件） */
const KNOWN_SECTIONS = new Set([
  'sections.hero',
  'sections.card-grid',
  'sections.signal-band',
  'sections.process-flow',
  'sections.split-media',
  'sections.content-grid',
  'sections.stat-strip',
  'sections.cta-band',
]);

function renderLanding() {
  render(
    <LandingChrome page={landing} formUrl="https://example.com/fallback-form">
      <SectionRenderer sections={landing.sections as SectionData[]} formUrl={CTA_URL} />
    </LandingChrome>,
  );
}

describe('seed 骨架：landing-page 字段与纯拼装', () => {
  it('slug=whitepaper / site=main / navSimple 开启，锚点链接 2 条指向页内区块', () => {
    expect(landing.slug).toBe('whitepaper');
    expect(landing.site).toBe('main');
    expect(landing.navSimple).toBe(true);
    expect(landing.navLinks?.map((l) => `${l.label}:${l.url}`)).toEqual([
      '测算模型:#model',
      'TFS-5 标准:#tfs',
    ]);
  });

  it('sections 全部为既有 8 区块组件（无专用 hero 字段组，纯拼装）', () => {
    for (const section of landing.sections) {
      expect(
        KNOWN_SECTIONS.has(section.__component),
        `${section.__component} 应为注册表内组件`,
      ).toBe(true);
    }
  });
});

describe('/whitepaper 渲染：封面 hero + 键值行 + 指标', () => {
  it('hero theme=cover：cover-hero 形态 + CSS 书封（书名/年份/出版方/缎带）', () => {
    renderLanding();
    const hero = document.querySelector('section.hero');
    expect(hero?.className).toContain('cover-hero');
    const cover = document.querySelector('.landing .cover');
    expect(cover).toBeTruthy();
    expect(cover?.querySelector('.c-top')?.textContent).toContain('WHITE PAPER 2026');
    expect(cover?.querySelector('.c-title')?.textContent).toContain('中国词元工厂');
    expect(cover?.querySelector('.c-title span')?.textContent).toBe('（2026）');
    const foot = cover?.querySelectorAll('.c-foot span');
    expect(foot?.[0]?.textContent).toBe('科智咨询');
    expect(foot?.[1]?.textContent).toBe('算力海洋');
    expect(cover?.querySelector('.c-tag')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hero metaRows 键值行 + 获取白皮书外链按钮（nav 与 hero 双入口同指 ctaUrl）', () => {
    renderLanding();
    const meta = document.querySelector('.hero-meta');
    expect(meta?.querySelector('dt')?.textContent).toBe('正式发布');
    expect(meta?.querySelector('dd')?.textContent).toBe('2026 年 9 月 10 日');
    const ctas = screen.getAllByRole('link', { name: '获取白皮书' });
    expect(ctas).toHaveLength(2);
    for (const cta of ctas) {
      expect(cta.getAttribute('href')).toBe(CTA_URL);
      expect(cta.getAttribute('target')).toBe('_blank');
    }
  });

  it('stat-strip 三格指标（140 万亿 / 2185 EFLOPS / 1300+）', () => {
    renderLanding();
    const cells = document.querySelectorAll('.stat-grid > div');
    expect(cells).toHaveLength(3);
    expect(cells[0]?.querySelector('b')?.textContent).toBe('140 万亿');
    expect(cells[1]?.querySelector('b')?.textContent).toBe('2185 EFLOPS');
    expect(cells[2]?.querySelector('b')?.textContent).toBe('1300+');
  });

  it('锚点目标：card-grid 渲染 section id=model / id=tfs', () => {
    renderLanding();
    expect(document.querySelector('section#model .detail-grid')).toBeTruthy();
    expect(document.querySelectorAll('#model .detail-card')).toHaveLength(2);
    expect(document.querySelector('section#tfs .service-catalog')).toBeTruthy();
    expect(document.querySelectorAll('#tfs .service-catalog article')).toHaveLength(5);
  });

  it('TFS 结构面板（split dark）与双按钮 CTA 带', () => {
    renderLanding();
    const panel = document.querySelector('.landing .agent-visual');
    expect(panel?.querySelector('h2')?.textContent).toContain('一张身份证 · 三本账');
    expect(panel?.querySelectorAll('ul.checks li')).toHaveLength(4);
    const cta = document.querySelector('.landing .cta');
    expect(cta?.querySelectorAll('a')).toHaveLength(2);
    expect(cta?.querySelector('.cta-tip')?.textContent).toContain('数据基准截至 2026 年 8 月 31 日');
  });
});

describe('navSimple 极简导航（无主导航下拉）', () => {
  it('brand 本站 logo + 锚点跳转 + 获取按钮外链', () => {
    renderLanding();
    const brand = document.querySelector('.landing-brand img');
    expect(brand?.getAttribute('src')).toBe('/logo/logo_cn_en.svg');
    const anchor = screen.getByRole('link', { name: 'TFS-5 标准' });
    expect(anchor.getAttribute('href')).toBe('#tfs');
    const navCta = document.querySelector('.landing-nav-cta');
    expect(navCta?.getAttribute('href')).toBe(CTA_URL);
    expect(navCta?.getAttribute('target')).toBe('_blank');
  });

  it('无主导航下拉（无 details 菜单）与页脚 disclaimer 渲染', () => {
    renderLanding();
    expect(document.querySelector('details')).toBeNull();
    expect(document.querySelector('.hq-menu')).toBeNull();
    const foot = document.querySelector('.landing-foot');
    expect(foot?.textContent).toContain('本白皮书不构成投资建议');
    expect(foot?.querySelector('img')?.getAttribute('src')).toBe('/logo/logo_en.png');
  });

  it('navSimple=false 关闭极简导航（.landing-nav 不渲染，页脚仍在）', () => {
    render(
      <LandingChrome page={{ ...landing, navSimple: false }}>
        <SectionRenderer sections={landing.sections as SectionData[]} />
      </LandingChrome>,
    );
    expect(document.querySelector('.landing-nav')).toBeNull();
    expect(document.querySelector('.landing-foot')).toBeTruthy();
  });

  it('ctaUrl 缺失时获取按钮回退 site-config-main.formUrl', () => {
    const FALLBACK = 'https://example.com/fallback-form';
    render(
      <LandingChrome page={{ ...landing, ctaUrl: null }} formUrl={FALLBACK}>
        <SectionRenderer sections={landing.sections as SectionData[]} />
      </LandingChrome>,
    );
    const navCta = document.querySelector('.landing-nav-cta');
    expect(navCta?.getAttribute('href')).toBe(FALLBACK);
  });

  it('返回顶部锚点：landing 根挂显式 id=top 落点', () => {
    renderLanding();
    expect(document.querySelector('.landing')?.id).toBe('top');
    const backTop = screen.getByRole('link', { name: '返回顶部' });
    expect(backTop.getAttribute('href')).toBe('#top');
  });
});

describe('零飞书 CDN 外链（生产页不依赖第三方文档 CDN）', () => {
  const webRoot = process.cwd();

  it('渲染输出不含 miaoda.feishu.cn / larksuite 域', () => {
    const { container } = render(
      <LandingChrome page={landing}>
        <SectionRenderer sections={landing.sections as SectionData[]} />
      </LandingChrome>,
    );
    const html = container.innerHTML;
    expect(html.includes('miaoda.feishu.cn')).toBe(false);
    expect(html.includes('larksuite')).toBe(false);
  });

  it('样式与 seed 均未引入飞书字体 CDN（样式全量本地化）', () => {
    const css = readFileSync(path.join(webRoot, 'src/app/globals.css'), 'utf-8');
    expect(css.includes('feishu.cn')).toBe(false);
    expect(css.includes('larksuite')).toBe(false);
    const seed = JSON.stringify(whitepaper);
    expect(seed.includes('feishu.cn')).toBe(false);
  });
});
