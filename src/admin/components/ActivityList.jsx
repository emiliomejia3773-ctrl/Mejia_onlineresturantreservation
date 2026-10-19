import { CalendarCheck, LogIn, Pencil, UserCheck, UserMinus, UserPlus, UserX } from 'lucide-react';
import { timeAgo } from '../adminData';

const ICONS = {
  hire: UserPlus,
  terminate: UserX,
  activate: UserCheck,
  deactivate: UserMinus,
  edit: Pencil,
  signin: LogIn,
  reservation: CalendarCheck,
};

export default function ActivityList({ items, limit }) {
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) return <p className="adm-empty-small">No activity yet.</p>;

  return (
    <ul className="adm-timeline">
      {list.map((a) => {
        const Icon = ICONS[a.type] || CalendarCheck;
        return (
          <li key={a.id}>
            <span className={`adm-timeline__icon adm-timeline__icon--${a.type}`}><Icon size={15} aria-hidden="true" /></span>
            <span className="adm-timeline__text">
              {a.text}
              <small>{timeAgo(a.at)}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
