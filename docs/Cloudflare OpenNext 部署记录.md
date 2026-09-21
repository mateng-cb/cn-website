# Cloudflare OpenNext 部署记录（Next.js 16 App Router）

本文记录 `dt-expo-international`（CircleMeet 国际版前台）部署到 Cloudflare Workers 时的配置，以及本次实际上线踩坑项。  
技术路径为 **`@opennextjs/cloudflare`（OpenNext）**，不是已废弃的 `@cloudflare/next-on-pages`。

对照旧项目 `slhy-website`《Cloudflare Pages 部署记录》：该记录面向 Next.js 14 Pages Router + Pages；本仓库为 Next.js 16 App Router，官方适配已切换到 Workers + OpenNext。

创建 Worker 时选 **Create Worker → Continue with GitHub**，不要点底部「想要部署 Pages?」。

## 为什么选 Worker 而不是 Pages？为什么 Next 14 用 Pages、现在 16 用 Worker？

核心结论：**不是 Cloudflare 故意削弱 Pages，而是「跑 Next.js 的适配器」换代了**——旧适配器挂在 Pages 上且已废弃；新适配器挂在 Workers 上，才是 Next 16 的官方路径。

### 1. 先分清三个概念

| 概念 | 是什么 | 和本次的关系 |
| --- | --- | --- |
| **Cloudflare Pages** | 偏「站点托管」产品：连 Git、静态资源、预览域名；历史上用 **Pages Functions** 跑边缘函数 | `slhy-website`（Next 14）走这条 |
| **Cloudflare Workers** | 通用边缘计算运行时：可跑完整请求处理、绑定 KV/R2/D1 等 | 本仓库（Next 16 + OpenNext）走这条 |
| **适配器（adapter）** | 把 Next.js 的构建产物「翻译」成 Cloudflare 能执行的格式 | 真正决定你该选 Pages 还是 Worker |

也就是说：控制台选 Pages 还是 Worker，取决于 **当前官方适配器部署到哪一侧**，不是「Next 大版本号本身规定必须用某个产品名」。

### 2. Next 14 时代为什么用 Pages？

当时 Cloudflare 官方给 Next.js（尤其 Pages Router + SSR）的路径是：

- 适配器：`@cloudflare/next-on-pages`
- 托管面：Cloudflare **Pages**
- 构建：`npx @cloudflare/next-on-pages@1`，输出到 `.vercel/output/static` 一类目录
- 运行时约束：页面侧大量使用 **Edge Runtime**（如 `export const runtime = 'experimental-edge'`）
- 兼容性：需要 `nodejs_compat` 等标志

`slhy-website`《Cloudflare Pages 部署记录》整份就是按这条路径落地的，所以 Next 14 项目「选 Pages」是正确、也是当时唯一成熟的选择。

### 3. 为什么这条路径不能继续给 Next 16 用？

1. **`@cloudflare/next-on-pages` 已废弃**  
   Cloudflare / 社区明确转向新方案；旧适配器不再跟进新 Next 大版本特性。

2. **Next 16（App Router）能力超出旧 Edge 适配模型**  
   App Router、更完整的 Node.js API 面、流式渲染、缓存语义等，更适合在 **Workers + Node.js 兼容运行时** 上跑，而不是继续塞进 next-on-pages 那套 Edge 约束。

3. **官方新路径是 OpenNext → Workers**  
   - 适配器：`@opennextjs/cloudflare`  
   - 部署：`wrangler` / Workers Builds  
   - 运行时：Next 的 **Node.js runtime**（在 Workers 上靠 `nodejs_compat` 等提供 Node API）  
   - 文档与脚手架（如 `npm create cloudflare -- --framework=next`）默认指向 **Workers**，不再推荐 Pages + next-on-pages

因此：不是「Next 16 不能部署到 Cloudflare」，而是 **不能再按 Next 14 那套 Pages 向导去部署 Next 16**。

### 4. Worker 是否功能比 Pages「少」？

对本次 Next 站点来说，**不少功能，入口换了**：

| 能力 | Pages（旧 next-on-pages） | Workers（OpenNext） |
| --- | --- | --- |
| 环境变量 / Secrets | 有 | 有（Worker 设置或 wrangler） |
| 自定义域名 | 有 | 有（Worker → 自定义域） |
| Git 自动构建 | Pages 很顺手 | Workers Builds / GitHub Actions |
| SSR / 中间件 / App Router | 受 Edge 适配限制 | OpenNext 面向完整 Next（Node runtime） |
| KV / R2 / D1 等绑定 | 可配，但旧适配器场景受限 | Workers 一等公民 |

旧印象里「Pages 才能配环境变量、Worker 很裸」已经过时；当前缺口主要是 **操作习惯和菜单位置**，不是能力缺失。

### 5. 和本仓库的对应关系

| 项目 | Next | 适配器 | 控制台应选 |
| --- | --- | --- | --- |
| `slhy-website` | 14 Pages Router | `@cloudflare/next-on-pages`（历史） | **Pages** |
| `dt-expo-international` | 16 App Router + next-intl | `@opennextjs/cloudflare` | **Worker** |

