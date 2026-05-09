import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import api, { fileUrl } from '../../services/api';

export default function CityCarousel() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/cities')
      .then((res) => { if (!cancelled) setCities(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
      <div className="text-center mb-10">
        <h2 className="heading">
          Choose your <span className="heading-accent">Destination</span>
        </h2>
        <p className="text-ink-muted mt-3 max-w-xl mx-auto">
          Handpicked cities and regions where unforgettable retreats await.
        </p>
      </div>

      <div className="relative px-10">
        <button
          className="city-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center hover:bg-brand hover:text-white transition"
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="city-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center hover:bg-brand hover:text-white transition"
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>

        <Swiper
          modules={[Navigation]}
          navigation={{ prevEl: '.city-prev', nextEl: '.city-next' }}
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{
            640: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
            1280: { slidesPerView: 6 },
          }}
        >
          {cities.map((c) => (
            <SwiperSlide key={c.id}>
              <Link
                to={`/retreats?city=${c.slug}`}
                className="group flex flex-col items-center text-center"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-4 border-white shadow-card relative">
                  {c.imageUrl ? (
                    <img
                      src={fileUrl(c.imageUrl)}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-white">
                      <MapPin size={28} />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="font-semibold text-sm">{c.name}</div>
                  {c.country && (
                    <div className="text-xs text-ink-muted">{c.country}</div>
                  )}
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
