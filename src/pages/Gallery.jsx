import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import PageHero from '../components/PageHero';
import SmartImage from '../components/SmartImage';
import { galleryPhotos, img } from '../data/images';

export default function Gallery() {
  const [index, setIndex] = useState(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % galleryPhotos.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, next, prev]);

  return (
    <>
      <PageHero eyebrow="Gallery" title="Moments at Aurelia" image="terrace" text="Rooms, plates and pours. Click any photo to view it larger." />

      <section className="section">
        <div className="container">
          <ul className="masonry">
            {galleryPhotos.map((p, i) => (
              <li key={p.key} className="masonry__item">
                <button type="button" onClick={() => setIndex(i)} aria-label={`Open photo: ${p.caption}`}>
                  <SmartImage src={img(p.key, 800)} alt={p.caption} className="masonry__img" />
                  <span className="masonry__overlay"><ZoomIn size={22} aria-hidden="true" /><span>{p.caption}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <button type="button" className="lightbox__close" onClick={close} aria-label="Close preview"><X size={26} /></button>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={prev} aria-label="Previous photo"><ChevronLeft size={30} /></button>
          <figure className="lightbox__figure">
            <SmartImage key={galleryPhotos[index].key} src={img(galleryPhotos[index].key, 1600)} alt={galleryPhotos[index].caption} className="lightbox__img" loading="eager" />
            <figcaption>{galleryPhotos[index].caption} <span>{index + 1} / {galleryPhotos.length}</span></figcaption>
          </figure>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={next} aria-label="Next photo"><ChevronRight size={30} /></button>
        </div>
      )}
    </>
  );
}
