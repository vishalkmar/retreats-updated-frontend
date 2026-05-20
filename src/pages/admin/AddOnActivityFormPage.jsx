import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Image as ImageIcon, Tag, MapPin,
  DollarSign, HelpCircle, Sparkles, Settings, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import { FaqEditor } from '../../components/admin/KeyValueListEditor.jsx';
import Dropzone from '../../components/admin/Dropzone.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';
import usePersistedForm from '../../hooks/usePersistedForm.js';

const blankForm = {
  name: '', slug: '',
  locationId: '',
  price: 0, priceOriginal: '', currency: 'INR',
  descriptionRich: '', highlightsRich: '',
  minAge: '', maxAge: '',
  faqs: [],
  isFeatured: false, isActive: true,
  sortOrder: 0,
};

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card mb-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
            <Icon size={18} />
          </div>
          <h3 className="font-display font-semibold">{title}</h3>
        </div>
        <span className="text-ink-muted text-xs">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="px-5 pb-5 border-t pt-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function AddOnActivityFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const {
    value: form,
    setValue: setForm,
    hydrateFromServer,
    clearDraft,
    discardDraft,
    hasDraft,
  } = usePersistedForm(`addon-form:${id || 'new'}`, blankForm, { editing });
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const [mainImage, setMainImage] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [replaceGallery, setReplaceGallery] = useState(false);

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.get('/locations/all').then((r) => setLocations(r.data.data.items)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await api.get(`/add-ons/admin/${id}`);
      const a = res.data.data.activity;
      setActivity(a);
      hydrateFromServer({
        name: a.name || '',
        slug: a.slug || '',
        locationId: a.locationId || '',
        price: a.price ?? 0,
        priceOriginal: a.priceOriginal ?? '',
        currency: a.currency || 'INR',
        descriptionRich: a.descriptionRich || '',
        highlightsRich: a.highlightsRich || '',
        minAge: a.minAge ?? '',
        maxAge: a.maxAge ?? '',
        faqs: a.faqs || [],
        isFeatured: !!a.isFeatured,
        isActive: a.isActive ?? true,
        sortOrder: a.sortOrder ?? 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [editing, id]);

  useEffect(() => { load(); }, [load]);

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.error('Name is required');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
        fd.append(k, JSON.stringify(v));
      } else {
        fd.append(k, v);
      }
    });
    if (mainImage) fd.append('mainImage', mainImage);
    galleryFiles.forEach((f) => fd.append('gallery', f));
    if (editing && replaceGallery) fd.append('replaceGallery', 'true');

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/add-ons/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Activity saved');
        clearDraft();
      } else {
        const res = await api.post('/add-ons', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Activity created');
        clearDraft();
        navigate(`/admin/add-ons/${res.data.data.activity.id}/edit`, { replace: true });
        return;
      }
      load();
      setMainImage(null);
      setGalleryFiles([]);
      setReplaceGallery(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const removeGalleryImg = async (imageId) => {
    if (!confirm('Remove this image?')) return;
    try {
      await api.delete(`/add-ons/${id}/gallery/${imageId}`);
      toast.success('Image removed');
      load();
    } catch (err) {
      toast.error('Remove failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/add-ons" className="p-2 rounded-lg hover:bg-surface-alt">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-display font-bold">
            {editing ? 'Edit Add-on Activity' : 'New Add-on Activity'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <button
              type="button"
              onClick={() => {
                if (!confirm('Discard unsaved draft and reload from the server?')) return;
                discardDraft();
                if (editing) load();
              }}
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100"
            >
              Discard draft
            </button>
          )}
          <button disabled={submitting} className="btn-primary">
            <Save size={16} /> {submitting ? 'Saving…' : 'Save activity'}
          </button>
        </div>
      </div>

      <Section icon={Tag} title="Basic info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
          <div className="sm:col-span-2">
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => change('name', e.target.value)}
              placeholder="Sunset Cruise on the Ganges"
              required
            />
          </div>
          <div>
            <label className="label">Slug (auto if empty)</label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => change('slug', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number" className="input"
              value={form.sortOrder}
              onChange={(e) => change('sortOrder', parseInt(e.target.value || 0, 10))}
            />
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Location & pricing">
        <div className="grid sm:grid-cols-4 gap-x-6 gap-y-6">
          <div className="sm:col-span-2">
            <label className="label">Location</label>
            <select
              className="input"
              value={form.locationId}
              onChange={(e) => change('locationId', e.target.value)}
            >
              <option value="">— Select —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.country ? ` · ${l.country}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" value={form.currency} onChange={(e) => change('currency', e.target.value)} />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number" className="input"
              value={form.sortOrder}
              onChange={(e) => change('sortOrder', parseInt(e.target.value || 0, 10))}
            />
          </div>
          <div>
            <label className="label">Price</label>
            <input
              type="number" step="0.01" className="input"
              value={form.price}
              onChange={(e) => change('price', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Original price</label>
            <input
              type="number" step="0.01" className="input"
              value={form.priceOriginal}
              onChange={(e) => change('priceOriginal', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Min age</label>
            <input
              type="number" min="0" className="input"
              value={form.minAge}
              onChange={(e) => change('minAge', e.target.value)}
              placeholder="No min"
            />
          </div>
          <div>
            <label className="label">Max age</label>
            <input
              type="number" min="0" className="input"
              value={form.maxAge}
              onChange={(e) => change('maxAge', e.target.value)}
              placeholder="No max"
            />
          </div>
        </div>
      </Section>

      <Section icon={ImageIcon} title="Media — main image & gallery">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Main image</label>
            <Dropzone
              accept="image/*"
              value={mainImage}
              onChange={setMainImage}
              existingUrl={activity?.mainImage}
              placeholder={activity?.mainImage ? 'Drag a new image to replace, or click' : 'Drag & drop main image, or click'}
            />
          </div>
          <div>
            <label className="label">Gallery (multiple)</label>
            <Dropzone
              accept="image/*"
              multiple
              value={galleryFiles}
              onChange={(v) => setGalleryFiles(v || [])}
              placeholder="Drag & drop images, or click"
            />
            {editing && activity?.gallery?.length > 0 && (
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={replaceGallery} onChange={(e) => setReplaceGallery(e.target.checked)} />
                Replace existing gallery instead of appending
              </label>
            )}
          </div>
        </div>

        {editing && activity?.gallery?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {activity.gallery.map((g) => (
              <div key={g.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img src={fileUrl(g.url)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImg(g.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={FileText} title="Highlights & description">
        <div>
          <label className="label">Highlights</label>
          <RichTextEditor value={form.highlightsRich} onChange={(v) => change('highlightsRich', v)} />
        </div>
        <div>
          <label className="label">Description</label>
          <RichTextEditor value={form.descriptionRich} onChange={(v) => change('descriptionRich', v)} />
        </div>
      </Section>

      <Section icon={HelpCircle} title="FAQs">
        <FaqEditor value={form.faqs} onChange={(v) => change('faqs', v)} />
      </Section>

      <Section icon={Settings} title="Status">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => change('isActive', e.target.checked)} />
            <span className="text-sm">Active / visible on site</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => change('isFeatured', e.target.checked)} />
            <span className="text-sm">Featured</span>
          </label>
        </div>
      </Section>

      <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t -mx-6 px-6 py-4 flex justify-end gap-2">
        <Link to="/admin/add-ons" className="btn-ghost">Cancel</Link>
        <button disabled={submitting} className="btn-primary">
          <Save size={16} /> {submitting ? 'Saving…' : 'Save activity'}
        </button>
      </div>
    </form>
  );
}
