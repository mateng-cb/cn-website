/** Strapi REST 返回的媒体对象（populate 指到 media 字段时） */
export interface StrapiMedia {
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number;
  height?: number;
  mime: string;
}

export interface SectionHeadData {
  eyebrow?: string | null;
  heading: string;
  lead?: string | null;
  align?: 'center' | 'left' | null;
}

export interface ActionData {
  id?: number;
  label: string;
  type?: 'primary' | 'secondary' | 'outline' | null;
  /** cta-band 场景可空（默认引全局 formUrl），其余区块必填语义由 seed 保证 */
  url?: string | null;
}

export interface MetaRowData {
  id?: number;
  label: string;
  text: string;
}

export interface BadgeData {
  id?: number;
  text: string;
}

export interface KvRowData {
  id?: number;
  key: string;
  value: string;
}

export interface TermItemData {
  id?: number;
  term?: string | null;
  text?: string | null;
  /** 列表项图标（cards 两列图标卡形态用，空显示占位块） */
  icon?: StrapiMedia | null;
}

export interface ListData {
  style?: 'plain' | 'diamond' | 'numbered' | 'check' | 'cards' | null;
  items: TermItemData[];
}

/** elements.slide：carousel 面板单张轮播图（2.0 PRD 1.2/5.1） */
export interface SlideData {
  id?: number;
  image: StrapiMedia;
  caption?: string | null;
}

export interface MediaPanelData {
  kind:
    | 'image'
    | 'imageCard'
    | 'carousel'
    | 'showcase'
    | 'govCard'
    | 'eventCard'
    | 'screen'
    | 'cover'
    | 'panel'
    | 'compliance';
  image?: StrapiMedia | null;
  /** carousel 专属（kind='carousel'）：1-5 张轮播 + 自动轮播间隔两档 */
  slides?: SlideData[] | null;
  interval?: '2000' | '3000' | null;
  eyebrow?: string | null;
  title?: string | null;
  caption?: string | null;
  kvRows?: KvRowData[] | null;
  miniItems?: MetaRowData[] | null;
  checks?: ListData | null;
  /** gov-card 尾链（alliance 报道外链 / government 进入子站） */
  link?: string | null;
  ctaText?: string | null;
  linkPrimary?: boolean | null;
}

/** sections.hero 组件实例（动态区元素带 __component 标记） */
export interface HeroData {
  __component: 'sections.hero';
  head?: SectionHeadData | null;
  eyebrow?: string | null;
  /** 内联富文本（<br /> / <em>），渲染时直接注入 */
  heading?: string | null;
  lead?: string | null;
  detail?: string | null;
  metaRows?: MetaRowData[] | null;
  actions?: ActionData[] | null;
  badges?: BadgeData[] | null;
  rightPanel?: MediaPanelData | null;
  /** home=首页大图形态，content=内容页形态（v0.3 .content-hero），
   *  cover=白皮书封面形态（06 号：右栏配 media-panel kind=cover 的 CSS 书封） */
  theme?: 'home' | 'content' | 'cover' | null;
}

/** elements.logo-item：Logo 墙单项（image 空渲染公司名文字卡，2.0 PRD 3.2 占位先行） */
export interface LogoItemData {
  id?: number;
  name: string;
  image?: StrapiMedia | null;
}

/** elements.logo-group：上方小字 + 主标题 + 组内 Logo 列表（3.3 设计稿四色卡） */
export interface LogoGroupData {
  id?: number;
  label?: string | null;
  title?: string | null;
  logos?: LogoItemData[] | null;
}

/** sections.logo-wall：生态伙伴 Logo 分组卡（3.3 设计稿：区块标题 + 四色卡横排） */
export interface LogoWallData {
  __component: 'sections.logo-wall';
  head?: SectionHeadData | null;
  groups?: LogoGroupData[] | null;
}

/** elements.solution-item：折叠卡单条（logo 空渲染文字名，2.0 PRD 7.2） */
export interface SolutionItemData {
  id?: number;
  title: string;
  summary?: string | null;
  logo?: StrapiMedia | null;
  cover?: StrapiMedia | null;
  body?: string | null;
}

/** sections.solution-list：共同体核心解决方案折叠列表（原生 details/summary 零 JS） */
export interface SolutionListData {
  __component: 'sections.solution-list';
  head?: SectionHeadData | null;
  solutions?: SolutionItemData[] | null;
}

/** 02 号及后续工单向 union 追加新区块类型 */
export type SectionData =
  | HeroData
  | CardGridData
  | SignalBandData
  | ProcessFlowData
  | SplitMediaData
  | ContentGridData
  | StatStripData
  | CtaBandData
  | LogoWallData
  | SolutionListData;

