import { Link } from 'react-router-dom';
import { MapPin, Star, Heart, Calendar, ShieldCheck, Award, Flame } from 'lucide-react';
import { fileUrl } from '../../services/api';

export default function PackageCard({ pkg }) {
  const reviewsLine =
    pkg.reviewCount > 0
      ? `${Number(pkg.rating).toFixed(2)} (${pkg.reviewCount} reviews)`
      : 'New';

  return (
    <article className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition group">
      <Link
        to={`/retreats/${pkg.slug}`}
        className="relative md:w-64 h-56 md:h-auto shrink-0 bg-slate-100"
      >
        {pkg.primaryImage ? (
          <img
            src={fileUrl(pkg.primaryImage)}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            <MapPin />
          </div>
        )}
        {pkg.priceOriginal && Number(pkg.priceOriginal) > Number(pkg.priceFrom) && (
          <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full">
            FREE GIFT
          </span>
        )}
        {pkg.isGoldHost && (
          <span className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 border border-amber-300">
            <Award size={12} /> Gold host
          </span>
        )}
        <button
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
          aria-label="Save to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={16} />
        </button>
      </Link>

      <div className="flex-1 p-5 flex flex-col">
        <Link to={`/retreats/${pkg.slug}`} className="block">
          <h3 className="font-display font-semibold text-lg leading-snug hover:text-brand transition line-clamp-2">
            {pkg.name}
          </h3>
        </Link>

        {pkg.locationDetail && (
          <div className="text-sm text-ink-muted mt-1 flex items-center gap-1">
            <MapPin size={14} /> {pkg.locationDetail}
          </div>
        )}

        <div className="text-xs text-ink-muted mt-1 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} /> {pkg.timing || (pkg.availableAllYear ? 'Available all year round' : '')}
          </span>
          {pkg.interestedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Flame size={12} /> {pkg.interestedCount} people interested
            </span>
          )}
          {pkg.freeCancellation && (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <ShieldCheck size={12} /> FREE Cancellation
            </span>
          )}
        </div>

        {pkg.shortDescription && (
          <p className="text-sm text-ink-muted mt-3 line-clamp-2 italic border-l-2 border-brand-light pl-3">
            “{pkg.shortDescription}”
          </p>
        )}

        {pkg.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pkg.categories.slice(0, 4).map((c) => (
              <span key={c.id} className="text-[11px] px-2.5 py-0.5 rounded-full bg-wellness/10 text-wellness font-medium">
                {c.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-xs text-ink-muted">From</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-brand">
                {pkg.currency} {Number(pkg.priceFrom).toLocaleString()}
              </span>
              {pkg.priceOriginal && Number(pkg.priceOriginal) > Number(pkg.priceFrom) && (
                <span className="text-sm line-through text-ink-muted">
                  {Number(pkg.priceOriginal).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-ink-muted">
              <Star size={12} className="fill-accent text-accent" />
              {reviewsLine}
            </div>
          </div>

          <div className="flex gap-2">
            <Link to={`/retreats/${pkg.slug}`} className="btn-outline text-sm py-2 px-4">
              Details
            </Link>
            <Link to={`/retreats/${pkg.slug}#book`} className="btn-primary text-sm py-2 px-5">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
