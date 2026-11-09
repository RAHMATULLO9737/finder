import { ORDER_STATUSES, statusInfo } from '../utils';

export function StatusBadge({ status }) {
  const [, label, tone] = statusInfo(status);
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

const FLOW = ['new', 'confirmed', 'shipping', 'delivered'];

// Buyurtma yo'li: Yangi → Tasdiqlandi → Yo'lda → Yetkazildi
export function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return <div className="timeline cancelled"><span className="status-badge bad">✖️ Buyurtma bekor qilingan</span></div>;
  }
  const current = FLOW.indexOf(status);
  return (
    <div className="timeline">
      {FLOW.map((code, i) => {
        const [, label, , emoji] = ORDER_STATUSES.find((s) => s[0] === code);
        return (
          <div key={code} className={'tl-step' + (i <= current ? ' done' : '') + (i === current ? ' now' : '')}>
            <span className="tl-dot">{emoji}</span>
            <small>{label}</small>
          </div>
        );
      })}
    </div>
  );
}
