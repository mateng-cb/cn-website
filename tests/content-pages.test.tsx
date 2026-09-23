import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionRenderer } from '@/components/SectionRenderer';
import { MediaPanel } from '@/components/elements/MediaPanel';
import type { LandingPageData, MediaPanelData, SectionData, StrapiPage } from '@/types/strapi';
import services from '../../content-seed/content/services.json';
import industry from '../../content-seed/content/industry.json';
import resources from '../../content-seed/content/resources.json';
import alliance from '../../content-seed/content/alliance.json';
import government from '../../content-seed/content/government.json';
import whitepaper from '../../content-seed/content/whitepaper.json';

// generateMetadata 用例只替换 getPage/getSiteConfigMain（09 号起 metadata 层
// 需站点默认 OG 图回退）；strapiMediaUrl 等保持真实实现供渲染用例使用。
// getLandingPage/getMainNavPages：[slug] 路由 2026-09-23 起 landing 回退链
// 与全局件取数（actual 会发真实 fetch，路由级用例必须 mock）
vi.mock('@/lib/strapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/strapi')>();
  return {
    ...actual,
    getPage: vi.fn(),
    getLandingPage: vi.fn(),
    getMainNavPages: vi.fn(),
    getSiteConfigMain: vi.fn(),
  };
});

/**
 * 主测试缝：03 号工单五个内容页（fixture 单一源 = content-seed/content/*.json）。
 * 覆盖：hero content 变体与右栏三种 kind、card-grid 四种内容页 layout、
 * split-media dark(agent-visual)/showcase 形态、cta-band anchor 与表单链接。
 */
const pages = {
  services: services.pages[0],
  industry: industry.pages[0],
  resources: resources.pages[0],
  alliance: alliance.pages[0],
  government: government.pages[0],
} as unknown as Record<string, StrapiPage>;

const GLOBAL_FORM_URL = 'https://kezhishuzi.cn/share/shrwhp27dzKJiSAGg0r46/fomNuUm3g8HqL4gulr';

function renderPage(slug: keyof typeof pages) {
  render(
    <SectionRenderer sections={pages[slug].sections as SectionData[]} formUrl={GLOBAL_FORM_URL} />,
  );
}

describe('SEO 字段（v0.3 各页 head 搬运，主接缝断言）', () => {
  it.each(Object.entries(pages))('%s：title 与 description 与现网一致', (slug, page) => {
    expect(page.seo?.title).toBeTruthy();
    expect(page.seo?.description).toBeTruthy();
    // 抽验两页完整值，其余只验非空（完整值由 generateMetadata 集成验证）
    if (slug === 'services') {
      expect(page.seo?.title).toBe('出海服务｜中国算力与AI应用海外落地｜算力海洋');
      expect(page.seo?.description).toBe(
        '算力海洋为企业提供算力与AI应用出海服务，覆盖资源梳理、产品包装、市场进入、区域伙伴连接与项目推进，助力稳健走向海外。',
      );
    }
  });
});

