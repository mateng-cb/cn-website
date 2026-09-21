import type { MainNavItem, MainNavNode } from '@/types/strapi';

/**
 * 主站页面 slug → URL（url-plan.md：slug home 即主站根）。
 * 与 hqPageUrl（/huaqiao 前缀）对称的路由层拼装约定。
 */
export function mainPageUrl(slug: string) {
  return slug === 'home' ? '/' : `/${slug}`;
}

/**
 * 主站导航树构建（08 号工单，纯函数供渲染与测试共用）：
 * - 入参为 getMainNavPages 已过滤的可见集合（site=main、navHidden=false、已发布）
 * - 一级判定：无父 / 父不在可见集合（被删、navHidden、未发布）/
 *   自引用 / 处于 navParent 互指环——均视为无父进一级（环成员降级一级，
 *   与「父不可见降级」同语义；schema 无环约束，防御在此收口）
 * - 深度截断：导航 DOM 只有二级。三级及以上链（A←B←C）的深层节点
 *   沿祖先链上提到最近的顶级之下（C 挂 A），不再向更深挂载——
 *   避免静默消失；任意深度同理收敛到二级
 * - 一级（含降级项）与二级各自按 navOrder 稳定排序（API sort 已排，
 *   降级插队后兜底重排；navOrder 空（null/undefined）按 0 参与排序）
 */
export function buildMainNavTree(items: MainNavItem[]): MainNavNode[] {
  const visible = new Set(items.map((i) => i.slug));
  const parentOf = new Map(items.map((i) => [i.slug, i.navParentSlug ?? null]));
  const nodes = new Map<string, MainNavNode>(
    items.map((i) => [
      i.slug,
      { slug: i.slug, navTitle: i.navTitle, url: mainPageUrl(i.slug), children: [] },
    ]),
  );
  const orderOf = new Map(items.map((i) => [i.slug, i.navOrder ?? 0]));

  /** 沿祖先链走：start 自身是否处于环上（链走回 start）。进入他人环不算。 */
  const inCycle = (start: string): boolean => {
    let cur = parentOf.get(start) ?? null;
    const seen = new Set<string>();
    while (cur && visible.has(cur)) {
      if (cur === start) return true;
      if (seen.has(cur)) return false; // 链进入环但 start 不在环上（其父终会被环判定降级）
      seen.add(cur);
      cur = parentOf.get(cur) ?? null;
    }
    return false;
  };

  const isTop = new Set(
    items
      .filter((i) => {
        const parent = i.navParentSlug;
        return (
          !parent || parent === i.slug || !visible.has(parent) || inCycle(i.slug)
        );
      })
      .map((i) => i.slug),
  );

  /**
   * 非 top 节点最终挂载的顶级 slug：父是 top → 父；父也是二级
   * （三级链）→ 递归到父的挂载点（截断上提）。非环节点链有限且
   * 终点必为 top（父不可见的节点已在 isTop 里），递归必然终止。
   */
  const mountTarget = (slug: string): string => {
    const parent = parentOf.get(slug) ?? '';
    return isTop.has(parent) ? parent : mountTarget(parent);
  };

  const tops: MainNavNode[] = [];
  for (const item of items) {
    const node = nodes.get(item.slug)!;
    if (isTop.has(item.slug)) {
      tops.push(node);
    } else {
      nodes.get(mountTarget(item.slug))!.children.push(node);
    }
  }

  const byOrder = (a: MainNavNode, b: MainNavNode) =>
    (orderOf.get(a.slug) ?? 0) - (orderOf.get(b.slug) ?? 0);
  tops.sort(byOrder);
  for (const top of tops) top.children.sort(byOrder);
  return tops;
}
