import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom 环境下每个用例结束后清理 DOM，避免跨用例查询串扰
afterEach(() => {
  cleanup();
});

// jsdom 不实现 matchMedia（02 号起 Carousel 的 prefers-reduced-motion 查询）；
// node 环境用例（@vitest-environment node）无 window，跳过 stub
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
