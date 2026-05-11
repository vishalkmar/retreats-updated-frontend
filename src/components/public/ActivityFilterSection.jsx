import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity as ActivityIcon, ChevronRight, Loader2, MapPin,
  Calendar, Users, Star, ShieldCheck, ArrowRight,
} from 'lucide-react';
import api, { fileUrl } from '../../services/api';

/**
 * Activity-based filter section.
 *
 *  - Top: pill-style activity carousel (centered when slides fit) — defaults
 *    to the activity with the most published packages.
 *  - Below: grid of package cards for the selected activity.
 */
export default function ActivityFilterSection() {
  const [activities, setActivities] = useState([]);
  const [packagesByActivity, setPackagesByActivity] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await api.get('/activities');
        const items = res.data?.data?.items || [];
        if (cancelled) return;
        setActivities(items);

        const map = {};
        await Promise.all(
          items.map((a) =>
            api
              .get('/packages', { params: { activity: a.slug, limit: 12 } })
              .then((r) => { map[a.id] = r.data?.data?.items || []; })
              .catch(() => { map[a.id] = []; })
          )
        );
        if (cancelled) return;
        setPackagesByActivity(map);

        const sorted = [...items].sort(
          (a, b) => (map[b.id]?.length || 0) - (map[a.id]?.length || 0)
        );
        if (sorted.length) setActiveId(sorted[0].id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const activeActivity = activities.find((a) => a.id === activeId);
  const activePackages = useMemo(
    () => (activeId ? packagesByActivity[activeId] || [] : []),
    [activeId, packagesByActivity]
  );

  if (!loading && !activities.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="heading">
            Find by <span className="heading-accent">Activity</span>
          </h2>
          <p className="text-ink-muted mt-3 max-w-xl mx-auto">
            From sunrise yoga to silent meditation — pick what calls you.
          </p>
        </div>

        {/* Activity strip — flex-wrap centered.  Always sits in the middle of
            the section, regardless of how many cards are present.  Wraps to
            the next row when there are too many to fit on one line, and
            switches to horizontal scroll on very narrow viewports. */}
        <div className="mb-10 flex flex-wrap justify-center gap-4 max-md:flex-nowrap max-md:overflow-x-auto max-md:justify-start max-md:px-4 max-md:-mx-4 max-md:pb-2">
          {(loading ? Array.from({ length: 8 }) : activities).map((a, idx) => {
            if (loading) {
              return (
                <div key={idx} className="w-36 h-28 bg-slate-100 rounded-2xl animate-pulse shrink-0" />
              );
            }
            const active = a.id === activeId;
            const count = packagesByActivity[a.id]?.length || 0;
            return (
              <button
                key={a.id}
                onClick={() => setActiveId(a.id)}
                className={`w-36 sm:w-40 shrink-0 group rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white shadow-sm ${
                  active
                    ? 'border-brand shadow-lg -translate-y-0.5'
                    : 'border-slate-100 hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {a.imageUrl ? (
                    <img
                      src={fileUrl(a.imageUrl)}
                      alt={a.name}
                      className={`w-full h-full object-cover transition duration-500 ${active ? 'scale-105' : 'group-hover:scale-105'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand bg-gradient-to-br from-brand/5 to-wellness/10">
                      <ActivityIcon size={28} />
                    </div>
                  )}
                  {count > 0 && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/95 text-brand font-bold shadow">
                      {count}
                    </span>
                  )}
                  {active && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold shadow ring-2 ring-white">
                      ✓
                    </span>
                  )}
                </div>
                <div className={`px-2 py-2.5 text-center text-sm font-semibold transition ${active ? 'bg-brand text-white' : 'bg-white text-ink'}`}>
                  {a.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Packages for selected activity */}
        {activeActivity && (
          <div>
            <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
              <h3 className="text-xl md:text-2xl font-display font-semibold">
                Top retreats for <span className="text-brand">{activeActivity.name}</span>
              </h3>
              <Link
                to={`/retreats?activity=${activeActivity.slug}`}
                className="text-sm text-brand font-semibold hover:underline inline-flex items-center gap-1"
              >
                See all <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40 text-ink-muted">
                <Loader2 className="animate-spin" />
              </div>
            ) : activePackages.length === 0 ? (
              <div className="bg-surface-alt rounded-2xl p-12 text-center text-ink-muted">
                No retreats yet for <strong>{activeActivity.name}</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activePackages.map((p) => <ActivityPackageCard key={p.id} pkg={p} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityPackageCard({ pkg }) {
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
            <ActivityIcon size={36} />
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
