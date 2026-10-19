import { Link } from 'react-router-dom';

/**
 * Renders a router <Link> when `to` is given, otherwise a <button>.
 * variant: primary | gold | outline | light | danger   size: md | sm
 */
export default function Button({ to, variant = 'primary', size = 'md', block = false, className = '', children, ...rest }) {
  const classes = ['btn', `btn--${variant}`, size === 'sm' ? 'btn--sm' : '', block ? 'btn--block' : '', className]
    .filter(Boolean)
    .join(' ');
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
