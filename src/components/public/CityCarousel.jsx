import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, MapPin, Calendar, Users, Star,
  ShieldCheck, ArrowRight,
} from 'lucide-react';
import api, { fileUrl } from '../../services/api';

/**
 * City carousel + packages-for-active-city panel.
 *
 *  - Top: pill-shaped city carousel (centered) — defaults to the city with
 *    the most published packages.
 *  - Below: a grid of beautifully styled package cards for that city.
 */
export default function CityCarousel() {
  const [cities, setCities] = useState([]);
  const [packagesByCity, setPackagesByCity] = useState({}); // cityId -> [pkg]
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const cityRes = await api.get('/cities');
        const cityItems = cityRes.data?.data?.items || [];
        if (cancelled) return;
        setCities(cityItems);

        // Fetch packages for each city in parallel (small N — admin set)
        const map = {};
        await Promise.all(
          cityItems.map((c) =>
            api
              .get('/packages', { params: { city: c.slug, limit: 12 } })
              .then((r) => { map[c.id] = r.data?.data?.items || []; })
              .catch(() => { map[c.id] = []; })
          )
        );
        if (cancelled) return;
        setPackagesByCity(map);

        // Default-select the city with the most packages (or first non-empty, or first)
        const sorted = [...cityItems].sort(
          (a, b) => (map[b.id]?.length || 0) - (map[a.id]?.length || 0)
        );
        if (sorted.length) setActiveId(sorted[0].id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const activeCity = cities.find((c) => c.id === activeId);
  const activePackages = useMemo(
    () => (activeId ? packagesByCity[activeId] || [] : []),
    [activeId, packagesByCity]
  );

  if (loading) {
    return (
      <section className="container-app py-12">
        <div className="text-center mb-10">
          <h2 className="heading">
            Choose your <span className="heading-accent">Destination</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-slate-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!cities.length) return null;

  return (
    <section className="container-app py-12 md:py-16">
      <div className="text-center mb-8">
        <h2 className="heading">
          Choose your <span className="heading-accent">Destination</span>
        </h2>
        <p className="text-ink-muted mt-3 max-w-xl mx-auto">
          Handpicked cities and regions where unforgettable retreats await.
        </p>
      </div>

      {/* City strip — flex-wrap centered.  Always horizontally centered;
          falls back to horizontal scroll on small screens. */}
      <div className="mb-10 flex flex-wrap justify-center gap-4 sm:gap-5 max-md:flex-nowrap max-md:overflow-x-auto max-md:justify-start max-md:px-4 max-md:-mx-4 max-md:pb-2">
        {cities.map((c) => {
          const active = c.id === activeId;
          const count = packagesByCity[c.id]?.length || 0;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className="group shrink-0 flex flex-col items-center text-center w-28 sm:w-32 lg:w-36"
            >
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-4 shadow-card relative transition ${
                  active ? 'border-brand ring-4 ring-brand/20' : 'border-white'
                }`}
              >
                {c.imageUrl ? (
                  <img
                    src={fileUrl(c.imageUrl)}
                    alt={c.name}
                    className={`w-full h-full object-cover transition duration-500 ${active ? 'scale-105' : 'group-hover:scale-110'}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-white">
                    <MapPin size={28} />
                  </div>
                )}
                {count > 0 && (
                  <span className="absolute bottom-1 right-1 text-[10px] px-2 py-0.5 rounded-full bg-white/95 text-brand font-bold shadow">
                    {count}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className={`font-semibold text-sm ${active ? 'text-brand' : ''}`}>{c.name}</div>
                {c.country && (
                  <div className="text-xs text-ink-muted">{c.country}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active city packages */}
      {activeCity && (
        <div>
          <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-ink-muted">
                Retreats in
              </div>
              <h3 className="text-xl md:text-2xl font-display font-semibold inline-flex items-center gap-2">
                {activeCity.name}
                {activeCity.country && (
                  <span className="text-sm text-ink-muted font-normal">· {activeCity.country}</span>
                )}
              </h3>
            </div>
            <Link
              to={`/retreats?city=${activeCity.slug}`}
              className="text-sm text-brand font-semibold hover:underline inline-flex items-center gap-1"
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {activePackages.length === 0 ? (
            <div className="bg-surface-alt rounded-2xl p-12 text-center text-ink-muted">
              No retreats yet for <strong>{activeCity.name}</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activePackages.map((p) => (
                <CityPackageCard key={p.id} pkg={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CityPackageCard({ pkg }) {
  const discount =
    pkg.priceOriginal && Number(pkg.priceOriginal) > Number(pkg.priceFrom)
      ? Math.round(
          ((Number(pkg.priceOriginal) - Number(pkg.priceFrom)) / Number(pkg.priceOriginal)) * 100
        )
      : 0;

  return (
    <Link
      to={`/retreats/${pkg.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {pkg.primaryImage ? (
          <img
            src={fileUrl(pkg.primaryImage)}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted bg-gradient-to-br from-brand-light/20 to-wellness-light/20">
            <MapPin size={36} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />

        {discount > 0 && (
          <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 font-bold shadow uppercase tracking-wider">
            -{discount}%
          </span>
        )}
        {pkg.rating > 0 && (
          <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-amber-700 font-bold flex items-center gap-1 shadow">
            <Star size={10} className="fill-amber-500 text-amber-500" />
            {Number(pkg.rating).toFixed(1)}
          </span>
        )}

        {pkg.categories?.[0] && (
          <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest text-white font-bold">
            {pkg.categories[0].name}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-semibold leading-snug line-clamp-2 group-hover:text-brand transition">
          {pkg.name}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted flex-wrap">
          {pkg.locationDetail && (
            <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
              <MapPin size={12} /> {pkg.locationDetail}
            </span>
          )}
          {(pkg.durationDays || pkg.durationNights) && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {pkg.durationDays}d / {pkg.durationNights}n
            </span>
          )}
          {(pkg.minGroupSize || pkg.maxGroupSize) && (
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {pkg.minGroupSize}-{pkg.maxGroupSize}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t mt-3">
          <div>
            <div className="text-[10px] uppercase text-ink-muted">From</div>
            <div className="text-lg font-bold text-brand leading-tight">
              {pkg.currency || 'INR'} {Number(pkg.priceFrom || 0).toLocaleString()}
            </div>
            {pkg.priceOriginal && Number(pkg.priceOriginal) > Number(pkg.priceFrom) && (
              <div className="text-xs text-ink-muted line-through">
                {Number(pkg.priceOriginal).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {pkg.freeCancellation && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <ShieldCheck size={11} /> Free cancellation
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:gap-2 transition-all">
              View <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
