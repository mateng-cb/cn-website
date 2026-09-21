'use client';

import { useEffect, useState } from 'react';

/**
 * 轮播（2.0 PRD 1.2/5.1）：hero 右栏 1-5 张图自动轮播（2s/3s 两档），
 * 容器内上下居中。全仓首个 client 组件——props 由 server 侧 MediaPanel
 * 预解析为可序列化纯数据（url/caption），零依赖取数层。
 * - SSR 输出首帧 index=0（与 hydration 一致），hydrate 后起 timer
 * - 单张降级静态（不起 timer、不渲染指示点），DOM 与 imageCard 单图同构
 * - prefers-reduced-motion 停播（自动轮播关闭，指示点仍可手动切换）
 * - 指示点 button 可点跳转；底部渐变条 title 恒定 + 当前帧 caption
 */
export interface CarouselSlide {
  url: string;
  alt: string;
  caption?: string | null;
}

export function Carousel({
  slides,
  intervalMs,
  title,
}: {
  slides: CarouselSlide[];
  intervalMs: number;
  title?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const single = slides.length <= 1;

  useEffect(() => {
    if (single) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      intervalMs,
    );
    return () => clearInterval(timer);
  }, [single, intervalMs, slides.length]);

  const active = single ? slides[0] : slides[index];
  const caption = active.caption;

  return (
    <div className={`hero-image-card${single ? '' : ' hero-carousel'}`}>
      <div className="hero-slides">
        {slides.map((s, i) => (
          <img
            key={i}
            src={s.url}
            alt={s.alt}
            loading="eager"
            {...(single || i === index ? { className: 'active' } : {})}
          />
        ))}
      </div>
      {title || caption ? (
        <div>
          {title ? <b>{title}</b> : null}
          {caption ? <span>{caption}</span> : null}
        </div>
      ) : null}
      {single ? null : (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`切换到第 ${i + 1} 张`}
              aria-current={i === index}
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
