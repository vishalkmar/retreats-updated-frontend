import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MapPin, Heart, Share2, Play,
  Wifi, Landmark, Shield, ShieldCheck, ChevronDown, Bed, Maximize2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/pagination';

import api, { fileUrl } from '../../services/api';

const stripHtml = (s) =>
  (s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export default function HotelDetailPage() {
  const { slug } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/hotels/${slug}`)
      .then((res) => {
        if (cancelled) return;
        const h = res.data?.data?.hotel;
        setHotel(h);
        if (h?.id) {
          api.get('/rooms', { params: { hotelId: h.id } })
            .then((r) => { if (!cancelled) setRooms(r.data?.data?.items || []); })
            .catch(() => {});

          // Suggested add-on activities — match by hotel location when present,
          // else fall back to a generic list of featured add-ons.
          const params = h.location?.slug ? { location: h.location.slug, limit: 6 } : { featured: 'true', limit: 6 };
          api.get('/add-ons', { params })
            .then((r) => { if (!cancelled) setAddOns(r.data?.data?.items || []); })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: hotel?.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="container-app py-12">
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container-app section text-center">
        <h1 className="heading">Hotel not found</h1>
        <Link to="/hotels" className="btn-primary mt-6 inline-flex">Browse all hotels</Link>
      </div>
    );
  }

  const galleryImages = [
    ...(hotel.primaryImage ? [{ id: 'primary', url: hotel.primaryImage }] : []),
    ...(hotel.gallery || []),
  ];

  const hasVideo = !!hotel.videoUrl;
  const isYoutube = hasVideo && /youtube\.com|youtu\.be/.test(hotel.videoUrl);
  const isVimeo = hasVideo && /vimeo\.com/.test(hotel.videoUrl);
  const youtubeId = isYoutube ? hotel.videoUrl.split(/(?:v=|\/)/).pop().split('?')[0] : null;

  const locLabel = hotel.location?.name
    ? `${hotel.location.name}${hotel.location.country ? `, ${hotel.location.country}` : ''}`
    : (hotel.city?.name || '');

  return (
    <>
      {/* Hero — gallery + meta */}
      <div className="bg-surface-alt">
        <div className="container-app py-6">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Gallery */}
            <div className="lg:col-span-2">
              {galleryImages.length > 0 ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100">
                  <Swiper
                    modules={[Navigation, Thumbs, Pagination]}
                    navigation
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    pagination={{ clickable: true }}
                    className="aspect-[16/10]"
                  >
                    {galleryImages.map((g) => (
                      <SwiperSlide key={g.id}>
                        <img src={fileUrl(g.url)} alt="" className="w-full h-full object-cover" />
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {galleryImages.length > 1 && (
                    <Swiper
                      modules={[Thumbs]}
                      onSwiper={setThumbsSwiper}
                      slidesPerView={6}
                      spaceBetween={6}
                      watchSlidesProgress
                      className="px-2 py-2"
                    >
                      {galleryImages.map((g) => (
                        <SwiperSlide key={g.id} className="cursor-pointer">
                          <img
                            src={fileUrl(g.url)}
                            alt=""
                            className="aspect-square object-cover rounded-md"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] rounded-2xl bg-slate-100 flex items-center justify-center text-ink-muted">
                  No images yet
                </div>
              )}
            </div>

            {/* Meta + booking CTA */}
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-start gap-2">
                  <h1 className="text-2xl font-display font-bold leading-tight flex-1">
                    {hotel.name}
                  </h1>
                  {hotel.starRating && (
                    <span className="text-amber-500 text-base shrink-0 mt-1">
                      {'★'.repeat(hotel.starRating)}
                    </span>
                  )}
                </div>

                {locLabel && (
                  <div className="text-sm text-ink-muted mt-2 flex items-center gap-1">
                    <MapPin size={14} /> {locLabel}
                  </div>
                )}

                {Number(hotel.rating) > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="bg-emerald-600 text-white font-bold rounded px-2 py-1 text-sm">
                      {Number(hotel.rating).toFixed(1)}
                    </span>
                    {hotel.reviewCount > 0 && (
                      <span className="text-xs text-ink-muted">
                        ({hotel.reviewCount} reviews)
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-5 border-t pt-4">
                  <div className="text-xs text-ink-muted">From</div>
                  <div>
                    <span className="text-3xl font-bold text-brand">
                      {hotel.currency} {Number(hotel.priceFrom).toLocaleString()}
                    </span>
                    {hotel.priceOriginal && Number(hotel.priceOriginal) > Number(hotel.priceFrom) && (
                      <span className="ml-2 line-through text-ink-muted">
                        {Number(hotel.priceOriginal).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5">+ taxes & fees · per night</div>
                </div>

                <a href="#rooms" className="btn-primary w-full mt-4">
                  Choose your room
                </a>

                <div className="flex items-center gap-3 mt-3 text-xs text-ink-muted">
                  <button onClick={onShare} className="inline-flex items-center gap-1 hover:text-brand">
                    <Share2 size={14} /> Share
                  </button>
                  <button className="inline-flex items-center gap-1 hover:text-brand">
                    <Heart size={14} /> Save
                  </button>
                </div>
              </div>

              {hasVideo && (
                <div className="card p-3">
                  <button
                    onClick={() => setShowVideo((s) => !s)}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-brand py-2"
                  >
                    <Play size={16} /> {showVideo ? 'Hide video' : 'Watch overview video'}
                  </button>
                  {showVideo && (
                    <div className="aspect-video mt-2 rounded-lg overflow-hidden bg-black">
                      {isYoutube ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title="Hotel video"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : isVimeo ? (
                        <iframe
                          src={hotel.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                          title="Hotel video"
                          className="w-full h-full"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <video src={hotel.videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-app py-8 space-y-8">
        {/* About */}
        {hotel.description && (
          <Section title="About this property">
            <div className="rich-prose" dangerouslySetInnerHTML={{ __html: hotel.description }} />
          </Section>
        )}

        {/* Facilities */}
        {hotel.facilities?.length > 0 && (
          <Section icon={Wifi} title="Facilities">
            <div className="flex flex-wrap gap-2">
              {hotel.facilities.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-sm">
                  {f.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Highlights / Inclusions / Exclusions */}
        {(hotel.highlightsRich || hotel.inclusionsRich || hotel.exclusionsRich) && (
          <div className="grid md:grid-cols-3 gap-5">
            {hotel.highlightsRich && (
              <Section title="Highlights" compact>
                <div className="rich-prose" dangerouslySetInnerHTML={{ __html: hotel.highlightsRich }} />
              </Section>
            )}
            {hotel.inclusionsRich && (
              <Section title="Inclusions" compact>
                <div className="rich-prose" dangerouslySetInnerHTML={{ __html: hotel.inclusionsRich }} />
              </Section>
            )}
            {hotel.exclusionsRich && (
              <Section title="Exclusions" compact>
                <div className="rich-prose" dangerouslySetInnerHTML={{ __html: hotel.exclusionsRich }} />
              </Section>
            )}
          </div>
        )}

        {/* Available Rooms */}
        <div id="rooms" className="scroll-mt-24">
          <h2 className="text-2xl font-display font-bold mb-4">Available rooms</h2>
          {rooms.length === 0 ? (
            <div className="card p-8 text-center text-ink-muted">
              No rooms listed yet for this property.
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((r) => (
                <RoomRow key={r.id} hotel={hotel} room={r} />
              ))}
            </div>
          )}
        </div>

        {/* Suggested add-ons */}
        {addOns.length > 0 && (
          <Section icon={Sparkles} title="Suggested add-on activities">
            <p className="text-sm text-ink-muted -mt-1 mb-4">
              Make your stay more memorable with these popular extras.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {addOns.map((a) => (
                <AddOnCard key={a.id} addOn={a} />
              ))}
            </div>
          </Section>
        )}

        {/* Nearby places */}
        {hotel.nearbyPlaces?.length > 0 && (
          <Section icon={Landmark} title="Nearby places">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hotel.nearbyPlaces.map((n) => (
                <div key={n.id} className="card overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-100">
                    {n.imageUrl ? (
                      <img src={fileUrl(n.imageUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <Landmark size={18} />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="text-sm font-medium leading-tight">{n.name}</div>
                    {n.description && (
                      <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5">
                        {stripHtml(n.description)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Map */}
        {hotel.mapEmbedHtml && (
          <Section title="Location on map">
            <div
              className="rounded-2xl overflow-hidden border [&_iframe]:w-full [&_iframe]:h-[400px] [&_iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: hotel.mapEmbedHtml }}
            />
            {hotel.address && (
              <p className="text-sm text-ink-muted mt-2 flex items-center gap-1">
                <MapPin size={14} /> {hotel.address}
              </p>
            )}
          </Section>
        )}

        {/* FAQs */}
        {hotel.faqs?.length > 0 && (
          <Section title="Frequently asked questions">
            <div className="space-y-2">
              {hotel.faqs.map((f, i) => (
                <FaqItem key={i} q={f.question} a={f.answer} />
              ))}
            </div>
          </Section>
        )}

        {/* Terms & Privacy */}
        {(hotel.termsConditions || hotel.privacyPolicy) && (
          <div className="grid md:grid-cols-2 gap-5">
            {hotel.termsConditions && (
              <Section icon={Shield} title="Terms & conditions" compact>
                <div className="rich-prose text-sm" dangerouslySetInnerHTML={{ __html: hotel.termsConditions }} />
              </Section>
            )}
            {hotel.privacyPolicy && (
              <Section icon={ShieldCheck} title="Privacy policy" compact>
                <div className="rich-prose text-sm" dangerouslySetInnerHTML={{ __html: hotel.privacyPolicy }} />
              </Section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Section({ icon: Icon, title, children, compact }) {
  return (
    <section className={`card ${compact ? 'p-4' : 'p-6'}`}>
      <h3 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
        {Icon && <Icon size={18} className="text-brand" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 text-left bg-white hover:bg-surface-alt/50"
      >
        <span className="font-medium text-sm">{q}</span>
        <ChevronDown size={16} className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 text-sm text-ink-muted rich-prose" dangerouslySetInnerHTML={{ __html: a }} />
      )}
    </div>
  );
}

function AddOnCard({ addOn }) {
  return (
    <div className="card overflow-hidden hover:shadow-lg transition group">
      <div className="aspect-[16/10] bg-slate-100 relative">
        {addOn.mainImage ? (
          <img
            src={fileUrl(addOn.mainImage)}
            alt={addOn.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            <Sparkles size={28} />
          </div>
        )}
        {addOn.isFeatured && (
          <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 font-semibold">
            POPULAR
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold leading-tight line-clamp-2">{addOn.name}</h4>
        {addOn.location?.name && (
          <div className="text-xs text-ink-muted mt-1 flex items-center gap-1">
            <MapPin size={11} /> {addOn.location.name}
          </div>
        )}
        {(addOn.minAge || addOn.maxAge) && (
          <div className="text-[11px] text-ink-muted mt-1">
            Age {addOn.minAge || 0}–{addOn.maxAge || '∞'}
          </div>
        )}
        <div className="flex items-end justify-between gap-2 mt-3 pt-3 border-t">
          <div>
            <span className="text-lg font-bold text-brand">
              {addOn.currency} {Number(addOn.price).toLocaleString()}
            </span>
            {addOn.priceOriginal && Number(addOn.priceOriginal) > Number(addOn.price) && (
              <span className="ml-1.5 line-through text-ink-muted text-xs">
                {Number(addOn.priceOriginal).toLocaleString()}
              </span>
            )}
            <div className="text-[10px] text-ink-muted">per person</div>
          </div>
          <button
            type="button"
            className="btn-outline text-xs whitespace-nowrap"
            onClick={() => toast.success('Add to booking — coming soon')}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomRow({ hotel, room }) {
  return (
    <article className="card flex flex-col md:flex-row overflow-hidden">
      <div className="md:w-56 h-44 md:h-auto shrink-0 bg-slate-100 relative">
        {room.mainImage ? (
          <img src={fileUrl(room.mainImage)} alt={room.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            <Bed size={24} />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <h4 className="font-display font-semibold text-lg leading-tight">{room.name}</h4>
        <div className="flex items-center flex-wrap gap-2 text-xs text-ink-muted mt-1">
          {room.roomSize && (
            <span className="inline-flex items-center gap-1">
              <Maximize2 size={11} /> {room.roomSize}
            </span>
          )}
          {room.maxOccupancy && (
            <>
              <span>·</span>
              <span>Up to {room.maxOccupancy} guests</span>
            </>
          )}
          {room.views?.length > 0 && (
            <>
              <span>·</span>
              <span>{room.views.map((v) => v.name).join(', ')}</span>
            </>
          )}
        </div>

        {room.facilities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {room.facilities.slice(0, 5).map((f) => (
              <span key={f.id} className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                {f.name}
              </span>
            ))}
          </div>
        )}

        {room.highlightsRich && (
          <div
            className="rich-prose text-xs text-ink-muted line-clamp-3 mt-2"
            dangerouslySetInnerHTML={{ __html: room.highlightsRich }}
          />
        )}

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <span className="text-xl font-bold text-brand">
              {room.currency} {Number(room.price).toLocaleString()}
            </span>
            {room.priceOriginal && Number(room.priceOriginal) > Number(room.price) && (
              <span className="ml-2 line-through text-ink-muted text-sm">
                {Number(room.priceOriginal).toLocaleString()}
              </span>
            )}
            <div className="text-[11px] text-ink-muted">+ taxes · per night</div>
          </div>
          <div className="flex flex-col gap-2 items-stretch">
            <Link
              to={`/hotels/${hotel.slug}/rooms/${room.slug}`}
              className="btn-outline text-xs whitespace-nowrap"
            >
              View details
            </Link>
            <button type="button" className="btn-primary text-xs whitespace-nowrap" onClick={() => toast.success('Booking flow coming soon')}>
              Book now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
