import { useState } from 'react';

/** <img> with a graceful gradient fallback when the photo fails to load. */
export default function SmartImage({ src, alt, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <span>{alt}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} {...rest} />;
}
