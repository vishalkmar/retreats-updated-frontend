import { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck, BadgeCheck, ClipboardCheck, Utensils, Sparkles,
  ClipboardList, Siren, MessageSquare, CreditCard, RefreshCcw,
  Accessibility, Leaf, Lock, CalendarX, Star, Umbrella, Award,
  Building2, Globe, GraduationCap, MessageCircle, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api, { fileUrl } from '../../services/api';

// Whitelist of lucide icon names the admin can pick from. Anything outside
// this list falls back to ShieldCheck so a typo doesn't blank out the chip.
const ICON_MAP = {
  ShieldCheck, BadgeCheck, ClipboardCheck, Utensils, Sparkles,
  ClipboardList, Siren, MessageSquare, CreditCard, RefreshCcw,
  Accessibility, Leaf, Lock, CalendarX, Star, Umbrella, Award,
  Building2, Globe, GraduationCap, MessageCircle,
};

const resolveIcon = (name) => ICON_MAP[name] || ShieldCheck;

// One audit chip. Renders a circular icon, a label, and a hover-tooltip
// floating above with the description.
function ChecklistChip({ item, index }) {
  const Icon = resolveIcon(item.iconName);
  const [hover, setHover] = useState(false);
  const wrapRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState('top');

  // If the chip is near the top edge of the viewport, flip the tooltip below
  // so it doesn't get clipped.
  useEffect(() => {
    if (!hover || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setTooltipPos(rect.top < 180 ? 'bottom' : 'top');
  }, [hover]);

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 18, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 19) * 0.05,
        ease: [0.21, 0.96, 0.27, 0.99],
      }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
      className="relative group cursor-default outline-none focus:outline-none"
    >
      {/* Chip */}
      <div className="flex flex-col items-center gap-2.5 px-3 pt-4 pb-3 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/60 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] group-hover:shadow-[0_20px_40px_-16px_rgba(15,118,110,0.35)] transition-all">
        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-brand to-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
          {item.iconUrl ? (
            <img src={fileUrl(item.iconUrl)} alt="" className="w-7 h-7 object-contain" />
          ) : (
            <Icon size={22} strokeWidth={2.2} />
          )}
          {/* Verified tick */}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-[10px] shadow-sm ring-2 ring-white">
            <BadgeCheck size={11} strokeWidth={3} />
          </span>
        </div>
        <div className="text-[12px] sm:text-[13px] font-semibold text-ink text-center leading-tight line-clamp-2">
          {item.label}
        </div>
      </div>

      {/* Tooltip */}
      {hover && item.description && (
        <div
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 w-72 z-30 ${
            tooltipPos === 'top'
              ? 'bottom-full mb-3'
              : 'top-full mt-3'
          }`}
          style={{ animation: 'tooltipIn 0.18s ease-out both' }}
        >
          <div className="bg-slate-900 text-white text-xs rounded-xl px-4 py-3 leading-relaxed shadow-2xl">
            <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
              <BadgeCheck size={12} /> {item.label}
            </div>
            <div className="text-white/90">{item.description}</div>
          </div>
          <div
            className={`mx-auto w-3 h-3 bg-slate-900 rotate-45 ${
              tooltipPos === 'top' ? '-mt-1.5' : '-mt-1.5 -translate-y-full'
            }`}
            style={{ marginLeft: 'calc(50% - 6px)' }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default function AuditChecklistSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/checklist')
      .then((res) => { if (!cancelled) setItems(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(15,23,42,1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,1)_1px,transparent_1px)] bg-[size:48px_48px]"
      />
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />

      <div className="container-app relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] font-bold px-3 py-1.5 rounded-full bg-brand/10 text-brand mb-5">
            <ShieldCheck size={13} />
            Trust &amp; safety
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black leading-tight">
            Every retreat passes a <span className="text-brand">20-point audit</span> before it lists
          </h2>
          <p className="mt-4 text-base md:text-lg text-ink-muted leading-relaxed">
            We audit every property end-to-end — credentials, hygiene, transparency, safety, and aftercare —
            so your only job is to relax. Hover any badge to see what we check.
          </p>
        </motion.div>

        {/* Chip grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {items.map((it, i) => (
            <ChecklistChip key={it.id} item={it} index={i} />
          ))}
        </div>

        {/* Footer strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-ink-muted"
        >
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck size={16} className="text-brand" /> Independently audited
          </span>
          <span className="hidden sm:inline text-ink-muted/40">·</span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw size={16} className="text-brand" /> Re-checked annually
          </span>
          <span className="hidden sm:inline text-ink-muted/40">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ChevronRight size={16} className="text-brand" /> Hover any badge for details
          </span>
        </motion.div>
      </div>
    </section>
  );
}
