export default function SectionHeading({ eyebrow, title, children, center = false }) {
  return (
    <div className={`section-heading ${center ? 'section-heading--center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <span className="gold-rule" aria-hidden="true" />
      {children && <p>{children}</p>}
    </div>
  );
}
