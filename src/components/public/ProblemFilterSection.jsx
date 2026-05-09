import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, HeartPulse, Loader2, Star, Sparkles } from 'lucide-react';
import api, { fileUrl } from '../../services/api';

/**
 * Problem-based filter section (image 2 flow):
 *   - left  : list of problems
 *   - right : cities that have at least one wellness package tagged with the
 *             selected problem (derived from /packages?problem=<slug>)
 *   - click a city card → /retreats?problem=<slug>&city=<slug>
 */
export default function ProblemFilterSection() {
  const [problems, setProblems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(true);

  const [packagesForProblem, setPackagesForProblem] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.get('/problems')
      .then((res) => {
        const items = res.data?.data?.items || [];
        if (cancelled) return;
        setProblems(items);
        if (items.length) setActiveId(items[0].id);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingProblems(false); });
    return () => { cancelled = true; };
  }, []);

  // Whenever active problem changes, fetch packages for it
  useEffect(() => {
    if (!activeId) return;
    const active = problems.find((p) => p.id === activeId);
    if (!active) return;

    let cancelled = false;
    setLoadingPackages(true);
    api.get('/packages', { params: { problem: active.slug, limit: 60 } })
      .then((res) => {
        if (!cancelled) setPackagesForProblem(res.data?.data?.items || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingPackages(false); });
    return () => { cancelled = true; };
  }, [activeId, problems]);

  // Derive unique cities + count + lowest price + average rating from the packages list
  const citiesForActive = useMemo(() => {
    const map = new Map();
    packagesForProblem.forEach((p) => {
      if (!p.city) return;
      const key = p.city.id;
      if (!map.has(key)) {
        map.set(key, {
          city: p.city,
          count: 0,
          minPrice: Infinity,
          maxRating: 0,
          currency: p.currency || 'INR',
          sample: p,
        });
      }
      const entry = map.get(key);
      entry.count += 1;
      const price = Number(p.priceFrom) || 0;
      if (price > 0 && price < entry.minPrice) entry.minPrice = price;
      const rating = Number(p.rating) || 0;
      if (rating > entry.maxRating) entry.maxRating = rating;
    });
    return Array.from(map.values())
      .map((e) => ({ ...e, minPrice: e.minPrice === Infinity ? 0 : e.minPrice }))
      .sort((a, b) => b.count - a.count);
  }, [packagesForProblem]);

  const activeProblem = problems.find((p) => p.id === activeId);

  if (!loadingProblems && !problems.length) return null;

  return (
    <section className="bg-surface-alt py-12 md:py-16">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="heading">
            What are you <span className="heading-accent-wellness">healing</span>?
          </h2>
          <p className="text-ink-muted mt-3 max-w-xl mx-auto">
            Pick a condition or goal — we'll show you the destinations and retreats best suited for it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Problems list */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="card p-3">
              {loadingProblems ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {problems.map((p) => {
                    const active = p.id === activeId;
                    return (
                      <li key={p.id}>
                        <button
                          onMouseEnter={() => setActiveId(p.id)}
                          onClick={() => setActiveId(p.id)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                            active
                              ? 'bg-wellness text-white shadow-soft'
                              : 'hover:bg-surface-alt text-ink'
                          }`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-wellness/10 text-wellness'}`}>
                              {p.imageUrl ? (
                                <img src={fileUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <HeartPulse size={16} />
                              )}
                            </span>
                            <span className="font-medium truncate">{p.name}</span>
                          </span>
                          <ChevronRight size={16} className={active ? 'text-white' : 'text-ink-muted'} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Cities for the active problem */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="card p-6 min-h-[320px]">
              {!activeProblem ? (
                <div className="flex items-center justify-center h-full text-ink-muted">
                  Select a condition to see destinations
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-ink-muted">
                        Destinations for
                      </div>
                      <h3 className="text-xl font-display font-semibold">
                        {activeProblem.name}
                      </h3>
                    </div>
                    <Link
                      to={`/retreats?problem=${activeProblem.slug}`}
                      className="text-sm text-wellness font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      See all retreats <ChevronRight size={14} />
                    </Link>
                  </div>

                  {loadingPackages ? (
                    <div className="flex items-center justify-center h-40 text-ink-muted">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : citiesForActive.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-ink-muted text-center">
                      <p>No destinations yet for <strong>{activeProblem.name}</strong>.</p>
                      <p className="text-xs mt-1">Add packages tagged to this condition from the admin panel.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {citiesForActive.map(({ city, count, minPrice, maxRating, currency }) => (
                        <button
                          key={city.id}
                          onClick={() =>
                            navigate(`/retreats?problem=${activeProblem.slug}&city=${city.slug}`)
                          }
                          className="text-left group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          {/* Image */}
                          <div className="aspect-[5/4] bg-slate-100 relative overflow-hidden">
                            {city.imageUrl ? (
                              <img
                                src={fileUrl(city.imageUrl)}
                                alt={city.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink-muted bg-gradient-to-br from-wellness/5 to-brand/10">
                                <MapPin size={32} />
                              </div>
                            )}
                            {/* Bottom gradient for legibility */}
                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />

                            {/* Top badges */}
                            <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-wellness font-bold uppercase tracking-wider shadow-sm">
                              {count} retreat{count > 1 ? 's' : ''}
                            </span>
                            {maxRating > 0 && (
                              <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-amber-700 font-bold flex items-center gap-1 shadow-sm">
                                <Star size={10} className="fill-amber-500 text-amber-500" />
                                {Number(maxRating).toFixed(1)}
                              </span>
                            )}

                            {/* Bottom-overlay city name */}
                            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                              <div className="font-display font-bold text-lg leading-tight drop-shadow">
                                {city.name}
                              </div>
                              {city.country && (
                                <div className="text-[11px] uppercase tracking-widest text-white/85 flex items-center gap-1">
                                  <MapPin size={10} />
                                  {city.country}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-4">
                            <div className="text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                              <Sparkles size={12} className="text-wellness" />
                              Helps with {activeProblem.name}
                            </div>
                            <div className="flex items-end justify-between mt-2.5">
                              <div>
                                {minPrice > 0 ? (
                                  <>
                                    <div className="text-[10px] text-ink-muted uppercase">From</div>
                                    <div className="text-base font-bold text-wellness leading-tight">
                                      {currency} {Number(minPrice).toLocaleString()}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-ink-muted">View retreats</div>
                                )}
                              </div>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-wellness group-hover:gap-2 transition-all">
                                Explore
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
