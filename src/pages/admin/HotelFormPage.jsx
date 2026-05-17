import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Image as ImageIcon, Tag, MapPin, Star,
  DollarSign, HelpCircle, FileText, Shield, Settings,
  Wifi, Landmark, Video, Map as MapIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import MultiSelectChips from '../../components/admin/MultiSelectChips.jsx';
import { FaqEditor } from '../../components/admin/KeyValueListEditor.jsx';
import Dropzone from '../../components/admin/Dropzone.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';
import usePersistedForm from '../../hooks/usePersistedForm.js';

const VIDEO_TYPES = [
  { value: '', label: '— Auto detect —' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'mp4', label: 'Direct MP4' },
  { value: 'other', label: 'Other' },
];

const STAR_OPTIONS = [
  { value: '', label: 'Unrated' },
  { value: '1', label: '★ 1' },
  { value: '2', label: '★★ 2' },
  { value: '3', label: '★★★ 3' },
  { value: '4', label: '★★★★ 4' },
  { value: '5', label: '★★★★★ 5' },
];

const blankForm = {
  name: '', slug: '',
  shortDescription: '', description: '',
  videoUrl: '', videoType: '',
  locationId: '', cityId: '',
  address: '', mapEmbedHtml: '',
  rating: 0, starRating: '',
  priceFrom: 0, priceOriginal: '', currency: 'INR',
  highlightsRich: '', inclusionsRich: '', exclusionsRich: '',
  termsConditions: '', privacyPolicy: '',
  faqs: [],
  isFeatured: false, isActive: true,
  metaTitle: '', metaDescription: '',
  sortOrder: 0,
  facilityIds: [], nearbyPlaceIds: [],
};