若强行对 Next 16 仍选 Pages + next-on-pages：高概率构建失败、Edge 运行时不兼容、或官方不再维护导致后续升级无路。  
若选 Worker + OpenNext：与 Cloudflare 现行文档一致，也是本仓库 `wrangler.jsonc` / `pnpm deploy` 已落地的路径。

### 6. 一句话记忆

- **Next 14 + 旧文档 → Pages**：因为当时适配器就叫 next-on-pages，产物挂在 Pages。  
- **Next 16 + 现文档 → Worker**：因为适配器换成 OpenNext，产物挂在 Workers。  
- 选的是 **适配器世代**，不是「Worker 比 Pages 高级」或「Pages 被淘汰到不能托管静态站」——静态站仍可用 Pages；**带完整 Next SSR 的 16 应用，官方已转到 Worker**。

## Cloudflare 配置

| 配置项 | 值 |
| --- | --- |
| 部署目标 | Cloudflare **Workers**（OpenNext） |
| 框架 / 适配器 | `@opennextjs/cloudflare` |
| 本地 / CI 构建 | `pnpm exec opennextjs-cloudflare build` 或 `pnpm run deploy` |
| Worker 名称 | `dt-expo-international`（见 `wrangler.jsonc`） |
| Node.js 版本 | 22（`.node-version`；Wrangler 4 要求 ≥ 22，勿再用 20） |
| 包管理器 | `pnpm@10.11.1`（`package.json` 的 `packageManager` 字段；lockfile 须与 CI pnpm 10 兼容） |
| 兼容性标志 | `nodejs_compat`（`wrangler.jsonc` 已声明；控制台生产/预览也需具备） |

**不要**使用以下旧 Pages 路径：

- 构建命令 `npx @cloudflare/next-on-pages@1`
- 输出目录 `.vercel/output/static`
- 页面级 `export const runtime = 'experimental-edge'`（OpenNext 使用 Node.js runtime）

未设置 `nodejs_compat` 时会出现：

```text
Node.JS Compatibility Error
no nodejs_compat compatibility flag set
```

## 环境变量

生产域名约定：

| 角色 | 域名 |
| --- | --- |
| 门户 | `https://eventnovas.com` |
| 用户中心 | `https://user.eventnovas.com` |
| 管理端 | `https://top.eventnovas.com` |
| 国际 API | `https://api-expo.eventnovas.com` |

| 变量 | 生产值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://eventnovas.com` | `metadataBase` / canonical；避免落到 `*.workers.dev` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api-expo.eventnovas.com` | 浏览器直连 API |
| `API_PROXY_TARGET` | `https://api-expo.eventnovas.com` | 服务端 / rewrite 目标 |
| `NEXT_PUBLIC_USER_CENTER_URL` | `https://user.eventnovas.com` | 登录 / 我的票入口 |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | `.eventnovas.com` | 与用户中心共享 `intl.token` |

**生产只认 Cloudflare 配置：** Workers → 设置 → 变量和机密 / Build 环境变量里配上表（`NEXT_PUBLIC_*` **必须勾选「构建时可用」**，否则会打成默认 `localhost:5174`）。  
仓库里的 `.env.production` / `.env.production.example` **不参与** CF 构建（前者 gitignore；构建脚本也不再拷贝）。本地开发继续用 `.env.development`。

后端需对门户、用户中心与管理端放行 CORS（至少 `https://eventnovas.com`、`https://user.eventnovas.com`、`https://top.eventnovas.com`），并允许凭证/Authorization。

## 代码约束（已落地）

1. locale 路由使用 `src/middleware.ts`（next-intl），不使用 Next 16 `proxy.ts`（OpenNext 对 Proxy 支持不完整）。
2. 不在中间件 / 服务端路径使用 Node-only 模块：`fs` / `path` / `child_process` / `jsdom` 等。
3. 不使用 `export const runtime = "edge"`。
4. `open-next.config.ts` 使用默认 `defineCloudflareConfig()`（本期不上 R2 增量缓存）。
5. `public/_headers` 为 `/_next/static/*` 配置长缓存。

## 本地验证

```bash
pnpm install
pnpm build
```

`pnpm build`（Next 本体构建）可在 Windows 上验证通过。

OpenNext 打包（`pnpm preview` / `pnpm deploy` / `opennextjs-cloudflare build`）在 **原生 Windows 上不完全支持**，官方建议使用 **WSL / Linux / macOS**，或在 Cloudflare Workers Builds / GitHub Actions（Linux runner）中执行。本机若出现类似：

```text
ENOENT: ... open-next.config.edge.mjs
```

请改到 WSL 或 CI 执行 OpenNext 构建，不要在原生 PowerShell 上强行打包。

可选（Linux/WSL，耗时更长，在 Workers runtime 预览）：

```bash
pnpm preview
```

一键部署到 Cloudflare（需已登录 `wrangler`，建议在 Linux/WSL/CI）：

```bash
pnpm deploy
```

Cloudflare Workers Builds 建议：

| 项 | 值 |
| --- | --- |
| Build command | `pnpm run build:cf`（即 `opennextjs-cloudflare build`） |
| Deploy command | `npx wrangler deploy` 或 `pnpm exec wrangler deploy` |
| Node.js | 22（由 `.node-version` 指定；控制台不要手动锁成 20） |

