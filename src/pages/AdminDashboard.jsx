import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Clock3, Download, Pencil, Plus, Search, SearchX, Trash2, Wrench, XCircle } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAdmin } from '../admin/AdminContext';
import StatusBadge from '../components/StatusBadge';
import {
  SEATING_AREAS,
  STATUS_META,
  areaName,
  formatDate,
  formatTime,
  parseISO,
  toISO,
  todayISO,
} from '../data/reservationData';

const TITLES = { overview: 'Dashboard overview', reservations: 'Reservations', calendar: 'Calendar', tables: 'Table availability' };
const STATUS_COLORS = { pending: '#a7741f', confirmed: '#4d6b4a', seated: '#3c5a78', completed: '#8a786a', cancelled: '#9b3b32', no_show: '#6d2a24' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABLE_STATUS_LABEL = { available: 'Available', reserved: 'Reserved', occupied: 'Occupied', unavailable: 'Unavailable' };

export default function AdminDashboard() {
  const [view, setView] = useState('overview');
  // Reservations are shared with the new admin dashboard so the counts always match.
  const { reservations: rows, updateReservationStatus: setStatus, deleteReservation, session } = useAdmin();
  const canDelete = session?.type === 'admin';
  const today = todayISO();

  const stats = useMemo(
    () => ({
      total: rows.length,
      today: rows.filter((r) => r.date === today).length,
      pending: rows.filter((r) => r.status === 'pending').length,
      confirmed: rows.filter((r) => r.status === 'confirmed').length,
      cancelled: rows.filter((r) => r.status === 'cancelled').length,
    }),
    [rows, today]
  );

  return (
    <AdminLayout active={view} onChange={setView} title={TITLES[view]}>
      {view === 'overview' && <Overview rows={rows} stats={stats} today={today} onStatus={setStatus} />}
      {view === 'reservations' && <ReservationsTable rows={rows} onStatus={setStatus} onDelete={canDelete ? deleteReservation : null} />}
      {view === 'calendar' && <CalendarView rows={rows} today={today} />}
      {view === 'tables' && <TablesView />}
    </AdminLayout>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ rows, stats, today, onStatus }) {
  const cards = [
    { label: "Today's reservations", value: stats.today, icon: CalendarDays },
    { label: 'Total bookings', value: stats.total, icon: CalendarCheck },
    { label: 'Pending', value: stats.pending, icon: Clock3 },
    { label: 'Confirmed', value: stats.confirmed, icon: CalendarCheck },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle },
  ];

  const byDay = useMemo(() => {
    const counts = WEEKDAYS.map((d) => ({ day: d, bookings: 0 }));
    rows.forEach((r) => { counts[parseISO(r.date).getDay()].bookings += 1; });
    return counts;
  }, [rows]);

  const byStatus = useMemo(
    () => Object.keys(STATUS_COLORS)
      .map((s) => ({ key: s, name: STATUS_META[s].label, value: rows.filter((r) => r.status === s).length }))
      .filter((d) => d.value > 0),
    [rows]
  );

  const todayRows = rows.filter((r) => r.date === today).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <div className="stat-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-card">
            <Icon size={20} aria-hidden="true" />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <section className="panel">
          <h2>Bookings by weekday</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd0b8" vertical={false} />
                <XAxis dataKey="day" stroke="#6b5a4e" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#6b5a4e" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(176,141,79,0.12)' }} />
                <Bar dataKey="bookings" fill="#b08d4f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <h2>Reservations by status</h2>
          <div className="chart-box">
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

      <section className="panel">
        <h2>Today’s reservations</h2>
        {todayRows.length === 0 ? (
          <div className="empty"><CalendarDays size={30} strokeWidth={1.3} /><h4>No reservations today</h4></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Guest</th><th>Party</th><th>Area</th><th>Table</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {todayRows.map((r) => (
                  <tr key={r.id}>
                    <td>{formatTime(r.time)}</td>
                    <td>{r.name}</td>
                    <td>{r.guests}</td>
                    <td>{areaName(r.area)}</td>
                    <td>{r.table}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td><StatusSelect value={r.status} onChange={(s) => onStatus(r.id, s)} label={`Update status for ${r.name}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function StatusSelect({ value, onChange, label }) {
  return (
    <select className="select select--sm" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {Object.entries(STATUS_META).filter(([k]) => k !== 'rejected' && k !== 'checked_in').map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
    </select>
  );
}

/* ---------------- CSV export ---------------- */
const csvCell = (v) => {
  let t = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; // stop spreadsheets from running a guest's text as a formula
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
function downloadReservationsCsv(rows) {
  const head = ['Reference', 'Guest', 'Email', 'Phone', 'Date', 'Time', 'Guests', 'Area', 'Table', 'Status', 'Occasion', 'Requests', 'Dietary'];
  const lines = rows.map((r) => [r.reference, r.name, r.email, r.phone, r.date, r.time, r.guests, areaName(r.area), r.table, r.status, r.occasion, r.requests, r.dietary].map(csvCell).join(','));
  const blob = new Blob(['\uFEFF' + [head.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aurelia-reservations-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------- Reservations table ---------------- */
function ReservationsTable({ rows, onStatus, onDelete }) {
  const confirmDelete = (r) => {
    if (window.confirm(`Delete reservation ${r.reference} for ${r.name}?\n\nThis permanently removes the record and cannot be undone.`)) onDelete(r.id);
  };
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (status === 'all' ? true : r.status === status))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [rows, query, status]);

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={16} aria-hidden="true" />
          <input className="input" type="search" placeholder="Search name, email or reference" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search reservations" />
        </div>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).filter(([k]) => !['rejected', 'checked_in'].includes(k)).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <span className="toolbar__count">{filtered.length} of {rows.length}</span>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => downloadReservationsCsv(filtered)} disabled={filtered.length === 0}>
          <Download size={14} aria-hidden="true" /> Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty"><SearchX size={32} strokeWidth={1.3} /><h4>No matching reservations</h4><p>Try a different search or status filter.</p></div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Reference</th><th>Guest</th><th>Date</th><th>Time</th><th>Party</th><th>Area / table</th><th>Status</th><th>Update</th>{onDelete && <th>Delete</th>}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.reference}</td>
                  <td>{r.name}<br /><small>{r.email}</small></td>
                  <td>{formatDate(r.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{formatTime(r.time)}</td>
                  <td>{r.guests}</td>
                  <td>{areaName(r.area)} · {r.table}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><StatusSelect value={r.status} onChange={(s) => onStatus(r.id, s)} label={`Update status for ${r.name}`} /></td>
                  {onDelete && (
                    <td>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => confirmDelete(r)} aria-label={`Delete reservation for ${r.name}`}>
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Calendar ---------------- */
function CalendarView({ rows, today }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(today);

  const first = month;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(first.getFullYear(), first.getMonth(), i + 1)))];

  const countFor = (iso) => rows.filter((r) => r.date === iso && !['cancelled'].includes(r.status)).length;
  const selectedRows = rows.filter((r) => r.date === selected).sort((a, b) => a.time.localeCompare(b.time));
  const shift = (n) => setMonth(new Date(first.getFullYear(), first.getMonth() + n, 1));

  return (
    <div className="admin-grid admin-grid--calendar">
      <section className="panel">
        <div className="cal__head">
          <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <h2>{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
        <div className="cal" role="grid">
          {WEEKDAYS.map((d) => <div key={d} className="cal__dow" role="columnheader">{d}</div>)}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`b${i}`} className="cal__cell cal__cell--blank" />;
            const n = countFor(iso);
            return (
              <button key={iso} type="button" className={`cal__cell ${iso === selected ? 'is-selected' : ''} ${iso === today ? 'is-today' : ''}`} onClick={() => setSelected(iso)} aria-label={`${formatDate(iso)}: ${n} reservations`} aria-pressed={iso === selected}>
                <span>{Number(iso.slice(8))}</span>
                {n > 0 && <em>{n}</em>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>{formatDate(selected, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
        {selectedRows.length === 0 ? (
          <div className="empty"><CalendarDays size={28} strokeWidth={1.3} /><h4>Nothing booked</h4><p>No reservations on this day.</p></div>
        ) : (
          <ul className="agenda">
            {selectedRows.map((r) => (
              <li key={r.id}>
                <strong>{formatTime(r.time)}</strong>
                <span>{r.name} · {r.guests} guests<br /><small>{areaName(r.area)} · {r.table}</small></span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------------- Tables ---------------- */
function TablesView() {
  const { tables: allTables, session, addTable, updateTable, removeTable } = useAdmin();
  const isAdmin = session?.type === 'admin';
  const [area, setArea] = useState('all');
  const [editing, setEditing] = useState(null); // table code being edited
  const [draft, setDraft] = useState({ area: 'indoor', seats: 2 });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const tables = allTables.filter((t) => area === 'all' || t.area === area);
  const counts = ['available', 'reserved', 'occupied', 'unavailable'].map((s) => ({ s, n: allTables.filter((t) => t.status === s).length }));

  const run = async (call) => {
    setMsg('');
    const result = await call();
    if (!result.ok) setMsg(result.error);
    return result;
  };
  const startEdit = (t) => { setEditing(t.id); setAdding(false); setMsg(''); setDraft({ area: t.area, seats: t.seats }); };
  const save = async (t) => {
    const r = await run(() => updateTable(t.id, { area: draft.area, seats: Number(draft.seats), outOfService: t.status === 'unavailable' }));
    if (r.ok) setEditing(null);
  };
  const toggleService = (t) => run(() => updateTable(t.id, { area: t.area, seats: t.seats, outOfService: t.status !== 'unavailable' }));
  const remove = (t) => {
    if (window.confirm(`Remove table ${t.id}? This cannot be undone.`)) run(() => removeTable(t.id));
  };
  const add = async () => {
    const r = await run(() => addTable({ area: draft.area, seats: Number(draft.seats) }));
    if (r.ok) setAdding(false);
  };

  const editor = (confirmLabel, onConfirm, onCancel) => (
    <div className="toolbar" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
      <select className="select select--sm" value={draft.area} onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))} aria-label="Seating area">
        {SEATING_AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <input className="input" type="number" min="1" max="20" style={{ width: '5.5rem' }} value={draft.seats} onChange={(e) => setDraft((d) => ({ ...d, seats: e.target.value }))} aria-label="Seats" />
      <button type="button" className="btn btn--primary btn--sm" onClick={onConfirm}>{confirmLabel}</button>
      <button type="button" className="btn btn--outline btn--sm" onClick={onCancel}>Cancel</button>
    </div>
  );

  return (
    <>
      <div className="stat-grid stat-grid--4">
        {counts.map(({ s, n }) => (
          <div key={s} className={`stat-card stat-card--${s}`}><strong>{n}</strong><span>{TABLE_STATUS_LABEL[s]}</span></div>
        ))}
      </div>
      <section className="panel">
        <div className="filters" role="tablist" aria-label="Filter tables by area">
          <button type="button" role="tab" aria-selected={area === 'all'} className={`filter ${area === 'all' ? 'is-active' : ''}`} onClick={() => setArea('all')}>All areas</button>
          {SEATING_AREAS.map((a) => (
            <button key={a.id} type="button" role="tab" aria-selected={area === a.id} className={`filter ${area === a.id ? 'is-active' : ''}`} onClick={() => setArea(a.id)}>{a.name}</button>
          ))}
          {isAdmin && (
            <button type="button" className="btn btn--primary btn--sm" style={{ marginLeft: 'auto' }} onClick={() => { setAdding(true); setEditing(null); setMsg(''); setDraft({ area: area === 'all' ? 'indoor' : area, seats: 2 }); }}>
              <Plus size={14} aria-hidden="true" /> Add table
            </button>
          )}
        </div>
        {msg && <p className="field__error" role="alert">{msg}</p>}
        {adding && editor('Add table', add, () => setAdding(false))}
        <div className="table-grid">
          {tables.map((t) => (
            <div key={t.id} className={`table-tile table-tile--${t.status}`}>
              <strong>{t.id}</strong>
              <span>{t.seats} seats</span>
              <small>{areaName(t.area)}</small>
              <em>{TABLE_STATUS_LABEL[t.status]}</em>
              {isAdmin && editing !== t.id && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => startEdit(t)} aria-label={`Edit table ${t.id}`}><Pencil size={13} aria-hidden="true" /></button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => toggleService(t)} aria-label={t.status === 'unavailable' ? `Put table ${t.id} back in service` : `Take table ${t.id} out of service`}>
                    <Wrench size={13} aria-hidden="true" /> {t.status === 'unavailable' ? 'Restore' : 'Out'}
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(t)} aria-label={`Remove table ${t.id}`}><Trash2 size={13} aria-hidden="true" /></button>
                </div>
              )}
              {isAdmin && editing === t.id && editor('Save', () => save(t), () => setEditing(null))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
