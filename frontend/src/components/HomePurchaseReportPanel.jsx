import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, Package, Pencil, ShoppingBag } from 'lucide-react';
import apiClient from '../utils/api';

const formatCurrency = (value) => (
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatPurchaseNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return '-';
  return `Pur-${String(parsed).padStart(2, '0')}`;
};

const formatQuantity = (value) => Number(value || 0).toLocaleString('en-IN');
const getDetailedItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: String(item._id || item.purchaseItemId || item.saleItemId || index),
    productName: String(item.productName || item.product?.name || 'Item').trim() || 'Item',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice || 0),
    total: Number(item.total || (Number(item.quantity || 0) * Number(item.unitPrice || 0))),
    unit: String(item.unit || item.product?.unit || '').trim() || '-'
  }));
};
const HIDDEN_DETAIL_FIELDS = new Set([
  'supplier bill',
  'party',
  'purchase date',
  'voucher no',
  'voucher number',
  'supplier invoice',
  'invoice',
  'invoice no',
  'invoice number',
  'due date'
]);

function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 text-lg font-black text-slate-800">{value}</p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2 text-white ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function PurchaseDetailModal({ detail, loading, error, onClose }) {
  if (!detail && !loading && !error) return null;

  const resolvedPartyName = String(detail?.partyName || detail?.party?.name || '').trim() || '-';

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-teal-900 to-cyan-800 px-5 py-4 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold">
                {detail?.title || 'Loading purchase detail'}
                {detail?.refNumber ? ` - ${detail.refNumber}` : ''}
              </h2>
              {resolvedPartyName !== '-' ? (
                <p className="text-sm text-cyan-100">{resolvedPartyName}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close purchase detail"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
              Loading purchase details...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && detail ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Amount</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(detail.amount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Purchase Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detail.date)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quantity</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatQuantity(detail.quantity)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Party</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{resolvedPartyName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(detail.fields || []).filter((field) => !HIDDEN_DETAIL_FIELDS.has(String(field?.label || '').trim().toLowerCase())).map((field) => (
                  <div key={`${field.label}-${field.value || 'empty'}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{field.label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {field.label.toLowerCase().includes('date') ? formatDate(field.value) : (field.value || '-')}
                    </p>
                  </div>
                ))}
              </div>

              {detail.notes ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{detail.notes}</p>
                </div>
              ) : null}

              {(detail.items || []).length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Purchased Items</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-white text-slate-600">
                        <tr>
                          <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Product</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Unit</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Qty</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Rate</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id} className="bg-white">
                            <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-800">{item.productName || '-'}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-medium text-slate-700">{item.unit || '-'}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-medium text-slate-800">{formatQuantity(item.quantity)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-medium text-slate-800">{formatCurrency(item.unitPrice)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function HomePurchaseReportPanel() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseDetail, setPurchaseDetail] = useState(null);
  const [purchaseDetailLoading, setPurchaseDetailLoading] = useState(false);
  const [purchaseDetailError, setPurchaseDetailError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setLoading(true);
        const [purchaseResponse, partyResponse] = await Promise.all([
          apiClient.get('/purchases'),
          apiClient.get('/parties')
        ]);
        setPurchases(purchaseResponse.data || []);
        setParties(partyResponse.data || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load purchase report');
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  const sortedPurchases = useMemo(() => (
    [...purchases].sort((a, b) => {
      const aTime = new Date(a.purchaseDate).getTime() || 0;
      const bTime = new Date(b.purchaseDate).getTime() || 0;
      return bTime - aTime;
    })
  ), [purchases]);

  const totalAmount = sortedPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);
  const visiblePurchases = sortedPurchases.slice(0, 8);
  const partyNameMap = useMemo(
    () => new Map((parties || []).map((party) => [String(party._id), String(party.name || party.partyName || 'Party').trim() || 'Party'])),
    [parties]
  );

  const getPurchasePartyName = (purchase) => {
    if (purchase?.party && typeof purchase.party === 'object') {
      return String(purchase.party.name || purchase.party.partyName || purchase.party.customerName || '').trim() || '-';
    }

    if (purchase?.partyName) {
      return String(purchase.partyName).trim() || '-';
    }

    const resolvedId = purchase?.party ? String(purchase.party) : '';
    return partyNameMap.get(resolvedId) || '-';
  };

  const handleOpenPurchaseDetail = async (purchase) => {
    if (!purchase?._id) return;

    setSelectedPurchase(purchase);
    setPurchaseDetail(null);
    setPurchaseDetailError('');
    setPurchaseDetailLoading(true);

    try {
      const response = await apiClient.get('/reports/party-ledger-entry-detail', {
        params: {
          type: 'purchase',
          refId: purchase._id
        }
      });

      setPurchaseDetail(response?.data || null);
    } catch (err) {
      setPurchaseDetailError(err.message || 'Error loading purchase detail');
    } finally {
      setPurchaseDetailLoading(false);
    }
  };

  const handleClosePurchaseDetail = () => {
    setSelectedPurchase(null);
    setPurchaseDetail(null);
    setPurchaseDetailError('');
    setPurchaseDetailLoading(false);
  };

  const handleEditPurchase = (purchase) => {
    if (!purchase?._id) return;

    navigate('/reports/purchase-report', {
      state: {
        editPurchase: purchase
      }
    });
  };

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <PurchaseDetailModal
        detail={purchaseDetail || (selectedPurchase ? {
          title: 'Purchase Details',
          refNumber: formatPurchaseNumber(selectedPurchase.purchaseNumber),
          partyName: getPurchasePartyName(selectedPurchase),
          amount: Number(selectedPurchase.totalAmount || 0),
          date: selectedPurchase.purchaseDate || '',
          quantity: (selectedPurchase.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          notes: String(selectedPurchase.notes || '').trim(),
          items: getDetailedItems(selectedPurchase.items)
        } : null)}
        loading={purchaseDetailLoading}
        error={purchaseDetailError}
        onClose={handleClosePurchaseDetail}
      />

      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Live Preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">Purchase Report</h2>
          </div>
          <Link
            to="/reports/purchase-report"
            className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Open Full Purchase Report
          </Link>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard title="Bills" value={sortedPurchases.length} icon={ShoppingBag} tone="from-amber-500 to-orange-500" />
          <StatCard title="Purchase Total" value={formatCurrency(totalAmount)} icon={IndianRupee} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Items" value={visiblePurchases.reduce((sum, purchase) => sum + Number(purchase.items?.length || 0), 0)} icon={Package} tone="from-blue-500 to-cyan-500" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Loading purchase report...</div>
          ) : visiblePurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Purchase No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Party</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em]">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePurchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      onClick={() => handleOpenPurchaseDetail(purchase)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(purchase.purchaseDate)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatPurchaseNumber(purchase.purchaseNumber)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{getPurchasePartyName(purchase)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">{formatCurrency(purchase.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditPurchase(purchase);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <ShoppingBag className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">No purchase report data found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