说明：平台会先自动跑一次 `pnpm install --frozen-lockfile`，构建命令里不必再写 `pnpm install`。  

**切勿**把 Cloudflare Build 设成 `pnpm run build`：`build` 必须是 `next build`，供 OpenNext 内部调用；若 `build` 也写成 `opennextjs-cloudflare build`，会无限递归。

## 自定义域绑定（eventnovas.com）

绑定入口（正确）：

1. **Workers 与 Pages** → 打开 Worker `dt-expo-international`
2. **设置 → 域和路由 / 自定义域** → 添加 `eventnovas.com`

**不是**域名下的「Workers 路由」空列表页（那是给已有 Zone 配 `域名/* → Worker` 规则用的）。

若添加自定义域时报：

```text
Hostname 'eventnovas.com' already has externally managed DNS records (A, CNAME, etc).
Delete them first or try a different hostname.
```

说明该主机名上已有冲突 DNS，需先清理再绑定：

1. Cloudflare 域名列表 → `eventnovas.com` → **配置 DNS**（不是 SSL/TLS）
2. 按需删除冲突记录后再回 Worker 添加自定义域

| 记录类型 | 名称示例 | 处理 |
| --- | --- | --- |
| A / AAAA | `eventnovas.com`（或 `@`） | **必须删除**（常见旧站/转发 IP，即冲突主因） |
| CNAME | `www` | 若 `www` 也要挂到本 Worker：**可删**；绑定成功后再在自定义域添加 `www.eventnovas.com` |
| CNAME | `_domainconnect…` | 非冲突主因，可留可删 |
| TXT | `_dmarc…` | **保留**（邮件策略，与 Worker 无关） |

删除根域名 A/CNAME 前确认旧站可下线；绑定成功后 Cloudflare 通常会自动写入指向 Worker 的新记录。DNS 生效可能需要数分钟。

## 本次踩坑记录

### 1. pnpm lockfile 与 CI 不兼容

**现象：**

```text
Ignoring not compatible lockfile at .../pnpm-lock.yaml
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

**原因：** 本地曾用 pnpm 8 生成 `lockfileVersion: '6.0'`，Cloudflare Builds 使用 pnpm 10.11.1，会忽略旧 lockfile，再按 `--frozen-lockfile` 安装即失败。

**处理：**

- 用与 CI 一致的 pnpm 10 重生成 lockfile（现为 `lockfileVersion: '9.0'`）
- `package.json` 固定 `"packageManager": "pnpm@10.11.1"`
- 本地可用 `pnpm install --frozen-lockfile` 自检

### 2. 构建成功但部署失败：Node 版本过低

**现象：** OpenNext 已 `OpenNext build complete`，随后：

```text
Executing user deploy command: npx wrangler deploy
Wrangler requires at least Node.js v22.0.0. You are using v20.20.2.
```

**原因：** Wrangler 4 要求 Node ≥ 22；仅把 Node 设为 20（或旧文档习惯）会导致「构建过、部署挂」。

**处理：**

- `.node-version` 设为 `22`
- Cloudflare 构建环境不要手动覆盖为 Node 20
- Deploy 使用 `pnpm exec wrangler deploy`（与项目内 wrangler 一致）

### 3. 构建命令重复 install

平台已自动执行 `pnpm install --frozen-lockfile`。用户构建命令写成 `pnpm install && pnpm exec opennextjs-cloudflare build` 虽不一定失败，但多余；建议构建命令只保留 OpenNext build。

### 4. 自定义域绑错入口 / DNS 冲突

见上文「自定义域绑定」。要点：

- 用 Worker 的 **自定义域**，不要只在「Workers 路由」页操作
- 先删根域名冲突 A（及需要时的 www CNAME），再添加域名
- 保留 `_dmarc` 等无关 TXT

### 5. 本机 Windows 无法完成 OpenNext 打包

见上文「本地验证」。CI（Linux）可正常完成 OpenNext bundle；原生 Windows 可能在复制 `open-next.config.edge.mjs` 时 ENOENT。

### 6. Next 对 middleware 的弃用提示

构建日志可能出现：

```text
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

本项目**仍使用** `src/middleware.ts`：OpenNext 对 Next 16 `proxy` 支持不完整。该警告可忽略，不要为消警告改回 `proxy.ts` 除非确认 OpenNext 已支持。

## 部署后检查

1. 打开 Workers 预览 / 自定义域，确认首页与主要 locale 路由可访问（如 `/en`、`/zh`）
2. 确认语言切换正常
3. 绑定 `eventnovas.com` 后，确认页面 canonical / Open Graph 域名指向 `https://eventnovas.com`

## 备注

- `@cloudflare/next-on-pages` 已废弃；本项目长期路径为 OpenNext Cloudflare
- Workers 支持控制台环境变量、Secrets、自定义域；能力不弱于旧 Pages 路径
- 若需 Git 推送自动构建，可使用 Cloudflare Workers Builds 或 GitHub Actions 调用 `pnpm run deploy` / `upload`