describe('/services：hero content 变体 + detail 卡（含 label 与裸 list）', () => {
  it('content-hero 类与 govCard 服务对象清单', () => {
    renderPage('services');
    expect(document.querySelector('section.hero')?.className).toContain('content-hero');
    expect(screen.getByText('服务对象').tagName).toBe('H3');
    expect(screen.getByText('海外园区、渠道与交付伙伴').tagName).toBe('LI');
    // 服务对象两列图标卡：ul.cards 五张卡、icon 空按顺序取 public 本地默认图
    const cards = document.querySelector('.gov-card ul.cards');
    expect(cards).toBeTruthy();
    expect(cards?.querySelectorAll('li')).toHaveLength(5);
    const icons = Array.from(cards?.querySelectorAll('img') ?? []).map((m) =>
      m.getAttribute('src'),
    );
    expect(icons).toEqual([
      '/bank-fill.png',
      '/jiguihang.png',
      '/yunfuwu.png',
      '/robot-3-fill.png',
      '/wangluo.png',
    ]);
  });

  it('hero 按钮引页面专属表单链接（非全局 formUrl）', () => {
    renderPage('services');
    // footerAction 尾按钮同名同链，排除后取 hero 按钮本体
    const link = screen
      .getAllByRole('link', { name: '出海服务咨询' })
      .find((b) => !b.closest('.grid-footer-cta'));
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(
      'https://kezhishuzi.cn/share/shrFS3F4xBaBd93F89nZW/fomiWyg52NfFRSErK9',
    );
  });

  it('六类服务网格下方尾按钮（footerAction）：外链开新窗 + primary 形态', () => {
    renderPage('services');
    // hero 按钮与网格尾按钮同名同链，各出现一次
    const buttons = screen.getAllByRole('link', { name: '出海服务咨询' });
    expect(buttons).toHaveLength(2);
    const footer = buttons.find((b) => b.closest('.grid-footer-cta'));
    expect(footer).toBeTruthy();
    expect(footer?.getAttribute('href')).toBe(
      'https://kezhishuzi.cn/share/shrFS3F4xBaBd93F89nZW/fomiWyg52NfFRSErK9',
    );
    expect(footer?.getAttribute('target')).toBe('_blank');
    expect(footer?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(footer?.className).toBe('primary');
  });

  it('detail-grid 六卡：label 标签 + 裸 ul 列表（无 checks 类）', () => {
    renderPage('services');
    const grid = document.querySelector('.detail-grid');
    expect(grid).toBeTruthy();
    expect(grid?.querySelectorAll('article.detail-card')).toHaveLength(6);
    expect(screen.getByText('GOVERNMENT').tagName).toBe('SPAN');
    const list = screen.getByText('区域资源盘点').closest('ul');
    expect(list?.className).toBe(''); // 裸 ul：v0.3 detail-card 内 18px 缩进圆点
  });
});

describe('/industry：layer-stack 序号 + agent-visual 深色分栏 + screen 面板', () => {
  it('layer 卡序号「01 / 第一层」由前端渲染（2.0 PRD 3.1 层名），footnote 结论行在卡尾', () => {
    renderPage('industry');
    expect(screen.getByText('01 / 第一层')).toBeTruthy();
    expect(screen.getByText('04 / 第四层')).toBeTruthy();
    // 「IDC 产业」在 logo-wall 分组卡 title 也出现（3.3 设计稿同源文案），
    // 限定 layer-stack 容器内取卡
    const layerCard = Array.from(document.querySelectorAll('.layer-stack h3'))
      .find((h) => h.textContent === 'IDC 产业')
      ?.closest('article');
    expect(layerCard).toBeTruthy();
    expect(layerCard?.querySelector('b')?.textContent).toBe('让项目有稳定承载');
  });

  it('theme=dark 渲染独立 agent-visual 结构（非 .section>.split 包裹）', () => {
    renderPage('industry');
    const visual = document.querySelector('section.agent-visual');
    expect(visual).toBeTruthy();
    expect(visual?.querySelector('.split')).toBeNull();
  });

  it('screen 面板：标题条双 span + miniItems 六格', () => {
    renderPage('industry');
    expect(screen.getByText('AI 应用出海服务台')).toBeTruthy();
    expect(screen.getByText('应用展示 · 资源适配 · 需求对接')).toBeTruthy();
    expect(document.querySelectorAll('.agent-apps article')).toHaveLength(6);
    expect(screen.getByText('企业 AI 助手').tagName).toBe('B');
  });

  it('页尾 cta 缺省 anchor=contact，按钮走全局 formUrl', () => {
    renderPage('industry');
    expect(document.getElementById('contact')).toBeTruthy();
    expect(screen.getByRole('link', { name: '预约项目沟通' }).getAttribute('href')).toBe(
      GLOBAL_FORM_URL,
    );
  });
});

describe('/resources：showcase 右栏 + hero-detail + inquiry 锚点', () => {
  it('hero detail 字段渲染为 hero-detail，右栏为轮播（2.0 PRD 5.1：showcase 改 carousel，seed 两张占位）', () => {
    renderPage('resources');
    expect(
      screen.getByText(/不直接承诺资源库存/).closest('p')?.className,
    ).toBe('hero-detail');
    // 多张轮播：容器带 hero-carousel 类，全部 slide 的 img 均在场（首帧 active）
    const card = document.querySelector('.hero-image-card.hero-carousel');
    expect(card).toBeTruthy();
    expect(card?.querySelectorAll('.hero-slides img')).toHaveLength(2);
    expect(card?.querySelectorAll('.hero-dots button')).toHaveLength(2);
    expect(screen.getByText('全球 IDC 数据库 · 科智集团')).toBeTruthy();
  });

  it('cta anchor=inquiry 且 formUrlOverride 覆写全局表单（hero 按钮同链）', () => {
    renderPage('resources');
    expect(document.getElementById('inquiry')).toBeTruthy();
    // 「提交资源需求」在 hero actions 与 cta 按钮各出现一次，均指向页面专属表单
    const links = screen.getAllByRole('link', { name: '提交资源需求' });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute('href')).toBe(
        'https://kezhishuzi.cn/share/shri3HNRf6akkzX5ySEzj/fom1vp8b2uF038hT6A',
      );
    }
  });
});

