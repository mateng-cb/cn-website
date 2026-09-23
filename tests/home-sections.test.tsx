import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionRenderer } from '@/components/SectionRenderer';
import { CardGrid } from '@/components/sections/CardGrid';
import { SignalBand } from '@/components/sections/SignalBand';
import { ProcessFlow } from '@/components/sections/ProcessFlow';
import { SplitMedia } from '@/components/sections/SplitMedia';
import { ContentGrid } from '@/components/sections/ContentGrid';
import type {
  CardGridData,
  ContentGridData,
  ProcessFlowData,
  SectionData,
  SignalBandData,
  SplitMediaData,
} from '@/types/strapi';
import seed from '../../content-seed/content/home.json';

/**
 * 主测试缝：02 号工单新增的首页区块。
 * fixture 单一源 = content-seed/content/home.json（seed 即 API 形状，仅 hero 含媒体变换）。
 */
const sections = seed.pages[0].sections as unknown as SectionData[];
const find = <T extends SectionData>(component: string) =>
  sections.find((s) => s.__component === component) as T;
/** 首页有两个 card-grid（three / four 形态），按序取 */
const cardGrids = sections.filter((s) => s.__component === 'sections.card-grid') as unknown as CardGridData[];

describe('SignalBand 渲染（v0.3 section.signal）', () => {
  it('四格标语：strong 主词 + span 副词', () => {
    const { container } = render(<SignalBand data={find<SignalBandData>('sections.signal-band')} />);
    expect(container.querySelector('section.signal')).toBeTruthy();
    const cells = container.querySelectorAll('section.signal > div');
    expect(cells.length).toBe(4);
    expect(screen.getByText('战略规划')).toBeTruthy();
    expect(screen.getByText('产业定位与实施路径')).toBeTruthy();
    expect(screen.getByText('全球连接')).toBeTruthy();
  });
});

describe('CardGrid 渲染（columns 变体）', () => {
  it('columns=3：.three + article.feature，序号由前端渲染（01/02/03 不入库）', () => {
    const { container } = render(<CardGrid data={cardGrids[0]} />);
    const grid = container.querySelector('div.three');
    expect(grid).toBeTruthy();
    const features = grid!.querySelectorAll('article.feature');
    expect(features.length).toBe(3);

    // 序号不入库：seed 卡片无 label，渲染层补 01/02/03
    expect(features[0].querySelector('span')!.textContent).toBe('01');
    expect(features[2].querySelector('span')!.textContent).toBe('03');

    // 卡尾链接（v0.3 feature a）
    const link = features[0].querySelector('a');
    expect(link?.getAttribute('href')).toBe('/government');
    expect(link?.textContent).toBe('查看合作模式 →');
  });

  it('columns=3 的 section-head：eyebrow + h2 + lead，居中', () => {
    const { container } = render(<CardGrid data={cardGrids[0]} />);
    const head = container.querySelector('div.section-head');
    expect(head?.className).toBe('section-head');
    expect(head?.querySelector('p.eyebrow')?.textContent).toBe('PLATFORM POSITIONING');
    expect(head?.querySelector('h2')?.textContent).toBe('把产业资源组织为可落地的出海服务能力');
    expect(head?.querySelector('h2 + p')?.textContent).toContain('算力海洋面向政府园区与产业企业');
  });

  it('columns=4：.four + article > b 标题 + p 正文（无序号无链接）', () => {
    const { container } = render(<CardGrid data={cardGrids[1]} />);
    const grid = container.querySelector('div.four');
    expect(grid).toBeTruthy();
    const cards = grid!.querySelectorAll('article');
    expect(cards.length).toBe(4);
    expect(cards[0].querySelector('b')?.textContent).toBe('产业研究');
    expect(cards[0].querySelector('p')?.textContent).toContain('区域产业基础');
    expect(cards[0].querySelector('span')).toBeNull();
  });

  it('theme=tint 渲染 .section.tint 类名', () => {
    const data = { ...cardGrids[0], theme: 'tint' } as CardGridData;
    const { container } = render(<CardGrid data={data} />);
    expect(container.querySelector('section.section.tint')).toBeTruthy();
  });
});

describe('ProcessFlow 渲染（v0.3 .method-flow）', () => {
  it('横向五步：阿拉伯序号 01-05 由前端渲染，footnote 承载交付行', () => {
    const { container } = render(
      <ProcessFlow data={find<ProcessFlowData>('sections.process-flow')} />,
    );
    expect(container.querySelector('section.section.service-method')).toBeTruthy();
    const steps = container.querySelectorAll('.method-flow > article');
    expect(steps.length).toBe(5);

    expect(steps[0].querySelector('b')?.textContent).toBe('01');
    expect(steps[4].querySelector('b')?.textContent).toBe('05');
    expect(steps[0].querySelector('h3')?.textContent).toBe('研究诊断');
    expect(steps[0].querySelector('span')?.textContent).toBe('交付：产业诊断与机会清单');
    expect(steps[4].querySelector('span')?.textContent).toBe('交付：运营计划与阶段成果');
  });

  it('纵向变体：中文数字序号', () => {
    const data = {
      ...find<ProcessFlowData>('sections.process-flow'),
      orientation: 'vertical',
    } as ProcessFlowData;
    const { container } = render(<ProcessFlow data={data} />);
    const steps = container.querySelectorAll('.method-flow > article');
    expect(steps[0].querySelector('b')?.textContent).toBe('一');
    expect(steps[2].querySelector('b')?.textContent).toBe('三');
  });
});

