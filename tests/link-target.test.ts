import { describe, expect, it } from 'vitest';
import { openInNewTab } from '@/lib/link-target';

/** 跨站入口新开窗判定（2026-09-23）：外链沿用 + 分站/专题前缀，边界不误伤 */
describe('openInNewTab', () => {
  it('外链 http(s) 新开（沿用既有行为）', () => {
    expect(openInNewTab('https://example.com')).toBe(true);
    expect(openInNewTab('http://example.com/a')).toBe(true);
  });

  it('分站 /huaqiao 与专题 /whitepaper：本体与子路径均新开', () => {
    expect(openInNewTab('/huaqiao')).toBe(true);
    expect(openInNewTab('/huaqiao/cloud')).toBe(true);
    expect(openInNewTab('/whitepaper')).toBe(true);
  });

  it('前缀边界：/huaqiaox 等近似路径不误命中', () => {
    expect(openInNewTab('/huaqiaox')).toBe(false);
    expect(openInNewTab('/whitepapers')).toBe(false);
  });

  it('主站内容页同窗：/ /news /services 等', () => {
    expect(openInNewTab('/')).toBe(false);
    expect(openInNewTab('/news')).toBe(false);
    expect(openInNewTab('/services')).toBe(false);
    expect(openInNewTab('#contact')).toBe(false);
  });

  it('空值不新开', () => {
    expect(openInNewTab(null)).toBe(false);
    expect(openInNewTab(undefined)).toBe(false);
    expect(openInNewTab('')).toBe(false);
  });
});
