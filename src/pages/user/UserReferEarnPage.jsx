import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Gift, Copy, Check, Share2, Wallet, Tag, Users, Clock, Loader2,
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useUserAuth } from '../../context/UserAuthContext.jsx';

const fmtMoney = (n, currency = 'INR') =>
  `${currency === 'INR' ? '₹' : currency + ' '}${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const TXN_TYPE_LABEL = {
  referral_payout: 'Referral payout',
  booking_used: 'Used on booking',
  booking_refund: 'Refund — booking cancelled',
  admin_adjust: 'Manual adjustment',
  signup_bonus: 'Signup bonus',
};

export default function UserReferEarnPage() {
  const { user } = useUserAuth();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('wallet');
  const [config, setConfig] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [coupons, setCoupons] = useState([]);
  const [referees, setReferees] = useState({ referees: [], count: 0, rewardedCount: 0, pendingCount: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);

  const code = user?.referralCode || '';
  const inviteUrl = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch everything in parallel — the refer & earn page is read-heavy.
      const [cfg, w, c, r] = await Promise.all([
        api.get('/refer-earn/config'),
        api.get('/refer-earn/wallet'),
        api.get('/refer-earn/coupons'),
        api.get('/refer-earn/referees'),
      ]);
      setConfig(cfg.data?.data || null);
      setWallet(w.data?.data || { balance: 0, transactions: [] });
      setCoupons(c.data?.data?.coupons || []);
      setReferees(r.data?.data || { referees: [], count: 0, rewardedCount: 0, pendingCount: 0, totalEarned: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load refer & earn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  const share = async () => {
    const shareData = {
      title: 'Join me on Retreats by Traveon',
      text: `I'm loving Retreats by Traveon! Sign up with my code ${code} and we both get rewarded.`,
      url: inviteUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      copy(inviteUrl);
    }
  };

  const activeCoupons = useMemo(
    () => coupons.filter((c) => !c.isExpired && !c.isUsedUp),
    [coupons]
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Refer & Earn</h1>
        <p className="text-sm text-ink-muted mt-1">
          {config
            ? `Invite a friend and earn ${fmtMoney(config.referrerWallet)} in wallet credit when they complete their first booking.`
            : 'Invite friends, earn rewards.'}
        </p>
      </div>

      {/* Hero card — referral code + share */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl p-6 md:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Gift size={22} />
          </div>
          <div>
            <p className="text-sm opacity-90">Your referral code</p>
            <p className="font-bold text-2xl tracking-wider">{code || '—'}</p>
          </div>
        </div>

        {config && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-sm">
            <Perk title="You earn" value={`${fmtMoney(config.referrerWallet)} wallet`} sub="per friend's first booking" />
            <Perk title="They get" value={`${config.newUserCouponPercent}% off`} sub={`up to ${fmtMoney(config.newUserCouponCap)}`} />
            <Perk title="Bonus" value={`${config.referrerCouponPercent}% off coupon`} sub="for you on next booking" />
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            type="button"
            onClick={() => copy(code)}
            disabled={!code}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-orange-600 font-medium hover:bg-orange-50 transition disabled:opacity-60"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
          <button
            type="button"
            onClick={share}
            disabled={!code}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium transition disabled:opacity-60"
          >
            <Share2 size={16} />
            Share invite link
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Wallet balance" value={fmtMoney(wallet.balance)} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Users} label="Friends invited" value={referees.count} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle2} label="Rewarded" value={referees.rewardedCount} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={Tag} label="Active coupons" value={activeCoupons.length} accent="bg-fuchsia-50 text-fuchsia-600" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {[
          { key: 'wallet', label: 'Wallet history' },
          { key: 'coupons', label: `Coupons (${activeCoupons.length})` },
          { key: 'referees', label: `Friends (${referees.count})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 -mb-px text-sm font-semibold border-b-2 transition ${
              tab === t.key
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-soft p-16 text-center">
          <Loader2 className="animate-spin mx-auto text-brand" />
        </div>
      ) : tab === 'wallet' ? (
        <WalletHistory transactions={wallet.transactions} />
      ) : tab === 'coupons' ? (
        <CouponList coupons={coupons} onCopy={copy} />
      ) : (
        <RefereesList referees={referees.referees} />
      )}
    </div>
  );
}

function Perk({ title, value, sub }) {
  return (
    <div className="bg-white/15 rounded-lg px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider opacity-90">{title}</div>
      <div className="font-bold text-base mt-0.5">{value}</div>
      <div className="text-[11px] opacity-90">{sub}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted uppercase tracking-wide truncate">{label}</div>
        <div className="font-bold text-lg text-ink truncate">{value}</div>
      </div>
    </div>
  );
}

function WalletHistory({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-10 text-center">
        <Wallet size={28} className="mx-auto text-ink-muted mb-2" />
        <h3 className="font-semibold text-ink">No wallet activity yet</h3>
        <p className="text-sm text-ink-muted mt-1">Your credits, earnings and refunds will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {transactions.map((t) => {
          const credit = t.amount > 0;
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                credit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                {credit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink truncate">
                  {TXN_TYPE_LABEL[t.type] || t.type}
                </div>
                <div className="text-xs text-ink-muted truncate">{t.description || ''}</div>
                <div className="text-[10px] text-ink-muted mt-0.5">{fmtDateTime(t.createdAt)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-bold text-base ${credit ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {credit ? '+' : ''}{fmtMoney(t.amount)}
                </div>
                <div className="text-[10px] text-ink-muted">Balance {fmtMoney(t.balanceAfter)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CouponList({ coupons, onCopy }) {
  if (!coupons.length) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-10 text-center">
        <Tag size={28} className="mx-auto text-ink-muted mb-2" />
        <h3 className="font-semibold text-ink">No coupons yet</h3>
        <p className="text-sm text-ink-muted mt-1">Refer a friend to earn your first coupon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {coupons.map((c) => (
        <CouponCard key={c.id} coupon={c} onCopy={onCopy} />
      ))}
    </div>
  );
}

function CouponCard({ coupon, onCopy }) {
  const isActive = !coupon.isExpired && !coupon.isUsedUp;
  return (
    <article className={`rounded-2xl border-2 border-dashed p-4 relative overflow-hidden ${
      isActive ? 'bg-white border-brand/30' : 'bg-surface-alt/30 border-gray-200 opacity-70'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted font-bold mb-1 flex items-center gap-1.5">
            <Tag size={11} /> {coupon.reason.replace('_', ' ')}
          </div>
          <div className="font-display font-bold text-2xl text-brand tracking-wider">
            {coupon.kind === 'percent' ? `${coupon.value}% OFF` : `${fmtMoney(coupon.value / 100)} OFF`}
          </div>
          {coupon.maxDiscount && coupon.kind === 'percent' && (
            <div className="text-[11px] text-ink-muted mt-0.5">up to {fmtMoney(coupon.maxDiscount)}</div>
          )}
        </div>
        {!isActive && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-600 uppercase">
            {coupon.isUsedUp ? 'Used' : 'Expired'}
          </span>
        )}
      </div>

      {coupon.description && (
        <p className="text-xs text-ink-muted mt-2 line-clamp-2">{coupon.description}</p>
      )}

      <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-ink-muted uppercase tracking-wide">Code</div>
          <div className="font-mono font-bold text-sm text-ink truncate">{coupon.code}</div>
        </div>
        <button
          type="button"
          onClick={() => onCopy(coupon.code)}
          disabled={!isActive}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
            isActive ? 'bg-brand text-white hover:brightness-110' : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Copy size={12} /> Copy
        </button>
      </div>

      {coupon.expiresAt && isActive && (
        <div className="text-[11px] text-ink-muted mt-2 inline-flex items-center gap-1">
          <Clock size={11} /> Expires {fmtDate(coupon.expiresAt)}
        </div>
      )}
    </article>
  );
}

function RefereesList({ referees }) {
  if (!referees.length) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-10 text-center">
        <Users size={28} className="mx-auto text-ink-muted mb-2" />
        <h3 className="font-semibold text-ink">You haven't referred anyone yet</h3>
        <p className="text-sm text-ink-muted mt-1">Share your code with a friend to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {referees.map((r) => {
          const done = r.status === 'rewarded';
          return (
            <li key={r.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                done ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink truncate">{r.name || r.emailMasked}</div>
                <div className="text-xs text-ink-muted truncate">{r.emailMasked}</div>
                <div className="text-[10px] text-ink-muted mt-0.5">Joined {fmtDate(r.joinedAt)}</div>
              </div>
              <div className="text-right shrink-0">
                {done ? (
                  <>
                    <div className="font-bold text-base text-emerald-600">+{fmtMoney(r.rewardEarned)}</div>
                    <div className="text-[10px] text-ink-muted">{fmtDate(r.rewardEarnedAt)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-amber-600">Awaiting first booking</div>
                    <div className="text-[10px] text-ink-muted">{r.paidBookingCount} bookings</div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
