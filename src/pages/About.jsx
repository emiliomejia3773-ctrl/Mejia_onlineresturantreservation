import { Link } from 'react-router-dom';
import { Heart, Leaf, Sparkles } from 'lucide-react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SmartImage from '../components/SmartImage';
import Button from '../components/Button';
import { img } from '../data/images';

const VALUES = [
  { icon: Leaf, title: 'Honest ingredients', text: 'We buy from growers and fishermen we trust, and cook only what is at its best.' },
  { icon: Heart, title: 'Generous hospitality', text: 'Every guest is treated as a friend of the house, from first greeting to last goodbye.' },
  { icon: Sparkles, title: 'Quiet craft', text: 'Technique that serves the plate and never shows off — precision without fuss.' },
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="Our story" title="About Aurelia" image="warmInterior" text="A neighbourhood restaurant with a fine-dining heart." />

      <section className="section">
        <div className="container editorial">
          <Reveal className="editorial__text">
            <SectionHeading eyebrow="Since 2012" title="Cooking with patience" />
            <p>Aurelia began as a twelve-seat room with a wood-fired oven and a short menu. Our founders wanted a place where the food was serious but the evening was relaxed — where a long lunch could stretch into dusk.</p>
            <p>More than a decade later, the room is bigger but the idea is the same. We still light the oven each afternoon, still change the menu with the market, and still believe the best meals are the ones you do not want to end.</p>
          </Reveal>
          <Reveal className="editorial__media" delay={150}>
            <SmartImage src={img('diningRoom', 1000)} alt="The Aurelia dining room" className="cover-img editorial__img-main" />
            <SmartImage src={img('cosy', 600)} alt="A quiet corner table" className="cover-img editorial__img-small" />
          </Reveal>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHeading eyebrow="Mission & values" title="What we believe" center>
            Our mission is simple: to make every guest feel looked after, and every plate worth remembering.
          </SectionHeading>
          <div className="values-grid">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 100} className="value">
                <Icon size={28} strokeWidth={1.3} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container editorial editorial--reverse">
          <Reveal className="editorial__media" delay={100}>
            <SmartImage src={img('barLounge', 1000)} alt="The Aurelia bar and lounge" className="cover-img editorial__img-main" />
            <SmartImage src={img('chefPlating', 600)} alt="The kitchen pass" className="cover-img editorial__img-small" />
          </Reveal>
          <Reveal className="editorial__text">
            <SectionHeading eyebrow="The dining experience" title="Every seat has a story" />
            <p>Choose the candlelit main room, the garden terrace in summer, or the chef’s counter for a front-row view of the kitchen. For gatherings of six or more, our private room seats up to twelve.</p>
            <p>Our team will happily tailor an evening — from a birthday surprise to a paired tasting for a business dinner.</p>
            <Button to="/book-now" variant="primary">Reserve a Table</Button>
            <p style={{ marginTop: '1rem' }}><Link to="/gallery" className="link-arrow">See the gallery</Link></p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
