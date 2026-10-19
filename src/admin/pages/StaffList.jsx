import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Power, Search, SearchX, Trash2, UserCheck, UserPlus, UserX } from 'lucide-react';
import Avatar from '../components/Avatar';
import StaffDialogs from '../components/StaffDialogs';
import StatusPill from '../components/StatusPill';
import { useAdmin } from '../AdminContext';
import { POSITIONS, ROLES, formatDateTime, formatDay, timeAgo } from '../adminData';

const SORTS = {
  name: { label: 'Name (A–Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  hired_new: { label: 'Newest hires', fn: (a, b) => b.hiredAt.localeCompare(a.hiredAt) },
  hired_old: { label: 'Longest serving', fn: (a, b) => a.hiredAt.localeCompare(b.hiredAt) },
  login: { label: 'Last login', fn: (a, b) => (b.lastLogin || '').localeCompare(a.lastLogin || '') },
};

export default function StaffList() {
  const { staff, staffCounts, setStaffActive, session } = useAdmin();
  // Managers can manage staff records, but only the administrator can change Manager accounts or their own.
  const isAdmin = session?.type === 'admin';
  const mayChange = (s) => isAdmin || s.role !== 'Manager';
  const [params, setParams] = useSearchParams();

  const [tab, setTab] = useState('staff'); // 'staff' | 'signins'
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [position, setPosition] = useState('all');
  const [sort, setSort] = useState('name');
  const [failedOnly, setFailedOnly] = useState(false);
  const [dialog, setDialog] = useState(params.get('hire') === '1' && session?.type === 'admin' ? { type: 'hire' } : null);

  // Remove ?hire=1 from the address once the dialog has opened.
  useEffect(() => {
    if (params.get('hire')) setParams({}, { replace: true });
  }, [params, setParams]);

  const q = query.trim().toLowerCase();
  const filtersActive = status !== 'all' || role !== 'all' || position !== 'all' || q !== '';
  const clearFilters = () => { setStatus('all'); setRole('all'); setPosition('all'); setQuery(''); };

  const filtered = useMemo(() => {
    const list = staff.filter(
      (s) =>
        (status === 'all' || s.status === status) &&
        (role === 'all' || s.role === role) &&
        (position === 'all' || s.position === position) &&
        (!q || [s.name, s.email, s.position, s.role, s.id].some((v) => v.toLowerCase().includes(q)))
    );
    return [...list].sort(SORTS[sort].fn);
  }, [staff, status, role, position, q, sort]);

  const signIns = useMemo(
    () =>
      staff
        .filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
        .flatMap((s) => s.signIns.map((x) => ({ ...x, person: s })))
        .filter((x) => !failedOnly || x.result === 'failed')
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 40),
    [staff, q, failedOnly]
  );

  const chips = [
    { id: 'all', label: 'All', count: staffCounts.all },
    { id: 'active', label: 'Active', count: staffCounts.active },
    { id: 'inactive', label: 'Inactive', count: staffCounts.inactive },
  ];

  return (
    <>
      <div className="adm-pagehead">
        <div>
          <h1>Staff Management</h1>
          <p>{isAdmin ? 'Hire, edit and manage your team. Terminating or deleting a staff member permanently removes their record.' : 'View and edit staff records. Only the administrator can hire, terminate or delete staff.'}</p>
        </div>
        {isAdmin && (
          <div className="adm-pagehead__actions">
            <button type="button" className="adm-btn adm-btn--primary" onClick={() => setDialog({ type: 'hire' })}>
              <UserPlus size={16} /> Hire new staff
            </button>
          </div>
        )}
      </div>

      <div className="adm-tabs" role="tablist" aria-label="Staff views">
        <button type="button" role="tab" aria-selected={tab === 'staff'} className={`adm-tab ${tab === 'staff' ? 'is-active' : ''}`} onClick={() => setTab('staff')}>Staff members</button>
        <button type="button" role="tab" aria-selected={tab === 'signins'} className={`adm-tab ${tab === 'signins' ? 'is-active' : ''}`} onClick={() => setTab('signins')}>Sign-in activity</button>
      </div>

      {tab === 'staff' && (
        <>
          <div className="adm-chips" role="group" aria-label="Filter by employment status">
            {chips.map((c) => (
              <button key={c.id} type="button" className={`adm-chip ${status === c.id ? 'is-active' : ''}`} onClick={() => setStatus(c.id)} aria-pressed={status === c.id}>
                {c.label} <span>{c.count}</span>
              </button>
            ))}
          </div>

          <section className="adm-card adm-card--flush">
            <div className="adm-toolbar">
              <div className="adm-search">
                <Search size={16} aria-hidden="true" />
                <input className="adm-input" type="search" placeholder="Search name, email, position or ID" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search staff" />
              </div>
              <select className="adm-select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
                <option value="all">All roles</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select className="adm-select" value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Filter by position">
                <option value="all">All positions</option>
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort staff">
                {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>Sort: {s.label}</option>)}
              </select>
            </div>
            <div className="adm-toolbar__meta">
              <span>Showing {filtered.length} of {staff.length}</span>
              {filtersActive && <button type="button" className="adm-link" onClick={clearFilters}>Clear filters</button>}
            </div>

            {filtered.length === 0 ? (
              <div className="adm-empty">
                <SearchX size={32} strokeWidth={1.4} aria-hidden="true" />
                <h3>No staff found</h3>
                <p>Try a different search or clear the filters.</p>
                <button type="button" className="adm-btn adm-btn--outline adm-btn--sm" onClick={clearFilters}>Clear filters</button>
              </div>
            ) : (
              <div className="adm-tablewrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Staff member</th><th>Position</th><th>Role</th><th>Status</th><th>Hired</th><th>Last login</th><th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      return (
                        <tr key={s.id}>
                          <td data-label="">
                            <Link to={`/admin/staff/${s.id}`} className="adm-person">
                              <Avatar name={s.name} />
                              <span><strong>{s.name}</strong><small>{s.email}</small></span>
                            </Link>
                          </td>
                          <td data-label="Position">{s.position}</td>
                          <td data-label="Role">{s.role}</td>
                          <td data-label="Status"><StatusPill status={s.status} /></td>
                          <td data-label="Hired">{formatDay(s.hiredAt)}</td>
                          <td data-label="Last login" title={s.lastLogin ? formatDateTime(s.lastLogin) : ''}>{timeAgo(s.lastLogin)}</td>
                          <td data-label="" className="adm-rowactions">
                            <Link to={`/admin/staff/${s.id}`} className="adm-iconbtn" title="View profile" aria-label={`View profile of ${s.name}`}><Eye size={17} /></Link>
                            {mayChange(s) && (
                              <>
                                <button type="button" className="adm-iconbtn" title="Edit" aria-label={`Edit ${s.name}`} onClick={() => setDialog({ type: 'edit', person: s })}><Pencil size={17} /></button>
                                {s.status === 'active' ? (
                                  <button type="button" className="adm-iconbtn" title="Deactivate account" aria-label={`Deactivate ${s.name}`} onClick={() => setDialog({ type: 'deactivate', person: s })}><Power size={17} /></button>
                                ) : (
                                  <button type="button" className="adm-iconbtn adm-iconbtn--good" title="Activate account" aria-label={`Activate ${s.name}`} onClick={() => setStaffActive(s.id, true)}><UserCheck size={17} /></button>
                                )}
                                {isAdmin && (
                                  <>
                                    <button type="button" className="adm-iconbtn adm-iconbtn--danger" title="Terminate" aria-label={`Terminate ${s.name}`} onClick={() => setDialog({ type: 'terminate', person: s })}><UserX size={17} /></button>
                                    <button type="button" className="adm-iconbtn adm-iconbtn--danger" title="Delete" aria-label={`Delete ${s.name}`} onClick={() => setDialog({ type: 'delete', person: s })}><Trash2 size={17} /></button>
                                  </>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'signins' && (
        <section className="adm-card adm-card--flush">
          <div className="adm-toolbar">
            <div className="adm-search">
              <Search size={16} aria-hidden="true" />
              <input className="adm-input" type="search" placeholder="Search by staff name or email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search sign-in activity" />
            </div>
            <label className="adm-check">
              <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} />
              <span>Failed attempts only</span>
            </label>
          </div>
          <div className="adm-toolbar__meta"><span>Latest {signIns.length} sign-in events (sample data)</span></div>

          {signIns.length === 0 ? (
            <div className="adm-empty"><SearchX size={32} strokeWidth={1.4} aria-hidden="true" /><h3>No sign-in events</h3><p>Nothing matches your search.</p></div>
          ) : (
            <div className="adm-tablewrap">
              <table className="adm-table">
                <thead><tr><th>Staff member</th><th>Date &amp; time</th><th>Result</th><th>Device</th></tr></thead>
                <tbody>
                  {signIns.map((x) => (
                    <tr key={x.id}>
                      <td data-label="">
                        <Link to={`/admin/staff/${x.person.id}`} className="adm-person">
                          <Avatar name={x.person.name} size="sm" />
                          <span><strong>{x.person.name}</strong><small>{x.person.position}</small></span>
                        </Link>
                      </td>
                      <td data-label="Date & time">{formatDateTime(x.at)}</td>
                      <td data-label="Result"><span className={`adm-pill adm-pill--${x.result === 'success' ? 'active' : 'terminated'}`}>{x.result === 'success' ? 'Success' : 'Failed'}</span></td>
                      <td data-label="Device">{x.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <StaffDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