/** elements.card：区块内最小内容单元（序号不入库，由前端按布局渲染） */
export interface CardData {
  id?: number;
  label?: string | null;
  icon?: StrapiMedia | null;
  tag?: string | null;
  heading: string;
  body?: string | null;
  list?: ListData | null;
  link?: string | null;
  ctaText?: string | null;
  footnote?: string | null;
}

export interface CardGridData {
  __component: 'sections.card-grid';
  head?: SectionHeadData | null;
  cards?: CardData[] | null;
  theme?: 'default' | 'tint' | 'navy' | null;
  layout?:
    | 'grid'
    | 'detail'
    | 'layer'
    | 'deliverable'
    | 'numbered'
    | 'row'
    | 'research'
    | 'benefit'
    | 'catalog'
    | 'partner'
    | null;
  columns?: 'auto' | '3' | '4' | null;
  /** 区块锚点 id（06 号：landing 极简导航锚点跳转目标，同 cta-band.anchor 先例） */
  anchor?: string | null;
  /** 网格下方居中尾按钮（2.0 PRD 4.1：services 六类服务下方「出海服务咨询」） */
  footerAction?: ActionData | null;
}

export interface SignalBandData {
  __component: 'sections.signal-band';
  head?: SectionHeadData | null;
  items?: MetaRowData[] | null;
}

export interface ProcessFlowData {
  __component: 'sections.process-flow';
  head?: SectionHeadData | null;
  steps?: CardData[] | null;
  orientation?: 'horizontal' | 'vertical' | null;
  /** 底色轴（同 card-grid/split-media）：tint → .section.tint 灰底 */
  theme?: 'default' | 'tint' | null;
}

export interface SplitMediaData {
  __component: 'sections.split-media';
  head?: SectionHeadData | null;
  lead?: string | null;
  checks?: ListData | null;
  actions?: ActionData[] | null;
  rightPanel?: MediaPanelData | null;
  theme?: 'default' | 'tint' | 'dark' | null;
}

export interface ContentGridData {
  __component: 'sections.content-grid';
  head?: SectionHeadData | null;
  kind?: 'insight' | 'publication' | 'news' | 'insightList' | null;
  cards?: CardData[] | null;
  featured?: boolean | null;
  linkCards?: boolean | null;
  newsLimit?: number | null;
  /**
   * kind=news 的运行时数据（页面层 enrichSections 注入，非 CMS 字段）：
   * 数据获取留在页面（server）层，组件保持纯同步展示——jsdom 测试零 mock。
   */
  news?: NewsData[] | null;
  /** kind=insightList 的运行时数据（2.0 PRD 6.1，注入语义同 news） */
  insights?: InsightEntryData[] | null;
  /** kind=news 区块尾链（2.0 PRD 7.1「查看全部动态」→ /news） */
  moreLabel?: string | null;
  moreUrl?: string | null;
  /**
   * kind=news 布局（运行时开关，非 CMS 字段）：缺省 grid 三卡（CMS 区块
   * 预览形态）；/news 列表页传 rows——一行一条行式列表（2026-09-21 用户指定）
   */
  newsLayout?: 'grid' | 'rows' | null;
}

export interface StatItemData {
  id?: number;
  value: string;
  label: string;
}

export interface StatStripData {
  __component: 'sections.stat-strip';
  head?: SectionHeadData | null;
  stats?: StatItemData[] | null;
}

export interface CtaBandData {
  __component: 'sections.cta-band';
  head?: SectionHeadData | null;
  eyebrow?: string | null;
  heading?: string | null;
  text?: string | null;
  buttons?: ActionData[] | null;
  tip?: string | null;
  formUrlOverride?: string | null;
  /** 锚点 id，缺省 contact（resources=inquiry / alliance=join / government=cooperate） */
  anchor?: string | null;
}

/**
 * site-config-main single type（02 号工单起 cta-band 引用 formUrl；08 号工单扩
 * 导航 CTA 默认（formCtaLabel）与页脚：footerTagline 品牌区副标语、
 * contactEmails 联系邮箱组、footerLinks 快速入口、companyName 公司全称、
 * icpBeian 备案号、footerNoticeDefault 免责默认——对照 v0.3/index.html
 * footer 逐元素，非凭空字段）。
 */
export interface SiteConfigMainData {
  siteName?: string | null;
  siteTagline?: string | null;
  formUrl?: string | null;
  /** 站点默认 OG 图（09 号工单：页面未配 seo.ogImage 时的回退，PNG 社交卡） */
  ogImageDefault?: StrapiMedia | null;
  formCtaLabel?: string | null;
  footerTagline?: string | null;
  contactEmails?: ContactEmailData[] | null;
  footerLinks?: FooterLinkData[] | null;
  companyName?: string | null;
  icpBeian?: string | null;
  footerNoticeDefault?: string | null;
}

