/**
 * hq 静态页 head 兜底注入：favicon link（2026-09-24）。
 * 原始单文件导出的 head 无 icon 声明——浏览器硬导航进页后须盲探
 * /favicon.ico，期间标签页显示默认占位图标。生成脚本第 6 步已同步
 * 注入（build-hq-static-pages.mjs），本函数为已提交产物与设计侧重导出
 * 产物的幂等兜底：rel="icon" 已在场即原样返回，不重复插入。
 */
export function withFavicon(html: string): string {
  if (html.includes('rel="icon"')) return html;
  return html.replace(
    '<link rel="canonical"',
    '<link rel="icon" href="/favicon.ico" />\n<link rel="canonical"',
  );
}
