import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity as ActivityIcon, ChevronRight, Loader2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import api, { fileUrl } from '../../services/api';
import PackageCard from './PackageCard.jsx';

export default function ActivityFilterSection() {
  const [activities, setActivities] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/activities')
      .then((res) => {
        const items = res.data?.data?.items || [];
        if (cancelled) return;
        setActivities(items);
        if (items.length) setActiveId(items[0].id);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingActivities(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const active = activities.find((a) => a.id === activeId);
    if (!active) return;

    let cancelled = false;
    setLoadingPackages(true);
    api.get('/packages', { params: { activity: active.slug, limit: 8 } })
      .then((res) => { if (!cancelled) setPackages(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingPackages(false); });
    return () => { cancelled = true; };
  }, [activeId, activities]);

  const activeActivity = activities.find((a) => a.id === activeId);

  if (!loadingActivities && !activities.length) return null;

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

        {/* Horizontal activity strip — centered when content fits, scrollable otherwise */}
        <div className="relative mb-10">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView="auto"
            navigation
            centerInsufficientSlides
            wrapperClass="activity-strip-wrapper !justify-center"
            className="activity-strip !px-1 !py-2"
          >
            {(loadingActivities ? Array.from({ length: 8 }) : activities).map((a, idx) => {
              if (loadingActivities) {
                return (
                  <SwiperSlide key={idx} style={{ width: 'auto' }}>
                    <div className="w-36 h-28 bg-slate-100 rounded-2xl animate-pulse" />
                  </SwiperSlide>
                );
              }
              const active = a.id === activeId;
              return (
                <SwiperSlide key={a.id} style={{ width: 'auto' }}>
                  <button
                    onClick={() => setActiveId(a.id)}
                    className={`w-36 sm:w-40 group rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white shadow-sm ${
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
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* Packages for selected activity */}
        {activeActivity && (
          <div>
            <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
              <h3 className="text-xl font-display font-semibold">
                Top retreats for <span className="text-brand">{activeActivity.name}</span>
              </h3>
              <Link
                to={`/retreats?activity=${activeActivity.slug}`}
                className="text-sm text-brand font-semibold hover:underline inline-flex items-center gap-1"
              >
                See all <ChevronRight size={14} />
              </Link>
            </div>

            {loadingPackages ? (
              <div className="flex items-center justify-center h-40 text-ink-muted">
                <Loader2 className="animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="bg-surface-alt rounded-2xl p-12 text-center text-ink-muted">
                No retreats yet for <strong>{activeActivity.name}</strong>.
              </div>
            ) : (
              <div className="space-y-5">
                {packages.slice(0, 4).map((p) => <PackageCard key={p.id} pkg={p} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
