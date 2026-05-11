import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, MapPin, HeartPulse, Loader2, Calendar, Users,
  Star, ShieldCheck, ArrowRight, Share2, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';

/**
 * Problem-based filter section.
 *  - Left rail: list of problems (defaulting to the one with most packages).
 *  - Right pane: package cards for the active problem, designed in the
 *    same "double-border + image + meta + CTA" style as BlogCard.
 */
export default function ProblemFilterSection() {
  const [problems, setProblems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(true);

  const [packagesForProblem, setPackagesForProblem] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Track total package counts per problem so we can default to the highest one.
  const [countByProblem, setCountByProblem] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoadingProblems(true);
    api.get('/problems')
      .then(async (res) => {
        const items = res.data?.data?.items || [];
        if (cancelled) return;
        setProblems(items);

        // Fetch counts in parallel — used to pick the default active problem
        const counts = {};
        await Promise.all(
          items.map((p) =>
            api
              .get('/packages', { params: { problem: p.slug, limit: 1 } })
              .then((r) => { counts[p.id] = r.data?.data?.pagination?.total || 0; })
              .catch(() => { counts[p.id] = 0; })
          )
        );
        if (cancelled) return;
        setCountByProblem(counts);

        if (items.length) {
          // Pick the problem with the most packages (or first if all 0)
          const sorted = [...items].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
          setActiveId(sorted[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingProblems(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const active = problems.find((p) => p.id === activeId);
    if (!active) return;

    let cancelled = false;
    setLoadingPackages(true);
    api.get('/packages', { params: { problem: active.slug, limit: 12 } })
      .then((res) => {
        if (!cancelled) setPackagesForProblem(res.data?.data?.items || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingPackages(false); });
    return () => { cancelled = true; };
  }, [activeId, problems]);

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
            Pick a condition or goal — we'll show you the retreats best suited for it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Problems list */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="card p-3 sticky top-24">
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
                    const count = countByProblem[p.id] || 0;
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
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white text-wellness' : 'bg-wellness/10 text-wellness'}`}>
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Packages for the active problem */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="card p-5 md:p-6 min-h-[400px]">
              {!activeProblem ? (
                <div className="flex items-center justify-center h-full text-ink-muted py-20">
                  Select a condition to see retreats
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-ink-muted">
                        Retreats for
                      </div>
                      <h3 className="text-xl font-display font-semibold">
                        {activeProblem.name}
                      </h3>
                    </div>
                    <Link
                      to={`/retreats?problem=${activeProblem.slug}`}
                      className="text-sm text-wellness font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      See all <ChevronRight size={14} />
                    </Link>
                  </div>

                  {loadingPackages ? (
                    <div className="flex items-center justify-center h-60 text-ink-muted">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : packagesForProblem.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-ink-muted text-center">
                      <p>No retreats yet for <strong>{activeProblem.name}</strong>.</p>
                      <p className="text-xs mt-1">Tag a package with this condition from admin.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
                      {packagesForProblem.map((p) => (
                        <ProblemPackageCard key={p.id} pkg={p} />
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

/* ----- Card: same visual language as BlogCard but tuned for packages ----- */
function ProblemPackageCard({ pkg }) {
  const navigate = useNavigate();
  const includes = Array.isArray(pkg.meals) ? pkg.meals : [];

  const onShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/retreats/${pkg.slug}`;
    if (navigator.share) {
      navigator.share({ title: pkg.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  return (
    <article className="group rounded-3xl bg-white p-3 ring-1 ring-slate-200 shadow-soft hover:shadow-lg hover:ring-wellness/40 transition duration-300 flex flex-col">
      <Link to={`/retreats/${pkg.slug}`} className="block">
        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100">
          {pkg.primaryImage ? (
            <img
              src={fileUrl(pkg.primaryImage)}
              alt={pkg.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted bg-gradient-to-br from-wellness/10 to-brand/10">
              <MapPin size={36} />
            </div>
          )}
          {/* Top-left category */}
          {pkg.categories?.[0] && (
            <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest bg-white/95 backdrop-blur text-wellness px-2.5 py-1 rounded-full font-bold shadow">
              {pkg.categories[0].name}
            </span>
          )}
          {/* Top-right rating */}
          {pkg.rating > 0 && (
            <span className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-amber-700 font-bold flex items-center gap-1 shadow">
              <Star size={10} className="fill-amber-500 text-amber-500" />
              {Number(pkg.rating).toFixed(1)}
            </span>
          )}
          {/* Bottom-left price */}
          <div className="absolute bottom-3 left-3 bg-black/55 text-white backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm">
            <span className="text-[10px] uppercase opacity-80 mr-1">From</span>
            <span className="font-bold">
              {pkg.currency || 'INR'} {Number(pkg.priceFrom || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-3 pt-4 pb-3 flex-1 flex flex-col">
        <Link to={`/retreats/${pkg.slug}`}>
          <h3 className="font-display font-semibold text-lg leading-snug line-clamp-2 group-hover:text-wellness transition">
            {pkg.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted flex-wrap">
          {pkg.locationDetail && (
            <span className="inline-flex items-center gap-1">
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

        {includes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {includes.slice(0, 3).map((m, i) => (
              <li key={i} className="text-xs text-ink flex items-center gap-1.5">
                <Check size={12} className="text-wellness shrink-0" /> {m}
              </li>
            ))}
          </ul>
        )}

        {pkg.freeCancellation && (
          <div className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 self-start">
            <ShieldCheck size={12} /> Free cancellation
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2">
          <button
            onClick={() => navigate(`/retreats/${pkg.slug}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-wellness text-white text-sm font-semibold hover:bg-wellness-dark transition"
          >
            View Details <ArrowRight size={14} />
          </button>
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-slate-200 text-ink hover:border-wellness hover:text-wellness text-sm font-semibold transition"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </article>
  );
}
