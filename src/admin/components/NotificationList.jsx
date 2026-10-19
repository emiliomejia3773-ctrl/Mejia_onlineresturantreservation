import { AlertTriangle, CalendarCheck, Info, Users } from 'lucide-react';
import { timeAgo } from '../adminData';

const ICONS = { reservation: CalendarCheck, staff: Users, alert: AlertTriangle, system: Info };

export default function NotificationList({ items, onRead, limit }) {
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) return <p className="adm-empty-small">You are all caught up.</p>;

  return (
    <ul className="adm-notifs">
      {list.map((n) => {
        const Icon = ICONS[n.kind] || Info;
        return (
          <li key={n.id}>
            <button type="button" className={`adm-notif ${n.read ? '' : 'is-unread'}`} onClick={() => onRead(n.id)}>
              <span className={`adm-notif__icon adm-notif__icon--${n.kind}`}><Icon size={16} aria-hidden="true" /></span>
              <span className="adm-notif__text">
                {n.text}
                <small>{timeAgo(n.at)}</small>
              </span>
              {!n.read && <i className="adm-dot" role="img" aria-label="Unread" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
