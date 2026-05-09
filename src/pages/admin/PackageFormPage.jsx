import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Image as ImageIcon, Tag, MapPin,
  Calendar, DollarSign, ListChecks, HelpCircle, User, Settings,
  Utensils, Sparkles, Hotel,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import MultiSelectChips from '../../components/admin/MultiSelectChips.jsx';
import CheckboxChips from '../../components/admin/CheckboxChips.jsx';
import { ItineraryEditor, FaqEditor } from '../../components/admin/KeyValueListEditor.jsx';
import Dropzone from '../../components/admin/Dropzone.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks', 'Tea / Coffee'];
const DIET_OPTIONS = [
  'Dairy-free', 'Egg-free', 'Gluten Free', 'Halal', 'Kosher',
  'Low fat', 'Nut-allergy-friendly', 'Organic', 'Vegan', 'Vegetarian',
];
const FACILITY_OPTIONS = [
  'A/C rooms', 'Free Wifi', 'Free parking', 'Garden', 'Laundry', 'Pool',
  'Restaurant', 'Spa', 'Terrace', 'Yoga Shala/Deck', 'Gym', 'Sauna',
  'Hot tub', 'Beach access', 'Lake access', 'Library', 'Cafe',
];

const blankForm = {
  name: '', slug: '',
  shortDescription: '', description: '',
  videoUrl: '',
  cityId: '', locationDetail: '',
  durationDays: 1, durationNights: 0, timing: '',
  availableAllYear: true, startDate: '', endDate: '',
  minGroupSize: 1, maxGroupSize: 30,
  priceFrom: 0, priceOriginal: '', currency: 'INR',
  freeCancellation: true, isGoldHost: false, isFeatured: false, isActive: true,
  richContent: '',
  food: '', meals: [], diets: [],
  benefits: '',
  facilities: [],
  itinerary: [], faqs: [],
  hostName: '', hostBio: '',
  metaTitle: '', metaDescription: '',
  sortOrder: 0,
  categoryIds: [], problemIds: [], activityIds: [],
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

export default function PackageFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(blankForm);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const [primaryImage, setPrimaryImage] = useState(null);
  const [hostImage, setHostImage] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [replaceGallery, setReplaceGallery] = useState(false);

  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [problems, setProblems] = useState([]);
  const [activities, setActivities] = useState([]);

  // Load taxonomies
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, cat, p, act] = await Promise.all([
          api.get('/cities/all'),
          api.get('/categories/all'),
          api.get('/problems/all'),
          api.get('/activities/all'),
        ]);
        setCities(c.data.data.items);
        setCategories(cat.data.data.items);
        setProblems(p.data.data.items);
        setActivities(act.data.data.items);
      } catch (err) {
        toast.error('Failed to load taxonomies');
      }
    };
    fetchAll();
  }, []);

  // Load package if editing
  const loadPkg = useCallback(async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await api.get(`/packages/admin/${id}`);
      const p = res.data.data.package;
      setPkg(p);
      setForm({
        name: p.name || '',
        slug: p.slug || '',
        shortDescription: p.shortDescription || '',
        description: p.description || '',
        videoUrl: p.videoUrl || '',
        cityId: p.cityId || '',
        locationDetail: p.locationDetail || '',
        durationDays: p.durationDays ?? 1,
        durationNights: p.durationNights ?? 0,
        timing: p.timing || '',
        availableAllYear: p.availableAllYear ?? true,
        startDate: p.startDate || '',
        endDate: p.endDate || '',
        minGroupSize: p.minGroupSize ?? 1,
        maxGroupSize: p.maxGroupSize ?? 30,
        priceFrom: p.priceFrom ?? 0,
        priceOriginal: p.priceOriginal ?? '',
        currency: p.currency || 'INR',
        freeCancellation: p.freeCancellation ?? true,
        isGoldHost: !!p.isGoldHost,
        isFeatured: !!p.isFeatured,
        isActive: p.isActive ?? true,
        richContent: p.richContent || '',
        food: p.food || '',
        meals: p.meals || [],
        diets: p.diets || [],
        benefits: p.benefits || '',
        facilities: p.facilities || [],
        itinerary: p.itinerary || [],
        faqs: p.faqs || [],
        hostName: p.hostName || '',
        hostBio: p.hostBio || '',
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        sortOrder: p.sortOrder ?? 0,
        categoryIds: (p.categories || []).map((c) => c.id),
        problemIds: (p.problems || []).map((c) => c.id),
        activityIds: (p.activities || []).map((c) => c.id),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load package');
    } finally {
      setLoading(false);
    }
  }, [editing, id]);

  useEffect(() => { loadPkg(); }, [loadPkg]);

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
    if (hostImage) fd.append('hostImage', hostImage);
    galleryFiles.forEach((f) => fd.append('gallery', f));
    if (editing && replaceGallery) fd.append('replaceGallery', 'true');

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/packages/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Package saved');
      } else {
        const res = await api.post('/packages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Package created');
        navigate(`/admin/packages/${res.data.data.package.id}/edit`, { replace: true });
        return;
      }
      loadPkg();
      setPrimaryImage(null);
      setHostImage(null);
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
      await api.delete(`/packages/${id}/gallery/${imageId}`);
      toast.success('Image removed');
      loadPkg();
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
          <Link to="/admin/packages" className="p-2 rounded-lg hover:bg-surface-alt">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {editing ? 'Edit Package' : 'New Package'}
            </h1>
            {editing && pkg && (
              <p className="text-xs text-ink-muted">
                Public URL:{' '}
                <Link to={`/retreats/${pkg.slug}`} target="_blank" className="text-brand hover:underline">
                  /retreats/{pkg.slug}
                </Link>
              </p>
            )}
          </div>
        </div>
        <button disabled={submitting} className="btn-primary">
          <Save size={16} /> {submitting ? 'Saving…' : 'Save package'}
        </button>
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
              placeholder="3 Day Kerala Ayurveda and Yoga Retreat"
              required
            />
          </div>
          <div>
            <label className="label">Slug (auto if empty)</label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => change('slug', e.target.value)}
              placeholder="kerala-ayurveda-yoga"
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
            <textarea
              className="input leading-relaxed resize-y"
              rows={4}
              style={{ padding: '14px 16px', minHeight: 110 }}
              value={form.shortDescription}
              onChange={(e) => change('shortDescription', e.target.value)}
              placeholder="One-line teaser shown in cards & listings."
            />
            <p className="text-[11px] text-ink-muted mt-1.5">
              Plain text · shown in cards and listings.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Full description</label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => change('description', v)}
              placeholder="A detailed write-up about the retreat — formatting, lists, headings will render exactly as you see them."
              minHeight={180}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Overview video URL</label>
            <input
              className="input"
              value={form.videoUrl}
              onChange={(e) => change('videoUrl', e.target.value)}
              placeholder="https://… (YouTube, Vimeo, MP4)"
            />
          </div>
        </div>
      </Section>

      {/* Media */}
      <Section icon={ImageIcon} title="Media — primary image & gallery">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Primary image</label>
            <Dropzone
              accept="image/*"
              value={primaryImage}
              onChange={setPrimaryImage}
              existingUrl={pkg?.primaryImage}
              placeholder={pkg?.primaryImage ? 'Drag a new image to replace, or click' : 'Drag & drop primary image, or click'}
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
            {editing && pkg?.gallery?.length > 0 && (
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={replaceGallery} onChange={(e) => setReplaceGallery(e.target.checked)} />
                Replace existing gallery
              </label>
            )}
          </div>
        </div>

        {pkg?.gallery?.length > 0 && (
          <div>
            <label className="label">Existing gallery</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {pkg.gallery.map((g) => (
                <div key={g.id} className="relative group rounded-lg overflow-hidden border">
                  <img src={fileUrl(g.url)} className="w-full h-24 object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImg(g.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Location & timing */}
      <Section icon={MapPin} title="Location & timing">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">City</label>
            <select className="input" value={form.cityId} onChange={(e) => change('cityId', e.target.value)}>
              <option value="">— select —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.country ? `, ${c.country}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location detail</label>
            <input
              className="input"
              value={form.locationDetail}
              onChange={(e) => change('locationDetail', e.target.value)}
              placeholder="Kochi, Kerala, India"
            />
          </div>
          <div>
            <label className="label">Duration (days)</label>
            <input
              type="number" min={1} className="input"
              value={form.durationDays}
              onChange={(e) => change('durationDays', parseInt(e.target.value || 1, 10))}
            />
          </div>
          <div>
            <label className="label">Nights</label>
            <input
              type="number" min={0} className="input"
              value={form.durationNights}
              onChange={(e) => change('durationNights', parseInt(e.target.value || 0, 10))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Timing label</label>
            <input
              className="input"
              value={form.timing}
              onChange={(e) => change('timing', e.target.value)}
              placeholder="Available all year round"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox" checked={form.availableAllYear}
              onChange={(e) => change('availableAllYear', e.target.checked)}
            />
            Available all year round (skip start/end dates)
          </label>
          {!form.availableAllYear && (
            <>
              <div>
                <label className="label">Start date</label>
                <input
                  type="date" className="input"
                  value={form.startDate || ''}
                  onChange={(e) => change('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label">End date</label>
                <input
                  type="date" className="input"
                  value={form.endDate || ''}
                  onChange={(e) => change('endDate', e.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label className="label">Min group size</label>
            <input
              type="number" min={1} className="input"
              value={form.minGroupSize}
              onChange={(e) => change('minGroupSize', parseInt(e.target.value || 1, 10))}
            />
          </div>
          <div>
            <label className="label">Max group size</label>
            <input
              type="number" min={1} className="input"
              value={form.maxGroupSize}
              onChange={(e) => change('maxGroupSize', parseInt(e.target.value || 30, 10))}
            />
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section icon={DollarSign} title="Pricing">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Price from *</label>
            <input
              type="number" min={0} step="0.01" className="input"
              value={form.priceFrom}
              onChange={(e) => change('priceFrom', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Original price (strike-through)</label>
            <input
              type="number" min={0} step="0.01" className="input"
              value={form.priceOriginal}
              onChange={(e) => change('priceOriginal', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <input
              className="input"
              value={form.currency}
              onChange={(e) => change('currency', e.target.value)}
              placeholder="INR / USD / EUR"
            />
          </div>
        </div>
      </Section>

      {/* Taxonomies */}
      <Section icon={Tag} title="Categories, problems & activities">
        <div>
          <label className="label">Categories</label>
          <MultiSelectChips
            options={categories}
            value={form.categoryIds}
            onChange={(v) => change('categoryIds', v)}
            color="wellness"
          />
        </div>
        <div>
          <label className="label">Problems / conditions this retreat helps</label>
          <MultiSelectChips
            options={problems}
            value={form.problemIds}
            onChange={(v) => change('problemIds', v)}
            color="wellness"
          />
        </div>
        <div>
          <label className="label">Activities included</label>
          <MultiSelectChips
            options={activities}
            value={form.activityIds}
            onChange={(v) => change('activityIds', v)}
          />
        </div>
      </Section>

      {/* Single rich-text block — replaces Highlights / Includes / Excludes */}
      <Section icon={ListChecks} title="Highlights / What's included / What's not">
        <p className="text-xs text-ink-muted -mt-1">
          Use one rich-text block for highlights, what's included and what's not.
          Use headings, lists and bold to structure it — the public page renders the same formatting.
        </p>
        <RichTextEditor
          value={form.richContent}
          onChange={(v) => change('richContent', v)}
          placeholder={`E.g.\n\nHighlights\n• 3 nights stay in a beachfront cottage\n\nIncluded\n• Daily yoga & meditation\n• 3 vegetarian meals/day\n\nNot included\n• Flights to/from destination`}
          minHeight={260}
        />
      </Section>

      {/* Benefits — rich text */}
      <Section icon={Sparkles} title="Benefits" defaultOpen={false}>
        <p className="text-xs text-ink-muted -mt-1">
          What guests can expect to gain — physically, mentally, emotionally.
        </p>
        <RichTextEditor
          value={form.benefits}
          onChange={(v) => change('benefits', v)}
          placeholder="The ideal place to unplug, slow down and reconnect…"
          minHeight={200}
        />
      </Section>

      {/* Food & diets */}
      <Section icon={Utensils} title="Food, meals & diets" defaultOpen={false}>
        <div>
          <label className="label">Food description</label>
          <RichTextEditor
            value={form.food}
            onChange={(v) => change('food', v)}
            placeholder="At our retreat we serve nourishing whole-food, vegan and vegetarian cuisine…"
            minHeight={180}
          />
        </div>
        <div>
          <label className="label">Meals provided</label>
          <CheckboxChips
            options={MEAL_OPTIONS}
            value={form.meals}
            onChange={(v) => change('meals', v)}
          />
        </div>
        <div>
          <label className="label">Diets catered</label>
          <CheckboxChips
            options={DIET_OPTIONS}
            value={form.diets}
            onChange={(v) => change('diets', v)}
          />
        </div>
      </Section>

      {/* Facilities */}
      <Section icon={Hotel} title="Facilities available" defaultOpen={false}>
        <CheckboxChips
          options={FACILITY_OPTIONS}
          value={form.facilities}
          onChange={(v) => change('facilities', v)}
        />
      </Section>

      {/* Itinerary */}
      <Section icon={Calendar} title="Itinerary" defaultOpen={false}>
        <ItineraryEditor value={form.itinerary} onChange={(v) => change('itinerary', v)} />
      </Section>

      {/* FAQs */}
      <Section icon={HelpCircle} title="Frequently asked questions" defaultOpen={false}>
        <FaqEditor value={form.faqs} onChange={(v) => change('faqs', v)} />
      </Section>

      {/* Host */}
      <Section icon={User} title="Host info" defaultOpen={false}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Host name</label>
            <input
              className="input"
              value={form.hostName}
              onChange={(e) => change('hostName', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Host image</label>
            <Dropzone
              accept="image/*"
              value={hostImage}
              onChange={setHostImage}
              existingUrl={pkg?.hostImage}
              placeholder="Drag host photo, or click"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Host bio</label>
            <RichTextEditor
              value={form.hostBio}
              onChange={(v) => change('hostBio', v)}
              placeholder="A short bio for the host…"
              minHeight={150}
            />
          </div>
        </div>
      </Section>

      {/* Status / SEO / Badges */}
      <Section icon={Settings} title="Status, badges & SEO">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={form.isActive}
              onChange={(e) => change('isActive', e.target.checked)}
            />
            Published (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={form.isFeatured}
              onChange={(e) => change('isFeatured', e.target.checked)}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={form.isGoldHost}
              onChange={(e) => change('isGoldHost', e.target.checked)}
            />
            Gold host badge
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={form.freeCancellation}
              onChange={(e) => change('freeCancellation', e.target.checked)}
            />
            Free cancellation
          </label>
          <div className="sm:col-span-2">
            <label className="label">Meta title (SEO)</label>
            <input
              className="input"
              value={form.metaTitle}
              onChange={(e) => change('metaTitle', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Meta description (SEO)</label>
            <textarea
              className="input" rows={2}
              value={form.metaDescription}
              onChange={(e) => change('metaDescription', e.target.value)}
            />
          </div>
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end mt-6">
        <button disabled={submitting} className="btn-primary shadow-card">
          <Save size={16} /> {submitting ? 'Saving…' : 'Save package'}
        </button>
      </div>
    </form>
  );
}
