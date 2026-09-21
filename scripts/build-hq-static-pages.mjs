#!/usr/bin/env node
/**
 * 华侨数港新版二级页单文件导入（/huaqiao/cloud|enterprise|global，暂不走 CMS）。
 *
 * 用法：node scripts/build-hq-static-pages.mjs <slug>=<原始单文件.html> [...]
 *
 * 输入为设计侧导出的自包含 HTML（互链用 hq-<name>.html 相对路径、主视觉为
 * base64 内嵌背景图）。脚本做四件事后生成构建期内嵌字符串模块：
 *  1. base64 主视觉 → /huaqiao/<slug>-hero.jpg（图片本体由导入流程另行压缩
 *     至 web/public/huaqiao/，不进 JS 包）
 *  2. href="hq-<name>.html" → /huaqiao/<name>（站内干净路径，与 url-plan 一致）
 *  3. hq-emblem 字符徽标（云/侨/球）→ /logo/logo_cn_en.svg 横版 logo
 *     （页头与门户统一，1187×342 → 44px 高自适应宽；样式同步改写）
 *  4. 产物写 src/lib/hq-static/<slug>.ts（JSON 转义字符串，route.ts 直接 import）
 *
 * 重复导入即覆盖更新（同名 slug 幂等）；slug 必须属于 HQ_SLUGS 白名单。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(webDir, 'src', 'lib', 'hq-static');
const HQ_SLUGS = ['cloud', 'enterprise', 'global'];

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('用法: node scripts/build-hq-static-pages.mjs <slug>=<原始单文件.html> [...]');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

for (const arg of args) {
  const eq = arg.indexOf('=');
  if (eq < 0) throw new Error(`参数格式应为 <slug>=<文件>，收到: ${arg}`);
  const slug = arg.slice(0, eq);
  const input = arg.slice(eq + 1);
  if (!HQ_SLUGS.includes(slug)) throw new Error(`slug "${slug}" 不在白名单 ${HQ_SLUGS.join('/')} 内`);

  let html = readFileSync(input, 'utf8');

  // 1. 内嵌 base64 主视觉 → public 静态图（图片本体另行压缩存放）
  const dataUri = /data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g;
  if (!dataUri.test(html)) throw new Error(`${slug}: 未找到内嵌 base64 图片，确认输入为单文件版导出`);
  html = html.replace(dataUri, `/huaqiao/${slug}-hero.jpg`);

  // 2. 页间互链相对路径 → 站内干净路径
  html = html.replace(/href="hq-([a-z]+)\.html"/g, (_, name) => {
    if (!HQ_SLUGS.includes(name)) throw new Error(`${slug}: 互链 hq-${name}.html 不在白名单内`);
    return `href="/huaqiao/${name}"`;
  });

  // 3. hq-emblem 字符徽标（云/侨/球）→ 横版 logo 图片 + 样式适配
  //    （logo_cn_en.svg 1187×342：44px 高 → width 153；渐变方块样式改纯图展示）
  html = html.replace(
    /<span class="hq-emblem">[^<]*<\/span>/g,
    '<img class="hq-emblem" src="/logo/logo_cn_en.svg" alt="算力海洋" width="153" height="44">',
  );
  html = html.replace(
    '.hq-emblem{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--blue),var(--navy-2));color:#fff;display:grid;place-items:center;font-weight:800;font-size:20px;box-shadow:0 6px 14px rgba(20,125,240,.35)}',
    '.hq-emblem{height:44px;width:auto;display:block;flex:0 0 auto}',
  );

  // 4. 残留检查：不再有 base64、.html 相对链与字符徽标
  if (/data:image\/[a-z+]+;base64,/.test(html)) throw new Error(`${slug}: base64 清理不彻底`);
  if (/href="[^"]*\.html"/.test(html)) throw new Error(`${slug}: 仍有 .html 相对链残留`);
  if (/<span class="hq-emblem">/.test(html)) throw new Error(`${slug}: hq-emblem 字符徽标替换失败`);

  const symbol = `HQ_${slug.replace(/([A-Z])/g, '_$1').toUpperCase()}_PAGE_HTML`;
  const banner = `/**
 * 华侨数港 /huaqiao/${slug} 静态单文件页本体（设计侧导出，暂不走 CMS）。
 * 由 scripts/build-hq-static-pages.mjs 生成——勿手改；主视觉在
 * /huaqiao/${slug}-hero.jpg（web/public/huaqiao/），互链已改写站内干净路径，
 * 页头品牌槽已替换 /logo/logo_cn_en.svg（与门户页头统一）。
 */
export const ${symbol} = `;

  const outFile = path.join(outDir, `${slug}.ts`);
  writeFileSync(outFile, banner + JSON.stringify(html) + ';\n', 'utf8');
  console.log(`[hq-static] ${slug}: ${(html.length / 1024).toFixed(1)}KB HTML → ${path.relative(webDir, outFile)}`);
}
