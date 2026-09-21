'use client';

import { usePathname } from 'next/navigation';

/**
 * 预览态退出条（07 号工单）：draftMode cookie 在场时由页面层渲染。
 * 右下角浮条（fixed，不入文档流）：不推挤 sticky header、不参与
 * [data-skin]/.landing 皮肤体系。client 组件仅为 usePathname 取当前路径
 * （server 组件无对应 API），退出后回到同一路径的发布态渲染。
 */
export function PreviewBar() {
  const pathname = usePathname();
  return (
    <div className="preview-bar" role="status">
      <span>预览模式：未发布草稿</span>
      <a href={`/api/preview/exit?to=${encodeURIComponent(pathname)}`}>退出预览</a>
    </div>
  );
}
