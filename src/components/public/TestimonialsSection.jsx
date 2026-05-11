import { useEffect, useMemo, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, Play, X } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import api, { fileUrl } from '../../services/api';

/**
 * Public testimonials section.
 *
 * Each testimonial carries its own type (text/image/video/gallery/image_text/
 * video_text/image_video) and a displayMode ('carousel' | 'grid') chosen in
 * the admin. We split items by displayMode and render each band accordingly.
 *
 * Per-card width/height (admin-pinned px values) override the default
 * responsive sizing when set.
 */
export default function TestimonialsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/testimonials')
      .then((res) => { if (!cancelled) setItems(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { carouselItems, gridItems } = useMemo(() => {
    const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return {
      carouselItems: sorted.filter((t) => (t.displayMode || 'carousel') === 'carousel'),
      gridItems: sorted.filter((t) => t.displayMode === 'grid'),
    };
  }, [items]);

  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container-app">
          <div className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <>
      {carouselItems.length > 0 && (
        <CarouselBand items={carouselItems} onPlayVideo={setPlaying} />
      )}
      {gridItems.length > 0 && (
        <GridBand items={gridItems} onPlayVideo={setPlaying} />
      )}
      {playing && <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

/* ---------- Carousel band ---------- */
function CarouselBand({ items, onPlayVideo }) {
  return (
    <section className="relative py-16 md:py-24 bg-wellness text-white overflow-hidden">
      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-white"
        style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 60%)' }}
      />
      <div className="container-app relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold drop-shadow">
            What Our Clients Say
          </h2>
        </div>

        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          centeredSlides={items.length <= 3}
          centerInsufficientSlides
          loop={items.length > 3}
          spaceBetween={20}
          slidesPerView={1.1}
          breakpoints={{
            640: { slidesPerView: 1.8 },
            1024: { slidesPerView: 2.6 },
            1280: { slidesPerView: 3.2 },
          }}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: '.tt-prev', nextEl: '.tt-next' }}
          className="pb-12"
        >
          {items.map((t) => (
            <SwiperSlide key={t.id} className="!h-auto">
              <TestimonialCard t={t} onPlayVideo={onPlayVideo} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex items-center justify-center gap-3 mt-2">
          <button className="tt-prev w-10 h-10 rounded-full bg-white text-wellness flex items-center justify-center shadow hover:scale-105 transition">
            <ChevronLeft size={18} />
          </button>
          <button className="tt-next w-10 h-10 rounded-full bg-white text-wellness flex items-center justify-center shadow hover:scale-105 transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Static grid band ---------- */
function GridBand({ items, onPlayVideo }) {
  return (
    <section className="py-12 md:py-16 bg-surface-alt">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="heading">
            Stories from <span className="heading-accent-wellness">our travellers</span>
          </h2>
          <p className="text-ink-muted mt-3 max-w-xl mx-auto">
            Real experiences shared by people who lived them.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} onPlayVideo={onPlayVideo} flat />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Single dynamic card — adapts to type ---------- */
function TestimonialCard({ t, onPlayVideo, flat }) {
  const customStyle = {};
  if (t.cardWidth) customStyle.width = `${t.cardWidth}px`;
  if (t.cardHeight) customStyle.minHeight = `${t.cardHeight}px`;

  const baseClasses = `${flat ? 'bg-white' : 'bg-white text-ink'} rounded-2xl shadow-card overflow-hidden h-full flex flex-col w-full max-w-md`;

  // Type → renderer
  switch (t.type) {
    case 'video':
      return (
        <article className={baseClasses} style={customStyle}>
          <VideoFrame t={t} onPlayVideo={onPlayVideo} />
          <CardBody t={t} />
        </article>
      );
    case 'video_text':
      return (
        <article className={baseClasses} style={customStyle}>
          <VideoFrame t={t} onPlayVideo={onPlayVideo} />
          <CardBody t={t} />
        </article>
      );
    case 'image':
      return (
        <article className={baseClasses} style={customStyle}>
          <ImageFrame t={t} />
          <CardBody t={t} />
        </article>
      );
    case 'image_text':
      return (
        <article className={baseClasses} style={customStyle}>
          <ImageFrame t={t} />
          <CardBody t={t} />
        </article>
      );
    case 'gallery':
      return (
        <article className={baseClasses} style={customStyle}>
          <GalleryFrame t={t} />
          {(t.authorName || t.content) && <CardBody t={t} />}
        </article>
      );
    case 'image_video':
      return (
        <article className={baseClasses} style={customStyle}>
          <div className="grid grid-cols-2 gap-1">
            <ImageFrame t={t} compact />
            <VideoFrame t={t} onPlayVideo={onPlayVideo} compact />
          </div>
          <CardBody t={t} />
        </article>
      );
    case 'text':
    default:
      return (
        <article className={`${baseClasses} p-6`} style={customStyle}>
          {t.authorAvatar && (
            <div className="-mt-12 mb-3 mx-auto">
              <div className="w-16 h-16 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-100">
                <img src={fileUrl(t.authorAvatar)} alt={t.authorName || ''} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          {t.rating && (
            <div className="flex items-center justify-center gap-0.5 text-amber-400 mb-3">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400" />
              ))}
            </div>
          )}
          {t.content && (
            <blockquote className="text-sm text-ink-muted text-center italic leading-relaxed flex-1">
              <Quote size={20} className="text-wellness/30 mx-auto mb-2" />
              {t.content}
            </blockquote>
          )}
          {t.authorName && (
            <div className="mt-4 pt-3 border-t text-center">
              <div className="font-semibold">{t.authorName}</div>
              {t.authorTitle && <div className="text-xs text-ink-muted">{t.authorTitle}</div>}
            </div>
          )}
        </article>
      );
  }
}

/* ---------- Sub-components ---------- */
function ImageFrame({ t, compact }) {
  const url = t.media?.[0]?.url || t.authorAvatar;
  if (!url) return null;
  return (
    <div className={`bg-slate-100 ${compact ? 'aspect-square' : 'aspect-[4/3]'} overflow-hidden`}>
      <img src={fileUrl(url)} alt={t.authorName || ''} className="w-full h-full object-cover" />
    </div>
  );
}

function VideoFrame({ t, onPlayVideo, compact }) {
  const fileVideo = t.media?.find((m) => m.mediaType === 'video');
  const url = fileVideo?.url || t.videoUrl;
  const poster = t.videoPoster || t.media?.find((m) => m.mediaType === 'image')?.url;
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={() => onPlayVideo?.({ url, poster, ...t })}
      className={`relative bg-slate-100 ${compact ? 'aspect-square' : 'aspect-[16/10]'} overflow-hidden group block w-full`}
    >
      {poster ? (
        <img src={fileUrl(poster)} className="w-full h-full object-cover" alt="" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-brand to-wellness" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/95 group-hover:bg-white flex items-center justify-center shadow-xl transition group-hover:scale-110">
          <Play size={20} className="text-brand fill-brand ml-0.5" />
        </div>
      </div>
    </button>
  );
}

function GalleryFrame({ t }) {
  const imgs = (t.media || []).filter((m) => m.mediaType !== 'video');
  if (!imgs.length) return null;
  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      autoplay={{ delay: 3500 }}
      pagination={{ clickable: true }}
      loop={imgs.length > 1}
      className="w-full aspect-[4/3]"
    >
      {imgs.map((m) => (
        <SwiperSlide key={m.id}>
          <img src={fileUrl(m.url)} alt="" className="w-full h-full object-cover" />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function CardBody({ t }) {
  return (
    <div className="p-5 flex-1 flex flex-col">
      {t.rating && (
        <div className="flex items-center gap-0.5 text-amber-400 mb-2">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={13} className="fill-amber-400" />
          ))}
        </div>
      )}
      {t.content && (
        <p className="text-sm text-ink-muted italic leading-relaxed flex-1">
          “{t.content}”
        </p>
      )}
      {t.authorName && (
        <div className="mt-3 pt-3 border-t flex items-center gap-3">
          {t.authorAvatar && (
            <img
              src={fileUrl(t.authorAvatar)}
              className="w-9 h-9 rounded-full object-cover"
              alt={t.authorName}
            />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{t.authorName}</div>
            {t.authorTitle && <div className="text-xs text-ink-muted truncate">{t.authorTitle}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Video player modal ---------- */
function VideoPlayerModal({ item, onClose }) {
  const { url } = item;
  const isYoutube = url && /youtube\.com|youtu\.be/.test(url);
  const isVimeo = url && /vimeo\.com/.test(url);
  const youtubeId = isYoutube ? url.split(/(?:v=|\/)/).pop().split('?')[0] : null;
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/80 hover:text-white">
          <X size={28} />
        </button>
        {isYoutube ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
            title="Testimonial video"
          />
        ) : isVimeo ? (
          <iframe
            src={url.replace('vimeo.com', 'player.vimeo.com/video')}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full"
            title="Testimonial video"
          />
        ) : (
          <video src={fileUrl(url)} controls autoPlay className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
