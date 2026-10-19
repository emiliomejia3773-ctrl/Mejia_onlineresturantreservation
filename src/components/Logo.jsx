import { Link } from 'react-router-dom';
import { RESTAURANT } from '../data/siteData';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label={`${RESTAURANT.name} ${RESTAURANT.tagline} — home`}>
      <span className="logo__mark" aria-hidden="true">
        <span>A</span>
      </span>
      <span className="logo__text">
        <span className="logo__name">{RESTAURANT.name.toUpperCase()}</span>
        <span className="logo__tag">{RESTAURANT.tagline}</span>
      </span>
    </Link>
  );
}
