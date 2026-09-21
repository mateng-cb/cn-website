import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Draft 预览链路（07 号工单）的密钥与判定辅助。
 * 双闸分立：
 * - PREVIEW_SECRET：/api/preview 入口闸（与 cn-strapi/.env 同值，handler 生成 URL 携带）
 * - STRAPI_PREVIEW_TOKEN：草稿取数闸（Strapi 只读 token preview-reader）
 * 均为服务端值，不走 NEXT_PUBLIC。
 */

/**
 * /api/preview 入口密钥。dev 默认值与 .env.example / cn-strapi/.env 同步维护
 * （同 REVALIDATE_TOKEN 的 dev 默认模式）；生产必须注入强随机值。
 * 每次调用时读 env（非模块顶层固化），测试 stubEnv 与运行时热改均生效。
 */
export function previewSecret(): string {
  return process.env.PREVIEW_SECRET ?? 'dev-preview-secret';
}

const PREVIEW_TOKEN_FILE = path.join(process.cwd(), '..', 'cn-strapi', '.preview-token');

let cachedFileToken: string | null | undefined;

/**
 * Strapi 只读 token（bootstrap 自动创建 preview-reader，写 cn-strapi/.preview-token，
 * 仅创建时返回一次 accessKey）。获取通道：
 * - 生产：env STRAPI_PREVIEW_TOKEN（Docker 注入 / CF Workers 变量，均必填）
 * - dev：env 未设时读 monorepo 同机的 ../cn-strapi/.preview-token（process.cwd()=web/）
 * 读不到返回 null——预览链路不可用，但不影响访客路径（无此分支不取草稿）。
 * 文件回退仅 dev：生产容器无 ../cn-strapi 可读，CF Workers 更无文件系统
 * （node:fs 读取必然 throw），提前返回省一次注定失败的 IO。
 */
export function getPreviewToken(): string | null {
  if (process.env.STRAPI_PREVIEW_TOKEN) return process.env.STRAPI_PREVIEW_TOKEN;
  if (process.env.NODE_ENV === 'production') return null;
  if (cachedFileToken === undefined) {
    try {
      cachedFileToken = readFileSync(PREVIEW_TOKEN_FILE, 'utf8').trim() || null;
    } catch {
      // 文件不存在/不可读（如生产容器、新克隆未启动 strapi）：无 token
      cachedFileToken = null;
    }
  }
  return cachedFileToken;
}

/**
 * 当前请求是否处于 Draft 预览态（/api/preview 已 enable draftMode cookie）。
 * 动态 import + try/catch：非请求上下文（单测/脚本直接调用页面组件）下
 * next/headers 的 draftMode() 会抛「outside a request scope」，视作非预览，
 * 保证既有用例与访客路径不受 draft 接入影响。
 */
export async function isPreviewMode(): Promise<boolean> {
  try {
    const { draftMode } = await import('next/headers');
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}
