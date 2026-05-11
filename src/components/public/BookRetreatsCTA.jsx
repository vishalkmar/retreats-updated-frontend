import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

/**
 * Pre-footer call-to-action band. Appears on every public page just above
 * the footer, nudging visitors towards the retreats listing.
 */
export default function BookRetreatsCTA() {
  return (
    <section className="container-app py-12 md:py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-dark to-wellness-dark text-white p-1.5 shadow-2xl">
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none ring-1 ring-white/20" />

        <div className="relative rounded-[1.75rem] p-8 md:p-14 grid md:grid-cols-5 gap-8 items-center">
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-wellness-light/20 blur-3xl pointer-events-none"
          />

          <div className="md:col-span-3 relative z-10">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-bold bg-white/15 px-3 py-1.5 rounded-full mb-4">
              <Sparkles size={12} /> Find your retreat
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight">
              Ready to unplug and recharge?
            </h3>
            <p className="mt-3 text-white/85 text-base md:text-lg max-w-xl">
              Browse our hand-picked yoga, ayurveda and wellness retreats — book the one that
              feels right and step into the version of you you've been waiting to meet.
            </p>
          </div>

          <div className="md:col-span-2 relative z-10 flex md:justify-end">
            <Link
              to="/retreats"
              className="group inline-flex items-center gap-3 bg-white text-brand font-bold px-6 py-4 rounded-full shadow-lg hover:bg-wellness hover:text-white transition w-full md:w-auto justify-center"
            >
              <Compass size={18} />
              Book your retreat
              <span className="w-8 h-8 rounded-full bg-brand/10 group-hover:bg-white/20 flex items-center justify-center transition">
                <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