describe('/alliance：gov-card 尾链 + tint 四卡 + deliverable 行 + join 锚点', () => {
  it('事件卡（eventCard 专用 kind）：封面置卡内最顶、无 ul，尾链「查看全部动态」指 /news（站内不开新窗）', () => {
    renderPage('alliance');
    // eventCard 与 govCard 定界拆分（2026-09-21）：事件卡独有「最顶封面 + 无清单」
    // 形态（占位复用现有 media，正式图后台上传替换）；govCard 多页共用行为不受波及
    const card = document.querySelector('.hero .gov-card');
    expect(card).toBeTruthy();
    expect(card?.className).toBe('gov-card');
    expect(card?.firstElementChild?.className).toBe('gov-card-cover');
    expect(card?.querySelector('ul')).toBeNull();
    // 「查看全部动态 →」与下方 news 区块尾链同名，限定 gov-card 容器内取
    const link = card?.querySelector('a');
    expect(link?.textContent).toBe('查看全部动态 →');
    expect(link?.getAttribute('href')).toBe('/news');
    expect(link?.getAttribute('target')).toBeNull();
  });

  it('hero 按钮锚点 #join 与 cta anchor=join 呼应', () => {
    renderPage('alliance');
    expect(screen.getByRole('link', { name: '加入伙伴共同体' }).getAttribute('href')).toBe(
      '#join',
    );
    expect(document.getElementById('join')).toBeTruthy();
  });

  it('tint 四卡与 deliverable-row 各就位', () => {
    renderPage('alliance');
    expect(document.querySelector('section.section.tint .four')).toBeTruthy();
    expect(document.querySelectorAll('.deliverable-row article')).toHaveLength(4);
  });

  it('govCard 传图也不渲染封面（image 仅 eventCard 参与——多页共用数据卡行为不受事件卡波及）', () => {
    render(
      <MediaPanel
        panel={
          {
            __component: 'elements.media-panel',
            kind: 'govCard',
            eyebrow: 'EYEBROW',
            title: '数据卡标题',
            image: { url: '/placeholder.webp', alternativeText: null },
            checks: { items: [{ text: '清单条目' }] },
          } as unknown as MediaPanelData
        }
      />,
    );
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('清单条目').tagName).toBe('LI');
  });

  it('最新动态区块（2.0 PRD 7.1）：cta-band 前就位 + 「查看全部动态」尾链指 /news', () => {
    renderPage('alliance');
    // hero gov-card 尾链与此同名（07 号后联盟页两处「查看全部动态」），限定 news 区块尾链
    const more = document.querySelector('#news .news-more a');
    expect(more?.textContent).toBe('查看全部动态 →');
    expect(more?.getAttribute('href')).toBe('/news');
    // news 数据由页面层 enrich 注入，纯渲染测试下列表空、尾链仍在
    const newsSection = more?.closest('section');
    expect(newsSection?.id).toBe('news');
    // 位于 cta-band 之前（sections 序：deliverable → news → cta-band）
    const sections = [...document.querySelectorAll('section')];
    const newsIdx = sections.findIndex((s) => s.id === 'news');
    const ctaIdx = sections.findIndex((s) => s.id === 'join');
    expect(newsIdx).toBeGreaterThan(-1);
    expect(ctaIdx).toBeGreaterThan(newsIdx);
  });
});

describe('/government：numbered 六卡（序号不入库）+ split showcase + cooperate 锚点', () => {
  it('cooperation-six 序号 01-06 由前端渲染，section 为 tint', () => {
    renderPage('government');
    const cards = document.querySelectorAll('.cooperation-six article');
    expect(cards).toHaveLength(6);
    expect(cards[0].querySelector('b')?.textContent).toBe('01');
    expect(cards[5].querySelector('b')?.textContent).toBe('06');
    expect(cards[0].closest('section')?.className).toBe('section tint');
  });

  it('hero gov-card 为「政府园区合作总览」（2.0 PRD 2.1：多园区总览，华侨数港入口移交 split-media）', () => {
    renderPage('government');
    expect(screen.getByText('政府园区合作总览').tagName).toBe('SPAN');
    expect(screen.getByText('与多个政府园区建立合作').tagName).toBe('LI');
    // 总览卡无尾链——华侨数港子模块入口由 split-media「了解华侨数港」承载（下例）
    expect(document.querySelector('.hero .gov-card a')).toBeNull();
  });

  it('split 左栏 checks 样式与右侧 showcase 图', () => {
    renderPage('government');
    expect(screen.getByText(/企业落地：工商、银行/).closest('ul')?.className).toBe('checks');
    expect(document.querySelector('.split .resource-showcase img')).toBeTruthy();
    expect(screen.getByRole('link', { name: '了解华侨数港' }).getAttribute('href')).toBe(
      '/huaqiao',
    );
  });

  it('cta anchor=cooperate，按钮走全局 formUrl（同首页）', () => {
    renderPage('government');
    expect(document.getElementById('cooperate')).toBeTruthy();
    expect(screen.getByRole('link', { name: '预约项目沟通' }).getAttribute('href')).toBe(
      GLOBAL_FORM_URL,
    );
  });
});

