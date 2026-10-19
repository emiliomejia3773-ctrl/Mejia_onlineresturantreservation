import { STATUS_META } from '../data/reservationData';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: 'neutral' };
  return <span className={`badge badge--${meta.tone}`}>{meta.label}</span>;
}
