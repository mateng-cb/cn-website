/**
 * 跨站入口新开窗判定（2026-09-23 需求）：从主站进入分站（/huaqiao）与
 * 专题落地页（/whitepaper）时新标签页打开，保留主站浏览上下文；主站
 * 内容页之间跳转（/news /services 等）仍当前页导航。外链 http(s) 沿用
 * 既有新开行为，收口为同一判定。
 *
 * 仅用于主站内容区与全局件链接；HqChrome/LandingChrome 不引用——子站/
 * 专题内部互链是同站导航，新开会连开多标签。后续运营自建 landing 若需
 * 新开，把链接配成完整 http(s) 地址即可（外链分支天然覆盖）。
 */
const NEW_TAB_PREFIXES = ['/huaqiao', '/whitepaper'];

export function openInNewTab(url: string | null | undefined): boolean {
  if (!url) return false;
  if (/^https?:\/\//.test(url)) return true;
  return NEW_TAB_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`));
}

/** openInNewTab 的展开形态：命中时返回 target/rel props，否则空对象 */
export function newTabProps(url: string | null | undefined) {
  return openInNewTab(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}
