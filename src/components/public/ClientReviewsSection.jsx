import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

import api from '../../services/api';

/**
 * ClientReviewsSection
 *
 * A standalone homepage band that surfaces approved package reviews submitted
 * by guests (managed under Admin → Reviews).  It is intentionally separate
 * from <TestimonialsSection /> — testimonials are hand-curated marketing
 * cards, while these are real guest reviews.
 *
 * Visual: a teal-band arc carousel.  The active card sits prominently in
 * the centre while neighbouring cards fall back along an arc — produced
 * with Swiper's EffectCoverflow plus a couple of styling tweaks so the side
 * cards feel slightly faded.
 */
export default function ClientReviewsSection() {
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
      <section className="py-16 bg-wellness">
        <div className="container-app">
          <div className="h-72 bg-white/10 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!reviews.length) return null;

  return (
    <section className="relative py-16 md:py-24 bg-wellness text-white overflow-hidden">
      {/* Soft white wedge at the bottom — gives the band the same shape as
          the marketing testimonial section. */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-white"
        style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 60%)' }}
      />

      <div className="container-app relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold drop-shadow">
            What Our Clients Say
          </h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Real reviews from real guests who travelled with us.
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
            depth: 220,
            modifier: 1.6,
            slideShadows: false,
          }}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.4 },
            1280: { slidesPerView: 4 },
          }}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true, el: '.cr-pagination' }}
          navigation={{ prevEl: '.cr-prev', nextEl: '.cr-next' }}
          className="client-review-arc !pb-2"
        >
          {reviews.map((r) => (
            <SwiperSlide key={r.id} className="!h-auto">
              <ReviewCard review={r} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            aria-label="Previous"
            className="cr-prev w-11 h-11 rounded-full bg-white text-wellness flex items-center justify-center shadow hover:scale-105 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="cr-pagination flex items-center gap-1.5" />
          <button
            type="button"
            aria-label="Next"
            className="cr-next w-11 h-11 rounded-full bg-white text-wellness flex items-center justify-center shadow hover:scale-105 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* --- Single review card --- */
function ReviewCard({ review }) {
  const initial = (review.name || '?').charAt(0).toUpperCase();
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

  return (
    <div className="px-3 h-full">
      <div className="bg-white text-ink rounded-2xl shadow-card p-6 h-full flex flex-col relative">
        {/* Avatar pill — initial circle that overlaps the top edge */}
        <div className="-mt-12 mb-3 mx-auto">
          <div className="w-16 h-16 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-wellness text-white flex items-center justify-center font-bold text-xl">
            {initial}
          </div>
        </div>

        {/* Stars */}
        {rating > 0 && (
          <div className="flex items-center justify-center gap-0.5 text-amber-400 mb-3">
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
          <blockquote className="text-sm text-ink-muted text-center italic leading-relaxed flex-1 line-clamp-6">
            “{review.comment}”
          </blockquote>
        )}

        {/* Footer with name + which retreat */}
        <div className="mt-4 pt-3 border-t text-center">
          <div className="font-semibold">{review.name}</div>
          {review.package?.name && (
            <div className="text-xs text-ink-muted truncate" title={review.package.name}>
              {review.package.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