describe('generateMetadata（[slug] 路由 SEO 管道）', () => {
  it('从 Page.seo 派生 title 与 description', async () => {
    const { getPage } = await import('@/lib/strapi');
    vi.mocked(getPage).mockResolvedValue(pages.government);
    const { generateMetadata } = await import('@/app/[slug]/page');
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'government' }) });
    expect(meta.title).toBe('政府园区合作｜区域算力与AI出海服务载体｜算力海洋');
    expect(meta.description).toBe(pages.government.seo?.description);
  });

  it('页面不存在时返回空 meta（配合 notFound）', async () => {
    const { getPage, getLandingPage } = await import('@/lib/strapi');
    vi.mocked(getPage).mockResolvedValue(null);
    vi.mocked(getLandingPage).mockResolvedValue(null);
    const { generateMetadata } = await import('@/app/[slug]/page');
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'nope' }) });
    expect(meta).toEqual({});
  });
});

describe('[slug] 路由 landing 回退链（2026-09-23：运营自建专题落地页直挂根路径）', () => {
  /** fixture：白皮书 landing（slug 换非 whitepaper 模拟运营新建，静态段不拦截；
   *  id/documentId 为 Strapi 运行时字段，seed JSON 不含，测试补齐过类型） */
  const landingFixture = {
    ...whitepaper.landingPages[0],
    id: 1,
    documentId: 'summit-2026',
    slug: 'summit-2026',
  } as LandingPageData;

  it('Page 未命中 → landing 承接：generateMetadata 从 landing.seo 派生', async () => {
    const { getPage, getLandingPage } = await import('@/lib/strapi');
    vi.mocked(getPage).mockResolvedValue(null);
    vi.mocked(getLandingPage).mockResolvedValue(landingFixture);
    const { generateMetadata } = await import('@/app/[slug]/page');
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'summit-2026' }) });
    expect(meta.title).toBe(landingFixture.seo?.title ?? landingFixture.title);
    expect(meta.alternates?.canonical).toBe('http://localhost:3001/summit-2026');
  });

  it('Page 未命中 → landing 承接：渲染 LandingChrome（.landing 容器）', async () => {
    const { getPage, getLandingPage, getMainNavPages, getSiteConfigMain } = await import(
      '@/lib/strapi'
    );
    vi.mocked(getPage).mockResolvedValue(null);
    vi.mocked(getLandingPage).mockResolvedValue(landingFixture);
    vi.mocked(getMainNavPages).mockResolvedValue([]);
    vi.mocked(getSiteConfigMain).mockResolvedValue(null);
    const { default: ContentPage } = await import('@/app/[slug]/page');
    render(await ContentPage({ params: Promise.resolve({ slug: 'summit-2026' }) }));
    expect(document.querySelector('.landing')).toBeTruthy();
    expect(document.querySelector('.site-nav')).toBeNull(); // landing 专题页不走主站全局件
  });

  it('Page 命中时 landing 查询不干扰：仍走 MainChrome', async () => {
    const { getPage, getLandingPage, getMainNavPages, getSiteConfigMain } = await import(
      '@/lib/strapi'
    );
    vi.mocked(getPage).mockResolvedValue(pages.government);
    vi.mocked(getLandingPage).mockResolvedValue(landingFixture); // 同 slug landing 也在
    vi.mocked(getMainNavPages).mockResolvedValue([]);
    vi.mocked(getSiteConfigMain).mockResolvedValue(null);
    const { default: ContentPage } = await import('@/app/[slug]/page');
    render(await ContentPage({ params: Promise.resolve({ slug: 'government' }) }));
    expect(document.querySelector('.site-nav')).toBeTruthy();
    expect(document.querySelector('.landing')).toBeNull();
  });
});
