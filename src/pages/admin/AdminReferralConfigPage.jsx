import { useCallback, useEffect, useState } from 'react';
import {
  Save, Loader2, RotateCcw, Plus, Trash2, Gift, TrendingUp, Users as UsersIcon,
  AlertTriangle, Info, Sparkles, Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmtMoney } from '../../components/user/bookingFormatters.js';

export default function AdminReferralConfigPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [draft, setDraft] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/referral-config');
      setData(res.data?.data || null);
      setDraft(toDraft(res.data?.data?.config));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load referral config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!draft) return;
    if (draft.baseAmount === '' || Number(draft.baseAmount) < 0) {
      toast.error('Base amount must be ₹0 or more');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        enabled: draft.enabled,
        baseAmount: Number(draft.baseAmount),
        description: draft.description || '',
        tiers: draft.tiers.map((t) => ({
          atCount: Number(t.atCount),
          withinDays: Number(t.withinDays),
          totalPayout: Number(t.totalPayout),
          label: t.label,
        })),
      };
      const res = await api.put('/admin/referral-config', payload);
      toast.success('Referral config saved');
      setData((d) => ({ ...d, config: res.data?.data?.config }));
      setDraft(toDraft(res.data?.data?.config));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to platform defaults (₹300 base, ₹1200 for 3-in-10-days)? Your custom tiers will be lost.')) return;
    setResetting(true);
    try {
      const res = await api.post('/admin/referral-config/reset');
      toast.success('Reset to defaults');
      setData((d) => ({ ...d, config: res.data?.data?.config }));
      setDraft(toDraft(res.data?.data?.config));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-muted">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold mb-1 inline-flex items-center gap-2">
          <Gift size={22} className="text-brand" /> Referral Configuration
        </h1>
        <p className="text-ink-muted text-sm">
          Tune the rewards a user earns each time a friend they referred makes their first paid booking.
          Changes apply immediately — no restart.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard icon={UsersIcon}   label="Payouts to date"  value={stats.totalPayouts ?? 0}                accent="bg-blue-50 text-blue-700" />
        <StatCard icon={TrendingUp}  label="Total disbursed"  value={fmtMoney(stats.totalAmount ?? 0)}       accent="bg-emerald-50 text-emerald-700" />
        <StatCard icon={Sparkles}    label="Active tiers"     value={draft.tiers.length}                     accent="bg-amber-50 text-amber-700" />
      </div>

      {/* Enable / disable */}
      <div className="bg-white rounded-2xl shadow-soft p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${draft.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <Power size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-ink text-sm">Referral payouts</div>
              <div className="text-xs text-ink-muted mt-0.5">
                {draft.enabled
                  ? 'On — referrers earn wallet credit when their referees complete a first paid booking.'
                  : 'Off — no payouts will be issued for any new referrals (existing balances stay intact).'}
              </div>
            </div>
          </div>
          <Toggle checked={draft.enabled} onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))} />
        </div>
      </div>

      {/* Base reward */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-ink">Base reward</h3>
            <p className="text-xs text-ink-muted mt-0.5">Paid for every qualifying referral that doesn't trigger a tier bonus.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-brand">₹</span>
          <input
            type="number"
            value={draft.baseAmount}
            onChange={(e) => setDraft((d) => ({ ...d, baseAmount: e.target.value }))}
            min="0"
            step="50"
            className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-lg font-bold focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
          />
          <span className="text-sm text-ink-muted">per qualifying referral</span>
        </div>
      </div>

      {/* Tiered bonuses */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-ink">Bonus tiers</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              When a referrer hits a tier, we top up the difference between the tier amount and what they've already earned as base payouts for those N referees.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({
              ...d,
              tiers: [...d.tiers, { atCount: 5, withinDays: 30, totalPayout: 2000, label: '5 referrals within 30 days' }],
            }))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition"
          >
            <Plus size={12} /> Add tier
          </button>
        </div>

        {draft.tiers.length === 0 ? (
          <div className="text-sm text-ink-muted bg-surface-alt/40 rounded-xl p-6 text-center">
            No bonus tiers — only the flat base reward will apply.
          </div>
        ) : (
          <div className="space-y-3">
            {draft.tiers.map((tier, idx) => (
              <TierRow
                key={idx}
                tier={tier}
                baseAmount={Number(draft.baseAmount) || 0}
                onChange={(patch) => setDraft((d) => ({
                  ...d,
                  tiers: d.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
                }))}
                onRemove={() => setDraft((d) => ({
                  ...d,
                  tiers: d.tiers.filter((_, i) => i !== idx),
                }))}
              />
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-start gap-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          <div>
            <strong>How it works:</strong> First match wins. We count the referrer's referees who have completed their first paid booking, chronologically. If <strong>atCount</strong> matches AND those referees' first-paid dates fit inside <strong>withinDays</strong> from the very first one, the tier pays the difference between <em>totalPayout</em> and <em>base × atCount</em>. So a tier of <code>3 / 10 days / ₹1200</code> with <code>base ₹300</code> tops up by ₹300 the moment the 3rd qualifying referee pays within 10 days of the 1st.
          </div>
        </div>
      </div>

      {/* Public description */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-5">
        <h3 className="font-display font-bold text-ink mb-2">Public description</h3>
        <p className="text-xs text-ink-muted mb-2">Shown to users on the Refer & Earn page.</p>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 p-4 rounded-2xl shadow-soft">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting || saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-ink-muted hover:bg-slate-50 disabled:opacity-60"
        >
          {resetting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand/90 transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save changes
        </button>
      </div>
    </div>
  );
}

const toDraft = (config) => {
  if (!config) return null;
  return {
    enabled: !!config.enabled,
    baseAmount: String(config.baseAmount ?? 0),
    tiers: (config.tiers || []).map((t) => ({
      atCount: String(t.atCount ?? 1),
      withinDays: String(t.withinDays ?? 0),
      totalPayout: String(t.totalPayout ?? 0),
      label: t.label || '',
    })),
    description: config.description || '',
  };
};

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

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-brand' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 ${checked ? 'left-5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all`} />
    </button>
  );
}

function TierRow({ tier, baseAmount, onChange, onRemove }) {
  const atCount = Number(tier.atCount) || 0;
  const totalPayout = Number(tier.totalPayout) || 0;
  const baseTotal = baseAmount * atCount;
  const topUp = Math.max(0, totalPayout - baseTotal);
  const isWarning = totalPayout < baseTotal;

  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-surface-alt/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="At referral #">
          <input
            type="number"
            min="1"
            value={tier.atCount}
            onChange={(e) => onChange({ atCount: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none"
          />
        </Field>
        <Field label="Within (days)">
          <input
            type="number"
            min="0"
            value={tier.withinDays}
            onChange={(e) => onChange({ withinDays: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none"
          />
        </Field>
        <Field label="Total payout (₹)">
          <input
            type="number"
            min="0"
            step="50"
            value={tier.totalPayout}
            onChange={(e) => onChange({ totalPayout: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none"
          />
        </Field>
        <Field label="Label (shown to admin)">
          <input
            type="text"
            value={tier.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={`${tier.atCount} referrals within ${tier.withinDays} days`}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none"
          />
        </Field>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className={`text-xs ${isWarning ? 'text-rose-600' : 'text-ink-muted'} inline-flex items-center gap-1.5`}>
          {isWarning && <AlertTriangle size={12} />}
          {isWarning
            ? `Warning: total payout ₹${totalPayout} is less than base × atCount (₹${baseTotal}). Top-up will be ₹0.`
            : <>Base × atCount = ₹{baseTotal.toLocaleString()} · Tier top-up = <strong className="text-emerald-600">₹{topUp.toLocaleString()}</strong></>
          }
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-ink-muted mb-1 font-bold">{label}</span>
      {children}
    </label>
  );
}