/** shared.footer-link：site-config 页脚链接组条目（08 号起 url 可空=纯文本占位项） */
export interface FooterLinkData {
  id?: number;
  label: string;
  url?: string | null;
}

/** shared.contact-email：主站页脚联系我们邮箱条目（渲染为 mailto） */
export interface ContactEmailData {
  id?: number;
  email: string;
}

/**
 * site-config-hq single type（05 号工单）：子站全局件配置——政务顶条
 * （siteTagline + backLabel/backUrl 返回主站）、品牌（logo + siteName +
 * companyName 公司全称）、页脚链接组（footerLinks）与默认免责
 * （footerNoticeDefault，页面级 disclaimer 优先）、全局表单链接 formUrl。
 */
export interface SiteConfigHqData {
  siteName?: string | null;
  siteTagline?: string | null;
  companyName?: string | null;
  logo?: StrapiMedia | null;
  /** 站点默认 OG 图（09 号工单：页面未配 seo.ogImage 时的回退，PNG 社交卡） */
  ogImageDefault?: StrapiMedia | null;
  backLabel?: string | null;
  backUrl?: string | null;
  formUrl?: string | null;
  formCtaLabel?: string | null;
  footerLinks?: FooterLinkData[] | null;
  footerNoticeDefault?: string | null;
}

/** 子站导航项（Page 集合 site=hq 派生，slug 前缀归路由层拼装） */
export interface HqNavItem {
  slug: string;
  navTitle: string;
}

/**
 * 主站导航项（08 号工单，getMainNavPages 返回的平铺可见集合）：
 * navTitle 已回退 title；navParentSlug 为 populate 的父页 slug，
 * 不在可见集合（被删/隐藏/未发布）时由 buildMainNavTree 降级一级。
 */
export interface MainNavItem {
  slug: string;
  navTitle: string;
  navOrder?: number | null;
  navParentSlug?: string | null;
}

/** 主站导航树节点（buildMainNavTree 产物，children 为二级下拉项） */
export interface MainNavNode {
  slug: string;
  navTitle: string;
  /** 主站单级 slug：home → /，其余 /slug */
  url: string;
  children: MainNavNode[];
}

/**
 * News 集合（04 号工单）：externalUrl 二态——有值列表卡直跳外链，无值进 /news/[slug]。
 * draftAndPublish:false + 自建 publishDate（datetime）：排序值由内容侧显式控制
 * （publishedAt 是 Strapi 保留字段，create/PUT 会被覆写为操作时刻，故字段名避开）；
 * 草稿能力 07 号工单再议。displayDate 为列表卡时间槽的显示覆盖
 * （v0.3 第三条卡 time 为「研究合作开放中」非日期）。
 */
export interface NewsData {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  cover?: StrapiMedia | null;
  excerpt?: string | null;
  body?: string | null;
  category?: 'report' | 'event' | 'coverage' | null;
  externalUrl?: string | null;
  /** 2.0 PRD 7.1：动态发生地（列表卡 time 槽「时间 · 地点」） */
  location?: string | null;
  displayDate?: string | null;
  publishDate?: string | null;
}

export interface SeoData {
  title?: string | null;
  description?: string | null;
  ogImage?: StrapiMedia | null;
  noindex?: boolean | null;
}

/**
 * 洞察内容集合（2.0 PRD 6.1）：category ASCII 枚举，中文文案映射在 web 端
 * 常量（ContentGrid）；draftAndPublish:false 保存即生效，缓存口径同 news
 * （force-cache + tag 'strapi'，INSTANT_UIDS 已登记保证保存即失效）。
 */
export interface InsightEntryData {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  category?: 'whitepaper' | 'market' | 'standard' | 'certification' | null;
  excerpt?: string | null;
  link?: string | null;
  publishDate?: string | null;
}

export interface StrapiPage {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  site: 'main' | 'hq';
  sections: SectionData[];
  navTitle?: string | null;
  navOrder?: number | null;
  navHidden?: boolean | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  disclaimer?: string | null;
  seo?: SeoData | null;
  publishedAt?: string | null;
  locale?: string | null;
}

/**
 * landing-page 集合（06 号工单）：白皮书等营销专题页。
 * sections 纯拼装（8 区块复用 Page 同一注册表）；navSimple=true 时
 * LandingChrome 渲染极简导航（brand + navLinks 锚点 + ctaLabel/ctaUrl 获取按钮），
 * navLinks 锚点目标由各区块自身 anchor 字段承担（card-grid/cta-band）。
 */
export interface LandingPageData {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  site: 'main' | 'hq';
  navSimple?: boolean | null;
  navLinks?: FooterLinkData[] | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  disclaimer?: string | null;
  sections: SectionData[];
  seo?: SeoData | null;
  publishedAt?: string | null;
  locale?: string | null;
}
