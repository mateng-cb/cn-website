// @vitest-environment node
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

/**
 * 11 号工单：资产体积守护（防大图/favicon 回流）。
 * legacy-cleanup-plan.md §2 六张大图压缩落地后的静态断言——WebP 体积上限、
 * og 双格式 .png 原版在场、favicon 组逐件 <30KB 且 icon.svg（内嵌 base64 位图
 * 880KB）不回流。真机 PSNR（≥38dB 定量判定）属压缩执行期一次性测量，
 * 不在测试边界内（见工单 11 完成备注的逐图记录）。
 */

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(webDir, '..');
const mediaDir = path.join(repoDir, 'content-seed', 'media');
const sizeOf = (p: string): number => statSync(p).size;
const KB = 1024;

/** content-seed/media：WebP 体积上限（legacy-cleanup-plan §2 目标表） */
const WEBP_BUDGETS: Record<string, number> = {
  'china-global-network.webp': 250 * KB,
  'huaqiao-intro.webp': 200 * KB,
  'shantou-global-overview.webp': 300 * KB,
  'idc-finder-reference.webp': 150 * KB,
};

describe('大图体积守护（content-seed/media）', () => {
  for (const [file, budget] of Object.entries(WEBP_BUDGETS)) {
    it(`${file} 在场且 ≤ ${budget / KB}KB`, () => {
      const p = path.join(mediaDir, file);
      expect(existsSync(p), `${file} 缺失——seed 引用会断`).toBe(true);
      expect(sizeOf(p)).toBeLessThanOrEqual(budget);
    });
  }

  it('og 双格式：china/huaqiao 的 .png 原版在场（内容实为 JPEG、.png 扩展名——社交爬虫按内容 sniff 实测兼容，名实裁定见工单 11 备注）', () => {
    expect(existsSync(path.join(mediaDir, 'china-global-network.png'))).toBe(true);
    expect(existsSync(path.join(mediaDir, 'huaqiao-intro.png'))).toBe(true);
  });

  it('被替换的原始大图不回流（引用已切 WebP，原 jpg 不再进 seed）', () => {
    expect(existsSync(path.join(mediaDir, 'shantou-global-overview.jpg'))).toBe(false);
    expect(existsSync(path.join(mediaDir, 'idc-finder-reference.jpg'))).toBe(false);
  });

  it('seed JSON 区块引用与媒体文件一致（引用名必有同名文件）', () => {
    const contentDir = path.join(repoDir, 'content-seed', 'content');
    const mediaFiles = new Set(readdirSync(mediaDir));
    const refRe = /"(?:image|icon|cover|logo|ogImageDefault|ogImage)":\s*"([^"]+)"/g;
    for (const f of readdirSync(contentDir).filter((x) => x.endsWith('.json'))) {
      const text = readFileSync(path.join(contentDir, f), 'utf8');
      for (const m of text.matchAll(refRe)) {
        expect(mediaFiles.has(m[1]), `${f} 引用 ${m[1]} 但 media 无此文件`).toBe(true);
      }
    }
  });
});

describe('皮肤资产体积守护（web/public）', () => {
  it('research-section.webp 在场且 ≤ 150KB（globals.css CSS 背景）', () => {
    const p = path.join(webDir, 'public', 'bg', 'research-section.webp');
    expect(existsSync(p)).toBe(true);
    expect(sizeOf(p)).toBeLessThanOrEqual(150 * KB);
  });

  // 华侨数港新版二级页主视觉（hq-static-pages 单文件导入时压缩外置，
  // 原始 base64 内嵌约 1.0-1.1MB/张；JPEG q78 压缩后落 300-360KB 区间）
  for (const file of ['cloud-hero.jpg', 'enterprise-hero.jpg', 'global-hero.jpg']) {
    it(`huaqiao/${file} 在场且 ≤ 400KB`, () => {
      const p = path.join(webDir, 'public', 'huaqiao', file);
      expect(existsSync(p)).toBe(true);
      expect(sizeOf(p)).toBeLessThanOrEqual(400 * KB);
    });
  }

  it('被替换的 research-section.png 不回流', () => {
    expect(existsSync(path.join(webDir, 'public', 'bg', 'research-section.png'))).toBe(false);
  });

  it('globals.css 背景引用指向 webp（无 png/jpg 背景残留）', () => {
    const css = readFileSync(path.join(webDir, 'src', 'app', 'globals.css'), 'utf8');
    // 单引号/双引号/无引号三种 url() 形态都收（防写法漂移导致全漏检）
    const bgUrls = [...css.matchAll(/url\((['"]?)([^'")]+)\1?\)/g)].map((m) => m[2]);
    expect(bgUrls.length).toBeGreaterThan(0);
    for (const u of bgUrls) {
      expect(u.endsWith('.webp'), `背景 ${u} 非 webp`).toBe(true);
    }
  });
});

describe('favicon 组体积守护（web/src/app）', () => {
  const appDir = path.join(webDir, 'src', 'app');

  // SVG 走 v0.3 同款形态：logo_icon.svg 内嵌位图降采样 256px + 256 色量化
  // （900KB → 16KB；页签渲染尺寸模拟 16px PSNR 51dB / 64px 46dB 视觉无损；
  // viewBox 1200x1164 保留，浏览器自缩放），文件约定 URL 自带内容 hash 破缓存
  it('icon.svg 在场且 < 30KB', () => {
    const p = path.join(appDir, 'icon.svg');
    expect(existsSync(p)).toBe(true);
    expect(sizeOf(p)).toBeLessThan(30 * KB);
  });

  // favicon.ico：Safari 桌面不支持 SVG favicon 的兜底；apple-icon：iOS 主屏
  for (const file of ['favicon.ico', 'apple-icon.png']) {
    it(`${file} 在场且 < 30KB`, () => {
      const p = path.join(appDir, file);
      expect(existsSync(p)).toBe(true);
      expect(sizeOf(p)).toBeLessThan(30 * KB);
    });
  }
});