function Section({ icon: Icon, title, children, defaultOpen = true, subtitle }) {
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
          <div>
            <h3 className="font-display font-semibold">{title}</h3>
            {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <span className="text-ink-muted text-xs">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="px-5 pb-5 border-t pt-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function HotelFormPage() {
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
  } = usePersistedForm(`hotel-form:${id || 'new'}`, blankForm);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const [primaryImage, setPrimaryImage] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [replaceGallery, setReplaceGallery] = useState(false);

  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  // Load taxonomies
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loc, c, f, np] = await Promise.all([
          api.get('/locations/all'),
          api.get('/cities/all'),
          api.get('/facilities/all'),
          api.get('/nearby-places/all'),
        ]);
        setLocations(loc.data.data.items);
        setCities(c.data.data.items);
        setFacilities(f.data.data.items);
        setNearbyPlaces(np.data.data.items);
      } catch (err) {
        toast.error('Failed to load taxonomies');
      }
    };
    fetchAll();
  }, []);

  // Load hotel if editing
  const loadHotel = useCallback(async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await api.get(`/hotels/admin/${id}`);
      const h = res.data.data.hotel;
      setHotel(h);
      hydrateFromServer({
        name: h.name || '',
        slug: h.slug || '',
        shortDescription: h.shortDescription || '',
        description: h.description || '',
        videoUrl: h.videoUrl || '',
        videoType: h.videoType || '',
        locationId: h.locationId || '',
        cityId: h.cityId || '',
        address: h.address || '',
        mapEmbedHtml: h.mapEmbedHtml || '',
        rating: h.rating ?? 0,
        starRating: h.starRating ?? '',
        priceFrom: h.priceFrom ?? 0,
        priceOriginal: h.priceOriginal ?? '',
        currency: h.currency || 'INR',
        highlightsRich: h.highlightsRich || '',
        inclusionsRich: h.inclusionsRich || '',
        exclusionsRich: h.exclusionsRich || '',
        termsConditions: h.termsConditions || '',
        privacyPolicy: h.privacyPolicy || '',
        faqs: h.faqs || [],
        isFeatured: !!h.isFeatured,
        isActive: h.isActive ?? true,
        metaTitle: h.metaTitle || '',
        metaDescription: h.metaDescription || '',
        sortOrder: h.sortOrder ?? 0,
        facilityIds: (h.facilities || []).map((x) => x.id),
        nearbyPlaceIds: (h.nearbyPlaces || []).map((x) => x.id),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load hotel');
    } finally {
      setLoading(false);
    }
  }, [editing, id]);

  useEffect(() => { loadHotel(); }, [loadHotel]);

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
    if (primaryImage) fd.append('primaryImage', primaryImage);
    galleryFiles.forEach((f) => fd.append('gallery', f));
    if (editing && replaceGallery) fd.append('replaceGallery', 'true');

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/hotels/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Hotel saved');
        clearDraft();
      } else {
        const res = await api.post('/hotels', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Hotel created');
        clearDraft();
        navigate(`/admin/hotels/${res.data.data.hotel.id}/edit`, { replace: true });
        return;
      }
      loadHotel();
      setPrimaryImage(null);
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
      await api.delete(`/hotels/${id}/gallery/${imageId}`);
      toast.success('Image removed');
      loadHotel();
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
          <Link to="/admin/hotels" className="p-2 rounded-lg hover:bg-surface-alt">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {editing ? 'Edit Hotel' : 'New Hotel'}
            </h1>
            {editing && hotel && (
              <p className="text-xs text-ink-muted">
                Public URL:{' '}
                <Link to={`/hotels/${hotel.slug}`} target="_blank" className="text-brand hover:underline">
                  /hotels/{hotel.slug}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing && hotel && (
            <Link
              to={`/admin/rooms?hotelId=${hotel.id}`}
              className="btn-ghost text-sm"
              title="Manage rooms for this hotel"
            >
              Manage rooms →
            </Link>
          )}
          {hasDraft && (
            <button
              type="button"
              onClick={() => { if (confirm('Discard unsaved draft and reset the form?')) discardDraft(); }}
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100"
            >
              Discard draft
            </button>
          )}
          <button disabled={submitting} className="btn-primary">
            <Save size={16} /> {submitting ? 'Saving…' : 'Save hotel'}
          </button>
        </div>
      </div>

      {/* Basic */}
      <Section icon={Tag} title="Basic info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
          <div className="sm:col-span-2">
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => change('name', e.target.value)}
              placeholder="Veda5 Wellness Retreats in Rishikesh"
              required
            />
          </div>
          <div>
            <label className="label">Slug (auto if empty)</label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => change('slug', e.target.value)}
              placeholder="veda5-rishikesh"
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
          <div className="sm:col-span-2">
            <label className="label">Short description</label>
            <RichTextEditor
              value={form.shortDescription}
              onChange={(v) => change('shortDescription', v)}
              placeholder="Tagline shown on cards & listings"
              minHeight={120}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Full description</label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => change('description', v)}
              placeholder="Detailed write-up about the property"
              minHeight={180}
            />
          </div>
        </div>
      </Section>

      {/* Location */}
      <Section icon={MapPin} title="Location & map">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
          <div>
            <label className="label">Location *</label>
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
            <p className="text-[11px] text-ink-muted mt-1">
              Manage from{' '}
              <Link to="/admin/hotels-config/locations" className="text-brand hover:underline">Locations</Link>
            </p>
          </div>
          <div>
            <label className="label">City (optional)</label>
            <select
              className="input"
              value={form.cityId}
              onChange={(e) => change('cityId', e.target.value)}
            >
              <option value="">— Select —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => change('address', e.target.value)}
              placeholder="Street, locality, postcode"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label flex items-center gap-2">
              <MapIcon size={14} /> Google Maps embed HTML
            </label>
            <textarea
              className="input font-mono text-xs"
              rows={3}
              value={form.mapEmbedHtml}
              onChange={(e) => change('mapEmbedHtml', e.target.value)}
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=…" …></iframe>'
            />
            {form.mapEmbedHtml && (
              <div className="mt-3 rounded-lg overflow-hidden border bg-surface-alt">
                <div className="text-[11px] text-ink-muted px-3 py-1.5 bg-white border-b">Preview</div>
                <div
                  className="[&_iframe]:w-full [&_iframe]:h-[280px] [&_iframe]:border-0"
                  dangerouslySetInnerHTML={{ __html: form.mapEmbedHtml }}
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Media */}
      <Section icon={ImageIcon} title="Media — primary image, gallery & video">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Primary image</label>
            <Dropzone
              accept="image/*"
              value={primaryImage}
              onChange={setPrimaryImage}
              existingUrl={hotel?.primaryImage}
              placeholder={hotel?.primaryImage ? 'Drag a new image to replace, or click' : 'Drag & drop primary image, or click'}
            />
          </div>
          <div>
            <label className="label">Gallery (multiple)</label>
            <Dropzone
              accept="image/*"
              multiple
              value={galleryFiles}
              onChange={(v) => setGalleryFiles(v || [])}
              placeholder="Drag & drop multiple images, or click"
            />
            {editing && hotel?.gallery?.length > 0 && (
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={replaceGallery} onChange={(e) => setReplaceGallery(e.target.checked)} />
                Replace existing gallery instead of appending
              </label>
            )}
          </div>
        </div>

        {editing && hotel?.gallery?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {hotel.gallery.map((g) => (
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

        <div className="grid sm:grid-cols-3 gap-4 mt-2">
          <div className="sm:col-span-2">
            <label className="label flex items-center gap-2"><Video size={14} /> Overview video URL</label>
            <input
              className="input"
              value={form.videoUrl}
              onChange={(e) => change('videoUrl', e.target.value)}
              placeholder="https://… (YouTube / Vimeo / MP4)"
            />
          </div>
          <div>
            <label className="label">Provider</label>
            <select
              className="input"
              value={form.videoType}
              onChange={(e) => change('videoType', e.target.value)}
            >
              {VIDEO_TYPES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Pricing & Rating */}
      <Section icon={DollarSign} title="Pricing & ratings">
        <div className="grid sm:grid-cols-4 gap-x-6 gap-y-6">
          <div>
            <label className="label">Currency</label>
            <input
              className="input"
              value={form.currency}
              onChange={(e) => change('currency', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Price from</label>
            <input
              type="number" step="0.01" className="input"
              value={form.priceFrom}
              onChange={(e) => change('priceFrom', e.target.value)}
            />
            <p className="text-[11px] text-ink-muted mt-1">Override or auto-set from cheapest room.</p>
          </div>
          <div>
            <label className="label">Original price</label>
            <input
              type="number" step="0.01" className="input"
              value={form.priceOriginal}
              onChange={(e) => change('priceOriginal', e.target.value)}
              placeholder="For strike-through"
            />
          </div>
          <div>
            <label className="label flex items-center gap-1"><Star size={12} /> Star category</label>
            <select
              className="input"
              value={form.starRating}
              onChange={(e) => change('starRating', e.target.value)}
            >
              {STAR_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Display rating (0–5)</label>
            <input
              type="number" step="0.01" min="0" max="5" className="input"
              value={form.rating}
              onChange={(e) => change('rating', e.target.value)}
              placeholder="4.5"
            />
            <p className="text-[11px] text-ink-muted mt-1">Shown next to a star on cards. Separate from star category.</p>
          </div>
        </div>
      </Section>

      {/* Facilities & Nearby */}
      <Section icon={Wifi} title="Facilities & nearby places">
        <div>
          <label className="label">Facilities</label>
          <MultiSelectChips
            options={facilities}
            value={form.facilityIds}
            onChange={(v) => change('facilityIds', v)}
            color="brand"
          />
          <p className="text-[11px] text-ink-muted mt-1.5">
            Add new ones in{' '}
            <Link to="/admin/hotels-config/facilities" className="text-brand hover:underline">Facilities</Link>
          </p>
        </div>
        <div>
          <label className="label flex items-center gap-2"><Landmark size={14} /> Nearby places</label>
          <MultiSelectChips
            options={nearbyPlaces}
            value={form.nearbyPlaceIds}
            onChange={(v) => change('nearbyPlaceIds', v)}
            color="wellness"
          />
          <p className="text-[11px] text-ink-muted mt-1.5">
            Add new ones in{' '}
            <Link to="/admin/hotels-config/nearby-places" className="text-brand hover:underline">Nearby places</Link>
          </p>
        </div>
      </Section>

      {/* Content blocks */}
      <Section icon={FileText} title="Content blocks">
        <div>
          <label className="label">Highlights</label>
          <RichTextEditor value={form.highlightsRich} onChange={(v) => change('highlightsRich', v)} />
        </div>
        <div>
          <label className="label">Inclusions (what's included)</label>
          <RichTextEditor value={form.inclusionsRich} onChange={(v) => change('inclusionsRich', v)} />
        </div>
        <div>
          <label className="label">Exclusions (not included)</label>
          <RichTextEditor value={form.exclusionsRich} onChange={(v) => change('exclusionsRich', v)} />
        </div>
      </Section>

      {/* Legal */}
      <Section icon={Shield} title="Terms & policies" defaultOpen={false}>
        <div>
          <label className="label">Terms & conditions</label>
          <RichTextEditor value={form.termsConditions} onChange={(v) => change('termsConditions', v)} />
        </div>
        <div>
          <label className="label">Privacy policy</label>
          <RichTextEditor value={form.privacyPolicy} onChange={(v) => change('privacyPolicy', v)} />
        </div>
      </Section>

      {/* FAQ */}
      <Section icon={HelpCircle} title="FAQs">
        <FaqEditor value={form.faqs} onChange={(v) => change('faqs', v)} />
      </Section>

      {/* SEO */}
      <Section icon={Settings} title="SEO" defaultOpen={false}>
        <div>
          <label className="label">Meta title</label>
          <input
            className="input"
            value={form.metaTitle}
            onChange={(e) => change('metaTitle', e.target.value)}
            maxLength={255}
          />
        </div>
        <div>
          <label className="label">Meta description</label>
          <textarea
            className="input"
            rows={2}
            value={form.metaDescription}
            onChange={(e) => change('metaDescription', e.target.value)}
            maxLength={500}
          />
        </div>
      </Section>

      {/* Status */}
      <Section icon={Settings} title="Status">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => change('isActive', e.target.checked)}
            />
            <span className="text-sm">Active / visible on site</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => change('isFeatured', e.target.checked)}
            />
            <span className="text-sm">Featured (highlighted on homepage)</span>
          </label>
        </div>
      </Section>

      <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t -mx-6 px-6 py-4 flex justify-end gap-2">
        <Link to="/admin/hotels" className="btn-ghost">Cancel</Link>
        <button disabled={submitting} className="btn-primary">
          <Save size={16} /> {submitting ? 'Saving…' : 'Save hotel'}
        </button>
      </div>
    </form>
  );
}
