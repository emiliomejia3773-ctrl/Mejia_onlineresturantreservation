import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarCheck, CalendarDays, Clock3, UserPlus, Users, UsersRound } from 'lucide-react';
import ActivityList from '../components/ActivityList';
import NotificationList from '../components/NotificationList';
import { useAdmin } from '../AdminContext';
import { ROLES } from '../adminData';
import { STATUS_META, addDays, toISO, todayISO } from '../../data/reservationData';

const STATUS_COLORS = {
  pending: '#c28a2b',
  confirmed: '#1b6b4f',
  seated: '#2f5d7c',
  completed: '#8fa59a',
  cancelled: '#a8372e',
  no_show: '#6d2a24',
};

function StatCard({ icon: Icon, label, value, hint, tone = 'green' }) {
  return (
    <div className={`adm-stat adm-stat--${tone}`}>
      <span className="adm-stat__icon"><Icon size={20} aria-hidden="true" /></span>
      <div>
        <span className="adm-stat__label">{label}</span>
        <strong className="adm-stat__value">{value}</strong>
        {hint && <small className="adm-stat__hint">{hint}</small>}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { reservations, staff, staffCounts, reservationCounts, activity, notifications, markNotificationRead, markAllRead, unreadCount, session, customerCount } = useAdmin();
  const today = todayISO();

  const todayCount = reservations.filter((r) => r.date === today && r.status !== 'cancelled').length;

  // Bookings per day: last 6 days, today, and the next 7 days.
  const perDay = useMemo(() => {
    const out = [];
    for (let i = -6; i <= 7; i += 1) {
      const d = addDays(i);
      const iso = toISO(d);
      out.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        bookings: reservations.filter((r) => r.date === iso && r.status !== 'cancelled').length,
        isToday: i === 0,
      });
    }
    return out;
  }, [reservations]);

  const byStatus = useMemo(
    () =>
      Object.keys(STATUS_COLORS)
        .map((key) => ({ key, name: STATUS_META[key].label, value: reservations.filter((r) => r.status === key).length }))
        .filter((d) => d.value > 0),
    [reservations]
  );

  const byRole = useMemo(
    () => ROLES.map((role) => ({ role, count: staff.filter((s) => s.role === role).length })),
    [staff]
  );
  const maxRole = Math.max(1, ...byRole.map((r) => r.count));

  return (
    <>
      <div className="adm-pagehead">
        <div>
          <h1>Dashboard overview</h1>
          <p>Welcome back, {session.name.split(' ')[0]}. Here is how the restaurant is doing.</p>
        </div>
        {session.type === 'admin' && (
          <div className="adm-pagehead__actions">
            <Link to="/admin/staff?hire=1" className="adm-btn adm-btn--primary"><UserPlus size={16} /> Hire staff</Link>
          </div>
        )}
      </div>

      <section className="adm-stats" aria-label="Summary">
        <StatCard icon={CalendarCheck} label="Total reservations" value={reservationCounts.total} hint={`${todayCount} today`} />
        <StatCard icon={Clock3} label="Pending reservations" value={reservationCounts.pending} hint="Waiting for approval" tone="amber" />
        <StatCard icon={CalendarDays} label="Confirmed reservations" value={reservationCounts.confirmed} hint="Ready to be seated" />
        <StatCard icon={UsersRound} label="Total customers" value={customerCount} hint="Registered guests" tone="blue" />
        <StatCard
          icon={Users}
          label="Total staff"
          value={staffCounts.current}
          hint={`${staffCounts.active} active · ${staffCounts.inactive} inactive`}
        />
      </section>

      <div className="adm-grid adm-grid--charts">
        <section className="adm-card">
          <h2 className="adm-card__title">Bookings, past week and next week</h2>
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perDay} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2dac6" vertical={false} />
                <XAxis dataKey="label" stroke="#5e6e65" tickLine={false} fontSize={11} interval="preserveStartEnd" minTickGap={14} />
                <YAxis allowDecimals={false} stroke="#5e6e65" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: 'rgba(27,107,79,0.08)' }} />
                <Bar dataKey="bookings" name="Bookings" radius={[4, 4, 0, 0]}>
                  {perDay.map((d) => <Cell key={d.label} fill={d.isToday ? '#0f3d2e' : '#6fae93'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="adm-card">
          <h2 className="adm-card__title">Reservations by status</h2>
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="80%" paddingAngle={2}>
                  {byStatus.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="adm-grid adm-grid--three">
        <section className="adm-card">
          <div className="adm-card__row">
            <h2 className="adm-card__title">Recent activity</h2>
          </div>
          <ActivityList items={activity} limit={7} />
        </section>

        <section className="adm-card">
          <div className="adm-card__row">
            <h2 className="adm-card__title">Notifications {unreadCount > 0 && <span className="adm-count">{unreadCount}</span>}</h2>
            <button type="button" className="adm-link" onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</button>
          </div>
          <NotificationList items={notifications} onRead={markNotificationRead} limit={6} />
        </section>

        <section className="adm-card">
          <div className="adm-card__row">
            <h2 className="adm-card__title">Team by role</h2>
            {session.canManageStaff && <Link to="/admin/staff" className="adm-link">Manage</Link>}
          </div>
          <ul className="adm-bars">
            {byRole.map(({ role, count }) => (
              <li key={role}>
                <span>{role}</span>
                <span className="adm-bars__track"><i style={{ width: `${(count / maxRole) * 100}%` }} /></span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
          <p className="adm-help">Counts cover current staff only; fired or deleted staff are removed.</p>
        </section>
      </div>
    </>
  );
}
