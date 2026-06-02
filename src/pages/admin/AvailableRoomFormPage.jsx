import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Image as ImageIcon, Tag, Bed,
  DollarSign, Settings, Wifi, Mountain, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import MultiSelectChips from '../../components/admin/MultiSelectChips.jsx';
import Dropzone from '../../components/admin/Dropzone.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';
import usePersistedForm from '../../hooks/usePersistedForm.js';

const blankForm = {
  ownerType: 'hotel',
  hotelId: '',
  packageId: '',
  name: '', slug: '',
  price: 0, priceOriginal: '', currency: 'INR',
  roomSize: '', maxOccupancy: 2, maxChildrenFree: 0,
  highlightsRich: '', descriptionRich: '',
  isFeatured: false, isActive: true, isRefundable: true,
  sortOrder: 0,
  facilityIds: [], viewIds: [],
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

export default function AvailableRoomFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const presetHotelId = searchParams.get('hotelId');
  const presetPackageId = searchParams.get('packageId');
  const editing = !!id;
  const navigate = useNavigate();

  const {
    value: form,
    setValue: setForm,
    hydrateFromServer,
    clearDraft,
    discardDraft,
    hasDraft,
  } = usePersistedForm(
    `room-form:${id || `new-${presetHotelId || presetPackageId || 'noid'}`}`,
    {
      ...blankForm,
      ownerType: presetPackageId ? 'package' : 'hotel',
      hotelId: presetHotelId || '',
      packageId: presetPackageId || '',
    },
    { editing },
  );
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const [mainImage, setMainImage] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [replaceGallery, setReplaceGallery] = useState(false);

  const [hotels, setHotels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [roomViews, setRoomViews] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [h, p, f, rv] = await Promise.all([
          api.get('/hotels/admin/all'),
          api.get('/packages/admin/all'),
          api.get('/facilities/all'),
          api.get('/room-views/all'),
        ]);
        setHotels(h.data.data.items);
        setPackages(p.data.data.items || []);
        setFacilities(f.data.data.items);
        setRoomViews(rv.data.data.items);
      } catch (err) {
        toast.error('Failed to load taxonomies');
      }
    };
    fetchAll();
  }, []);

  const loadRoom = useCallback(async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await api.get(`/rooms/admin/${id}`);
      const r = res.data.data.room;
      setRoom(r);
      hydrateFromServer({
        ownerType: r.ownerType || (r.packageId ? 'package' : 'hotel'),
        hotelId: r.hotelId || '',
        packageId: r.packageId || '',
        name: r.name || '',
        slug: r.slug || '',
        price: r.price ?? 0,
        priceOriginal: r.priceOriginal ?? '',
        currency: r.currency || 'INR',
        roomSize: r.roomSize || '',
        maxOccupancy: r.maxOccupancy ?? 2,
        maxChildrenFree: r.maxChildrenFree ?? 0,
        highlightsRich: r.highlightsRich || '',
        descriptionRich: r.descriptionRich || '',
        isFeatured: !!r.isFeatured,
        isActive: r.isActive ?? true,
        isRefundable: r.isRefundable ?? true,
        sortOrder: r.sortOrder ?? 0,
        facilityIds: (r.facilities || []).map((x) => x.id),
        viewIds: (r.views || []).map((x) => x.id),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [editing, id]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.error('Name is required');
    if (form.ownerType === 'package' && !form.packageId) return toast.error('Please select a package');
    if (form.ownerType !== 'package' && !form.hotelId) return toast.error('Please select a hotel');

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
        await api.put(`/rooms/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Room saved');
        clearDraft();
      } else {
        const res = await api.post('/rooms', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Room created');
        clearDraft();
        navigate(`/admin/rooms/${res.data.data.room.id}/edit`, { replace: true });
        return;
      }
      loadRoom();
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
      await api.delete(`/rooms/${id}/gallery/${imageId}`);
      toast.success('Image removed');
      loadRoom();
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

  const backHref = presetPackageId || room?.packageId
    ? `/admin/rooms?ownerType=package&packageId=${presetPackageId || room?.packageId}`
    : presetHotelId
      ? `/admin/rooms?hotelId=${presetHotelId}`
      : (room?.hotelId ? `/admin/rooms?hotelId=${room.hotelId}` : '/admin/rooms');

  return (
    <form onSubmit={submit}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={backHref} className="p-2 rounded-lg hover:bg-surface-alt">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {editing ? 'Edit Room' : 'New Room'}
            </h1>
            {room?.hotel && (
              <p className="text-xs text-ink-muted">
                Hotel:{' '}
                <Link to={`/admin/hotels/${room.hotel.id}/edit`} className="text-brand hover:underline">
                  {room.hotel.name}
                </Link>
              </p>
            )}
            {room?.package && (
              <p className="text-xs text-ink-muted">
                Package:{' '}
                <Link to={`/admin/packages/${room.package.id}/edit`} className="text-brand hover:underline">
                  {room.package.name}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <button
              type="button"
              onClick={() => {
                if (!confirm('Discard unsaved draft and reload from the server?')) return;
                discardDraft();
                if (editing) loadRoom();
              }}
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100"
            >
              Discard draft
            </button>
          )}
          <button disabled={submitting} className="btn-primary">
            <Save size={16} /> {submitting ? 'Saving…' : 'Save room'}
          </button>
        </div>
      </div>

      {/* Owner + Basic */}
      <Section icon={Bed} title="Owner & basic info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
          <div className="sm:col-span-2">
            <label className="label">This room belongs to *</label>
            <div className="flex gap-2">
              {['hotel', 'package'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => change('ownerType', t)}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium capitalize transition ${
                    form.ownerType === t
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 text-ink-muted hover:border-brand/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {form.ownerType === 'package' ? (
            <div className="sm:col-span-2">
              <label className="label">Package *</label>
              <select
                className="input"
                value={form.packageId}
                onChange={(e) => change('packageId', e.target.value)}
              >
                <option value="">— Select package —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="label">Hotel *</label>
              <select
                className="input"
                value={form.hotelId}
                onChange={(e) => change('hotelId', e.target.value)}
              >
                <option value="">— Select hotel —</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Room name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => change('name', e.target.value)}
              placeholder="Luxe Queen Room, Deluxe Suite, …"
              required
            />
          </div>
          <div>
            <label className="label">Property name</label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => change('slug', e.target.value)}
              placeholder="luxe-queen"
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

      {/* Pricing & Specs */}
      <Section icon={DollarSign} title="Pricing & specs">
        <div className="grid sm:grid-cols-4 gap-x-6 gap-y-6">
          <div>
            <label className="label">Currency</label>
            <input className="input" value={form.currency} onChange={(e) => change('currency', e.target.value)} />
          </div>
          <div>
            <label className="label">Price (per night)</label>
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
              placeholder="Strike-through"
            />
          </div>
          <div>
            <label className="label">Max occupancy</label>
            <input
              type="number" min="1" className="input"
              value={form.maxOccupancy}
              onChange={(e) => change('maxOccupancy', parseInt(e.target.value || 1, 10))}
            />
          </div>
          <div>
            <label className="label">Free children</label>
            <input
              type="number" min="0" className="input"
              value={form.maxChildrenFree}
              onChange={(e) => change('maxChildrenFree', parseInt(e.target.value || 0, 10))}
              placeholder="Kids who stay free"
            />
            <p className="text-[11px] text-ink-muted mt-1">Children up to this many stay free.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Room size</label>
            <input
              className="input"
              value={form.roomSize}
              onChange={(e) => change('roomSize', e.target.value)}
              placeholder='e.g. "350 sqft" or "32 m²"'
            />
          </div>
        </div>
      </Section>

      {/* Media */}
      <Section icon={ImageIcon} title="Media — main image & gallery">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Main image</label>
            <Dropzone
              accept="image/*"
              value={mainImage}
              onChange={setMainImage}
              existingUrl={room?.mainImage}
              placeholder={room?.mainImage ? 'Drag a new image to replace, or click' : 'Drag & drop main image, or click'}
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
            {editing && room?.gallery?.length > 0 && (
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={replaceGallery} onChange={(e) => setReplaceGallery(e.target.checked)} />
                Replace existing gallery instead of appending
              </label>
            )}
          </div>
        </div>

        {editing && room?.gallery?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {room.gallery.map((g) => (
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

      {/* Facilities & views */}
      <Section icon={Wifi} title="Facilities & views">
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
          <label className="label flex items-center gap-2"><Mountain size={14} /> Room views</label>
          <MultiSelectChips
            options={roomViews}
            value={form.viewIds}
            onChange={(v) => change('viewIds', v)}
            color="wellness"
          />
          <p className="text-[11px] text-ink-muted mt-1.5">
            Sea View, Garden View, … — manage in{' '}
            <Link to="/admin/hotels-config/room-views" className="text-brand hover:underline">Room views</Link>
          </p>
        </div>
      </Section>

      {/* Content */}
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

      {/* Status */}
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
          <label className="flex items-center gap-2" title="When off, cancellations on this room will not refund any money regardless of the platform refund tiers.">
            <input type="checkbox" checked={form.isRefundable} onChange={(e) => change('isRefundable', e.target.checked)} />
            <span className="text-sm">Refundable on cancellation</span>
          </label>
        </div>
      </Section>

      <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t -mx-6 px-6 py-4 flex justify-end gap-2">
        <Link to={backHref} className="btn-ghost">Cancel</Link>
        <button disabled={submitting} className="btn-primary">
          <Save size={16} /> {submitting ? 'Saving…' : 'Save room'}
        </button>
      </div>
    </form>
  );
}
