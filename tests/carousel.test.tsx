import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Carousel } from '@/components/elements/Carousel';

/**
 * 2.0 工单 02 主测试缝：轮播 client 组件（全仓首个 'use client'）。
 * jsdom 边界：matchMedia 全局 stub 见 vitest.setup.ts（matches:false 恒动效态）；
 * 定时器行为用 fake timers 驱动（intervalMs 由 props 直传，不走真实 2s/3s 等待）。
 */
const mk = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    url: `/uploads/slide-${i + 1}.webp`,
    alt: `第 ${i + 1} 张`,
    caption: `说明 ${i + 1}`,
  }));

describe('Carousel 多张轮播', () => {
  it('SSR 首帧：全部 img 在场、仅第一张 active，指示点数量与张数一致', () => {
    render(<Carousel slides={mk(3)} intervalMs={3000} title="轮播标题" />);
    const imgs = document.querySelectorAll('.hero-slides img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0].className).toBe('active');
    expect(imgs[1].className).toBe('');
    expect(document.querySelectorAll('.hero-dots button')).toHaveLength(3);
    expect(screen.getByText('轮播标题')).toBeTruthy();
    expect(screen.getByText('说明 1')).toBeTruthy(); // 底条 caption 跟随当前帧
  });

  it('自动轮播：intervalMs 到点切下一帧并循环回第一张', () => {
    vi.useFakeTimers();
    try {
      render(<Carousel slides={mk(3)} intervalMs={2000} />);
      const active = () =>
        [...document.querySelectorAll('.hero-slides img')].findIndex((i) => i.className === 'active');
      expect(active()).toBe(0);
      act(() => vi.advanceTimersByTime(2000));
      expect(active()).toBe(1);
      act(() => vi.advanceTimersByTime(4000));
      expect(active()).toBe(0); // 1 → 2 → 0 循环
    } finally {
      vi.useRealTimers();
    }
  });

  it('指示点可点切换：aria-current 跟随，caption 同步换帧', () => {
    render(<Carousel slides={mk(3)} intervalMs={3000} />);
    fireEvent.click(screen.getByRole('button', { name: '切换到第 3 张' }));
    const imgs = document.querySelectorAll('.hero-slides img');
    expect(imgs[2].className).toBe('active');
    expect(screen.getByText('说明 3')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: '切换到第 3 张' }).getAttribute('aria-current'),
    ).toBe('true');
  });
});

describe('Carousel 单张退化（占位态）', () => {
  it('无多张类、无指示点、无定时器（advance 后仍是首帧）', () => {
    vi.useFakeTimers();
    try {
      render(<Carousel slides={mk(1)} intervalMs={2000} title="单张" />);
      expect(document.querySelector('.hero-carousel')).toBeNull();
      expect(document.querySelector('.hero-dots')).toBeNull();
      act(() => vi.advanceTimersByTime(10000));
      const imgs = document.querySelectorAll('.hero-slides img');
      expect(imgs).toHaveLength(1);
      expect(imgs[0].className).toBe('active');
      expect(screen.getByText('单张')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Carousel prefers-reduced-motion 停播', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addListener: () => {}, removeListener: () => {} }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reduce 态不起定时器（advance 后仍首帧），指示点手动切换仍可用', () => {
    vi.useFakeTimers();
    try {
      render(<Carousel slides={mk(2)} intervalMs={2000} />);
      act(() => vi.advanceTimersByTime(10000));
      const imgs = document.querySelectorAll('.hero-slides img');
      expect(imgs[0].className).toBe('active');
      fireEvent.click(screen.getByRole('button', { name: '切换到第 2 张' }));
      expect(imgs[1].className).toBe('active');
    } finally {
      vi.useRealTimers();
    }
  });
});
