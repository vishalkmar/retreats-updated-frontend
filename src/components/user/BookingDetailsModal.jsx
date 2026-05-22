import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, MapPin, Calendar, Users, Clock, CreditCard, FileText, Printer, Download,
  ArrowRight, AlertCircle, Loader2, XCircle, ExternalLink, Hotel as HotelIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { fileUrl } from '../../services/api';
import { TYPE_LABEL, STATUS_BADGE, fmtMoney, fmtDate, fmtDateTime, categorize } from './bookingFormatters';

/**
 * Full-detail booking modal used by BOTH the bookings page and the
 * transactions page. Closing rules:
 *   • Click backdrop OR press Esc → close (unless cancelling is in flight).
 *   • Cancel action opens an inline confirm step inside the same modal so
 *     the user doesn't lose context.
 *
 * Print uses the same window.print() trick as BookingSuccessPage. We add a
 * `.print-only-target` class to the voucher card and hide the rest via the
 * inline print stylesheet at the bottom of the file.
 */
export default function BookingDetailsModal({ booking, open, onClose, onChanged }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmingCancel(false);
      setCancelling(false);
      setCancelReason('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !cancelling) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, cancelling, onClose]);

  if (!open || !booking) return null;

  const item = booking.item || {};
  const pricing = booking.pricing || {};
  const status = booking.status;
  const cat = categorize(booking);
  const canCancel = (status === 'pending_payment' || status === 'confirmed') && cat !== 'completed';
  const canPay = status === 'pending_payment';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/bookings/me/${booking.bookingCode}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });
      toast.success('Booking cancelled');
      onChanged?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const badge = STATUS_BADGE[status] || { label: status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={() => !cancelling && onClose?.()}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden booking-voucher-print"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close + actions row */}
        <div className="absolute top-3 right-3 z-10 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-ink shadow border border-gray-200"
            aria-label="Print voucher"
            title="Print"
          >
            <Printer size={16} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-ink shadow border border-gray-200"
            aria-label="Save as PDF"
            title="Save as PDF (uses 'Save as PDF' from the print dialog)"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-ink shadow border border-gray-200 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Header ribbon */}
        <div className="bg-gradient-to-r from-brand to-brand-dark text-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap pr-32 print:pr-0">
            <div>
              <div className="text-[11px] uppercase tracking-widest opacity-90">Booking voucher</div>
              <div className="font-mono font-bold text-xl sm:text-2xl mt-1 tracking-wider break-all">
                {booking.bookingCode}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-widest opacity-90">
                {status === 'pending_payment' ? 'Amount due' : 'Total'}
              </div>
              <div className="font-bold text-xl sm:text-2xl">{fmtMoney(pricing.total, booking.currency)}</div>
              {booking.payment?.paidAt && (
                <div className="text-[11px] opacity-90 mt-1">{fmtDateTime(booking.payment.paidAt)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Item snapshot */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 border-b">
          <div className="sm:w-44 h-32 rounded-lg overflow-hidden bg-slate-100 shrink-0">
            {item?.image ? (
              <img src={fileUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-muted">
                <FileText size={28} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand mb-1">
              {TYPE_LABEL[item.type] || 'Booking'}
            </div>
            <h2 className="font-display font-bold text-lg sm:text-xl leading-snug">{item?.name}</h2>
            {item?.hotel?.name && (
              <div className="text-sm text-ink-muted mt-1 inline-flex items-center gap-1">
                <HotelIcon size={13} /> {item.hotel.name}
              </div>
            )}
            {item?.location && (
              <div className="text-sm text-ink-muted mt-1 inline-flex items-center gap-1">
                <MapPin size={13} /> {item.location}
              </div>
            )}
            {item?.detailHref && (
              <Link
                to={item.detailHref}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline print:hidden"
              >
                View experience <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
          <Detail
            icon={Calendar}
            label="When"
            value={
              booking.scheduledFor
                ? booking.scheduledEndAt
                  ? `${fmtDate(booking.scheduledFor)} → ${fmtDate(booking.scheduledEndAt)}`
                  : fmtDate(booking.scheduledFor)
                : '—'
            }
          />
          <Detail icon={Users} label="Guests" value={booking.guest?.count} />
          <Detail
            icon={Clock}
            label={item?.type === 'room' ? 'Nights' : 'Duration'}
            value={booking.units}
          />
          <Detail
            icon={CreditCard}
            label="Payment"
            value={booking.payment?.paidAt ? 'Paid' : status === 'cancelled' ? 'Cancelled' : 'Pending'}
          />
        </div>

        {/* Guest snapshot */}
        <div className="p-5 sm:p-6 border-b">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Lead traveller</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <KV label="Name" value={booking.guest?.name} />
            <KV label="Email" value={booking.guest?.email} />
            <KV label="Phone" value={booking.guest?.phone} />
          </div>
          {booking.specialRequests && (
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">Special requests</div>
              <p className="text-sm text-ink whitespace-pre-wrap">{booking.specialRequests}</p>
            </div>
          )}
        </div>

        {/* Payment details */}
        <div className="p-5 sm:p-6 border-b">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Payment</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <KV label="Order id" value={booking.payment?.orderId ? <span className="font-mono text-xs">{booking.payment.orderId}</span> : '—'} />
            <KV label="Payment id" value={booking.payment?.paymentId ? <span className="font-mono text-xs">{booking.payment.paymentId}</span> : '—'} />
            <KV label="Method" value={booking.payment?.method ? <span className="capitalize">{booking.payment.method}</span> : '—'} />
            <KV label="Paid at" value={booking.payment?.paidAt ? fmtDateTime(booking.payment.paidAt) : '—'} />
          </div>
        </div>

        {/* Pricing */}
        <div className="p-5 sm:p-6 bg-surface-alt/40">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Price breakdown</div>
          <div className="space-y-1.5 text-sm">
            <Row label={`${fmtMoney(pricing.unitPrice, booking.currency)} × ${booking.units || booking.guest?.count || 1}`} value={fmtMoney(pricing.subtotal, booking.currency)} />
            <Row label="Taxes" value={fmtMoney(pricing.tax, booking.currency)} />
            {pricing.walletDiscount > 0 && (
              <Row label="Wallet credit" value={`− ${fmtMoney(pricing.walletDiscount, booking.currency)}`} accent="text-emerald-600" />
            )}
            {pricing.couponDiscount > 0 && (
              <Row label={`Coupon ${pricing.couponCode || ''}`.trim()} value={`− ${fmtMoney(pricing.couponDiscount, booking.currency)}`} accent="text-emerald-600" />
            )}
            <div className="border-t mt-2 pt-2 flex items-center justify-between font-bold text-base">
              <span>{status === 'pending_payment' ? 'Total payable' : 'Total paid'}</span>
              <span className="text-brand">{fmtMoney(pricing.total, booking.currency)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation info */}
        {(status === 'cancelled' || status === 'refunded') && booking.cancelledAt && (
          <div className="p-5 sm:p-6 bg-rose-50 border-t border-rose-100 text-sm text-rose-900">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <XCircle size={16} /> Booking cancelled on {fmtDateTime(booking.cancelledAt)}
            </div>
            {booking.cancellationReason && (
              <div className="text-rose-800 mt-1">Reason: {booking.cancellationReason}</div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/dashboard/bookings"
            className="text-sm font-medium text-ink-muted hover:text-brand"
            onClick={onClose}
          >
            ← All bookings
          </Link>

          <div className="flex flex-wrap gap-2">
            {canPay && (
              <Link
                to={`/checkout/${booking.bookingCode}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:brightness-110"
              >
                <CreditCard size={14} /> Pay now
              </Link>
            )}
            {canCancel && !confirmingCancel && (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50"
              >
                <XCircle size={14} /> Cancel booking
              </button>
            )}
          </div>
        </div>

        {/* Inline cancel confirmation */}
        {confirmingCancel && (
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 print:hidden">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2 text-amber-900">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="text-sm">
                  <strong>Are you sure?</strong> This will cancel the booking. Refunds (where applicable) are processed within 5–7 business days.
                </div>
              </div>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Optional: tell us why you're cancelling"
                className="mt-3 w-full px-3 py-2 rounded-lg border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40 outline-none text-sm bg-white"
                maxLength={250}
              />
              <div className="mt-3 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelling}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-white"
                >Keep booking</button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Confirm cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print-only stylesheet — hides the dimmer/scroll container chrome and
          shows only the voucher when the user prints. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .booking-voucher-print, .booking-voucher-print * { visibility: visible !important; }
          .booking-voucher-print {
            position: absolute !important;
            inset: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-ink-muted uppercase tracking-wide mb-0.5">
        <Icon size={12} /> {label}
      </div>
      <div className="font-medium text-ink text-sm break-words">{value || '—'}</div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div>
      <div className="text-xs text-ink-muted uppercase tracking-wide">{label}</div>
      <div className="font-medium text-ink break-words">{value || '—'}</div>
    </div>
  );
}

function Row({ label, value, accent = '' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-medium ${accent || 'text-ink'}`}>{value}</span>
    </div>
  );
}
