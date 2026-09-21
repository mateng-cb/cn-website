import type { StatStripData } from '@/types/strapi';
import { SectionHead } from '@/components/elements/SectionHead';

/**
 * 数字指标条：v0.3 无对应结构（白皮书 landing 数字指标用，工单 06），
 * main 皮肤基础样式 .stat-strip（value 大号主色，label 弱化说明）。
 */
export function StatStrip({ data }: { data: StatStripData }) {
  const stats = data.stats ?? [];
  return (
    <section className="stat-strip">
      {data.head ? <SectionHead data={data.head} /> : null}
      {stats.length > 0 ? (
        <div className="stat-grid">
          {stats.map((stat, i) => (
            <div key={stat.id ?? i}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
