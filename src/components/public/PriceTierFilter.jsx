import { useMemo } from 'react';
import { ChevronDown, IndianRupee } from 'lucide-react';

/**
 * Dynamic price-tier dropdown used by Hotels / Packages / Events list pages.
 *
 * Props
 *   priceMin     — lowest price in the live dataset (number).
 *   priceMax     — highest price in the live dataset (number). Required for
 *                  the dropdown to have meaningful tiers.
 *   value        — currently-selected maxPrice (string or number).
 *   onChange     — (nextMaxPriceString: string) => void.  Pass '' to clear.
 *   currency     — display label, defaults to 'INR'.
 *   tierCount    — how many tiers to render (default 5).
 *
 * Renders nothing if priceMax is missing or non-positive — the page will
 * gracefully hide the filter until prices are known.
 */
export default function PriceTierFilter({
  priceMin = 0,
  priceMax,
  value,
  onChange,
  currency = 'INR',
  tierCount = 5,
}) {
  const tiers = useMemo(() => {
    const fromLive = generateTiers(Number(priceMin) || 0, Number(priceMax) || 0, tierCount);
    if (fromLive.length > 0) return fromLive;
    // Fallback tiers — used while the catalogue probe is in flight or when
    // the dataset hasn't been priced yet. Ensures the filter is ALWAYS
    // visible at the top of the sidebar.
    return [5000, 10000, 25000, 50000, 100000];
  }, [priceMin, priceMax, tierCount]);

  const haveLiveRange = Number(priceMax) > 0;

  return (
    <div className="relative">
      <select
        className="input pr-9 appearance-none cursor-pointer"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Any price</option>
        {tiers.map((t) => (
          <option key={t} value={t}>
            Under {currency} {t.toLocaleString()}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      {haveLiveRange && (
        <p className="mt-1.5 text-[11px] text-ink-muted flex items-center gap-1">
          <IndianRupee size={11} />
          Range in this list: {currency} {Number(priceMin).toLocaleString()} – {Number(priceMax).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// Round to a "nice" step value (500 or 1000 for big, 100 for small).
function roundStep(step) {
  if (step <= 0) return 100;
  if (step >= 5000) return Math.ceil(step / 1000) * 1000;
  if (step >= 1000) return Math.ceil(step / 500) * 500;
  if (step >= 100) return Math.ceil(step / 100) * 100;
  return Math.max(50, Math.ceil(step / 50) * 50);
}

function roundUpToNice(n) {
  if (n <= 0) return 0;
  if (n >= 100000) return Math.ceil(n / 5000) * 5000;
  if (n >= 10000) return Math.ceil(n / 1000) * 1000;
  if (n >= 1000) return Math.ceil(n / 500) * 500;
  if (n >= 100) return Math.ceil(n / 50) * 50;
  return Math.ceil(n / 10) * 10;
}

function generateTiers(min, max, count) {
  if (!max || max <= 0) return [];

  const cleanMax = roundUpToNice(max);
  const cleanMin = Math.max(0, Math.floor(min / 100) * 100);

  // Just one tier needed when range is too tight.
  if (cleanMax - cleanMin < 500 || count <= 1) return [cleanMax];

  const step = roundStep((cleanMax - cleanMin) / count);
  const tiers = new Set();
  let v = Math.max(cleanMin + step, step);
  while (v < cleanMax && tiers.size < count - 1) {
    tiers.add(v);
    v += step;
  }
  tiers.add(cleanMax);
  return [...tiers].sort((a, b) => a - b);
}
