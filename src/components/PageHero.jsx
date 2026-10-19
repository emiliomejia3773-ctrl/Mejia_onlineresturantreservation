import SmartImage from './SmartImage';
import { img } from '../data/images';

/** Compact image banner used at the top of inner pages. */
export default function PageHero({ eyebrow, title, text, image = 'diningRoom' }) {
  return (
    <section className="page-hero">
      <div className="page-hero__media">
        <SmartImage src={img(image, 1800)} alt="" className="cover-img" loading="eager" />
        <div className="page-hero__overlay" />
      </div>
      <div className="container page-hero__content">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  );
}