describe('SplitMedia 渲染（v0.3 .section.tint > .split + .gov-card）', () => {
  it('左栏：eyebrow + 含换行 h2 + lead + 双按钮', () => {
    const { container } = render(<SplitMedia data={find<SplitMediaData>('sections.split-media')} />);
    expect(container.querySelector('section.section.tint')).toBeTruthy();

    const left = container.querySelector('.split > div')!;
    expect(left.querySelector('p.eyebrow')?.textContent).toBe('REGIONAL PLATFORM');
    const h2 = left.querySelector('h2')!;
    // seed 以 \n 表达 v0.3 的 <br /> 换行
    expect(h2.innerHTML).toContain('<br>');
    expect(h2.textContent).toBe('以区域平台承接产业落地形成可复制的政企服务样板');
    expect(left.querySelector('h2 + p')?.textContent).toContain('汕头华侨数港算力科技有限公司');

    const primary = left.querySelector('.actions a.primary')!;
    expect(primary.getAttribute('href')).toBe('/huaqiao');
    // 分站入口新标签打开、主站内容页同窗（2026-09-23：lib/link-target 前缀判定）
    expect(primary.getAttribute('target')).toBe('_blank');
    expect(primary.textContent).toBe('进入华侨数港主页');
    const secondary = left.querySelector('.actions a.secondary')!;
    expect(secondary.getAttribute('href')).toBe('/government');
    expect(secondary.getAttribute('target')).toBeNull();
  });

  it('右栏 govCard：span 标签 + h3 + p + 四条列表', () => {
    const { container } = render(<SplitMedia data={find<SplitMediaData>('sections.split-media')} />);
    const card = container.querySelector('.gov-card')!;
    expect(card.querySelector('span')?.textContent).toBe('汕头华侨经济文化合作试验区');
    expect(card.querySelector('h3')?.textContent).toBe('华侨数港');
    expect(card.querySelector('p')?.textContent).toBe(
      '来数加工 · 合规承接 · 云资源空间 · 企业服务',
    );
    expect(card.querySelectorAll('ul li').length).toBe(4);
    expect(card.querySelector('ul li')?.textContent).toBe('合规白名单能力展示');
  });
});

describe('ContentGrid 渲染（v0.3 .insights-preview）', () => {
  it('linkCards=true：三卡整体为链接，tag/heading/body/ctaText 齐备', () => {
    const { container } = render(
      <ContentGrid data={find<ContentGridData>('sections.content-grid')} />,
    );
    expect(container.querySelector('section.section.insights-preview')).toBeTruthy();
    expect(container.querySelector('div.section-head.left')).toBeTruthy();

    const cards = container.querySelectorAll('a.insight-card');
    expect(cards.length).toBe(3);
    expect(cards[0].querySelector('span')?.textContent).toBe('WHITE PAPER');
    expect(cards[0].querySelector('h3')?.textContent).toBe('中国算力出海与跨境智能服务产业白皮书');
    expect(cards[0].querySelector('b')?.textContent).toBe('查看白皮书计划 →');
    expect(cards[0].getAttribute('href')).toBe('/insights');
    expect(cards[0].getAttribute('target')).toBeNull(); // 主站站内链接同窗
    // 卡链指向专题落地页时整卡新开（2026-09-23：线上 insights 页 linkCards 卡即此形态）
    const seedGrid = find<ContentGridData>('sections.content-grid');
    const { container: c2 } = render(
      <ContentGrid
        data={{
          ...seedGrid,
          cards: seedGrid.cards?.map((c, i) => (i === 0 ? { ...c, link: '/whitepaper' } : c)),
        }}
      />,
    );
    const wpCard = c2.querySelector('a.insight-card')!;
    expect(wpCard.getAttribute('target')).toBe('_blank');
    expect(wpCard.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('SectionRenderer 注册表（8 区块齐备）', () => {
  it('seed 全部 8 个区块均有注册组件，逐个渲染出 section', () => {
    const { container } = render(
      <SectionRenderer sections={sections} formUrl="https://form.example" />,
    );
    // hero + signal + card-grid×2 + process-flow + split + content-grid + cta = 8 个 section 级节点
    const rendered = container.querySelectorAll('section');
    expect(rendered.length).toBe(8);
  });
});
