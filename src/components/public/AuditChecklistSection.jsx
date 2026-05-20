import { useEffect, useState } from 'react';
import {
  ShieldCheck, BadgeCheck, ClipboardCheck, Utensils, Sparkles,
  ClipboardList, Siren, MessageSquare, CreditCard, RefreshCcw,
  Accessibility, Leaf, Lock, CalendarX, Star, Umbrella, Award,
  Building2, Globe, GraduationCap, MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api, { fileUrl } from '../../services/api';

const ICON_MAP = {
  ShieldCheck, BadgeCheck, ClipboardCheck, Utensils, Sparkles,
  ClipboardList, Siren, MessageSquare, CreditCard, RefreshCcw,
  Accessibility, Leaf, Lock, CalendarX, Star, Umbrella, Award,
  Building2, Globe, GraduationCap, MessageCircle,
};
const resolveIcon = (name) => ICON_MAP[name] || ShieldCheck;

// We show exactly the first 5 active items (whatever the admin orders first
// in the Trust Checklist page).
const MAX_ITEMS = 5;

// Tree palette — kept here so trunk, branches, leaves and root badges all
// stay in sync.
const GREEN_DARK = '#1f8a4c';
const GREEN_MID  = '#36b25f';
const GREEN_SOFT = '#7fd49b';
const TRUNK_DARK = '#6b3a1f';
const TRUNK_MID  = '#8c5630';

/*
  Two compositions of the same tree:

   - HORIZONTAL (md+) — 1200 × 800 viewBox.  Trunk in the centre, 5 leaves
     fanned out (top, upper-L, upper-R, lower-L, lower-R) plus a row of
     numbered root badges along the base.

   - VERTICAL (mobile) — 700 × 1300 viewBox.  Trunk runs top-to-bottom on
     the centre line, leaves alternate left/right going down, root badges
     stacked at the bottom.

  Both layouts are rendered by the SAME `<TreeSvg>` component below — the
  caller just passes in the viewBox, the trunk-path and the per-leaf
  geometry. Because everything lives inside an SVG `viewBox` with
  `preserveAspectRatio="xMidYMid meet"`, the whole composition scales as a
  single block, so text and graphics stay perfectly in proportion at every
  device width.
*/
const HORIZONTAL = {
  viewBox: '0 0 1200 800',
  // Trunk path — fat, tapered, gradient brown
  trunk:
    `M 580 800
     C 580 720 575 640 585 560
     C 590 500 590 460 596 420
     L 604 420
     C 610 460 610 500 615 560
     C 625 640 620 720 620 800 Z`,
  trunkHighlight: 'M 600 800 L 600 420',
  // Each leaf: branch (the curve from trunk) + circle (cx, cy, r).
  leaves: [
    { branch: 'M 600 380 C 600 320 600 260 600 220', cx: 600, cy: 175, r: 90 },
    { branch: 'M 580 410 C 470 380 360 320 280 240', cx: 240, cy: 195, r: 85 },
    { branch: 'M 620 410 C 730 380 840 320 920 240', cx: 960, cy: 195, r: 85 },
    { branch: 'M 575 520 C 460 540 320 540 200 520', cx: 145, cy: 510, r: 85 },
    { branch: 'M 625 520 C 740 540 880 540 1000 520', cx: 1055, cy: 510, r: 85 },
  ],
  rootCenter: { x: 600, y: 770 },
  rootSpread: 360,
  iconSize: 26,
  labelFont: 16,
  badgeRadius: 22,
  badgeFont: 14,
  tooltipW: 280,
  tooltipH: 96,
  tooltipFlipAboveY: 280,
};

const VERTICAL = {
  viewBox: '0 0 700 1300',
  // Trunk path — slightly thicker, runs from y=380 (under the top leaf) down
  // to y=1180 (above the root badges).
  trunk:
    `M 335 1180
     C 335 1100 330 1020 340 940
     C 345 880 345 740 340 620
     C 335 500 335 460 340 380
     L 360 380
     C 365 460 365 500 360 620
     C 355 740 355 880 360 940
     C 370 1020 365 1100 365 1180 Z`,
  trunkHighlight: 'M 350 1180 L 350 380',
  leaves: [
    // 1 — top centre
    { branch: 'M 350 380 C 350 320 350 260 350 200',  cx: 350, cy: 145, r: 110 },
    // 2 — upper left
    { branch: 'M 332 460 C 270 470 200 440 150 400', cx: 130, cy: 380, r: 100 },
    // 3 — upper right
    { branch: 'M 368 460 C 430 470 500 440 550 400', cx: 570, cy: 380, r: 100 },
    // 4 — lower left
    { branch: 'M 332 720 C 270 730 200 700 150 660', cx: 130, cy: 640, r: 100 },
    // 5 — lower right
    { branch: 'M 368 720 C 430 730 500 700 550 660', cx: 570, cy: 640, r: 100 },
  ],
  rootCenter: { x: 350, y: 1230 },
  rootSpread: 360,
  iconSize: 30,
  labelFont: 19,
  badgeRadius: 25,
  badgeFont: 16,
  tooltipW: 280,
  tooltipH: 100,
  tooltipFlipAboveY: 230,
};

// ──────────────────────────────────────────────────────────────────────────────
// Single leaf — drawn entirely in SVG so the tree scales as one block.
// ──────────────────────────────────────────────────────────────────────────────
function LeafNode({ item, geometry, layout }) {
  const { cx, cy, r } = geometry;
  const Icon = resolveIcon(item.iconName);
  const [hover, setHover] = useState(false);

  const tooltipW = layout.tooltipW;
  const tooltipH = layout.tooltipH;
  const tooltipBelow = cy < layout.tooltipFlipAboveY;
  const tooltipY = tooltipBelow ? cy + r + 14 : cy - r - tooltipH - 14;

  // Keep the tooltip inside the visible area horizontally — clamp x.
  const viewW = parseInt(layout.viewBox.split(' ')[2], 10);
  const ttX = Math.max(10, Math.min(viewW - tooltipW - 10, cx - tooltipW / 2));

  return (
    <g
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setHover((v) => !v)}
      tabIndex={0}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      {/* Soft ground shadow */}
      <ellipse
        cx={cx}
        cy={cy + r * 0.95}
        rx={r * 0.82}
        ry={r * 0.13}
        fill="rgba(15,23,42,0.10)"
      />

      {/* Green outer ring — the leaf outline */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={GREEN_MID}
        strokeWidth={r * 0.22}
        strokeLinecap="round"
      />
      <circle
        cx={cx} cy={cy - 2} r={r}
        fill="none"
        stroke={GREEN_SOFT}
        strokeWidth={r * 0.05}
        opacity={0.6}
      />

      {/* White content disc */}
      <circle
        cx={cx} cy={cy}
        r={r - r * 0.22}
        fill="white"
        stroke="rgba(15,23,42,0.05)"
      />

      {/* Icon — top third of the disc */}
      <foreignObject
        x={cx - layout.iconSize}
        y={cy - r + r * 0.32}
        width={layout.iconSize * 2}
        height={layout.iconSize * 2}
        style={{ pointerEvents: 'none' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '999px',
            background: `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_DARK})`,
            color: 'white',
            boxShadow: '0 6px 14px -6px rgba(15,138,76,0.55)',
          }}
        >
          {item.iconUrl ? (
            <img
              src={fileUrl(item.iconUrl)}
              alt=""
              style={{ width: layout.iconSize, height: layout.iconSize, objectFit: 'contain' }}
            />
          ) : (
            <Icon size={layout.iconSize} strokeWidth={2.4} />
          )}
        </div>
      </foreignObject>

      {/* Label — wraps across up to two lines */}
      <foreignObject
        x={cx - (r - r * 0.3)}
        y={cy + r * 0.1}
        width={(r - r * 0.3) * 2}
        height={r * 0.85}
        style={{ pointerEvents: 'none' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%',
            textAlign: 'center',
            fontFamily: 'Poppins, Inter, sans-serif',
            fontWeight: 700,
            color: GREEN_DARK,
            fontSize: layout.labelFont,
            lineHeight: 1.18,
            padding: '0 4px',
          }}
        >
          {item.label}
        </div>
      </foreignObject>

      {/* Verified tick */}
      <g transform={`translate(${cx + r - r * 0.32}, ${cy + r - r * 0.32})`}>
        <circle r={r * 0.2} fill="#f59e0b" stroke="white" strokeWidth={r * 0.045} />
        <path
          d={`M ${-r * 0.075} 0 L ${-r * 0.025} ${r * 0.05} L ${r * 0.075} ${-r * 0.05}`}
          stroke="white"
          strokeWidth={r * 0.045}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Tooltip */}
      {hover && item.description && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={ttX} y={tooltipY}
            width={tooltipW} height={tooltipH}
            rx={14}
            fill="#0f172a"
          />
          <foreignObject
            x={ttX} y={tooltipY}
            width={tooltipW} height={tooltipH}
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                width: '100%', height: '100%',
                padding: '12px 14px',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                lineHeight: 1.4,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.92)' }}>
                {item.description}
              </div>
            </div>
          </foreignObject>
          <polygon
            points={
              tooltipBelow
                ? `${cx - 7},${tooltipY} ${cx + 7},${tooltipY} ${cx},${tooltipY - 9}`
                : `${cx - 7},${tooltipY + tooltipH} ${cx + 7},${tooltipY + tooltipH} ${cx},${tooltipY + tooltipH + 9}`
            }
            fill="#0f172a"
          />
        </g>
      )}
    </g>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Whole-tree SVG. One implementation, two layouts.
