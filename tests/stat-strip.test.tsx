import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatStrip } from '@/components/sections/StatStrip';
import type { StatStripData } from '@/types/strapi';

/**
 * stat-strip 在 v0.3 首页无对应段落（白皮书 landing 数字指标用，工单 06），
 * 故 fixture 内联而非复用首页 seed。
 */
const fixture: StatStripData = {
  __component: 'sections.stat-strip',
  head: {
    eyebrow: 'BY THE NUMBERS',
    heading: '平台运营规模',
    lead: '资源节点、指标和可用性以伙伴确认及正式协议为准。',
    align: 'center',
  },
  stats: [
    { id: 1, value: '30+', label: '全球资源节点' },
    { id: 2, value: '100E', label: '可组织算力规模' },
    { id: 3, value: '5', label: '海外区域伙伴圈层' },
  ],
};

describe('StatStrip 渲染（main 皮肤基础样式）', () => {
  it('数字指标按 value/label 原样渲染（格式化留给皮肤层）', () => {
    const { container } = render(<StatStrip data={fixture} />);
    expect(container.querySelector('section.stat-strip')).toBeTruthy();

    const cells = container.querySelectorAll('.stat-grid > div');
    expect(cells.length).toBe(3);
    expect(cells[0].querySelector('b')?.textContent).toBe('30+');
    expect(cells[0].querySelector('span')?.textContent).toBe('全球资源节点');
    expect(screen.getByText('100E')).toBeTruthy();
  });

  it('head 渲染 section-head（eyebrow + h2 + lead）', () => {
    const { container } = render(<StatStrip data={fixture} />);
    const head = container.querySelector('div.section-head');
    expect(head?.querySelector('p.eyebrow')?.textContent).toBe('BY THE NUMBERS');
    expect(head?.querySelector('h2')?.textContent).toBe('平台运营规模');
  });

  it('空 stats 安全降级：不渲染格子', () => {
    const { container } = render(
      <StatStrip data={{ __component: 'sections.stat-strip' }} />,
    );
    expect(container.querySelector('.stat-grid')).toBeNull();
  });
});
