import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CtaBand } from '@/components/sections/CtaBand';
import type { CtaBandData } from '@/types/strapi';
import seed from '../../content-seed/content/home.json';

const sections = seed.pages[0].sections as unknown as CtaBandData[];
const ctaSeed = sections.find((s) => s.__component === 'sections.cta-band')!;

const FORM_URL = 'https://kezhishuzi.cn/share/shrwhp27dzKJiSAGg0r46/fomNuUm3g8HqL4gulr';

describe('CtaBand 渲染（v0.3 section#contact.cta）', () => {
  it('结构：id=contact 锚点 + eyebrow + h2 + text + 按钮', () => {
    render(<CtaBand data={ctaSeed} formUrl={FORM_URL} />);
    const section = document.getElementById('contact')!;
    expect(section.className).toBe('cta');
    expect(screen.getByText('PROJECT CONSULTATION').className).toBe('eyebrow');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      '共同建设面向全球的区域算力与 AI 产业服务能力',
    );
    expect(screen.getByText(/适用于地方政府/)).toBeTruthy();
  });

  it('默认引用 site-config formUrl：按钮 href 取全局表单链接，外链开新窗', () => {
    render(<CtaBand data={ctaSeed} formUrl={FORM_URL} />);
    const button = screen.getByRole('link', { name: '预约项目沟通' });
    expect(button.getAttribute('href')).toBe(FORM_URL);
    expect(button.getAttribute('target')).toBe('_blank');
    expect(button.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('formUrlOverride 覆写全局表单链接', () => {
    const data = { ...ctaSeed, formUrlOverride: '/contact-form' } as CtaBandData;
    render(<CtaBand data={data} formUrl={FORM_URL} />);
    const button = screen.getByRole('link', { name: '预约项目沟通' });
    expect(button.getAttribute('href')).toBe('/contact-form');
    // 内链（非 http 开头）不加 target
    expect(button.getAttribute('target')).toBeNull();
  });

  it('无 formUrl 无 override 时安全降级为 #', () => {
    render(<CtaBand data={ctaSeed} />);
    expect(screen.getByRole('link', { name: '预约项目沟通' }).getAttribute('href')).toBe('#');
  });

  it('按钮自身 url 优先于 override 与全局 formUrl（后台可填字段不能静默丢弃）', () => {
    const data = {
      ...ctaSeed,
      formUrlOverride: '/block-override',
      buttons: [{ label: '按钮A', url: '/per-button' }, { label: '按钮B' }],
    } as unknown as CtaBandData;
    render(<CtaBand data={data} formUrl={FORM_URL} />);
    expect(screen.getByRole('link', { name: '按钮A' }).getAttribute('href')).toBe('/per-button');
    // 未填 url 的按钮仍走区块 override
    expect(screen.getByRole('link', { name: '按钮B' }).getAttribute('href')).toBe(
      '/block-override',
    );
  });

  it('自带标题字段缺省时回落 head 备用来源；tip 渲染', () => {
    const data = {
      __component: 'sections.cta-band',
      head: { eyebrow: 'EYEBROW', heading: '标题', lead: '说明' },
      buttons: [{ label: '按钮' }],
      tip: '提交后 1 个工作日内回复',
    } as unknown as CtaBandData;
    render(<CtaBand data={data} formUrl={FORM_URL} />);
    expect(screen.getByText('EYEBROW')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('标题');
    expect(screen.getByText('说明')).toBeTruthy();
    expect(screen.getByText('提交后 1 个工作日内回复').className).toBe('cta-tip');
  });
});
