import type { HqNavItem, SiteConfigHqData, StrapiPage } from '@/types/strapi';
import { enrichSections } from '@/lib/enrich';
import { SectionRenderer } from '@/components/SectionRenderer';
import { HqChrome } from '@/components/chrome/HqChrome';

/**
 * 子站页面视图（05 号工单）：组装皮肤壳 + 区块序列。
 * 取数全在路由层 Promise.all 并行完成（与主站首页模式一致，避免
 * getPage 完成后才发 config/nav 两跳的串行瀑布），本组件只消费 props：
 * page（site=hq 的 Page）+ config（site-config-hq 单例）+ nav（Page 派生导航）。
 * data-skin="gov" 在 HqChrome 根节点挂载，区块渲染走同一批组件零分支。
 */
export async function HqPageView({
  page,
  config,
  nav,
}: {
  page: StrapiPage;
  config: SiteConfigHqData | null;
  nav: HqNavItem[];
}) {
  const sections = await enrichSections(page.sections);
  return (
    <HqChrome config={config} page={page} nav={nav}>
      <SectionRenderer sections={sections} formUrl={config?.formUrl ?? undefined} />
    </HqChrome>
  );
}
