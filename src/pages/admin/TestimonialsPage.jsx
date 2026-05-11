import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Star, Quote,
  Image as ImageIcon, Video, Layers, MessageSquare, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import TestimonialFormModal from '../../components/admin/TestimonialFormModal.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image + quote' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'video', label: 'Video' },
  { value: 'image_text', label: 'Image + text' },
  { value: 'video_text', label: 'Video + text' },
  { value: 'image_video', label: 'Image + video' },
];

const TYPE_ICONS = {
  text: Quote,
  image: ImageIcon,
  gallery: Layers,
  video: Video,
  image_text: ImageIcon,
  video_text: Video,
  image_video: Layers,
};

const TYPE_LABEL = {
  text: 'Text',
  image: 'Image',
  gallery: 'Gallery',
  video: 'Video',
  image_text: 'Image+text',
  video_text: 'Video+text',
  image_video: 'Img+vid',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/testimonials/all', {
        params: filterType ? { type: filterType } : {},
      });
      setItems(res.data.data.items);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (it) => {
    try {
      await api.patch(`/testimonials/${it.id}/toggle`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/testimonials/${deleteId}`);
      toast.success('Testimonial deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Reviews</h1>
        <p className="text-ink-muted text-sm">Manage your reviews</p>
      </div>

      <div className="card overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-5 border-b flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-soft">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold">Reviews</h3>
              <p className="text-xs text-ink-muted">Manage home page testimonials/reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input max-w-[200px] text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="btn-primary whitespace-nowrap"
            >
              <Plus size={16} /> Add Review
            </button>
          </div>
        </div>

        {/* Table / states */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-muted">
            <Quote size={36} />
            <p className="font-semibold">No reviews yet</p>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="text-sm text-brand font-semibold hover:underline"
            >
              Add your first review
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-alt text-ink-muted uppercase text-[10px] font-bold tracking-[0.15em]">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Review</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((t) => {
                  const TIcon = TYPE_ICONS[t.type] || Quote;
                  return (
                    <tr key={t.id} className="hover:bg-surface-alt/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {t.authorAvatar ? (
                            <img
                              src={fileUrl(t.authorAvatar)}
                              alt={t.authorName || ''}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                              {(t.authorName || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate max-w-[180px]">{t.authorName || '—'}</div>
                            {t.authorTitle && (
                              <div className="text-xs text-ink-muted truncate max-w-[180px]">{t.authorTitle}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {t.rating ? (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                        ) : <span className="text-xs text-ink-muted">—</span>}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-ink-muted text-sm truncate" title={t.content || ''}>
                          {t.content || <span className="italic text-ink-muted/70">No quote</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          <TIcon size={11} /> {TYPE_LABEL[t.type] || t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-muted">{t.sortOrder ?? 0}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted">{formatDate(t.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggle(t)}
                            className="p-2 text-ink-muted hover:text-ink hover:bg-surface-alt rounded-lg transition"
                            title={t.isActive ? 'Disable' : 'Enable'}
                          >
                            {t.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => { setEditing(t); setShowForm(true); }}
                            className="p-2 text-brand hover:text-brand-dark hover:bg-brand/10 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(t.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TestimonialFormModal
        open={showForm}
        item={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete review?"
        message="This will permanently remove this testimonial and its media."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
