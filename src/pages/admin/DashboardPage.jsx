import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, Globe, Palette, Package, MapPin, Tag, HeartPulse, Activity,
  MessageSquareQuote, FileText, BookOpen, Star, Hotel as HotelIcon, Bed,
  Sparkles, CalendarDays, Megaphone, Layers, Trophy, Building2, Users as UsersIcon,
  Calendar, Wallet, CheckCircle2, XCircle, Settings, LayoutDashboard,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAdminView } from '../../context/AdminViewContext.jsx';

// "Configure" mode mirrors the website-setup cards the dashboard used to
// show before Phase 8 introduced the Main/Configure split.
const configureCards = [
  { label: 'Hero Sections', icon: Image, to: '/admin/website/hero', color: 'brand' },
  { label: 'Header Links', icon: Globe, to: '/admin/website/header-links', color: 'brand' },
  { label: 'Theme Manager', icon: Palette, to: '/admin/website/theme', color: 'brand' },
  { label: 'Site Details', icon: Building2, to: '/admin/website/site-details', color: 'brand' },
  { label: 'Cities', icon: MapPin, to: '/admin/content/cities', color: 'brand' },
  { label: 'Categories', icon: Tag, to: '/admin/content/categories', color: 'wellness' },
  { label: 'Problems', icon: HeartPulse, to: '/admin/content/problems', color: 'wellness' },
  { label: 'Activities', icon: Activity, to: '/admin/content/activities', color: 'wellness' },
  { label: 'Packages', icon: Package, to: '/admin/packages', color: 'wellness' },
  { label: 'Hotels', icon: HotelIcon, to: '/admin/hotels', color: 'brand' },
  { label: 'Available Rooms', icon: Bed, to: '/admin/rooms', color: 'brand' },
  { label: 'Add-on Activities', icon: Sparkles, to: '/admin/add-ons', color: 'wellness' },
  { label: 'Events', icon: CalendarDays, to: '/admin/events', color: 'wellness' },
  { label: 'Promo Banners', icon: Megaphone, to: '/admin/promo-banners', color: 'brand' },
  { label: 'Featured Tabs', icon: Layers, to: '/admin/website/featured-tabs', color: 'brand' },
  { label: 'Event Types', icon: Trophy, to: '/admin/content/event-types', color: 'wellness' },
  { label: 'Trainers', icon: UsersIcon, to: '/admin/trainers', color: 'wellness' },
  { label: 'Reviews', icon: Star, to: '/admin/reviews', color: 'wellness' },
  { label: 'Testimonials', icon: MessageSquareQuote, to: '/admin/testimonials', color: 'wellness' },
  { label: 'Blogs', icon: FileText, to: '/admin/blogs', color: 'brand' },
  { label: 'Blog Categories', icon: BookOpen, to: '/admin/content/blog-categories', color: 'brand' },
];

const fmtMoney = (n) =>
  `₹${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { view, setView } = useAdminView();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Pull a lightweight booking summary so the Main dashboard surfaces useful
  // numbers (total revenue, pending payment, recent bookings) without waiting
  // for the user to click into the bookings page.
  useEffect(() => {
    if (view !== 'main') return undefined;
    let cancelled = false;
    setSummaryLoading(true);
    api.get('/admin/bookings', { params: { limit: 5 } })
      .then((res) => { if (!cancelled) setSummary(res.data?.data || null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSummaryLoading(false); });
    return () => { cancelled = true; };
  }, [view]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold mb-1">Dashboard</h1>
        <p className="text-ink-muted text-sm">
          {view === 'main' ? 'Track every booking, payment and refund.' : 'Configure every part of the public site.'}
        </p>
      </div>

      {/* Big mode toggle — also the entry-point cards. Same state as the
          sidebar toggle, so clicking either updates the other in lockstep. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ModeCard
          active={view === 'main'}
          onClick={() => setView('main')}
          icon={LayoutDashboard}
          title="Main Dashboard"
          description="Bookings, transactions, customers — everything tied to revenue."
          accent="from-emerald-500 to-emerald-600"
        />
        <ModeCard
          active={view === 'configure'}
          onClick={() => setView('configure')}
          icon={Settings}
          title="Configure Dashboard"
          description="Hero, theme, content, hotels, events — set up the public site."
          accent="from-brand to-brand-dark"
        />
      </div>

      {view === 'main' ? (
        <MainView summary={summary} loading={summaryLoading} />
      ) : (
        <ConfigureView />
      )}
    </div>
  );
}

function ModeCard({ active, onClick, icon: Icon, title, description, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl p-5 transition border-2 ${
        active
          ? `bg-gradient-to-br ${accent} text-white border-transparent shadow-card`
          : 'bg-white border-gray-200 hover:border-brand/40 hover:shadow-soft text-ink'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
          active ? 'bg-white/20' : 'bg-brand/10 text-brand'
        }`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-lg">{title}</div>
          <div className={`text-sm mt-0.5 ${active ? 'opacity-90' : 'text-ink-muted'}`}>{description}</div>
        </div>
      </div>
    </button>
  );
}