// ──────────────────────────────────────────────────────────────────────────────
function TreeSvg({ layout, items, idSuffix }) {
  const total = items.length;
  const leaves = layout.leaves.slice(0, total);

  // SVG `<defs>` are document-global — two SVGs with the same `id` collide
  // and the second instance can render with the wrong gradient. Suffix
  // every id so the desktop and mobile trees stay independent.
  const trunkGradId = `trunkFill-${idSuffix}`;
  const branchGradId = `branchFill-${idSuffix}`;

  // Root badge positions — evenly spread around layout.rootCenter.x.
  const rootY = layout.rootCenter.y;
  const startX = layout.rootCenter.x - layout.rootSpread / 2;
  const stepX = total > 1 ? layout.rootSpread / (total - 1) : 0;

  return (
    <svg
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      aria-label={`${total}-point audit tree`}
    >
      <defs>
        <linearGradient id={trunkGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TRUNK_MID} />
          <stop offset="100%" stopColor={TRUNK_DARK} />
        </linearGradient>
        <linearGradient id={branchGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GREEN_DARK} />
          <stop offset="100%" stopColor={GREEN_MID} />
        </linearGradient>
      </defs>

      {/* Trunk */}
      <path d={layout.trunk} fill={`url(#${trunkGradId})`} />
      <path
        d={layout.trunkHighlight}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Branches */}
      {leaves.map((g, i) => (
        <g key={`branch-${i}`}>
          <path d={g.branch} stroke={`url(#${branchGradId})`} strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d={g.branch} stroke={GREEN_SOFT} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.55" />
        </g>
      ))}

      {/* Leaves */}
      {items.map((it, i) => (
        <LeafNode key={it.id} item={it} geometry={leaves[i]} layout={layout} />
      ))}

      {/* Root badges */}
      {items.map((_, i) => {
        const x = startX + stepX * i;
        return (
          <g key={`root-${i}`}>
            <path
              d={`M ${layout.rootCenter.x} ${rootY - 30} Q ${(layout.rootCenter.x + x) / 2} ${rootY - 10} ${x} ${rootY - layout.badgeRadius}`}
              stroke={TRUNK_DARK}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            <circle cx={x} cy={rootY} r={layout.badgeRadius} fill={GREEN_DARK} stroke="white" strokeWidth={4} />
            <text
              x={x} y={rootY + layout.badgeFont * 0.36}
              textAnchor="middle"
              fontFamily="Poppins, Inter, sans-serif"
              fontWeight="800"
              fontSize={layout.badgeFont}
              fill="white"
            >
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main section.
// ──────────────────────────────────────────────────────────────────────────────
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

  const visible = items.slice(0, MAX_ITEMS);
  const auditCount = visible.length;

  return (
    <section className="relative py-14 md:py-24 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40">
      {/* Background grid + blobs */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(15,23,42,1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,1)_1px,transparent_1px)] bg-[size:48px_48px]"
      />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />

      <div className="container-app relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-6 md:mb-10"
        >
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] font-bold px-3 py-1.5 rounded-full bg-emerald-600/10 text-emerald-700 mb-4">
            <ShieldCheck size={13} />
            Trust &amp; safety
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black leading-tight text-ink">
            Every retreat passes a{' '}
            <span className="text-emerald-600">{auditCount}-point audit</span>{' '}
            before it lists
          </h2>
          <p className="mt-3 text-base md:text-lg text-ink-muted leading-relaxed">
            We audit every property end-to-end — credentials, hygiene, transparency, safety and aftercare.
            Tap any leaf to see what we check.
          </p>
        </motion.div>

        {/*
          One tree, two layouts. Tailwind's responsive `hidden / block`
          classes swap them at the md (768 px) breakpoint. Each SVG is
          self-contained: viewBox + preserveAspectRatio guarantee the
          composition fits its container at any size, so the entire tree
          is always visible without horizontal scroll.
        */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.21, 0.96, 0.27, 0.99] }}
          className="relative mx-auto w-full"
          style={{ maxWidth: 1180 }}
        >
          {/* Desktop / tablet — horizontal tree */}
          <div className="hidden md:block">
            <TreeSvg layout={HORIZONTAL} items={visible} idSuffix="h" />
          </div>
          {/* Mobile — vertical tree, taller so the cards stay readable */}
          <div className="md:hidden">
            <TreeSvg layout={VERTICAL} items={visible} idSuffix="v" />
          </div>
        </motion.div>

        {/* Footer strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-ink-muted"
        >
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck size={16} className="text-emerald-600" /> Independently audited
          </span>
          <span className="hidden sm:inline text-ink-muted/40">·</span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw size={16} className="text-emerald-600" /> Re-checked annually
          </span>
          <span className="hidden sm:inline text-ink-muted/40">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={16} className="text-emerald-600" /> Tap a leaf for details
          </span>
        </motion.div>
      </div>
    </section>
  );
}
