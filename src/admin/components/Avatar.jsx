import { initials } from '../adminData';

export default function Avatar({ name, size = 'md' }) {
  return (
    <span className={`adm-avatar adm-avatar--${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
