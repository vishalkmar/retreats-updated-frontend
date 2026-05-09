import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Check, X as XIcon, Trash2, Search, Mail,
  MessageSquare, ExternalLink, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'all', label: 'All' },
];

export default function ReviewsPage() {
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/packages/admin/reviews', {
        params: {
          status,
          search: search || undefined,
          page,
          limit: 20,
        },
      });
      setItems(res.data.data.items);
      setPendingCount(res.data.data.pendingCount);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load(1);
  }, [load]);

  const toggle = async (review) => {
    try {
      await api.patch(`/packages/reviews/${review.id}/approve`);
      toast.success(review.isApproved ? 'Unapproved' : 'Approved');
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/packages/reviews/${deleteId}`);
      toast.success('Review deleted');
      setDeleteId(null);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            Reviews
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                <Clock size={12} /> {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-ink-muted text-sm">
            Approve guest reviews. Approving auto-updates the package's rating &amp; review count.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
          <input
            className="input pl-9"
            placeholder="Search by name or comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              status === t.value
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
            {t.value === 'pending' && pendingCount > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-ink-muted mb-3" />
          <p className="text-ink-muted">
            {status === 'pending'
              ? 'No reviews waiting for approval. Nice!'
              : 'No reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card p-5 flex flex-col md:flex-row gap-4">
              {/* Package thumb */}
              <Link
                to={r.package ? `/admin/packages/${r.package.id}/edit` : '#'}
                className="shrink-0 w-full md:w-32 h-24 rounded-lg overflow-hidden bg-slate-100 relative"
              >
                {r.package?.primaryImage ? (
                  <img
                    src={fileUrl(r.package.primaryImage)}
                    alt={r.package?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted">
                    <MessageSquare size={20} />
                  </div>
                )}
              </Link>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    {r.package ? (
                      <Link
                        to={`/retreats/${r.package.slug}`}
                        target="_blank"
                        className="text-sm font-display font-semibold hover:text-brand inline-flex items-center gap-1"
                      >
                        {r.package.name}
                        <ExternalLink size={12} />
                      </Link>
                    ) : (
                      <span className="text-sm text-ink-muted italic">Package deleted</span>
                    )}
                    <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5 flex-wrap">
                      <span className="font-medium text-ink">{r.name}</span>
                      {r.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} /> {r.email}
                        </span>
                      )}
                      <span>· {new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      r.isApproved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.isApproved ? 'APPROVED' : 'PENDING'}
                  </span>
                </div>

                {r.rating && (
                  <div className="flex items-center gap-0.5 text-accent mt-2">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-accent" />
                    ))}
                  </div>
                )}

                {r.title && <h4 className="font-semibold mt-2 text-sm">{r.title}</h4>}
                {r.comment && (
                  <p className="text-sm text-ink-muted mt-1 whitespace-pre-line">{r.comment}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => toggle(r)}
                    className={
                      r.isApproved
                        ? 'btn-ghost text-xs'
                        : 'btn bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 py-1.5'
                    }
                  >
                    {r.isApproved ? <XIcon size={14} /> : <Check size={14} />}
                    {r.isApproved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            className="btn-outline text-sm disabled:opacity-50"
          >Previous</button>
          <span className="text-sm">
            Page <strong>{pagination.page}</strong> / {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => load(pagination.page + 1)}
            className="btn-outline text-sm disabled:opacity-50"
          >Next</button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete review?"
        message="This permanently removes the review. If it was approved, the package's rating will recompute."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
