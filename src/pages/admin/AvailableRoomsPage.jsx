import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Bed, Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

export default function AvailableRoomsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const hotelIdFilter = params.get('hotelId') || '';

  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  // Hotel dropdown options
  useEffect(() => {
    api.get('/hotels/admin/all')
      .then((r) => setHotels(r.data.data.items))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms/admin/all', {
        params: hotelIdFilter ? { hotelId: hotelIdFilter } : {},
      });
      setRooms(res.data.data.items);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [hotelIdFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = rooms.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const onHotelChange = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set('hotelId', id); else next.delete('hotelId');
    setParams(next, { replace: true });
  };

  const toggle = async (r) => {
    try {
      await api.patch(`/rooms/${r.id}/toggle`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const duplicate = async (r) => {
    if (duplicatingId) return;
    setDuplicatingId(r.id);
    try {
      const res = await api.post(`/rooms/${r.id}/duplicate`);
      const newId = res.data?.data?.room?.id;
      toast.success('Room duplicated — opening for edit');
      if (newId) navigate(`/admin/rooms/${newId}/edit`);
      else load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duplicate failed');
    } finally {
      setDuplicatingId(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/rooms/${deleteId}`);
      toast.success('Room deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Group by hotel for nicer display
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.hotel?.id || r.hotelId;
      if (!map.has(key)) map.set(key, { hotel: r.hotel, items: [] });
      map.get(key).items.push(r);
    });
    return Array.from(map.values());
  }, [filtered]);

  const selectedHotel = hotels.find((h) => String(h.id) === String(hotelIdFilter));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Available Rooms</h1>
          <p className="text-ink-muted text-sm">
            Rooms are bound to a hotel. Pick a hotel below to focus the list, or browse all.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            className="input"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={hotelIdFilter}
            onChange={(e) => onHotelChange(e.target.value)}
          >
            <option value="">All hotels</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <Link
            to={hotelIdFilter ? `/admin/rooms/new?hotelId=${hotelIdFilter}` : '/admin/rooms/new'}
            className="btn-primary whitespace-nowrap"
          >
            <Plus size={18} /> New
          </Link>
        </div>
      </div>

      {selectedHotel && (
        <div className="mb-4 text-xs text-ink-muted">
          Showing rooms for <strong>{selectedHotel.name}</strong> ·{' '}
          <button type="button" onClick={() => onHotelChange('')} className="text-brand hover:underline">
            Clear filter
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Bed size={40} className="mx-auto text-ink-muted mb-3" />
          <p className="text-ink-muted">No rooms{hotelIdFilter ? ' for this hotel' : ''} yet. Click <strong>New</strong> to add one.</p>
        </div>
      ) : (
        grouped.map(({ hotel, items }) => (
          <div key={hotel?.id || 'unknown'} className="card overflow-hidden mb-5">
            <div className="px-4 py-3 bg-surface-alt text-xs uppercase font-semibold tracking-wide text-ink-muted flex items-center justify-between">
              <span>
                {hotel?.name || 'Unknown hotel'}{' '}
                <span className="text-ink-muted/70 font-normal normal-case">
                  · {items.length} room{items.length === 1 ? '' : 's'}
                </span>
              </span>
              {hotel?.id && (
                <Link to={`/admin/hotels/${hotel.id}/edit`} className="text-brand hover:underline normal-case">
                  Edit hotel →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-12 px-4 py-2 bg-white border-t text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              <div className="col-span-1">Image</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {items.map((r) => (
              <div key={r.id} className={`grid grid-cols-12 items-center px-4 py-3 border-t hover:bg-surface-alt/50 ${!r.isActive && 'opacity-60'}`}>
                <div className="col-span-1">
                  <div className="w-14 h-10 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                    {r.mainImage ? (
                      <img src={fileUrl(r.mainImage)} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <Bed size={14} className="text-ink-muted" />
                    )}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="font-medium text-sm leading-tight">{r.name}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    Up to {r.maxOccupancy} guests
                    {r.views?.length > 0 && (
                      <> · {r.views.map((v) => v.name).join(', ')}</>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-ink-muted">
                  {r.roomSize || '—'}
                </div>
                <div className="col-span-2 text-sm">
                  <span className="font-bold text-brand">
                    {r.currency} {Number(r.price).toLocaleString()}
                  </span>
                  {r.priceOriginal && Number(r.priceOriginal) > Number(r.price) && (
                    <div className="line-through text-ink-muted text-[11px]">
                      {Number(r.priceOriginal).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {r.isActive ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button onClick={() => toggle(r)} className="p-1.5 hover:bg-surface-alt rounded" title={r.isActive ? 'Unpublish' : 'Publish'}>
                    {r.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => duplicate(r)}
                    disabled={duplicatingId === r.id}
                    className="p-1.5 hover:bg-surface-alt rounded disabled:opacity-50"
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </button>
                  <Link
                    to={`/admin/rooms/${r.id}/edit`}
                    className="p-1.5 hover:bg-surface-alt rounded"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete room?"
        message="This will permanently remove the room and its gallery. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
