import type { LogoWallData } from '@/types/strapi';
import { strapiMediaUrl } from '@/lib/strapi';
import { SectionHead } from '@/components/elements/SectionHead';

/**
 * 生态伙伴 Logo 分组卡（3.3 设计稿）：区块标题 + 四张彩色卡片四列横排。
 * 每卡 = 上方小字（label）+ 主标题（title）+ 白色 Logo 格三列网格；
 * logo-item 的 image 空时渲染公司名文字卡（正式 Logo 由郑琴侧补齐后
 * 后台上传替换，零代码）。
 */
export function LogoWall({ data }: { data: LogoWallData }) {
  const groups = data.groups ?? [];
  return (
    <section className="section logo-wall">
      {data.head ? <SectionHead data={data.head} /> : null}
      <div className="logo-wall-groups">
        {groups.map((group, gi) => (
          <div className="logo-wall-group" key={group.id ?? gi}>
            {group.label ? <p className="logo-wall-label">{group.label}</p> : null}
            {group.title ? <h3 className="logo-wall-title">{group.title}</h3> : null}
            {group.summary ? <p className="logo-wall-summary">{group.summary}</p> : null}
            <div className="logo-wall-grid">
              {(group.logos ?? []).map((logo, li) => (
                <div className="logo-cell" key={logo.id ?? li}>
                  {logo.image ? (
                    <img src={strapiMediaUrl(logo.image)} alt={logo.name} loading="lazy" />
                  ) : (
                    <span className="logo-cell-name">{logo.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
