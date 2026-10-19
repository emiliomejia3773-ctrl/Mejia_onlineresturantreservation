import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import PageHero from '../components/PageHero';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import { FAQS, HOURS_SUMMARY, RESTAURANT } from '../data/siteData';
import { api } from '../api';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [sendError, setSendError] = useState('');

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (!form.subject.trim()) e.subject = 'Please add a subject.';
    if (form.message.trim().length < 10) e.message = 'Your message should be at least 10 characters.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus('sending');
    setSendError('');
    try {
      await api.post('/contact', form);
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      setStatus('idle');
      setSendError(err.message);
    }
  };

  const Err = ({ m }) => (m ? <span className="field__error" role="alert"><AlertCircle size={14} aria-hidden="true" /> {m}</span> : null);

  return (
    <>
      <PageHero eyebrow="Get in touch" title="Contact" image="cosy" text="Questions, private events or special requests — we would love to hear from you." />

      <section className="section">
        <div className="container contact">
          <div className="contact__info">
            <SectionHeading eyebrow="Find us" title="Visit Aurelia" />
            <ul className="contact__list">
              <li><MapPin size={20} aria-hidden="true" /><span>{RESTAURANT.address}<br />{RESTAURANT.city}</span></li>
              <li><Phone size={20} aria-hidden="true" /><a href={`tel:${RESTAURANT.phone.replace(/[^+\d]/g, '')}`}>{RESTAURANT.phone}</a></li>
              <li><Mail size={20} aria-hidden="true" /><a href={`mailto:${RESTAURANT.email}`}>{RESTAURANT.email}</a></li>
              <li>
                <Clock size={20} aria-hidden="true" />
                <span>{HOURS_SUMMARY.map((h) => <span key={h.days} className="contact__hours"><span>{h.days}</span><span>{h.hours}</span></span>)}</span>
              </li>
            </ul>
            <div className="map-placeholder" role="img" aria-label="Map placeholder showing the restaurant location">
              <MapPin size={34} strokeWidth={1.3} />
              <strong>{RESTAURANT.name} {RESTAURANT.tagline}</strong>
              <span>{RESTAURANT.address}</span>
              <em>Map placeholder (demo)</em>
            </div>
          </div>

          <form className="contact__form" onSubmit={submit} noValidate>
            <h3>Send us a message</h3>
            {status === 'sent' && (
              <div className="alert alert--success" role="status"><CheckCircle2 size={18} /> Thank you! Your message has been sent. We will get back to you soon.</div>
            )}
            {sendError && <div className="alert alert--error" role="alert"><AlertCircle size={18} /> {sendError}</div>}
            <div className="form-grid">
              <div className="field">
                <label className="field__label" htmlFor="c-name">Name</label>
                <input id="c-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} autoComplete="name" />
                <Err m={errors.name} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-email">Email</label>
                <input id="c-email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors.email)} autoComplete="email" />
                <Err m={errors.email} />
              </div>
              <div className="field full">
                <label className="field__label" htmlFor="c-subject">Subject</label>
                <input id="c-subject" className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} aria-invalid={Boolean(errors.subject)} />
                <Err m={errors.subject} />
              </div>
              <div className="field full">
                <label className="field__label" htmlFor="c-message">Message</label>
                <textarea id="c-message" className="textarea" value={form.message} onChange={(e) => set('message', e.target.value)} aria-invalid={Boolean(errors.message)} />
                <Err m={errors.message} />
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={status === 'sending'}>
              {status === 'sending' ? (<><Loader2 size={16} className="spin" /> Sending…</>) : 'Send message'}
            </Button>
          </form>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHeading eyebrow="Good to know" title="Frequently asked" center />
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
