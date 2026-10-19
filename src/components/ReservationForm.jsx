import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Minus, Plus } from 'lucide-react';
import Button from './Button';
import SmartImage from './SmartImage';
import { tableView } from '../data/tableViews';
import { api } from '../api';
import {
  MAX_ADVANCE_DAYS,
  MAX_GUESTS,
  OCCASIONS,
  SEATING_AREAS,
  addDays,
  areaName,
  formatDate,
  formatTime,
  toISO,
  todayISO,
} from '../data/reservationData';

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span id={id} className="field__error" role="alert">
      <AlertCircle size={14} aria-hidden="true" /> {message}
    </span>
  );
}

/**
 * Booking form. For editing, pass `initial` (the existing reservation) and `submitLabel`;
 * the booking's own table then counts as free when availability is checked.
 */
export default function ReservationForm({ user, onSubmit, initial = null, submitLabel = 'Confirm reservation' }) {
  const [form, setForm] = useState({
    date: initial?.date || '',
    time: initial?.time || '',
    guests: initial?.guests || 2,
    area: initial?.area || 'indoor',
    table: initial?.table || '',
    name: initial?.name || user?.name || '',
    email: initial?.email || user?.email || '',
    phone: initial?.phone || user?.phone || '',
    occasion: initial?.occasion || 'None',
    requests: initial?.requests || '',
    dietary: initial?.dietary || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const minDate = todayISO();
  const maxDate = toISO(addDays(MAX_ADVANCE_DAYS));

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleDate = (value) => {
    setForm((f) => ({ ...f, date: value, time: '', table: '' }));
    setErrors((e) => ({ ...e, date: undefined, time: undefined }));
  };

  // Live availability from the server: depends on the date, party size and seating area.
  const [avail, setAvail] = useState(null); // { open, lastSeating, slots } for the current choices
  const [availState, setAvailState] = useState('idle'); // idle | loading | error
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!form.date) { setAvail(null); setAvailState('idle'); return undefined; }
    let cancelled = false;
    setAvailState('loading');
    api.get(`/availability?date=${form.date}&guests=${form.guests}&area=${form.area}${initial ? `&exclude=${initial.id}` : ''}`)
      .then((data) => {
        if (cancelled) return;
        setAvail(data);
        setAvailState('idle');
        // A time that is no longer free (party size / area changed) must be picked again.
        setForm((f) => (f.time && !data.slots.some((s) => s.time === f.time && s.available) ? { ...f, time: '' } : f));
      })
      .catch(() => { if (!cancelled) { setAvail(null); setAvailState('error'); } });
    return () => { cancelled = true; };
  }, [form.date, form.guests, form.area, refreshTick, initial]);

  // Free tables for the chosen slot: the guest picks one and sees a photo of the seat.
  const [tables, setTables] = useState([]);
  const [tablesState, setTablesState] = useState('idle'); // idle | loading | error

  useEffect(() => {
    if (!form.date || !form.time) { setTables([]); setTablesState('idle'); return undefined; }
    let cancelled = false;
    setTablesState('loading');
    api.get(`/tables/available?date=${form.date}&time=${form.time}&guests=${form.guests}&area=${form.area}${initial ? `&exclude=${initial.id}` : ''}`)
      .then((data) => {
        if (cancelled) return;
        setTables(data.tables);
        setTablesState('idle');
        // A previously chosen table that is no longer free (time / party / area changed) must be picked again.
        setForm((f) => (f.table && !data.tables.some((t) => t.code === f.table) ? { ...f, table: '' } : f));
      })
      .catch(() => { if (!cancelled) { setTables([]); setTablesState('error'); } });
    return () => { cancelled = true; };
  }, [form.date, form.time, form.guests, form.area, refreshTick, initial]);

  const chosenTable = tables.find((t) => t.code === form.table) || null;

  const dateOpen = avail ? avail.open : null;
  const slots = (avail?.slots || []).map((s) => ({ ...s, label: formatTime(s.time) }));
  const hours = avail?.open ? { lastSeating: avail.lastSeating } : null;

  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'Please choose a date.';
    else if (form.date < minDate) e.date = 'That date has already passed.';
    else if (form.date > maxDate) e.date = `Bookings open up to ${MAX_ADVANCE_DAYS} days ahead.`;
    else if (dateOpen === false) e.date = 'We are closed on that day. Please choose another date.';

    if (!form.time) e.time = 'Please select an available time.';
    else if (!form.table) e.table = 'Please choose your table.';
    if (form.guests < 1 || form.guests > MAX_GUESTS) e.guests = `Parties of 1–${MAX_GUESTS} can book online.`;
    if (form.area === 'private' && form.guests < 6) e.area = 'Private Dining is for parties of 6 or more.';
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a valid phone number.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector('[aria-invalid="true"], .field__error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({
        date: form.date,
        time: form.time,
        guests: form.guests,
        area: form.area,
        table: form.table,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        occasion: form.occasion,
        requests: form.requests.trim(),
        dietary: form.dietary.trim(),
      });
    } catch (err) {
      setSubmitting(false);
      setSubmitError(err.message);
      setForm((f) => ({ ...f, time: '' }));
      setRefreshTick((t) => t + 1); // the slot may have just been taken: reload the times
    }
  };

  return (
    <form className="booking" onSubmit={handleSubmit} noValidate>
      <div className="booking__fields">
        {/* 1. Date & time */}
        <fieldset className="booking__step">
          <legend><span>1</span> Date &amp; time</legend>
          <div className="field">
            <label className="field__label" htmlFor="res-date">Reservation date</label>
            <input
              id="res-date"
              type="date"
              className="input"
              min={minDate}
              max={maxDate}
              value={form.date}
              onChange={(e) => handleDate(e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'err-date' : undefined}
            />
            <FieldError id="err-date" message={errors.date} />
          </div>

          <div className="field" style={{ marginTop: '1.2rem' }}>
            <span className="field__label" id="time-label">Available times</span>
            {!form.date && <p className="booking__hint">Select a date to see available times.</p>}
            {form.date && dateOpen === false && <p className="booking__hint booking__hint--warn">We are closed on {formatDate(form.date, { weekday: 'long' })}s.</p>}
            {form.date && availState === 'loading' && !avail && <p className="booking__hint">Checking availability…</p>}
            {form.date && availState === 'error' && <p className="booking__hint booking__hint--warn">Could not load times. Please check your connection and pick the date again.</p>}
            {form.date && dateOpen && (
              <>
                <p className="booking__hint">Last seating {formatTime(hours.lastSeating)}. Greyed times are fully booked.</p>
                <div className="slots" role="radiogroup" aria-labelledby="time-label">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      role="radio"
                      aria-checked={form.time === s.time}
                      disabled={!s.available}
                      className={`slot ${form.time === s.time ? 'is-selected' : ''}`}
                      onClick={() => set('time', s.time)}
                      title={s.available ? '' : s.reason}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <FieldError id="err-time" message={errors.time} />
          </div>
        </fieldset>

        {/* 2. Party & seating */}
        <fieldset className="booking__step">
          <legend><span>2</span> Party &amp; seating</legend>
          <div className="field">
            <span className="field__label" id="guests-label">Number of guests</span>
            <div className="stepper" role="group" aria-labelledby="guests-label">
              <button type="button" onClick={() => set('guests', Math.max(1, form.guests - 1))} disabled={form.guests <= 1} aria-label="Fewer guests"><Minus size={16} /></button>
              <output aria-live="polite">{form.guests}</output>
              <button type="button" onClick={() => set('guests', Math.min(MAX_GUESTS, form.guests + 1))} disabled={form.guests >= MAX_GUESTS} aria-label="More guests"><Plus size={16} /></button>
            </div>
            <FieldError id="err-guests" message={errors.guests} />
          </div>

          <div className="field" style={{ marginTop: '1.2rem' }}>
            <span className="field__label" id="area-label">Preferred seating area</span>
            <div className="area-grid" role="radiogroup" aria-labelledby="area-label">
              {SEATING_AREAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={form.area === a.id}
                  className={`area-option ${form.area === a.id ? 'is-selected' : ''}`}
                  onClick={() => set('area', a.id)}
                >
                  <strong>{a.name}</strong>
                  <span>{a.description}</span>
                </button>
              ))}
            </div>
            <FieldError id="err-area" message={errors.area} />
          </div>
        </fieldset>

        {/* Table picker: each table shows a photo of the view from the seat */}
        <fieldset className="booking__step">
          <legend><span>3</span> Choose your table</legend>
          {!form.time && <p className="booking__hint">Select a date and time first, then pick the table you would like.</p>}
          {form.time && tablesState === 'loading' && tables.length === 0 && <p className="booking__hint">Finding free tables…</p>}
          {form.time && tablesState === 'error' && <p className="booking__hint booking__hint--warn">Could not load tables. Please pick the time again.</p>}
          {form.time && tablesState !== 'error' && tablesState !== 'loading' && tables.length === 0 && (
            <p className="booking__hint booking__hint--warn">No tables are free at that time. Please choose another time or seating area.</p>
          )}
          {tables.length > 0 && (
            <div className="table-grid" role="radiogroup" aria-label="Available tables">
              {tables.map((t) => {
                const v = tableView(t);
                const on = form.table === t.code;
                return (
                  <button
                    key={t.code}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`table-card ${on ? 'is-selected' : ''}`}
                    onClick={() => set('table', t.code)}
                  >
                    <SmartImage src={v.photo} alt={`View from table ${t.code}`} className="table-card__photo" />
                    <span className="table-card__body">
                      <strong>Table {t.code}</strong>
                      <small>Seats up to {t.seats}</small>
                      <span>{v.view}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <FieldError id="err-table" message={errors.table} />
        </fieldset>

        {/* 3. Details */}
        <fieldset className="booking__step">
          <legend><span>4</span> Your details</legend>
          <div className="form-grid">
            <div className="field full">
              <label className="field__label" htmlFor="res-name">Full name</label>
              <input id="res-name" className="input" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
              <FieldError message={errors.name} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="res-email">Email</label>
              <input id="res-email" type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors.email)} />
              <FieldError message={errors.email} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="res-phone">Phone</label>
              <input id="res-phone" type="tel" className="input" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={Boolean(errors.phone)} />
              <FieldError message={errors.phone} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="res-occasion">Occasion</label>
              <select id="res-occasion" className="select" value={form.occasion} onChange={(e) => set('occasion', e.target.value)}>
                {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="res-diet">Allergies / dietary <small>(optional)</small></label>
              <input id="res-diet" className="input" placeholder="e.g. nut allergy, vegetarian" value={form.dietary} onChange={(e) => set('dietary', e.target.value)} />
            </div>
            <div className="field full">
              <label className="field__label" htmlFor="res-requests">Special requests <small>(optional)</small></label>
              <textarea id="res-requests" className="textarea" maxLength={400} placeholder="Window table, celebration touches, accessibility needs…" value={form.requests} onChange={(e) => set('requests', e.target.value)} />
            </div>
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="booking__summary" aria-label="Reservation summary">
        <h3>Your reservation</h3>
        <span className="gold-rule" aria-hidden="true" />
        {chosenTable && (
          <figure className="booking__seat">
            <SmartImage src={tableView(chosenTable).photo} alt={`Your seat at table ${chosenTable.code}`} />
            <figcaption>Your seat · Table {chosenTable.code}</figcaption>
          </figure>
        )}
        <dl className="detail-list">
          <div><dt>Date</dt><dd>{form.date ? formatDate(form.date) : '—'}</dd></div>
          <div><dt>Time</dt><dd>{form.time ? formatTime(form.time) : '—'}</dd></div>
          <div><dt>Guests</dt><dd>{form.guests}</dd></div>
          <div><dt>Seating</dt><dd>{areaName(form.area)}</dd></div>
          <div><dt>Table</dt><dd>{chosenTable ? `Table ${chosenTable.code}` : '—'}</dd></div>
          <div><dt>Name</dt><dd>{form.name || '—'}</dd></div>
        </dl>
        <p className="booking__note">
          Parties of 4 or fewer are confirmed instantly; larger parties are reviewed by our team. Free cancellation up to 4 hours before your booking.
        </p>
        <Button variant="primary" block type="submit" disabled={submitting}>
          {submitting ? (<><Loader2 size={16} className="spin" /> {initial ? 'Saving…' : 'Reserving…'}</>) : submitLabel}
        </Button>
        {submitError && <p className="field__error" role="alert"><AlertCircle size={14} aria-hidden="true" /> {submitError}</p>}
      </aside>
    </form>
  );
}
