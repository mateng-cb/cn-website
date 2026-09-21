import type { ComponentType } from 'react';
import type { SectionData } from '@/types/strapi';
import { Hero } from '@/components/sections/Hero';
import { CardGrid } from '@/components/sections/CardGrid';
import { SignalBand } from '@/components/sections/SignalBand';
import { ProcessFlow } from '@/components/sections/ProcessFlow';
import { SplitMedia } from '@/components/sections/SplitMedia';
import { ContentGrid } from '@/components/sections/ContentGrid';
import { StatStrip } from '@/components/sections/StatStrip';
import { CtaBand } from '@/components/sections/CtaBand';
import { LogoWall } from '@/components/sections/LogoWall';
import { SolutionList } from '@/components/sections/SolutionList';

/**
 * __component → React 组件注册表（CMS 区块拼页面的核心）。
 * 未注册的组件静默跳过，保证 CMS 里先建了内容、前端后发版时页面仍可渲染。
 * formUrl（site-config 全局表单链接）透传给需要它的区块（cta-band）。
 * data: never 强转：各区块收窄自己的 Data 类型，registry 统一存 never 收协变。
 * 全部区块保持纯同步展示组件（kind=news 的数据由页面层 enrichSections 注入）。
 */
type SectionComponent = ComponentType<{ data: never; formUrl?: string }>;

const registry: Record<string, SectionComponent> = {
  'sections.hero': Hero as SectionComponent,
  'sections.card-grid': CardGrid as SectionComponent,
  'sections.signal-band': SignalBand as SectionComponent,
  'sections.process-flow': ProcessFlow as SectionComponent,
  'sections.split-media': SplitMedia as SectionComponent,
  'sections.content-grid': ContentGrid as SectionComponent,
  'sections.stat-strip': StatStrip as SectionComponent,
  'sections.cta-band': CtaBand as SectionComponent,
  'sections.logo-wall': LogoWall as SectionComponent,
  'sections.solution-list': SolutionList as SectionComponent,
};

export function SectionRenderer({
  sections,
  formUrl,
}: {
  sections: SectionData[];
  formUrl?: string;
}) {
  return (
    <>
      {sections.map((section, index) => {
        const Component = registry[section.__component];
        if (!Component) return null;
        return <Component key={index} data={section as never} formUrl={formUrl} />;
      })}
    </>
  );
}
