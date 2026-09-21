// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

/**
 * 10 号工单部署配置静态断言（本机 Docker daemon 未运行的验证边界内）：
 * nginx 301 逐条、strapi 无公网映射、三 named volume、webhook 网内直达、
 * 三 token 分立、web.Dockerfile 形态。运行时验证（compose up、curl 301 比对、
 * webhook 真投递、备份 dry-run 实跑）属部署日 runbook（deploy/README.md），
 * spec 测试决策：nginx 301 与真实 webhook 投递不自动化。
 */

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployDir = path.resolve(webDir, '..', 'deploy');
const read = (rel: string): string => readFileSync(path.join(deployDir, rel), 'utf8');

const compose = read('docker-compose.yml');
const nginxTpl = read(path.join('nginx', 'templates', 'suanlihaiyang.conf.template'));
const envExample = read('.env.example');
const dockerfile = read('web.Dockerfile');
const backupSh = read(path.join('backup', 'backup.sh'));

/** 提取 compose 二级缩进的服务体（name: 到下一个二级键之前） */
function service(name: string): string {
  const re = new RegExp(`^  ${name}:\\n((?:(?:    |\\s*#|\\s*$).*\\n?)*)`, 'm');
  const m = compose.match(re);
  expect(m, `compose 应含服务 ${name}`).toBeTruthy();
  return m![1];
}

/** 提取 .env.example 的 KEY=VALUE（忽略注释与空行） */
function envValue(key: string): string {
  const m = envExample.match(new RegExp(`^${key}=(.*)$`, 'm'));
  expect(m, `.env.example 应含 ${key}`).toBeTruthy();
  return m![1].trim();
}

