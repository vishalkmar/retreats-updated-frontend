import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MapPin, Calendar, Users, Heart, Share2, Check, X as XIcon,
  ShieldCheck, Award, Flame, ChevronDown, Play, Send,
  Utensils, Sparkles, Hotel, Shield, RefreshCcw, XCircle, BookOpen,
  Award as AwardIcon, Clock, Heart as HeartIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/pagination';

import api, { fileUrl } from '../../services/api';

export default function PackageDetailPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/packages/${slug}`)
      .then((res) => { if (!cancelled) setPkg(res.data?.data?.package); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: pkg?.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const onInterested = () => {
    if (!pkg) return;
    api.post(`/packages/${pkg.id}/interested`)
      .then((res) => {
        toast.success("Got it — we've noted your interest");
        setPkg((p) => ({ ...p, interestedCount: res.data?.data?.interestedCount ?? p.interestedCount }));
      })
      .catch(() => toast.error('Could not save'));
  };

  if (loading) {
    return (
      <div className="container-app py-12">
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="container-app section text-center">
        <h1 className="heading">Package not found</h1>
        <Link to="/retreats" className="btn-primary mt-6 inline-flex">Browse all retreats</Link>
      </div>
    );
  }

  const galleryImages = [
    ...(pkg.primaryImage ? [{ id: 'primary', url: pkg.primaryImage }] : []),
    ...(pkg.gallery || []),
  ];

  const hasVideo = !!pkg.videoUrl;
  const isYoutube = hasVideo && /youtube\.com|youtu\.be/.test(pkg.videoUrl);
  const isVimeo = hasVideo && /vimeo\.com/.test(pkg.videoUrl);
  const youtubeId = isYoutube ? pkg.videoUrl.split(/(?:v=|\/)/).pop().split('?')[0] : null;

  // The page now supports three independent rich-text blocks for highlights,
  // inclusions and exclusions. The legacy combined `richContent` and the older
  // structured arrays are still rendered as fallbacks if the newer fields are
  // empty, so existing packages keep working.
  const hasHighlightsRich = !!pkg.highlightsRich && pkg.highlightsRich.trim() !== '';
  const hasInclusionsRich = !!pkg.inclusionsRich && pkg.inclusionsRich.trim() !== '';
  const hasExclusionsRich = !!pkg.exclusionsRich && pkg.exclusionsRich.trim() !== '';
  const hasAnyRichSection = hasHighlightsRich || hasInclusionsRich || hasExclusionsRich;
  const hasRichContent = !!pkg.richContent && pkg.richContent.trim() !== '';
  const hasLegacyLists =
    (pkg.highlights?.length > 0) ||
    (pkg.includes?.length > 0) ||
    (pkg.excludes?.length > 0);

  return (
    <>
      {/* Title bar */}
      <div className="bg-white border-b">
        <div className="container-app py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-ink-muted uppercase tracking-widest">
              {pkg.categories?.[0]?.name || 'Wellness Retreat'}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mt-1">{pkg.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-ink-muted flex-wrap">
              {pkg.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="fill-accent text-accent" />
                  <strong>{Number(pkg.rating).toFixed(2)}</strong>
                  <span>({pkg.reviewCount} reviews)</span>
                </span>
              )}
              {pkg.locationDetail && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {pkg.locationDetail}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onShare} className="btn-ghost text-sm">
              <Share2 size={16} /> Share
            </button>
            <button onClick={onInterested} className="btn-outline text-sm">
              <Heart size={16} /> Save
            </button>
          </div>
        </div>
      </div>

      <div className="container-app py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[16/10]">
                <Swiper
                  modules={[Navigation, Thumbs, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                  className="w-full h-full"
                >
                  {galleryImages.map((g) => (
                    <SwiperSlide key={g.id}>
                      <img src={fileUrl(g.url)} className="w-full h-full object-cover" alt={pkg.name} />
                    </SwiperSlide>
                  ))}
                </Swiper>
                {hasVideo && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute bottom-4 left-4 bg-white/95 hover:bg-white text-ink px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
                  >
                    <Play size={14} className="fill-current" /> Watch video
                  </button>
                )}
              </div>
              {galleryImages.length > 1 && (
                <Swiper
                  onSwiper={setThumbsSwiper}
                  modules={[Thumbs]}
                  watchSlidesProgress
                  spaceBetween={8}
                  slidesPerView={5}
                  className="thumbs"
                >
                  {galleryImages.map((g) => (
                    <SwiperSlide key={g.id}>
                      <img src={fileUrl(g.url)} className="w-full h-16 object-cover rounded cursor-pointer" alt="" />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          )}

          {/* Quick info row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={Calendar} label="Duration" value={`${pkg.durationDays}d / ${pkg.durationNights}n`} />
            <Stat
              icon={Users}
              label="Group size"
              value={`${pkg.minGroupSize}-${pkg.maxGroupSize}`}
            />
            {pkg.freeCancellation && (
              <Stat icon={ShieldCheck} label="Cancellation" value="Free" color="text-emerald-600" />
            )}
            {pkg.interestedCount > 0 && (
              <Stat
                icon={Flame}
                label="Interested"
                value={`${pkg.interestedCount} people`}
                color="text-amber-600"
              />
            )}
          </div>

          {/* Description (rich-text) */}
          {pkg.description && (
            <Section title="About this retreat">
              <RichHtml html={pkg.description} />
            </Section>
          )}

          {/* Highlights — independent rich-text */}
          {hasHighlightsRich && (
            <Section title="Highlights">
              <RichHtml html={pkg.highlightsRich} />
            </Section>
          )}

          {/* What's included — independent rich-text */}
          {hasInclusionsRich && (
            <Section title="What's included">
              <RichHtml html={pkg.inclusionsRich} />
            </Section>
          )}

          {/* What's not included — independent rich-text */}
          {hasExclusionsRich && (
            <Section title="What's not included">
              <RichHtml html={pkg.exclusionsRich} />
            </Section>
          )}

          {/* Legacy combined block — only shown if none of the new fields are set */}
          {!hasAnyRichSection && hasRichContent && (
            <Section title="What's included">
              <RichHtml html={pkg.richContent} />
            </Section>
          )}

          {/* Legacy structured lists fallback (only if no rich blocks set) */}
          {!hasAnyRichSection && !hasRichContent && hasLegacyLists && (
            <>
              {pkg.highlights?.length > 0 && (
                <Section title="Highlights">
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {pkg.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {(pkg.includes?.length > 0 || pkg.excludes?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {pkg.includes?.length > 0 && (
                    <Section title="Included" compact>
                      <ul className="space-y-1.5">
                        {pkg.includes.map((it, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" /> {it}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                  {pkg.excludes?.length > 0 && (
                    <Section title="Not included" compact>
                      <ul className="space-y-1.5">
                        {pkg.excludes.map((it, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <XIcon size={16} className="text-red-500 mt-0.5 shrink-0" /> {it}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </div>
              )}
            </>
          )}

          {/* Retreat Experience */}
          {pkg.retreatExperience && (
            <Section title="The retreat experience" icon={HeartIcon}>
              <RichHtml html={pkg.retreatExperience} />
            </Section>
          )}

          {/* What makes this retreat special */}
          {pkg.whatMakesSpecial && (
            <Section title="What makes this retreat special" icon={AwardIcon}>
              <RichHtml html={pkg.whatMakesSpecial} />
            </Section>
          )}

          {/* Full program timing */}
          {pkg.fullProgramTiming && (
            <Section title="Full program timing" icon={Clock}>
              <RichHtml html={pkg.fullProgramTiming} />
            </Section>
          )}

          {/* Benefits */}
          {pkg.benefits && (
            <Section title="Benefits" icon={Sparkles}>
              <RichHtml html={pkg.benefits} />
            </Section>
          )}

          {/* Food */}
          {(pkg.food || pkg.meals?.length > 0 || pkg.diets?.length > 0) && (
            <Section title="Food" icon={Utensils}>
              {pkg.food && <RichHtml html={pkg.food} />}
              {pkg.meals?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Meals provided</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {pkg.meals.map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 text-ink">
                        <Check size={14} className="text-brand" /> {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {pkg.diets?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Diets catered</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {pkg.diets.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 text-ink">
                        <Check size={14} className="text-brand" /> {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Facilities */}
          {pkg.facilities?.length > 0 && (
            <Section title="Facilities available" icon={Hotel}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                {pkg.facilities.map((f) => (
                  <span key={f} className="inline-flex items-center gap-2 text-ink">
                    <Check size={14} className="text-brand shrink-0" /> {f}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Itinerary */}
          {pkg.itinerary?.length > 0 && (
            <Section title="Day-by-day itinerary">
              <div className="space-y-3">
                {pkg.itinerary.map((d, i) => (
                  <details key={i} className="group bg-surface-alt rounded-xl">
                    <summary className="cursor-pointer px-4 py-3 flex items-center justify-between font-semibold text-sm">
                      <span>Day {d.day || i + 1} · {d.title}</span>
                      <ChevronDown size={16} className="group-open:rotate-180 transition" />
                    </summary>
                    {d.description && (
                      <div className="px-4 pb-4">
                        {/* Render as HTML so admin's rich-text formatting (lists, icons, headings) survives. */}
                        {/^\s*</.test(d.description)
                          ? <RichHtml html={d.description} className="text-sm" />
                          : <p className="text-sm text-ink-muted whitespace-pre-line">{d.description}</p>}
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </Section>
          )}

          {/* Host */}
          {pkg.hostName && (
            <Section title="Your host">
              <div className="flex items-start gap-4 bg-surface-alt rounded-xl p-5">
                {pkg.hostImage && (
                  <img src={fileUrl(pkg.hostImage)} className="w-16 h-16 rounded-full object-cover" alt={pkg.hostName} />
                )}
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {pkg.hostName}
                    {pkg.isGoldHost && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <Award size={10} /> Gold host
                      </span>
                    )}
                  </h4>
                  {pkg.hostBio && <RichHtml html={pkg.hostBio} className="mt-1 text-sm" />}
                </div>
              </div>
            </Section>
          )}

          {/* FAQs */}
          {pkg.faqs?.length > 0 && (
            <Section title="FAQs">
              <div className="space-y-2">
                {pkg.faqs.map((q, i) => (
                  <details key={i} className="group bg-white border rounded-xl">
                    <summary className="cursor-pointer px-4 py-3 flex items-center justify-between font-medium text-sm">
                      <span>{q.question}</span>
                      <ChevronDown size={16} className="group-open:rotate-180 transition" />
                    </summary>
                    {q.answer && (
                      <p className="px-4 pb-4 text-sm text-ink-muted whitespace-pre-line">{q.answer}</p>
                    )}
                  </details>
                ))}
              </div>
            </Section>
          )}

          {/* Booking terms */}
          {pkg.bookingTerms && (
            <Section title="Booking terms" icon={BookOpen}>
              <RichHtml html={pkg.bookingTerms} />
            </Section>
          )}

          {/* Cancellation policy */}
          {pkg.cancellationPolicy && (
            <Section title="Cancellation policy" icon={XCircle}>
              <RichHtml html={pkg.cancellationPolicy} />
            </Section>
          )}

          {/* Refunds policy */}
          {pkg.refundsPolicy && (
            <Section title="Refunds policy" icon={RefreshCcw}>
              <RichHtml html={pkg.refundsPolicy} />
            </Section>
          )}

          {/* Terms & Conditions */}
          {pkg.termsConditions && (
            <Section title="Terms & Conditions" icon={Shield}>
              <RichHtml html={pkg.termsConditions} />
            </Section>
          )}

          {/* Reviews */}
          {pkg.reviews?.length > 0 && (
            <Section title={`Reviews (${pkg.reviewCount})`}>
              <div className="space-y-3">
                {pkg.reviews.slice(0, 6).map((r) => (
                  <div key={r.id} className="bg-white border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
                        {r.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{r.name}</div>
                        <div className="flex items-center gap-1 text-xs text-accent">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} size={12} className="fill-accent" />
                          ))}
                        </div>
                      </div>
                    </div>
                    {r.title && <h5 className="font-semibold text-sm">{r.title}</h5>}
                    {r.comment && <p className="text-sm text-ink-muted mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <ReviewForm packageId={pkg.id} />
        </div>

        {/* Sidebar booking card */}
        <aside id="book" className="lg:sticky lg:top-24 self-start">
          <div className="card p-6">
            <div className="text-xs text-ink-muted uppercase tracking-widest">From</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-brand">
                {pkg.currency} {Number(pkg.priceFrom).toLocaleString()}
              </span>
              {pkg.priceOriginal && Number(pkg.priceOriginal) > Number(pkg.priceFrom) && (
                <span className="line-through text-sm text-ink-muted">
                  {Number(pkg.priceOriginal).toLocaleString()}
                </span>
              )}
            </div>

            <button className="btn-primary w-full mt-4">Book now</button>
            <button onClick={onInterested} className="btn-outline w-full mt-2">
              <Heart size={14} /> I'm interested
            </button>

            <ul className="mt-5 pt-5 border-t space-y-2 text-sm">
              {pkg.freeCancellation && (
                <li className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck size={16} /> FREE cancellation
                </li>
              )}
              {pkg.timing && (
                <li className="flex items-center gap-2 text-ink-muted">
                  <Calendar size={16} /> {pkg.timing}
                </li>
              )}
              {pkg.locationDetail && (
                <li className="flex items-center gap-2 text-ink-muted">
                  <MapPin size={16} /> {pkg.locationDetail}
                </li>
              )}
            </ul>

            {pkg.problems?.length > 0 && (
              <div className="mt-5 pt-5 border-t">
                <div className="text-xs uppercase tracking-widest text-ink-muted mb-2">Helps with</div>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.problems.map((p) => (
                    <span key={p.id} className="text-[11px] px-2 py-0.5 rounded-full bg-wellness/10 text-wellness font-medium">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Video modal */}
      {showVideo && hasVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            ><XIcon size={28} /></button>
            {isYoutube ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
                title="Video"
              />
            ) : isVimeo ? (
              <iframe
                src={pkg.videoUrl.replace('vimeo.com', 'player.vimeo.com/video')}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="w-full h-full"
                title="Video"
              />
            ) : (
              <video src={pkg.videoUrl} controls autoPlay className="w-full h-full" />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ icon: Icon, label, value, color = 'text-brand' }) {
  return (
    <div className="bg-surface-alt rounded-xl p-3">
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon size={16} />
        <span className="text-xs uppercase tracking-widest text-ink-muted">{label}</span>
      </div>
      <div className="font-semibold mt-1 text-sm">{value}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children, compact }) {
  return (
    <section className={compact ? '' : 'border-t pt-6'}>
      <h2 className={`font-display ${compact ? 'text-lg' : 'text-xl'} font-bold mb-3 flex items-center gap-2`}>
        {Icon && <Icon size={18} className="text-brand" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function RichHtml({ html, className = '' }) {
  return (
    <div
      className={`rich-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ReviewForm({ packageId }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return toast.error('Name and comment required');
    setSubmitting(true);
    try {
      await api.post(`/packages/${packageId}/reviews`, { name, email, rating, comment });
      toast.success('Thanks! Your review will appear after approval.');
      setName(''); setEmail(''); setRating(5); setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title="Leave a review">
      <form onSubmit={submit} className="space-y-3 bg-surface-alt p-5 rounded-xl">
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">Rating:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={n <= rating ? 'text-accent' : 'text-slate-300'}
            ><Star size={20} className={n <= rating ? 'fill-accent' : ''} /></button>
          ))}
        </div>
        <textarea
          className="input" rows={3}
          placeholder="Share your experience…"
          value={comment} onChange={(e) => setComment(e.target.value)}
          required
        />
        <button disabled={submitting} className="btn-primary text-sm">
          <Send size={14} /> {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </form>
    </Section>
  );
}
