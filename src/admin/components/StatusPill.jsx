import { STATUS_LABEL } from '../adminData';

export default function StatusPill({ status }) {
  return <span className={`adm-pill adm-pill--${status}`}>{STATUS_LABEL[status] || status}</span>;
}