function MainView({ summary, loading }) {
  const s = summary?.summary || {};
  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total revenue" value={fmtMoney(s.totalRevenue)} accent="bg-emerald-50 text-emerald-600" loading={loading} />
        <StatCard icon={Calendar} label="Bookings" value={s.bookingCount ?? 0} accent="bg-blue-50 text-blue-600" loading={loading} />
        <StatCard icon={CheckCircle2} label="Paid" value={s.paidCount ?? 0} accent="bg-amber-50 text-amber-600" loading={loading} />
        <StatCard icon={XCircle} label="Cancellations" value={s.cancelledCount ?? 0} accent="bg-rose-50 text-rose-600" loading={loading} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/bookings"
          className="card p-6 hover:shadow-lg transition group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-blue-50 text-blue-600 group-hover:scale-110 transition">
            <Calendar size={22} />
          </div>
          <div className="font-semibold text-lg">All Bookings</div>
          <div className="text-sm text-ink-muted mt-1">View, filter and open full details for every booking.</div>
        </Link>
        <Link
          to="/admin/transactions"
          className="card p-6 hover:shadow-lg transition group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
            <Wallet size={22} />
          </div>
          <div className="font-semibold text-lg">All Transactions</div>
          <div className="text-sm text-ink-muted mt-1">Payments, refunds, and full payment voucher per row.</div>
        </Link>
      </div>

      {/* Recent bookings preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Recent bookings</h2>
          <Link to="/admin/bookings" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="text-sm text-ink-muted py-6 text-center">Loading…</div>
        ) : !summary?.bookings?.length ? (
          <div className="text-sm text-ink-muted py-6 text-center inline-flex items-center justify-center gap-2 w-full">
            <AlertCircle size={16} /> No bookings yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {summary.bookings.map((b) => (
              <li key={b.bookingCode} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{b.item?.name || 'Booking'}</div>
                  <div className="text-xs text-ink-muted truncate">
                    <span className="font-mono">{b.bookingCode}</span> · {b.guest?.name || b.user?.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-brand">{fmtMoney(b.pricing?.total)}</div>
                  <div className="text-[11px] text-ink-muted capitalize">{b.status.replace('_', ' ')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted uppercase tracking-wide truncate">{label}</div>
        <div className="font-bold text-lg text-ink truncate">{loading ? '…' : value}</div>
      </div>
    </div>
  );
}

function ConfigureView() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {configureCards.map((c) => (
        <Link
          key={c.label}
          to={c.to}
          className="card p-6 hover:shadow-lg transition group relative"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              c.color === 'wellness' ? 'bg-wellness/10 text-wellness' : 'bg-brand/10 text-brand'
            } group-hover:scale-110 transition`}
          >
            <c.icon size={22} />
          </div>
          <div className="font-semibold">{c.label}</div>
          <div className="text-xs text-ink-muted mt-1">Open &amp; manage</div>
        </Link>
      ))}
    </div>
  );
}
