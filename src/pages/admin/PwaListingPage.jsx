import { useEffect, useState, useCallback } from 'react';
import {
  Globe, Loader2, Building2, Package as PackageIcon, CalendarDays, X,
  Plus, Trash2, FileText, Download, RefreshCw, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';

const TABS = [
  { key: 'config', label: 'Listing & Configuration' },
  { key: 'process', label: 'Property on Process' },
  { key: 'contracts', label: 'Signed Contracts' },
];

export default function PwaListingPage() {
  const [tab, setTab] = useState('config');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Globe size={22} className="text-brand" /> Website Listing
        </h1>
        <p className="text-ink-muted text-sm">
          Configure onboarded properties and publish them to the website.
        </p>
      </div>

      <div className="flex gap-1 border-b mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'config' && <ConfigTab />}
      {tab === 'process' && <ProcessTab />}
      {tab === 'contracts' && <ContractsTab />}
    </div>
  );
}

/* ─────────────────────────── Tab 1: Listing & Config ─────────────────── */

function ConfigTab() {
  const [sub, setSub] = useState('queue'); // queue | listed
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pwa/admin/listings/${sub}`);
      setItems(res.data.data.items || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [sub]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="inline-flex bg-surface-alt rounded-lg p-1 text-sm mb-4">
        <button
          onClick={() => setSub('queue')}
          className={`px-3 py-1.5 rounded-md ${sub === 'queue' ? 'bg-white shadow-soft text-brand' : 'text-ink-muted'}`}
        >
          New from PWA
        </button>
        <button
          onClick={() => setSub('listed')}
          className={`px-3 py-1.5 rounded-md ${sub === 'listed' ? 'bg-white shadow-soft text-brand' : 'text-ink-muted'}`}
        >
          Listed on website
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty label={sub === 'queue' ? 'No properties waiting to be configured.' : 'No properties listed yet.'} />
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <PropertyRow key={p.id} p={p} onConfigure={() => setEditId(p.id)} />
          ))}
        </div>
      )}

      {editId && (
        <ConfigEditor
          propertyId={editId}
          onClose={() => setEditId(null)}
          onChanged={() => { setEditId(null); load(); }}
        />
      )}
    </div>
  );
}

function PropertyRow({ p, onConfigure }) {
  const cfg = p.listingConfig;
  const listed = cfg?.listingStatus === 'listed';
  return (
    <div className="card p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold truncate">{p.name}</div>
        <div className="text-xs text-ink-muted truncate">
          {p.propertyCode || `#${p.id}`} · {p.ownerName || p.owner?.name || '—'} · {p.address}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          {cfg?.propertyType && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold capitalize">{cfg.propertyType}</span>
          )}
          <span className={`px-2 py-0.5 rounded-full font-semibold ${listed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {listed ? 'LISTED' : (cfg?.listingStatus === 'unlisted' ? 'UNLISTED' : 'DRAFT')}
          </span>
        </div>
      </div>
      <button onClick={onConfigure} className="btn-primary text-sm whitespace-nowrap">
        {listed ? 'Edit listing' : 'Configure'}
      </button>
    </div>
  );
}

/* ─────────────────────────── Config Editor (slide-over) ──────────────── */

const TYPE_OPTIONS = [
  { value: 'hotel', label: 'Hotel', icon: Building2 },
  { value: 'package', label: 'Package', icon: PackageIcon },
  { value: 'event', label: 'Event', icon: CalendarDays },
  { value: 'custom', label: 'Custom', icon: Globe },
];

function ConfigEditor({ propertyId, onClose, onChanged }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const [propertyType, setPropertyType] = useState('');
  const [customType, setCustomType] = useState('');
  const [markup, setMarkup] = useState({ mode: 'total', type: 'percent', value: 0, perRoom: {} });
  const [customFields, setCustomFields] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pwa/admin/listings/${propertyId}`);
      const prop = res.data.data.property;
      setProperty(prop);
      const cfg = prop.listingConfig || {};
      setPropertyType(cfg.propertyType || '');
      setCustomType(cfg.customType || '');
      setMarkup({ mode: 'total', type: 'percent', value: 0, perRoom: {}, ...(cfg.markup || {}) });
      setCustomFields(Array.isArray(cfg.customFields) ? cfg.customFields : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const rooms = roomsOf(property);
  const listed = property?.listingConfig?.listingStatus === 'listed';

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.put(`/pwa/admin/listings/${propertyId}/config`, {
        propertyType, customType, markup, customFields,
      });
      toast.success('Configuration saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!propertyType) return toast.error('Pick a property type first');
    setBusy('publish');
    try {
      await api.put(`/pwa/admin/listings/${propertyId}/config`, { propertyType, customType, markup, customFields });
      await api.post(`/pwa/admin/listings/${propertyId}/publish`);
      toast.success('Property is now live on the website');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      setBusy(null);
    }
  };

  const unlist = async () => {
    setBusy('unlist');
    try {
      await api.post(`/pwa/admin/listings/${propertyId}/unlist`);
      toast.success('Removed from website');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unlist failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl h-full bg-surface overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-display font-semibold truncate">{property?.name || 'Configure listing'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt"><X size={18} /></button>
        </div>

        {loading ? <Spinner /> : property && (
          <div className="p-5 space-y-5 pb-28">
            {/* PWA data (read-only) */}
            <PropertyDataView property={property} rooms={rooms} />

            {/* Type */}
            <Section title="Property type" hint="Decides which website category it lists under.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPropertyType(value)}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm font-medium transition ${
                      propertyType === value ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 text-ink-muted hover:border-brand/40'
                    }`}
                  >
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>
              {propertyType === 'custom' && (
                <input
                  className="input mt-3"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Custom type label (lists as a hotel)"
                />
              )}
            </Section>

            {/* Markup */}
            <MarkupEditor markup={markup} setMarkup={setMarkup} rooms={rooms} />

            {/* Custom fields */}
            <CustomFieldsEditor fields={customFields} setFields={setCustomFields} />
          </div>
        )}

        {/* Footer actions */}
        {!loading && property && (
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t px-5 py-3 flex flex-wrap justify-end gap-2">
            <button onClick={saveConfig} disabled={saving} className="btn-ghost text-sm">
              {saving ? 'Saving…' : 'Save config'}
            </button>
            {listed ? (
              <button onClick={unlist} disabled={busy} className="btn-ghost text-sm text-red-600">
                {busy === 'unlist' ? 'Removing…' : 'Unlist from website'}
              </button>
            ) : null}
            <button onClick={publish} disabled={busy} className="btn-primary text-sm">
              <Globe size={15} /> {busy === 'publish' ? 'Publishing…' : listed ? 'Re-publish' : 'List on website'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PWA property data (dynamic, read-only) ── */
function PropertyDataView({ property, rooms }) {
  const [open, setOpen] = useState(true);
  const sections = (property.fields || []).filter((f) => f.sectionKey !== 'rooms');
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between p-4">
        <span className="font-semibold text-sm">Property data from PWA (read-only)</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field label="Owner" value={property.ownerName || property.owner?.name} />
            <Field label="Owner email" value={property.ownerEmail || property.owner?.email} />
            <Field label="Owner phone" value={property.ownerPhone || property.owner?.phone} />
            <Field label="Auditor" value={property.auditor?.name} />
            <Field label="Rooms" value={property.numberOfRooms} />
            <Field label="Status" value={property.status} />
            <div className="col-span-2"><Field label="Address" value={property.address} /></div>
          </dl>

          {rooms.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">Rooms ({rooms.length})</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {rooms.map((r, i) => (
                  <div key={r.rid || i} className="rounded-lg border border-slate-200 p-2.5 text-xs">
                    <div className="font-semibold">{r.category || `Room ${i + 1}`}</div>
                    <div className="text-ink-muted">
                      {r.price != null ? `₹${Number(r.price).toLocaleString()}/night` : 'No price'}
                      {r.sizeSqft ? ` · ${r.sizeSqft} sqft` : ''}
                    </div>
                    {Array.isArray(r.facilities) && r.facilities.length > 0 && (
                      <div className="mt-1 text-[10px] text-ink-muted">{r.facilities.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">Sections</p>
              <div className="flex flex-wrap gap-1.5">
                {sections.map((s) => (
                  <span key={s.sectionKey} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                    {s.sectionKey}{(s.photoUrls?.length || 0) > 0 ? ` · ${s.photoUrls.length}📷` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Markup editor ── */
function MarkupEditor({ markup, setMarkup, rooms }) {
  const set = (patch) => setMarkup((m) => ({ ...m, ...patch }));
  const setRoom = (key, patch) => setMarkup((m) => ({
    ...m, perRoom: { ...(m.perRoom || {}), [key]: { type: 'percent', value: 0, ...(m.perRoom?.[key] || {}), ...patch } },
  }));
  return (
    <Section title="Markup" hint="Added on top of the onboarded price before it shows on the website.">
      <div className="flex gap-2 mb-3">
        {['total', 'per_room'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => set({ mode })}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
              markup.mode === mode ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 text-ink-muted'
            }`}
          >
            {mode === 'total' ? 'On total (all rooms)' : 'Per room'}
          </button>
        ))}
      </div>

      {markup.mode === 'total' ? (
        <div className="flex items-end gap-2">
          <div>
            <label className="label">Type</label>
            <select className="input" value={markup.type} onChange={(e) => set({ type: e.target.value })}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="label">Value</label>
            <input type="number" min="0" className="input" value={markup.value}
              onChange={(e) => set({ value: e.target.value })} placeholder={markup.type === 'percent' ? '15' : '500'} />
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <p className="text-xs text-ink-muted">This property has no individual rooms.</p>
      ) : (
        <div className="space-y-2">
          {rooms.map((r, i) => {
            const key = r.rid || String(i);
            const v = markup.perRoom?.[key] || { type: 'percent', value: 0 };
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate">{r.category || `Room ${i + 1}`}</span>
                <select className="input w-28" value={v.type} onChange={(e) => setRoom(key, { type: e.target.value })}>
                  <option value="percent">%</option>
                  <option value="fixed">₹</option>
                </select>
                <input type="number" min="0" className="input w-24" value={v.value}
                  onChange={(e) => setRoom(key, { value: e.target.value })} />
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

/* ── Custom fields editor ── */
function CustomFieldsEditor({ fields, setFields }) {
  const add = (kind) => setFields((f) => [...f, { id: `cf-${Date.now()}`, kind, name: '', value: '' }]);
  const update = (idx, patch) => setFields((f) => f.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const remove = (idx) => setFields((f) => f.filter((_, i) => i !== idx));

  const uploadImage = async (idx, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const tId = toast.loading('Uploading…');
    try {
      const res = await api.post('/uploads/inline', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      update(idx, { value: res.data?.data?.url || '' });
      toast.success('Uploaded', { id: tId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: tId });
    }
  };

  return (
    <Section title="Additional fields" hint="Extra text or images shown with the listing.">
      <div className="space-y-3">
        {fields.map((f, idx) => (
          <div key={f.id || idx} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">{f.kind}</span>
              <input className="input flex-1" value={f.name} onChange={(e) => update(idx, { name: e.target.value })} placeholder="Field name" />
              <button onClick={() => remove(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
            </div>
            {f.kind === 'image' ? (
              <div className="flex items-center gap-3">
                {f.value && <img src={fileUrl(f.value)} alt="" className="h-16 w-24 rounded-lg border object-cover" />}
                <label className="btn-ghost text-xs cursor-pointer">
                  {f.value ? 'Replace' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(idx, e.target.files?.[0])} />
                </label>
              </div>
            ) : (
              <textarea className="input" rows={2} value={f.value} onChange={(e) => update(idx, { value: e.target.value })} placeholder="Content" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => add('text')} className="btn-ghost text-xs"><Plus size={14} /> Text field</button>
        <button onClick={() => add('image')} className="btn-ghost text-xs"><Plus size={14} /> Image field</button>
      </div>
    </Section>
  );
}

/* ─────────────────────────── Tab 2: On Process ───────────────────────── */

function ProcessTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.get('/pwa/admin/listings-process')
      .then((r) => setItems(r.data.data.items || []))
      .catch((e) => toast.error(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!items.length) return <Empty label="No properties in process." />;

  return (
    <div className="grid gap-3">
      {items.map((p) => (
        <div key={p.id} className="card overflow-hidden">
          <button onClick={() => setOpenId((o) => (o === p.id ? null : p.id))} className="w-full flex items-center justify-between gap-3 p-4 text-left">
            <div className="min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-ink-muted truncate">{p.propertyCode || `#${p.id}`} · {p.ownerName || p.owner?.name || '—'}</div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold whitespace-nowrap">{p.status}</span>
          </button>
          {openId === p.id && (
            <div className="px-4 pb-4 border-t pt-3">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Field label="Owner" value={p.ownerName || p.owner?.name} />
                <Field label="Owner email" value={p.ownerEmail || p.owner?.email} />
                <Field label="Owner phone" value={p.ownerPhone || p.owner?.phone} />
                <Field label="Auditor" value={p.auditor?.name} />
                <Field label="Officer" value={p.officer?.name} />
                <Field label="Rooms" value={p.numberOfRooms} />
                <Field label="Source" value={p.source} />
                <Field label="Listed" value={p.listingConfig?.listingStatus || '—'} />
                <div className="col-span-2"><Field label="Address" value={p.address} /></div>
              </dl>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Tab 3: Signed Contracts ─────────────────── */

function ContractsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.get('/pwa/admin/signed-properties')
      .then((r) => setItems(r.data.data.items || []))
      .catch((e) => toast.error(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const download = async (p) => {
    setDownloadingId(p.id);
    try {
      const res = await api.get(`/pwa/admin/signed-properties/${p.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.propertyCode || p.name || 'contract'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <Spinner />;
  if (!items.length) return <Empty label="No signed contracts yet." />;

  return (
    <div className="grid gap-3">
      {items.map((p) => (
        <div key={p.id} className="card p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate flex items-center gap-2">
              <FileText size={16} className="text-brand shrink-0" /> {p.name}
            </div>
            <div className="text-xs text-ink-muted truncate">
              {p.propertyCode || `#${p.id}`} · {p.ownerName || p.owner?.name || '—'} ·{' '}
              <span className="text-green-700 font-semibold capitalize">{p.status}</span>
            </div>
          </div>
          <button onClick={() => download(p)} disabled={downloadingId === p.id} className="btn-primary text-sm whitespace-nowrap">
            <Download size={15} /> {downloadingId === p.id ? 'Downloading…' : 'Signed PDF'}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── shared bits ────────────────────────────── */

function Section({ title, hint, children }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      {hint && <p className="text-[11px] text-ink-muted mt-0.5 mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="text-sm text-ink break-words">{value == null || value === '' ? '—' : String(value)}</dd>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin text-brand" />
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="card p-12 text-center text-ink-muted">
      <Eye size={36} className="mx-auto mb-3 opacity-60" />
      <p>{label}</p>
    </div>
  );
}

const roomsOf = (property) => {
  const f = (property?.fields || []).find((x) => x.sectionKey === 'rooms');
  return Array.isArray(f?.deepDiveData?.rooms) ? f.deepDiveData.rooms : [];
};
