import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, HeartPulse, Loader2 } from 'lucide-react';
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

  // Derive unique cities + count from the packages list
  const citiesForActive = useMemo(() => {
    const map = new Map();
    packagesForProblem.forEach((p) => {
      if (!p.city) return;
      const key = p.city.id;
      if (!map.has(key)) map.set(key, { city: p.city, count: 0 });
      map.get(key).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
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
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {citiesForActive.map(({ city, count }) => (
                        <button
                          key={city.id}
                          onClick={() =>
                            navigate(`/retreats?problem=${activeProblem.slug}&city=${city.slug}`)
                          }
                          className="text-left group rounded-2xl overflow-hidden bg-surface-alt hover:shadow-card transition"
                        >
                          <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                            {city.imageUrl ? (
                              <img
                                src={fileUrl(city.imageUrl)}
                                alt={city.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink-muted">
                                <MapPin />
                              </div>
                            )}
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/95 text-wellness font-semibold">
                              {count} retreat{count > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="p-3">
                            <div className="font-semibold text-sm">{city.name}</div>
                            {city.country && (
                              <div className="text-xs text-ink-muted">{city.country}</div>
                            )}
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
