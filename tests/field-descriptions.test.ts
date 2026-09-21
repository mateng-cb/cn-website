// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

/**
 * admin-field-help 工单：后台表单字段说明文案表全量覆盖守护。
 *
 * 机制背景：编辑表单的说明小字来自 core_store metadatas（bootstrap 的
 * sync-field-descriptions.js 注入），文案表 cn-strapi/src/bootstrap/
 * field-descriptions.js 是唯一事实源——本测试静态校验每个 content-type
 * 与组件的每个 schema 字段都有非空中文文案（新增字段漏写说明 → 红），
 * 及文案表不存在 schema 已删的孤儿键（防文案腐化误导运营）。
 */

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(webDir, '..');
const strapiSrc = path.join(repoDir, 'cn-strapi', 'src');

/** 收集全部 content-type / 组件的 uid → 字段集合（schema 为准） */
function collectSchemaFields(): Map<string, Set<string>> {
  const fields = new Map<string, Set<string>>();

  const apiDir = path.join(strapiSrc, 'api');
  for (const api of readdirSync(apiDir)) {
    const ctDir = path.join(apiDir, api, 'content-types');
    if (!existsSync(ctDir)) continue;
    for (const t of readdirSync(ctDir)) {
      const s = JSON.parse(readFileSync(path.join(ctDir, t, 'schema.json'), 'utf8'));
      const uid = `api::${s.info.singularName}.${s.info.singularName}`;
      fields.set(uid, new Set(Object.keys(s.attributes)));
    }
  }

  const compRoot = path.join(strapiSrc, 'components');
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.json')) {
        const s = JSON.parse(readFileSync(p, 'utf8'));
        // 组件 uid 与 strapi.components 键一致：目录分隔符折叠为点（elements.card）
        const uid = path
          .relative(compRoot, p)
          .split(path.sep)
          .join('.')
          .replace(/\.json$/, '');
        fields.set(uid, new Set(Object.keys(s.attributes)));
      }
    }
  };
  walk(compRoot);
  return fields;
}

/** 文案表（CJS module.exports，经 createRequire 加载避开 ESM 互操作） */
const require_ = createRequire(import.meta.url);
const descriptions = require_(
  path.join(strapiSrc, 'bootstrap', 'field-descriptions.js'),
) as Record<string, Record<string, string>>;

const schemaFields = collectSchemaFields();
const CJK = /[一-鿿]/;

describe('后台字段说明文案表（cn-strapi field-descriptions.js）', () => {
  it('文案表覆盖全部 content-type 与组件（无缺漏 uid）', () => {
    const missing = [...schemaFields.keys()].filter((uid) => !(uid in descriptions));
    expect(missing, `以下类型缺文案：${missing.join(', ')}`).toEqual([]);
  });

  it('每个 schema 字段都有非空中文文案', () => {
    const problems: string[] = [];
    for (const [uid, fields] of schemaFields) {
      const table = descriptions[uid] ?? {};
      for (const field of fields) {
        const text = table[field];
        if (typeof text !== 'string' || !text.trim()) {
          problems.push(`${uid}.${field} 缺文案`);
        } else if (!CJK.test(text)) {
          problems.push(`${uid}.${field} 文案非中文`);
        }
      }
    }
    expect(problems, problems.join('；')).toEqual([]);
  });

  it('文案表不存在 schema 已删的孤儿键（uid 或字段）', () => {
    const problems: string[] = [];
    for (const [uid, fields] of Object.entries(descriptions)) {
      if (!schemaFields.has(uid)) {
        problems.push(`孤儿 uid：${uid}`);
        continue;
      }
      const schemaSet = schemaFields.get(uid)!;
      for (const field of Object.keys(fields)) {
        if (!schemaSet.has(field)) problems.push(`${uid} 孤儿字段：${field}`);
      }
    }
    expect(problems, problems.join('；')).toEqual([]);
  });
});
