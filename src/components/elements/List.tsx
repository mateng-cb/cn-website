import type { ListData } from '@/types/strapi';
import { strapiMediaUrl } from '@/lib/strapi';

/** cards 形态的 icon 兜底图（后台词条项未传 icon 时按顺序取用）：
 *  与 services「服务对象」五项一一对应，web/public 静态资产（郑琴提供）；
 *  后台上传 icon 后即被覆盖，顺序错位时运营逐项上传即可纠偏 */
const CARD_ICON_FALLBACKS = [
  '/bank-fill.png', // 地方政府与产业园区
  '/jiguihang.png', // IDC、数据中心与运营商
  '/yunfuwu.png', // 云平台、GPU 与算力资源方
  '/robot-3-fill.png', // AI 应用、Agent 与企业软件
  '/wangluo.png', // 海外园区、渠道与交付伙伴
];

/**
 * 要点列表（v0.3 形态）：
 * - plain（默认）→ 裸 ul（内容卡内 18px 缩进圆点，样式由容器规则定）
 * - check → ul.checks（✓ 前缀走 CSS content）
 * - cards → ul.cards（两列图标卡：#f3f9fe 圆角 8px、左 icon 右文字、左 46px 内边距；
 *   icon 空按顺序取 CARD_ICON_FALLBACKS 本地默认图）
 * - diamond / numbered → 类名就位，皮肤 05 号子站对齐（v0.3 主站无此形态）
 */
export function List({ data }: { data: ListData }) {
  const items = data.items ?? [];
  if (items.length === 0) return null;
  const style = data.style ?? 'plain';
  const className = style === 'check' ? 'checks' : style === 'plain' ? undefined : style;
  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={item.id ?? i}>
          {item.icon ? (
            <img
              src={strapiMediaUrl(item.icon)}
              alt={item.term ?? item.text ?? ''}
              loading="lazy"
            />
          ) : style === 'cards' ? (
            <img
              src={CARD_ICON_FALLBACKS[i % CARD_ICON_FALLBACKS.length]}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
          ) : null}
          {item.term ? <b>{item.term}</b> : null}
          {item.text}
        </li>
      ))}
    </ul>
  );
}
