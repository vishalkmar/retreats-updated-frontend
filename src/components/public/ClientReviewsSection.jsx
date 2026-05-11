import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

import api from '../../services/api';
import useSectionThemes from '../../hooks/useSectionThemes.js';

/**
 * ClientReviewsSection — homepage arc carousel of approved guest reviews.
 *
 * Theme: per-section colours are loaded from /api/section-themes and applied
 * inline so admins can tune background, card and text colours without code.
 * Default theme is now neutral (white background) — the heavy green band of
 * the previous version was replaced with a softer, double-border card style.
 */
export default function ClientReviewsSection() {
  const themes = useSectionThemes();
  const t = themes.clientReviews;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/packages/reviews/public', { params: { limit: 18 } })
      .then((res) => {
        if (!cancelled) setReviews(res.data?.data?.items || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="py-16" style={{ background: t.bg }}>
        <div className="container-app">
          <div className="h-72 bg-black/5 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!reviews.length) return null;

  return (
    <section
      className="relative py-16 md:py-20"
      style={{ background: t.bg, color: t.text }}
    >
      <div className="container-app relative z-10">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-bold px-3 py-1.5 rounded-full mb-5"
            style={{ background: t.accent + '1A', color: t.accent }}
          >
            <Star size={11} className="fill-current" /> Verified guest reviews
          </div>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1]"
            style={{ color: t.text }}
          >
            What our{' '}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: t.accent }}>clients</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 h-2.5 rounded-full opacity-30"
                style={{ background: t.accent }}
              />
            </span>
            {' '}say
          </h2>
          <p
            className="mt-5 text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: t.text, opacity: 0.7 }}
          >
            Real reviews from real travellers — every story below comes from a guest
            who actually booked and lived the experience.
          </p>
        </div>

        <Swiper
          modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
          effect="coverflow"
          centeredSlides
          loop={reviews.length > 4}
          slidesPerView={1.2}
          spaceBetween={0}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 200,
            modifier: 1.4,
            slideShadows: false,
          }}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
            1280: { slidesPerView: 3.8 },
          }}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true, el: '.cr-pagination' }}
          navigation={{ prevEl: '.cr-prev', nextEl: '.cr-next' }}
          className="client-review-arc !pb-4"
        >
          {reviews.map((r) => (
            <SwiperSlide key={r.id} className="!h-auto">
              <ReviewCard review={r} theme={t} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            aria-label="Previous"
            className="cr-prev w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition border"
            style={{ background: t.card, color: t.accent, borderColor: t.accent + '33' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="cr-pagination flex items-center gap-1.5" />
          <button
            type="button"
            aria-label="Next"
            className="cr-next w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition border"
            style={{ background: t.card, color: t.accent, borderColor: t.accent + '33' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* --- Double-border review card --- */
function ReviewCard({ review, theme }) {
  const initial = (review.name || '?').charAt(0).toUpperCase();
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

  return (
    <div className="px-3 h-full">
      {/* Outer shell — double-border effect */}
      <div
        className="rounded-3xl p-2 h-full shadow-sm ring-1 transition hover:shadow-xl"
        style={{
          background: theme.card,
          // subtle ring matching the accent
          boxShadow: `0 0 0 1px ${theme.accent}22, 0 4px 20px -8px rgba(0,0,0,0.08)`,
        }}
      >
        {/* Inner card with the actual content */}
        <div
          className="rounded-2xl p-6 h-full flex flex-col border"
          style={{
            background: theme.card,
            borderColor: theme.accent + '33',
            color: theme.text,
          }}
        >
          {/* Quote glyph */}
          <Quote
            size={28}
            className="opacity-20 mb-2"
            style={{ color: theme.accent }}
          />

          {/* Stars */}
          {rating > 0 && (
            <div className="flex items-center gap-0.5 text-amber-400 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={14}
                  className={n <= rating ? 'fill-amber-400' : 'opacity-30'}
                />
              ))}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <blockquote
              className="text-sm italic leading-relaxed flex-1 line-clamp-6"
              style={{ color: theme.text, opacity: 0.85 }}
            >
              “{review.comment}”
            </blockquote>
          )}

          {/* Footer — avatar pill + name */}
          <div
            className="mt-5 pt-4 flex items-center gap-3 border-t"
            style={{ borderColor: theme.accent + '22' }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0"
              style={{ background: theme.accent, color: theme.card }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate" style={{ color: theme.text }}>
                {review.name}
              </div>
              {review.package?.name && (
                <div
                  className="text-xs truncate"
                  style={{ color: theme.text, opacity: 0.6 }}
                  title={review.package.name}
                >
                  {review.package.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
