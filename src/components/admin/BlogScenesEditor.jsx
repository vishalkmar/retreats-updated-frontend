import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import Dropzone from './Dropzone.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const POSITIONS = [
  { value: 'left', label: 'Image left, text right' },
  { value: 'right', label: 'Image right, text left' },
  { value: 'top', label: 'Image on top' },
  { value: 'bottom', label: 'Image at bottom' },
  { value: 'full', label: 'Full-width image' },
];

const blank = {
  title: '',
  subtitle: '',
  content: '',
  imagePosition: 'left',
};

export default function BlogScenesEditor({ blogId }) {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const res = await api.get(`/blogs/${blogId}/scenes`);
      setScenes(res.data?.data?.scenes || []);
    } catch (err) {
      toast.error('Failed to load scenes');
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => { load(); }, [load]);

  const move = async (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= scenes.length) return;
    const next = [...scenes];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setScenes(next);
    try {
      await api.put(`/blogs/${blogId}/scenes/reorder`, { order: next.map((s) => s.id) });
    } catch (err) {
      toast.error('Reorder failed');
      load();
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/blogs/${blogId}/scenes/${deleteId}`);
      toast.success('Scene removed');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (!blogId) {
    return (
      <p className="text-sm text-ink-muted italic">
        Save the blog first to add scenes.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-ink-muted text-sm">Loading scenes…</div>
      ) : scenes.length === 0 ? (
        <p className="text-sm text-ink-muted italic">
          No scenes yet. Add one to break this article into sections (image + title + content).
        </p>
      ) : (
        <div className="space-y-2">
          {scenes.map((s, i) => (
            <div key={s.id} className="bg-surface-alt rounded-xl p-3 flex items-center gap-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-ink-muted hover:text-brand disabled:opacity-30"
                ><ChevronUp size={16} /></button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === scenes.length - 1}
                  className="text-ink-muted hover:text-brand disabled:opacity-30"
                ><ChevronDown size={16} /></button>
              </div>

              <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                {s.imageUrl && (
                  <img src={fileUrl(s.imageUrl)} className="w-full h-full object-cover" alt="" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink-muted">Scene {i + 1}</div>
                <div className="font-semibold text-sm truncate">{s.title || <em>Untitled</em>}</div>
                {s.subtitle && (
                  <div className="text-xs text-ink-muted truncate">{s.subtitle}</div>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => { setEditing(s); setFormOpen(true); }}
                  className="p-1.5 hover:bg-white rounded"
                  title="Edit"
                ><Edit size={16} /></button>
                <button
                  type="button"
                  onClick={() => setDeleteId(s.id)}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                  title="Delete"
                ><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="inline-flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
      >
        <Plus size={14} /> Add scene
      </button>

      <SceneFormModal
        open={formOpen}
        scene={editing}
        blogId={blogId}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete scene?"
        message="This will permanently remove this scene and its image."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function SceneFormModal({ open, scene, blogId, onClose, onSaved }) {
  const editing = !!scene;
  const [form, setForm] = useState(blank);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (scene) {
      setForm({
        title: scene.title || '',
        subtitle: scene.subtitle || '',
        content: scene.content || '',
        imagePosition: scene.imagePosition || 'left',
      });
    } else setForm(blank);
    setImage(null);
  }, [scene, open]);

  if (!open) return null;

  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v);
    });
    if (image) fd.append('image', image);

    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/blogs/${blogId}/scenes/${scene.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Scene updated');
      } else {
        await api.post(`/blogs/${blogId}/scenes`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Scene added');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-card">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-display font-semibold">
            {editing ? 'Edit scene' : 'New scene'}
          </h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={22} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input
                className="input" value={form.title}
                onChange={(e) => change('title', e.target.value)}
                placeholder="An Ideal Post-Covid Destination"
              />
            </div>
            <div>
              <label className="label">Subtitle (optional)</label>
              <input
                className="input" value={form.subtitle}
                onChange={(e) => change('subtitle', e.target.value)}
                placeholder="Seychelles"
              />
            </div>
          </div>
          <div>
            <label className="label">Content (HTML supported)</label>
            <textarea
              className="input font-mono text-sm" rows={8}
              value={form.content}
              onChange={(e) => change('content', e.target.value)}
              placeholder="There are numerous considerations to consider as grounded passengers begin to plan their post-pandemic trip…"
            />
          </div>
          <div>
            <label className="label">Image layout</label>
            <select
              className="input"
              value={form.imagePosition}
              onChange={(e) => change('imagePosition', e.target.value)}
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Scene image</label>
            <Dropzone
              accept="image/*"
              value={image}
              onChange={setImage}
              existingUrl={scene?.imageUrl}
              placeholder={scene?.imageUrl ? 'Drag a new image to replace, or click' : 'Drag & drop an image, or click'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : editing ? 'Save' : 'Add scene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
