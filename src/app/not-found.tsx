import Link from 'next/link';

/**
 * 404 页（08 号工单，Next app/not-found.tsx 约定）。
 * v0.3 无 404 源页，自设计最小样式（.not-found 独立类，风格对齐主站：
 * 品牌蓝主按钮、居中版式）。不挂 MainChrome——404 路径不再拉 Strapi 导航/
 * 配置数据，Strapi 不可达时 404 兜底页本身不能跟着失效。
 */
export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>页面不存在或已下线</h1>
      <p className="not-found-lead">
        你访问的地址没有对应页面，可能已被移动、删除，或从未发布。
      </p>
      <Link className="primary" href="/">
        返回首页
      </Link>
    </main>
  );
}
