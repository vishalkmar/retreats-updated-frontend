import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * "Not sure which retreat is perfect for you?" CTA strip.
 *
 * Visual: left-aligned heading + sub-copy + primary button on a soft surface,
 * right-side 4-image staggered collage. Sits between the Featured Retreats
 * grid and the Video Testimonials band on the home page.
 *
 * Images are loaded from `/personalised/*.jpg` in /public — placeholders for
 * now. Admin can drop in their own files at those paths without code changes,
 * or this can be promoted to an admin-managed section later.
 */
const COLLAGE = [
  { src: '/personalised/1.jpg', cls: 'col-start-1 row-start-1 -mt-4 sm:mt-0' },
  { src: '/personalised/2.jpg', cls: 'col-start-2 row-start-1 mt-6 sm:mt-12 -ml-2 sm:-ml-6' },
  { src: '/personalised/3.jpg', cls: 'col-start-1 row-start-2 mt-2 sm:mt-4 ml-2 sm:ml-6' },
  { src: '/personalised/4.jpg', cls: 'col-start-2 row-start-2 -mt-2 sm:-mt-4' },
];

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e5e7eb"/><circle cx="50" cy="40" r="14" fill="%2394a3b8"/><rect x="22" y="58" width="56" height="22" rx="11" fill="%2394a3b8"/></svg>`
);

export default function PersonalisedRecommendationCTA() {
  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Soft curved background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-alt via-white to-surface-alt -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/5 -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-wellness/5 -z-10"
      />

      <div className="container-app grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — text + CTA */}
        <div className="max-w-md">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight text-ink">
            Not sure which retreat is perfect for you?
          </h2>
          <p className="mt-4 text-base md:text-lg text-ink-muted leading-relaxed">
            Let our team of wellness experts hand-pick a few options for you.
            It's free and we'll get back to you within 24 hours.
          </p>

          <Link
            to="/retreats"
            className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-brand to-wellness text-white font-semibold shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:translate-y-[-1px] transition"
          >
            Get Personalised Recommendations
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Right — 4-image collage */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-md ml-auto w-full">
          {COLLAGE.map((c, i) => (
            <div
              key={i}
              className={`${c.cls} aspect-square rounded-2xl overflow-hidden shadow-card bg-slate-200`}
            >
              <img
                src={c.src}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = FALLBACK; }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
