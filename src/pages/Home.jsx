import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, Clock, Leaf, MapPin, Quote, Star, Wine } from 'lucide-react';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SmartImage from '../components/SmartImage';
import { img, galleryPhotos } from '../data/images';
import { MENU_ITEMS } from '../data/menuData';
import { HOURS_SUMMARY, RESTAURANT, TESTIMONIALS } from '../data/siteData';

const EXPERIENCE = [
  { icon: Leaf, title: 'Seasonal & Local', text: 'Menus shaped by the farms and fishermen we know by name.' },
  { icon: Wine, title: 'Curated Cellar', text: 'Over 200 labels, with pairings chosen by our sommelier.' },
  { icon: ChefHat, title: 'Chef-Led Kitchen', text: 'Open to view from the counter, precise in every detail.' },
];

export default function Home() {
  const featured = MENU_ITEMS.filter((i) => i.featured).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero__media">
          <SmartImage src={img('hero', 2000)} alt="Aurelia dining room" className="cover-img" loading="eager" fetchpriority="high" />
          <div className="hero__overlay" />
        </div>
        <div className="container hero__content">
          <span className="eyebrow hero__eyebrow">Seasonal fine dining · Est. 2012</span>
          <h1>An evening, <em>unhurried</em>.</h1>
          <p className="hero__lead">Wood-fired cooking, a considered wine list and warm hospitality in the heart of Old Town.</p>
          <div className="hero__cta">
            <Button to="/book-now" variant="gold">Reserve a Table</Button>
            <Button to="/menu" variant="light">View the Menu</Button>
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true"><span /></div>
      </section>

      {/* Introduction */}
      <section className="section">
        <div className="container split">
          <Reveal className="split__text">
            <SectionHeading eyebrow="Welcome to Aurelia" title="Where simple things are done beautifully">
              For over a decade we have cooked with patience and restraint. Our kitchen lets the ingredient lead, our cellar keeps the glass full, and our team makes sure your table is the best seat in the house.
            </SectionHeading>
            <Link to="/about" className="link-arrow">Our story <ArrowRight size={16} /></Link>
          </Reveal>
          <Reveal className="split__media split__media--stack" delay={150}>
            <SmartImage src={img('tableSetting', 900)} alt="A table set for dinner" className="cover-img split__img-a" />
            <SmartImage src={img('chefPlating', 700)} alt="Chef plating a dish" className="cover-img split__img-b" />
          </Reveal>
        </div>
      </section>

      {/* Featured dishes */}
      <section className="section section--cream">
        <div className="container">
          <SectionHeading eyebrow="Signature plates" title="Featured dishes" center>
            A glimpse of what is on the table this season.
          </SectionHeading>
          <div className="dish-grid">
            {featured.map((dish, i) => (
              <Reveal key={dish.id} delay={i * 90}>
                <article className="dish-card">
                  <div className="dish-card__img"><SmartImage src={img(dish.image, 700)} alt={dish.name} className="cover-img" /></div>
                  <div className="dish-card__body">
                    <div className="dish-card__row"><h3>{dish.name}</h3><span className="price">${dish.price}</span></div>
                    <p>{dish.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="center-row"><Button to="/menu" variant="outline">Explore the full menu</Button></div>
        </div>
      </section>

      {/* Dining experience */}
      <section className="section section--dark">
        <div className="container">
          <SectionHeading eyebrow="The experience" title="Dining, considered" center>
            From the first welcome to the last coffee, every detail is deliberate.
          </SectionHeading>
          <div className="experience-grid">
            {EXPERIENCE.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 100} className="experience">
                <Icon size={30} strokeWidth={1.2} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery preview */}
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Gallery" title="A taste of the room" />
          <div className="preview-grid">
            {galleryPhotos.slice(0, 6).map((p, i) => (
              <Reveal key={p.key} delay={i * 70} className={`preview-grid__item preview-grid__item--${i + 1}`}>
                <Link to="/gallery" aria-label={`${p.caption} — open gallery`}>
                  <SmartImage src={img(p.key, 800)} alt={p.caption} className="cover-img" />
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="center-row"><Link to="/gallery" className="link-arrow">View full gallery <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section--cream">
        <div className="container">
          <SectionHeading eyebrow="Kind words" title="From our guests" center />
          <div className="testimonials">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <figure className="testimonial">
                  <Quote size={28} strokeWidth={1.2} aria-hidden="true" />
                  <blockquote>{t.quote}</blockquote>
                  <div className="stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={14} fill="currentColor" />)}</div>
                  <figcaption><strong>{t.name}</strong><span>{t.occasion}</span></figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Hours & location */}
      <section className="section">
        <div className="container visit">
          <Reveal className="visit__info">
            <SectionHeading eyebrow="Visit us" title="Hours & location" />
            <div className="visit__block">
              <h4><Clock size={16} aria-hidden="true" /> Opening hours</h4>
              <ul>{HOURS_SUMMARY.map((h) => <li key={h.days}><span>{h.days}</span><span>{h.hours}</span></li>)}</ul>
            </div>
            <div className="visit__block">
              <h4><MapPin size={16} aria-hidden="true" /> Address</h4>
              <p>{RESTAURANT.address}<br />{RESTAURANT.city}</p>
            </div>
            <Button to="/book-now" variant="primary">Reserve a Table</Button>
          </Reveal>
          <Reveal className="visit__media" delay={150}>
            <SmartImage src={img('terrace', 1000)} alt="Aurelia garden terrace" className="cover-img" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
