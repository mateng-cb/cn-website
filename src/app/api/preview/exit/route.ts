import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { draftMode } from 'next/headers';

/**
 * 退出 Draft 预览（07 号工单）：清 preview cookie 后回到原页面（发布态渲染）。
 * to 参数限定站内路径，防开放重定向：先粗滤（/ 开头且非协议相对 //），
 * 再以构造结果的 origin 反校验兜底——WHATWG URL 在特殊 scheme 下会把
 * 反斜杠规范化为正斜杠（/\evil.com → //evil.com → host=evil.com），
 * 纯字符串前缀挡不住该变体，必须校验最终 URL 的 origin（审查修正 I-1）。
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to') ?? '/';
  const candidate = to.startsWith('/') && !to.startsWith('//') ? to : '/';
  let target: URL;
  try {
    target = new URL(candidate, req.nextUrl.origin);
  } catch {
    target = new URL('/', req.nextUrl.origin);
  }
  if (target.origin !== req.nextUrl.origin) {
    target = new URL('/', req.nextUrl.origin);
  }
  (await draftMode()).disable();
  return NextResponse.redirect(target);
}
