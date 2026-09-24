import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import './globals.css';

// 09 号工单：metadataBase 为相对 URL 解析基准（canonical/og:url 均已输出
// 绝对 URL，此处兜底 incidental 相对值）；og 常量与 icon 组由文件约定
// （app/favicon.ico 16/32/48、app/icon.svg 16KB 矢量版——多 icon 声明时
// Chrome 取最后声明的 icon.svg、app/apple-icon.png 180）与
// lib/seo.ts buildMetadata 逐页生成
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: '算力海洋',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-skin：双皮肤开关（05 号工单起子站页面在内容根挂 data-skin="gov"
    // ——HqChrome；根布局恒为 main 默认皮肤，令牌在 gov 子树整片切换，组件零分支）
    <html lang="zh-CN" data-skin="main">
      <body>{children}</body>
    </html>
  );
}
