import type { JSX } from 'react';

/**
 * 内联富文本直注（hero heading 的 <br /> / <em>、News body 的段落 HTML）。
 * 内容仅可由 Strapi 后台（已鉴权编辑）写入，前台按受信富文本渲染；
 * 引入不受信来源时需先加 sanitizer。
 */
export function RichText({
  html,
  as = 'p',
  className,
}: {
  html: string;
  as?: 'h1' | 'h2' | 'p' | 'div';
  className?: string;
}) {
  const Tag = as as keyof JSX.IntrinsicElements;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
