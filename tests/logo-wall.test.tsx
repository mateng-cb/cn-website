import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionRenderer } from '@/components/SectionRenderer';
import type { SectionData, StrapiPage } from '@/types/strapi';
import industry from '../../content-seed/content/industry.json';

vi.mock('@/lib/strapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/strapi')>();
  return { ...actual, getPage: vi.fn(), getSiteConfigMain: vi.fn() };
});

/**
 * 3.3 设计稿生态伙伴 Logo 分组卡（fixture = industry.json seed 单一源）：
 * 四张彩色卡片（上方小字 label + 主标题 title + Logo 格），无区块大标题；
 * image 空渲染公司名文字卡不出 img 节点——占位先行口径的组件契约。
 */
const page = industry.pages[0] as unknown as StrapiPage;

describe('/industry：生态伙伴 Logo 分组卡（3.3 设计稿）', () => {
  it('区块大标题 + 四张分组卡：上方小字 + 主标题 + 20 个 Logo 格', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const wall = document.querySelector('section.logo-wall');
    expect(wall).toBeTruthy();
    // 区块大标题（head 恢复）：eyebrow + 「生态伙伴」
    expect(wall?.querySelector('.section-head .eyebrow')?.textContent).toBe('ECOSYSTEM PARTNERS');
    expect(wall?.querySelector('.section-head h2')?.textContent).toBe('生态伙伴');
    expect(wall?.querySelectorAll('.logo-wall-label')).toHaveLength(4);
    // 主标题与 layer-stack 四层同源文案（3.3 设计稿），限定本墙内断言
    const titles = Array.from(wall?.querySelectorAll('h3.logo-wall-title') ?? []).map(
      (t) => t.textContent,
    );
    expect(titles).toEqual(['IDC 产业', '算力及云计算', '大模型及词元生态', '应用及企业服务生态']);
    expect(wall?.querySelectorAll('.logo-cell')).toHaveLength(20);
  });

  it('image 空渲染公司名文字卡（零 img 节点，占位先行）', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const wall = document.querySelector('section.logo-wall');
    expect(wall?.querySelectorAll('img')).toHaveLength(0);
    expect(wall?.querySelectorAll('.logo-cell-name')).toHaveLength(20);
    expect(screen.getByText('中国 IDC 圈').className).toBe('logo-cell-name');
    expect(screen.getByText('PPIO')).toBeTruthy();
  });

  it('组简介：每组主标题下渲染 summary（2026-09-22 后台可维护）', () => {
    render(<SectionRenderer sections={page.sections as SectionData[]} />);
    const wall = document.querySelector('section.logo-wall');
    const summaries = Array.from(wall?.querySelectorAll('.logo-wall-summary') ?? []).map(
      (s) => s.textContent,
    );
    expect(summaries).toHaveLength(4);
    expect(summaries[0]).toBe('联合头部 IDC 与数据中心服务商，提供机柜、电力与网络的基础承载能力。');
    // summary 紧跟主标题（标题 → 简介 → Logo 格 的卡片序）
    expect(wall?.querySelector('.logo-wall-title + .logo-wall-summary')).toBeTruthy();
  });
});
