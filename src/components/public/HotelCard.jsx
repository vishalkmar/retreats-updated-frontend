import { Link } from 'react-router-dom';
import { MapPin, Star, Heart, ShieldCheck, Award } from 'lucide-react';
import { fileUrl } from '../../services/api';

const stripHtml = (s) =>
  (s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Variant:
 *   'horizontal' (default) — image-left, details-right; for list/MMT-style view
 *   'vertical' — image on top, details below; for grid view
 */
export default function HotelCard({ hotel, variant = 'horizontal' }) {
  const teaser = stripHtml(hotel.shortDescription);
  const locLabel = hotel.location?.name || hotel.city?.name || '';

  if (variant === 'vertical') {
    return (
      <article className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg transition group">
        <Link to={`/hotels/${hotel.slug}`} className="relative block aspect-[16/10] bg-slate-100">
          {hotel.primaryImage ? (
            <img
              src={fileUrl(hotel.primaryImage)}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted">
              <MapPin />
            </div>
          )}
          {hotel.isFeatured && (
            <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full">
              FEATURED
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
        <div className="p-4">
          <CardBody hotel={hotel} teaser={teaser} locLabel={locLabel} />
        </div>
      </article>
    );
  }

  // horizontal (list)
  return (
    <article className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition group">
      <Link to={`/hotels/${hotel.slug}`} className="relative md:w-64 h-56 md:h-auto shrink-0 bg-slate-100">
        {hotel.primaryImage ? (
          <img
            src={fileUrl(hotel.primaryImage)}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            <MapPin />
          </div>
        )}
        {hotel.isFeatured && (
          <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full">
            FEATURED
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
        <CardBody hotel={hotel} teaser={teaser} locLabel={locLabel} expanded />
      </div>
    </article>
  );
}

function CardBody({ hotel, teaser, locLabel, expanded }) {
  return (
    <>
      <Link to={`/hotels/${hotel.slug}`} className="block">
        <div className="flex items-start gap-2">
          <h3 className="font-display font-semibold text-lg leading-snug hover:text-brand transition line-clamp-2 flex-1">
            {hotel.name}
          </h3>
          {hotel.starRating ? (
            <span className="text-amber-500 text-sm shrink-0 mt-1">
              {'★'.repeat(hotel.starRating)}
            </span>
          ) : null}
        </div>
      </Link>

      {locLabel && (
        <div className="text-sm text-ink-muted mt-1 flex items-center gap-1">
          <MapPin size={14} /> {locLabel}
        </div>
      )}

      {expanded && teaser && (
        <p className="text-sm text-ink-muted mt-2 line-clamp-2">{teaser}</p>
      )}

      {hotel.facilities?.length > 0 && expanded && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hotel.facilities.slice(0, 4).map((f) => (
            <span key={f.id} className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand">
              {f.name}
            </span>
          ))}
          {hotel.facilities.length > 4 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-ink-muted">
              +{hotel.facilities.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 flex items-end justify-between gap-2">
        <div>
          {Number(hotel.rating) > 0 && (
            <div className="inline-flex items-center gap-1 text-xs mb-1">
              <span className="bg-emerald-600 text-white font-bold rounded px-1.5 py-0.5">
                {Number(hotel.rating).toFixed(1)}
              </span>
              <Star size={10} className="fill-amber-400 text-amber-400" />
            </div>
          )}
          <div>
            <span className="text-xl font-bold text-brand">
              {hotel.currency} {Number(hotel.priceFrom).toLocaleString()}
            </span>
            {hotel.priceOriginal && Number(hotel.priceOriginal) > Number(hotel.priceFrom) && (
              <span className="ml-2 line-through text-ink-muted text-sm">
                {Number(hotel.priceOriginal).toLocaleString()}
              </span>
            )}
            <div className="text-[11px] text-ink-muted">+ taxes & fees · per night</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-stretch">
          <Link to={`/hotels/${hotel.slug}`} className="btn-outline text-xs whitespace-nowrap">
            Details
          </Link>
          <Link to={`/hotels/${hotel.slug}#rooms`} className="btn-primary text-xs whitespace-nowrap">
            Book now
          </Link>
        </div>
      </div>
    </>
  );
}
