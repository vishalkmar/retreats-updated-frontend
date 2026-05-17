import { Link } from 'react-router-dom';
import {
  MapPin, Star, Heart, ShieldCheck, Award, BadgePercent,
  Wifi, Coffee, Utensils, Waves,
} from 'lucide-react';
import { fileUrl } from '../../services/api';

const stripHtml = (s) =>
  (s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Map common facility slugs to a small icon so the card stays scannable.
const FACILITY_ICONS = {
  'free-wifi': Wifi,
  wifi: Wifi,
  cafe: Coffee,
  restaurant: Utensils,
  pool: Waves,
  spa: Waves,
};

/**
 * Variant:
 *   'horizontal' (default) — image-left, details-right; for list/MMT-style view
 *   'vertical' — image on top, details below; for grid view
 */
export default function HotelCard({ hotel, variant = 'horizontal' }) {
  const teaser = stripHtml(hotel.shortDescription);
  const locLabel = hotel.location?.name || hotel.city?.name || '';
  const orig = Number(hotel.priceOriginal || 0);
  const now = Number(hotel.priceFrom || 0);
  const discountPct = orig > now && orig > 0 ? Math.round(((orig - now) / orig) * 100) : 0;
  const ratingLabel = ratingText(Number(hotel.rating || 0));

  if (variant === 'vertical') {
    return (
      <article className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-lg transition group">
        <Link to={`/hotels/${hotel.slug}`} className="relative block aspect-[16/10] bg-slate-100 overflow-hidden">
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
          <Badges hotel={hotel} discountPct={discountPct} />
          <WishlistBtn />
          <RatingOverlay hotel={hotel} />
        </Link>
        <div className="p-4">
          <CardBody hotel={hotel} teaser={teaser} locLabel={locLabel} ratingLabel={ratingLabel} />
        </div>
      </article>
    );
  }

  // horizontal (list)
  return (
    <article className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition group">
      <Link to={`/hotels/${hotel.slug}`} className="relative md:w-72 h-56 md:h-auto shrink-0 bg-slate-100 overflow-hidden">
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
        <Badges hotel={hotel} discountPct={discountPct} />
        <WishlistBtn />
        <RatingOverlay hotel={hotel} />
      </Link>

      <div className="flex-1 p-5 flex flex-col">
        <CardBody hotel={hotel} teaser={teaser} locLabel={locLabel} ratingLabel={ratingLabel} expanded />
      </div>
    </article>
  );
}

function Badges({ hotel, discountPct }) {
  return (
    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
      {discountPct > 0 && (
        <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
          <BadgePercent size={11} /> {discountPct}% OFF
        </span>
      )}
      {hotel.isFeatured && (
        <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full shadow">
          FEATURED
        </span>
      )}
    </div>
  );
}

function WishlistBtn() {
  return (
    <button
      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
      aria-label="Save to wishlist"
      onClick={(e) => e.preventDefault()}
    >
      <Heart size={16} />
    </button>
  );
}

function RatingOverlay({ hotel }) {
  if (!(Number(hotel.rating) > 0)) return null;
  return (
    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold rounded-md px-2 py-1 shadow">
      <Star size={11} className="fill-white" /> {Number(hotel.rating).toFixed(1)}
      {hotel.reviewCount > 0 && (
        <span className="opacity-90 font-normal">· {hotel.reviewCount}</span>
      )}
    </div>
  );
}

function CardBody({ hotel, teaser, locLabel, ratingLabel, expanded }) {
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
          {hotel.address && <span className="text-ink-muted/70"> · {hotel.address.length > 32 ? hotel.address.slice(0, 32) + '…' : hotel.address}</span>}
        </div>
      )}

      {/* Trust strip */}
      <div className="text-xs mt-1.5 flex items-center gap-3 flex-wrap">
        {ratingLabel && (
          <span className="font-semibold text-emerald-700">{ratingLabel}</span>
        )}
        <span className="inline-flex items-center gap-1 text-emerald-600">
          <ShieldCheck size={12} /> Free Cancellation
        </span>
        {hotel.isGoldHost && (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <Award size={12} /> Gold host
          </span>
        )}
      </div>

      {expanded && teaser && (
        <p className="text-sm text-ink-muted mt-2 line-clamp-2 italic border-l-2 border-brand-light pl-3">
          “{teaser}”
        </p>
      )}

      {/* Facilities row — first 5 with icons where possible */}
      {hotel.facilities?.length > 0 && expanded && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {hotel.facilities.slice(0, 5).map((f) => {
            const Icon = FACILITY_ICONS[f.slug];
            return (
              <span key={f.id} className="text-[11px] px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-medium inline-flex items-center gap-1">
                {Icon && <Icon size={11} />}
                {f.name}
              </span>
            );
          })}
          {hotel.facilities.length > 5 && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-ink-muted">
              +{hotel.facilities.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Nearby chips — show 3 if any */}
      {hotel.nearbyPlaces?.length > 0 && expanded && (
        <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-ink-muted">
          <span className="font-medium">Near:</span>
          {hotel.nearbyPlaces.slice(0, 3).map((n) => (
            <span key={n.id}>{n.name}</span>
          )).reduce((acc, el, i, arr) => (i === 0 ? [el] : [...acc, <span key={`s-${i}`}>·</span>, el]), [])}
          {hotel.nearbyPlaces.length > 3 && (
            <span>· +{hotel.nearbyPlaces.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between gap-2">
        <div>
          <div className="text-[11px] text-ink-muted uppercase tracking-wide">From</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand">
              {hotel.currency} {Number(hotel.priceFrom).toLocaleString()}
            </span>
            {hotel.priceOriginal && Number(hotel.priceOriginal) > Number(hotel.priceFrom) && (
              <span className="text-sm line-through text-ink-muted">
                {Number(hotel.priceOriginal).toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-[10px] text-ink-muted">+ taxes & fees · per night</div>
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

// MMT-style rating buckets
function ratingText(r) {
  if (!r) return '';
  if (r >= 4.5) return 'Excellent';
  if (r >= 4) return 'Very Good';
  if (r >= 3.5) return 'Good';
  if (r >= 3) return 'Pleasant';
  return '';
}
