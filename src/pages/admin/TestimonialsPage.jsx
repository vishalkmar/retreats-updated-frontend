import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Star, Quote, Image as ImageIcon, Video, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import TestimonialFormModal from '../../components/admin/TestimonialFormModal.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'text', label: 'Text', icon: Quote },
  { value: 'image', label: 'Image + quote', icon: ImageIcon },
  { value: 'gallery', label: 'Gallery', icon: Layers },
  { value: 'video', label: 'Video', icon: Video },
];

const TYPE_ICONS = { text: Quote, image: ImageIcon, gallery: Layers, video: Video };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Testimonials</h1>
          <p className="text-ink-muted text-sm">Text quotes, image cards, galleries and videos.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input max-w-[180px]"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary whitespace-nowrap">
            <Plus size={18} /> New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Quote size={40} className="mx-auto text-ink-muted mb-3" />
          <p className="text-ink-muted">No testimonials yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t) => {
            const Icon = TYPE_ICONS[t.type] || Quote;
            const previewMedia = t.media?.[0];
            return (
              <div key={t.id} className={`card overflow-hidden group ${!t.isActive && 'opacity-60'}`}>
                <div className="aspect-[16/10] bg-slate-100 relative">
                  {t.type === 'video' && (t.videoPoster || previewMedia) ? (
                    <img
                      src={fileUrl(t.videoPoster || previewMedia.url)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : previewMedia ? (
                    <img src={fileUrl(previewMedia.url)} className="w-full h-full object-cover" alt="" />
                  ) : t.authorAvatar ? (
                    <img src={fileUrl(t.authorAvatar)} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted bg-gradient-to-br from-brand-light/20 to-wellness-light/20">
                      <Icon size={36} />
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${t.isActive ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                    {t.isActive ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white">
                    <Icon size={10} /> {t.type}
                  </span>
                </div>
                <div className="p-4">
                  {t.authorName && <h3 className="font-semibold text-sm">{t.authorName}</h3>}
                  {t.authorTitle && <p className="text-xs text-ink-muted">{t.authorTitle}</p>}
                  {t.rating && (
                    <div className="flex items-center gap-0.5 mt-1 text-accent text-xs">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-accent" />
                      ))}
                    </div>
                  )}
                  {t.content && (
                    <p className="text-xs text-ink-muted line-clamp-3 mt-2 italic">"{t.content}"</p>
                  )}
                  <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                    <button onClick={() => toggle(t)} className="flex-1 btn-ghost text-xs">
                      {t.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {t.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => { setEditing(t); setShowForm(true); }}
                      className="flex-1 btn-ghost text-xs"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="flex-1 btn-ghost text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TestimonialFormModal
        open={showForm}
        item={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete testimonial?"
        message="This will permanently remove this testimonial and its media."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
