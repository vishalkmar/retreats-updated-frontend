import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, Play, X } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

import api, { fileUrl } from '../../services/api';

export default function TestimonialsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/testimonials')
      .then((res) => { if (!cancelled) setItems(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container-app">
          <div className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  const text = items.filter((t) => t.type === 'text');
  const image = items.filter((t) => t.type === 'image');
  const gallery = items.filter((t) => t.type === 'gallery');
  const video = items.filter((t) => t.type === 'video');

  if (!items.length) return null;

  return (
    <>
      {(text.length > 0 || image.length > 0) && (
        <TextImageBand text={text} image={image} />
      )}
      {gallery.length > 0 && <GalleryBand gallery={gallery} />}
      {video.length > 0 && <VideoBand video={video} />}
    </>
  );
}

/* -------------- TEXT + IMAGE BAND (teal background like image 2) -------------- */
function TextImageBand({ text, image }) {
  const cards = [...text, ...image].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <section className="relative py-16 md:py-24 bg-wellness text-white overflow-hidden">
      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 60%)' }} />

      <div className="container-app relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold drop-shadow">
            What Our Clients Say
          </h2>
        </div>

        <Swiper
          modules={[Autoplay, Navigation, Pagination, EffectCoverflow]}
          effect="coverflow"
          centeredSlides
          loop={cards.length > 3}
          spaceBetween={16}
          slidesPerView={1.2}
          coverflowEffect={{ rotate: 0, depth: 100, modifier: 2, slideShadows: false }}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
            1280: { slidesPerView: 4 },
          }}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: '.tt-prev', nextEl: '.tt-next' }}
          className="pb-12"
        >
          {cards.map((t) => (
            <SwiperSlide key={t.id} className="!h-auto">
              <TestimonialCard t={t} />
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

function TestimonialCard({ t }) {
  const heroImage = t.media?.[0]?.url || t.authorAvatar;
  return (
    <div className="bg-white text-ink rounded-2xl shadow-card p-6 h-full flex flex-col relative">
      {heroImage && (
        <div className="-mt-12 mb-3 mx-auto">
          <div className="w-16 h-16 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-100">
            <img src={fileUrl(heroImage)} alt={t.authorName || ''} className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      {t.rating && (
        <div className="flex items-center justify-center gap-0.5 text-accent mb-3">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={14} className="fill-accent" />
          ))}
        </div>
      )}
      {t.content && (
        <blockquote className="text-sm text-ink-muted text-center italic leading-relaxed flex-1">
          “{t.content}”
        </blockquote>
      )}
      {t.authorName && (
        <div className="mt-4 pt-3 border-t text-center">
          <div className="font-semibold">{t.authorName}</div>
          {t.authorTitle && <div className="text-xs text-ink-muted">{t.authorTitle}</div>}
        </div>
      )}
    </div>
  );
}

/* -------------- GALLERY BAND -------------- */
function GalleryBand({ gallery }) {
  const allImages = gallery
    .flatMap((g) => (g.media || []).map((m) => ({ ...m, name: g.authorName, location: g.authorTitle })))
    .filter((m) => m.url);

  if (!allImages.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="heading">Moments from <span className="heading-accent">our travellers</span></h2>
          <p className="text-ink-muted mt-3 max-w-xl mx-auto">
            A peek into the journeys we've been part of.
          </p>
        </div>

        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          slidesPerView={1.2}
          spaceBetween={12}
          loop={allImages.length > 4}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.5 },
            1280: { slidesPerView: 4.5 },
          }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: '.gal-prev', nextEl: '.gal-next' }}
          className="pb-10"
        >
          {allImages.map((m) => (
            <SwiperSlide key={m.id}>
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 group">
                <img
                  src={fileUrl(m.url)}
                  alt={m.caption || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex items-center justify-center gap-3">
          <button className="gal-prev w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-brand hover:text-white transition">
            <ChevronLeft size={18} />
          </button>
          <button className="gal-next w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-brand hover:text-white transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------- VIDEO BAND -------------- */
function VideoBand({ video }) {
  const [playing, setPlaying] = useState(null);

  return (
    <section className="py-12 md:py-16 bg-surface-alt">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="heading">Hear it from <span className="heading-accent-wellness">them</span></h2>
          <p className="text-ink-muted mt-3 max-w-xl mx-auto">
            Stories straight from people who lived it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {video.map((v) => {
            const poster = v.videoPoster || v.media?.[0]?.url;
            const fileVideo = v.media?.find((m) => m.mediaType === 'video');
            const url = fileVideo?.url || v.videoUrl;
            return (
              <button
                key={v.id}
                onClick={() => setPlaying({ url, poster, ...v })}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100 text-left"
              >
                {poster ? (
                  <img src={fileUrl(poster)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand to-wellness" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 group-hover:bg-white flex items-center justify-center shadow-xl transition group-hover:scale-110">
                    <Play size={24} className="text-brand fill-brand ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  {v.authorName && <div className="font-semibold">{v.authorName}</div>}
                  {v.authorTitle && <div className="text-xs opacity-80">{v.authorTitle}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {playing && <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}

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
