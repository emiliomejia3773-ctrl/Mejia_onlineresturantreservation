import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import Reveal from '../components/Reveal';
import SmartImage from '../components/SmartImage';
import PageHero from '../components/PageHero';
import { img } from '../data/images';
import { MENU_CATEGORIES, MENU_ITEMS } from '../data/menuData';

export default function Menu() {
  const [category, setCategory] = useState('all');

  const items = useMemo(
    () => (category === 'all' ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === category)),
    [category]
  );
  const featured = MENU_ITEMS.filter((i) => i.featured);

  return (
    <>
      <PageHero eyebrow="Seasonal menu" title="The Menu" image="plated" text="Cooked to order from ingredients delivered each morning. Menu changes with the seasons." />

      <section className="section section--cream">
        <div className="container">
          <h2 className="menu-subhead">Chef’s selection</h2>
          <div className="featured-strip">
            {featured.map((d) => (
              <article key={d.id} className="featured-chip">
                <SmartImage src={img(d.image, 300)} alt={d.name} className="cover-img" />
                <div>
                  <span className="featured-chip__tag"><Star size={12} fill="currentColor" /> Recommended</span>
                  <h3>{d.name}</h3>
                  <span className="price">${d.price}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="filters" role="tablist" aria-label="Menu categories">
            {MENU_CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={category === c.id} className={`filter ${category === c.id ? 'is-active' : ''}`} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="menu-list">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={(i % 4) * 60}>
                <article className="menu-item">
                  <div className="menu-item__img"><SmartImage src={img(item.image, 500)} alt={item.name} className="cover-img" /></div>
                  <div className="menu-item__body">
                    <div className="menu-item__row">
                      <h3>{item.name}</h3>
                      <span className="menu-item__dots" aria-hidden="true" />
                      <span className="price">${item.price}</span>
                    </div>
                    <p>{item.description}</p>
                    {item.featured && <span className="featured-chip__tag"><Star size={12} fill="currentColor" /> Chef’s pick</span>}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <p className="menu-note">Please inform us of any allergies when booking. Menu and prices are sample content for this demo.</p>
          <div className="center-row"><Link to="/book-now" className="btn btn--primary">Reserve a Table</Link></div>
        </div>
      </section>
    </>
  );
}
