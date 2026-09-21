import type { SignalBandData } from '@/types/strapi';

/** 信号条带：v0.3 section.signal > div > strong + span（无标题结构，head 不渲染） */
export function SignalBand({ data }: { data: SignalBandData }) {
  const items = data.items ?? [];
  return (
    <section className="signal">
      {items.map((item, i) => (
        <div key={item.id ?? i}>
          <strong>{item.label}</strong>
          <span>{item.text}</span>
        </div>
      ))}
    </section>
  );
}
