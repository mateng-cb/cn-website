import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionRenderer } from '@/components/SectionRenderer';
import type { SectionData, StrapiPage } from '@/types/strapi';
import alliance from '../../content-seed/content/alliance.json';

vi.mock('@/lib/strapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/strapi')>();
  return { ...actual, getPage: vi.fn(), getSiteConfigMain: vi.fn() };
});

/**
 * 2.0 PRD 7.2 共同体核心解决方案折叠列表（fixture = alliance.json seed 单一源）。
 * 原生 details/summary 零 JS：jsdom 不执行任何脚本也成立——open 属性即折叠
 * 状态的全部事实（默认 closed；禁 JS 开合为本单定义性验收，浏览器原生行为）。
 */
const page = alliance.pages[0] as unknown as StrapiPage;

describe('/alliance：解决方案折叠列表（2.0 PRD 7.2）', () => {
  it('两条折叠卡默认收起（details 无 open 属性）', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const items = document.querySelectorAll('details.solution-item');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.hasAttribute('open')).toBe(false);
    }
  });

  it('summary 结构：上部左右分栏（左 logo + 标题随展开钮 + 简介，右封面）', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const first = document.querySelector('details.solution-item');
    const summary = first?.querySelector('summary');
    expect(summary).toBeTruthy();
    // summary 自身即开关，内部不得再嵌 button（吞 toggle）
    expect(summary?.querySelector('button')).toBeNull();
    // 上部左右：.solution-row > .solution-left（logo/标题/简介）+ cover
    const row = summary?.querySelector('.solution-row');
    expect(row).toBeTruthy();
    const left = row?.querySelector('.solution-left');
    expect(left).toBeTruthy();
    // logo 空：方案名首两字文字标（aria-hidden 装饰）
    const logoText = left?.querySelector('.solution-logo-text');
    expect(logoText?.getAttribute('aria-hidden')).toBe('true');
    expect(logoText?.textContent).toBe('城市');
    expect(screen.getByText('城市智能体解决方案').tagName).toBe('B');
    // 展开提示紧随标题后（.solution-title 内）：文字双态 span + 箭头 ::after
    // 均由 CSS [open] 切换（收起「向下展开」↔ 展开「收起」），DOM 两态并存
    const title = left?.querySelector('.solution-title');
    const toggle = title?.querySelector('.solution-toggle');
    expect(toggle?.querySelector('.solution-toggle-expand')?.textContent).toBe('向下展开');
    expect(toggle?.querySelector('.solution-toggle-collapse')?.textContent).toBe('收起');
    // 简介在标题组下方
    expect(left?.querySelector('.solution-summary')?.textContent).toContain(
      '面向城市治理与公共服务的智能体平台',
    );
    // 封面图在 row 右侧（left 之外）
    expect(left?.querySelector('.solution-cover')).toBeNull();
    expect(row?.querySelector('img.solution-cover')).toBeTruthy();
  });

  it('展开态 body 富文本容器就位（details 内 .solution-body，closed 态不渲染内容）', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const first = document.querySelector('details.solution-item');
    const body = first?.querySelector('.solution-body');
    expect(body).toBeTruthy();
    expect(body?.innerHTML).toContain('优刻得与生态伙伴联合打造');
    // jsdom 不展开 details，closed 态内容仍在 DOM（浏览器原生隐藏）
    expect(first?.hasAttribute('open')).toBe(false);
  });

  it('区块位于 deliverable 之后、news 区块之前（sections 序）', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const sections = [...document.querySelectorAll('section')];
    const solIdx = sections.findIndex((s) =>
      s.className.includes('solution-list'),
    );
    const deliverIdx = sections.findIndex((s) => s.querySelector('.deliverable-row'));
    const newsIdx = sections.findIndex((s) => s.id === 'news');
    expect(deliverIdx).toBeGreaterThan(-1);
    expect(solIdx).toBeGreaterThan(deliverIdx);
    expect(newsIdx).toBeGreaterThan(solIdx);
  });
});