describe('deploy: docker-compose.yml 四服务编排', () => {
  it('nginx / next / strapi / mysql 四服务齐全', () => {
    expect(service('nginx')).toContain('image:');
    expect(service('next')).toContain('build:');
    expect(service('strapi')).toContain('build:');
    expect(service('mysql')).toContain('mysql:8.4');
  });

  it('nginx 是唯一公网入口：仅它有 ports 80/443', () => {
    expect(service('nginx')).toMatch(/ports:\s*\n\s*-\s*"80:80"\s*\n\s*-\s*"443:443"/);
  });

  it('strapi 无宿主 ports 映射、仅容器网 expose 1337（验收 3）', () => {
    const strapi = service('strapi');
    expect(strapi).not.toMatch(/^    ports:/m);
    expect(strapi).toMatch(/expose:\s*\n\s*-\s*"1337"/);
  });

  it('mysql 无宿主 ports 映射（容器网内）', () => {
    expect(service('mysql')).not.toMatch(/^    ports:/m);
  });

  it('strapi DATABASE_* 指向 mysql 服务（容器自建 MySQL，验收 DATABASE_CLIENT=mysql）', () => {
    const strapi = service('strapi');
    expect(strapi).toMatch(/DATABASE_CLIENT:\s*mysql/);
    expect(strapi).toMatch(/DATABASE_HOST:\s*mysql/);
  });

  it('mysql 带 healthcheck（mysqladmin ping），strapi 依赖其就绪', () => {
    expect(service('mysql')).toMatch(/healthcheck:/);
    expect(service('mysql')).toMatch(/mysqladmin/);
    expect(service('strapi')).toMatch(/service_healthy/);
  });

  it('strapi 复用 cn-strapi 仓构建（build context ../cn-strapi）且 env_file 读部署 .env', () => {
    const strapi = service('strapi');
    expect(strapi).toMatch(/context:\s*\.\.\/cn-strapi/);
    expect(strapi).toMatch(/env_file:/);
  });

  it('strapi 开 SERVER_PROXY（nginx HTTPS 反代后 Koa 信任 X-Forwarded-*，复审 Minor 4）', () => {
    expect(service('strapi')).toMatch(/SERVER_PROXY:\s*"true"/);
  });

  it('nginx 挂 certbot webroot（ACME HTTP-01 续期通道，复审 Minor 5）', () => {
    expect(service('nginx')).toMatch(/\.\/certbot-www:\/var\/www\/certbot/);
  });

  it('web 服务 REVALIDATE_TOKEN 引用 WEBHOOK_TOKEN 单一真相源（验收 4 Bearer 同值）', () => {
    expect(service('next')).toMatch(/REVALIDATE_TOKEN:\s*\$\{WEBHOOK_TOKEN/);
  });

  it('web 镜像 build args 注入 SITE_URL/STRAPI_URL（09 号注记：sitemap/robots build 期固化）', () => {
    const next = service('next');
    expect(next).toMatch(/SITE_URL:\s*\$\{/);
    expect(next).toMatch(/STRAPI_URL:\s*\$\{/);
  });
});

describe('deploy: 三 named volume 持久化（验收 6）', () => {
  it('顶层声明 next_cache / mysql_data / strapi_uploads', () => {
    const m = compose.match(/^volumes:\n((?:  \w[\w-]*:.*\n?)*)/m);
    expect(m, 'compose 应有顶层 volumes 段').toBeTruthy();
    const names = m![1].split('\n').filter(Boolean).map((l) => l.trim());
    for (const v of ['next_cache:', 'mysql_data:', 'strapi_uploads:']) {
      expect(names).toContain(v);
    }
  });

  it('next 挂 /app/.next/cache；strapi 挂 /srv/app/public/uploads；mysql 挂 /var/lib/mysql', () => {
    expect(service('next')).toMatch(/next_cache:\/app\/\.next\/cache/);
    expect(service('strapi')).toMatch(/strapi_uploads:\/srv\/app\/public\/uploads/);
    expect(service('mysql')).toMatch(/mysql_data:\/var\/lib\/mysql/);
  });
});

describe('deploy: nginx 13 条页面级 301 逐条（url-plan.md §3，验收 2）', () => {
  const pageRedirects: Array<[string, string]> = [
    // 主站 7 条（首页 / 无 301）
    ['/services.html', '/services'],
    ['/industry.html', '/industry'],
    ['/resources.html', '/resources'],
    ['/insights.html', '/insights'],
    ['/alliance.html', '/alliance'],
    ['/government.html', '/government'],
    ['/index-v1.html', '/whitepaper'],
    // 子站 5 条（shantou → huaqiao 语义化 slug）
    ['/shantou.html', '/huaqiao'],
    ['/shantou-cloud.html', '/huaqiao/cloud'],
    ['/shantou-ecosystem.html', '/huaqiao/ecosystem'],
    ['/shantou-enterprise.html', '/huaqiao/enterprise'],
    ['/shantou-global.html', '/huaqiao/global'],
  ];

  it.each(pageRedirects)('%s → %s 在 map $uri 固定映射中', (old, target) => {
    expect(nginxTpl).toMatch(new RegExp(`${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${target};`));
  });

  it('map 以 $uri 为键（入口层完成，不占 Next 计算）', () => {
    expect(nginxTpl).toMatch(/map\s+\$uri\s+\$canonical_redirect/);
  });

  it('map 共 13 条静态映射 = 12 条页面级 + /index.html 首页规范形（url-plan §3 口径）', () => {
    const mapBody = nginxTpl.match(/map \$uri \$canonical_redirect \{([\s\S]*?)\n\}/)![1];
    const entries = mapBody
      .split('\n')
      .map((l) => l.replace(/#.*$/, '').trim())
      .filter((l) => l && !/^default\s/.test(l))
      .map((l) => l.replace(/;$/, ''));
    // spec「13 条」：主站 7 + 子站 5 页面级 301，加 /index.html → / 规范化
    expect(entries).toHaveLength(13);
    expect(mapBody).toMatch(/\/index\.html\s+\/;/);
  });
});

describe('deploy: nginx 4 条规则级 301 兜底（验收 2）', () => {
  it('任意 *.html 去后缀（map 未命中才走，保留查询串）', () => {
    expect(nginxTpl).toMatch(/rewrite \^\/\(\.\*\)\\\.html\$ \/\$1 permanent/);
  });

  it('http → https 301（ACME 挑战直通除外）', () => {
    expect(nginxTpl).toMatch(/return 301 https:\/\/\$host\$request_uri/);
    expect(nginxTpl).toMatch(/acme-challenge/);
  });

  it('www → 裸域 301', () => {
    expect(nginxTpl).toMatch(/server_name www\.\$\{SITE_DOMAIN\}/);
    expect(nginxTpl).toMatch(/return 301 https:\/\/\$\{SITE_DOMAIN\}\$request_uri/);
  });

  it('精确 map 优先于 .html 兜底（if 在 rewrite 前，同一 location / 块内）', () => {
    const ifPos = nginxTpl.indexOf('if ($canonical_redirect)');
    const rewritePos = nginxTpl.indexOf('rewrite ^/(.*)\\.html$');
    expect(ifPos).toBeGreaterThanOrEqual(0);
    expect(rewritePos).toBeGreaterThan(ifPos);
    // 兜底只出现在主域 location /（if/rewrite 与 proxy_pass 同块）
    const loc = nginxTpl.slice(ifPos, ifPos + 600);
    expect(loc).toContain('rewrite ^/(.*)\\.html$ /$1 permanent');
    expect(loc).toContain('proxy_pass http://next:3000');
  });
});

describe('deploy: nginx 反代与字符集', () => {
  it('主域 charset utf-8', () => {
    expect(nginxTpl).toMatch(/charset utf-8;/);
  });

  it('主域 proxy 到 next:3000（web 服务名容器网解析）', () => {
    expect(nginxTpl).toMatch(/proxy_pass http:\/\/next:3000/);
  });

  it('主域 /uploads 反代 strapi（seed 相对 URL 同源兜底）', () => {
    const uploadsLoc = nginxTpl.match(/location \^~ \/uploads\/ \{([\s\S]*?)\n    \}/)![1];
    expect(uploadsLoc).toContain('proxy_pass http://strapi:1337');
  });

  it('admin 子域 server 反代 strapi:1337（admin 面板 + API + uploads 公网可达）', () => {
    const adminSrv = nginxTpl.match(/server_name \$\{ADMIN_DOMAIN\};([\s\S]*?)\n\}/)![1];
    expect(adminSrv).toContain('proxy_pass http://strapi:1337');
    expect(adminSrv).toContain('client_max_body_size');
  });

  it('证书路径 env 化（envsubst 模板变量）', () => {
    expect(nginxTpl).toMatch(/ssl_certificate\s+\$\{SSL_CERTIFICATE\}/);
    expect(nginxTpl).toMatch(/ssl_certificate_key\s+\$\{SSL_CERTIFICATE_KEY\}/);
  });
});

describe('deploy: .env.example 三 token 分立与 URL 链', () => {
  it('WEBHOOK_TOKEN / PREVIEW_SECRET / STRAPI_PREVIEW_TOKEN 三值分立不重样（TODO 占位）', () => {
    const tokens = ['WEBHOOK_TOKEN', 'PREVIEW_SECRET', 'STRAPI_PREVIEW_TOKEN'].map(envValue);
    expect(new Set(tokens).size).toBe(3);
    for (const t of tokens) expect(t).toContain('TODO');
    // 不复用 dev 默认值（dev 默认一旦漂进生产即三闸同破）
    expect(tokens).not.toContain('dev-webhook-shared-token');
    expect(tokens).not.toContain('dev-preview-secret');
  });

  it('NEXT_URL 指向容器网内 next:3000（验收 4 webhook 直达）', () => {
    expect(envValue('NEXT_URL')).toBe('http://next:3000');
  });

  it('PUBLIC_URL 与 STRAPI_URL 同值；FRONTEND_URL 与 SITE_URL 同值（一个反代地址双职责）', () => {
    expect(envValue('PUBLIC_URL')).toBe(envValue('STRAPI_URL'));
    expect(envValue('FRONTEND_URL')).toBe(envValue('SITE_URL'));
  });

  it('生产 URL 均为 https', () => {
    expect(envValue('SITE_URL')).toMatch(/^https:\/\//);
    expect(envValue('STRAPI_URL')).toMatch(/^https:\/\//);
  });

  it('MySQL 凭证四件套与库名占位存在', () => {
    for (const k of ['MYSQL_ROOT_PASSWORD', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD']) {
      expect(envValue(k).length).toBeGreaterThan(0);
    }
  });
});

describe('deploy: web.Dockerfile（standalone 镜像形态）', () => {
  it('multi-stage：deps → build → runner', () => {
    expect(dockerfile.match(/^FROM /gm)?.length).toBeGreaterThanOrEqual(3);
  });

  it('ARG SITE_URL / STRAPI_URL 作 ENV 供 build 期固化', () => {
    expect(dockerfile).toMatch(/ARG SITE_URL/);
    expect(dockerfile).toMatch(/ARG STRAPI_URL/);
    expect(dockerfile).toMatch(/ENV SITE_URL=\$\{SITE_URL\} STRAPI_URL=\$\{STRAPI_URL\}/);
  });

  it('runner：HOSTNAME=0.0.0.0 + PORT=3000（验收 1 next 容器绑定）', () => {
    expect(dockerfile).toMatch(/HOSTNAME=0\.0\.0\.0/);
    expect(dockerfile).toMatch(/PORT=3000/);
  });

  it('standalone 产物拷贝三件（server + static + public）', () => {
    expect(dockerfile).toMatch(/\.next\/standalone/);
    expect(dockerfile).toMatch(/\.next\/static/);
    expect(dockerfile).toMatch(/COPY[^\n]*\/app\/public \.\/public/);
  });

  it('non-root 运行（USER node）且 .next/cache 目录预建属主', () => {
    expect(dockerfile).toMatch(/USER node/);
    expect(dockerfile).toMatch(/mkdir -p \/app\/\.next\/cache/);
  });
});

describe('deploy: 备份脚本（验收 5 静态形态）', () => {
  it('MySQL 转储走容器内 mysqldump（凭证不落宿主命令行）', () => {
    expect(backupSh).toMatch(/mysqldump -uroot -p/);
    expect(backupSh).toMatch(/\$MYSQL_ROOT_PASSWORD/);
  });

  it('uploads 归档 named volume（临时容器 tar）', () => {
    expect(backupSh).toMatch(/_strapi_uploads:\/data:ro/);
    expect(backupSh).toMatch(/tar czf/);
  });

  it('obsutil 推 OBS 且凭证走环境变量', () => {
    expect(backupSh).toMatch(/obsutil cp/);
    expect(backupSh).toMatch(/\$\{OBS_AK:\?/);
    expect(backupSh).toMatch(/\$\{OBS_SK:\?/);
  });

  it('--dry-run 模式：产出不推不清理（本地可验）', () => {
    expect(backupSh).toMatch(/--dry-run/);
    expect(backupSh).toMatch(/跳过 OBS/);
  });

  it('产物命名带日期戳', () => {
    expect(backupSh).toMatch(/date \+%Y%m%d-%H%M%S/);
  });

  it('cron 定义文件存在（每日执行）', () => {
    expect(existsSync(path.join(deployDir, 'backup', 'backup.cron'))).toBe(true);
  });
});

describe('deploy: web 配置基线回归', () => {
  it('next.config.ts 双路径条件化：默认（Docker）standalone，DEPLOY_TARGET=cloudflare 关闭', () => {
    const nextConfig = readFileSync(path.join(webDir, 'next.config.ts'), 'utf8');
    expect(nextConfig).toContain("=== 'cloudflare' ? undefined : 'standalone'");
    expect(nextConfig).toContain('top-slhy.fintechquan.cn');
  });

  it('web 构建上下文瘦身（.dockerignore 排除 node_modules/.next/env）', () => {
    const dockerignore = readFileSync(path.join(webDir, '.dockerignore'), 'utf8');
    for (const p of ['node_modules', '.next', '.env.local', 'tests']) {
      expect(dockerignore).toContain(p);
    }
  });
});

describe('deploy: Cloudflare Workers（OpenNext）配置基线', () => {
  // 参照 web/docs/Cloudflare OpenNext 部署记录.md；OpenNext 打包须 WSL/Linux/CI
  //（原生 Windows ENOENT），静态断言是 Windows 上的验证边界
  const readWeb = (rel: string): string => readFileSync(path.join(webDir, rel), 'utf8');
  const wrangler = readWeb('wrangler.jsonc');
  const pkg = JSON.parse(readWeb('package.json'));

  it('wrangler.jsonc：main 指向 .open-next/worker.js，assets 目录 + ASSETS 绑定', () => {
    expect(wrangler).toMatch(/"main"\s*:\s*"\.open-next\/worker\.js"/);
    expect(wrangler).toMatch(/"directory"\s*:\s*"\.open-next\/assets"/);
    expect(wrangler).toMatch(/"binding"\s*:\s*"ASSETS"/);
  });

  it('wrangler.jsonc：nodejs_compat 兼容标志 + Worker 名 suanlihaiyang-web', () => {
    expect(wrangler).toMatch(/"compatibility_flags"\s*:\s*\[\s*"nodejs_compat"\s*\]/);
    expect(wrangler).toMatch(/"name"\s*:\s*"suanlihaiyang-web"/);
  });

  it('open-next.config.ts 用默认 defineCloudflareConfig（本期不上 R2 增量缓存）', () => {
    const cfg = readWeb('open-next.config.ts');
    expect(cfg).toMatch(/import \{ defineCloudflareConfig \} from '@opennextjs\/cloudflare'/);
    expect(cfg).toMatch(/export default defineCloudflareConfig\(\)/);
  });

  it('build 脚本保持 next build（OpenNext 内部调用，写成 build:cf 即无限递归）', () => {
    expect(pkg.scripts.build).toBe('next build');
  });

  it('build:cf 注入 DEPLOY_TARGET=cloudflare（standalone 条件化开关）；preview/deploy 单点复用', () => {
    expect(pkg.scripts['build:cf']).toMatch(/^DEPLOY_TARGET=cloudflare opennextjs-cloudflare build$/);
    expect(pkg.scripts.preview).toMatch(/^pnpm run build:cf && wrangler dev$/);
    expect(pkg.scripts.deploy).toMatch(/^pnpm run build:cf && wrangler deploy$/);
  });

  it('packageManager 固定 pnpm@10（CF Builds 兼容，参考文档踩坑 1）', () => {
    expect(pkg.packageManager).toBe('pnpm@10.11.1');
  });

  it('devDeps 含 @opennextjs/cloudflare 与 wrangler；esbuild/workerd 构建脚本放行', () => {
    expect(Object.keys(pkg.devDependencies)).toContain('@opennextjs/cloudflare');
    expect(Object.keys(pkg.devDependencies)).toContain('wrangler');
    expect(pkg.pnpm.onlyBuiltDependencies).toEqual(
      expect.arrayContaining(['esbuild', 'workerd']),
    );
  });

  it('.node-version = 22（Wrangler 4 要求 ≥22，参考文档踩坑 2）', () => {
    expect(readWeb('.node-version').trim()).toBe('22');
  });

  it('public/_headers：/_next/static/* immutable 长缓存', () => {
    const headers = readWeb(path.join('public', '_headers'));
    expect(headers).toMatch(/\/_next\/static\/\*/);
    expect(headers).toMatch(/max-age=31536000/);
    expect(headers).toMatch(/immutable/);
  });

  it('web/.gitignore 排除 .open-next 构建产物（web 独立仓库，规则随库走）', () => {
    const gi = readWeb('.gitignore');
    expect(gi).toMatch(/^\.open-next\/$/m);
  });

  it('.env.example 留档 CF 构建期变量与 webhook 公网目标说明', () => {
    const envExampleWeb = readWeb('.env.example');
    expect(envExampleWeb).toContain('SITE_URL=<门户公网地址');
    expect(envExampleWeb).toContain('STRAPI_URL=https://top-slhy.fintechquan.cn');
    // 生产域名换回说明与 webhook 公网目标留档
    expect(envExampleWeb).toContain('admin.suanlihaiyang.com');
    expect(envExampleWeb).toContain('https://suanlihaiyang.com/api/revalidate');
  });
});
