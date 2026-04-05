import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, Package, Pencil, ShoppingCart } from 'lucide-react';
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

const formatQuantity = (value) => Number(value || 0).toLocaleString('en-IN');

const formatInvoiceNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return String(value || '-').trim() || '-';
  return `Inv-${String(parsed).padStart(2, '0')}`;
};

const getDetailedItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: String(item._id || item.saleItemId || item.purchaseItemId || index),
    productName: String(item.productName || item.product?.name || 'Item').trim() || 'Item',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice || 0),
    total: Number(item.total || (Number(item.quantity || 0) * Number(item.unitPrice || 0))),
    unit: String(item.unit || item.product?.unit || '').trim() || '-'
  }));
};

const HIDDEN_DETAIL_FIELDS = new Set([
  'party',
  'sale date',
  'invoice',
  'invoice no',
  'invoice number',
  'voucher no',
  'voucher number',
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

function SaleDetailModal({ detail, loading, error, onClose }) {
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
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-violet-900 to-indigo-800 px-5 py-4 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold">
                {detail?.title || 'Loading sale detail'}
                {detail?.refNumber ? ` - ${detail.refNumber}` : ''}
              </h2>
              {resolvedPartyName !== '-' ? (
                <p className="text-sm text-indigo-100">{resolvedPartyName}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close sale detail"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
              Loading sale details...
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sale Date</p>
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
                    <h3 className="text-sm font-semibold text-slate-900">Sale Items</h3>
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

export default function HomeSalesLedgerPanel() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetail, setSaleDetail] = useState(null);
  const [saleDetailLoading, setSaleDetailLoading] = useState(false);
  const [saleDetailError, setSaleDetailError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/sales');
        setSales(response.data || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load sales report');
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  const sortedSales = useMemo(() => (
    [...sales].sort((a, b) => {
      const aTime = new Date(a.saleDate).getTime() || 0;
      const bTime = new Date(b.saleDate).getTime() || 0;
      return bTime - aTime;
    })
  ), [sales]);

  const totalAmount = sortedSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalItems = sortedSales.reduce((sum, sale) => sum + Number(sale.items?.length || 0), 0);
  const visibleSales = sortedSales.slice(0, 8);

  const handleOpenSaleDetail = async (sale) => {
    if (!sale?._id) return;

    setSelectedSale(sale);
    setSaleDetail(null);
    setSaleDetailError('');
    setSaleDetailLoading(true);

    try {
      const response = await apiClient.get('/reports/party-ledger-entry-detail', {
        params: {
          type: 'sale',
          refId: sale._id
        }
      });

      setSaleDetail(response?.data || null);
    } catch (err) {
      setSaleDetailError(err.message || 'Error loading sale detail');
    } finally {
      setSaleDetailLoading(false);
    }
  };

  const handleCloseSaleDetail = () => {
    setSelectedSale(null);
    setSaleDetail(null);
    setSaleDetailError('');
    setSaleDetailLoading(false);
  };

  const handleEditSale = (sale) => {
    if (!sale?._id) return;

    navigate('/reports/sales-report', {
      state: {
        editSale: sale
      }
    });
  };

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <SaleDetailModal
        detail={saleDetail || (selectedSale ? {
          title: 'Sale Details',
          refNumber: formatInvoiceNumber(selectedSale.invoiceNumber),
          partyName: String(selectedSale.customerName || selectedSale.party?.name || selectedSale.partyName || '').trim() || '-',
          amount: Number(selectedSale.totalAmount || 0),
          date: selectedSale.saleDate || '',
          quantity: (selectedSale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          notes: String(selectedSale.notes || '').trim(),
          items: getDetailedItems(selectedSale.items)
        } : null)}
        loading={saleDetailLoading}
        error={saleDetailError}
        onClose={handleCloseSaleDetail}
      />

      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">Live Preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">Sales Report</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lifetime Sales</p>
          </div>
          <Link
            to="/reports/sales-report"
            className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            Open Full Sales Report
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
          <StatCard title="Invoices" value={sortedSales.length} icon={ShoppingCart} tone="from-blue-500 to-cyan-500" />
          <StatCard title="Sales Total" value={formatCurrency(totalAmount)} icon={IndianRupee} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Items" value={totalItems} icon={Package} tone="from-violet-500 to-purple-500" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Loading sales report...</div>
          ) : visibleSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Invoice No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em]">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleSales.map((sale) => (
                    <tr
                      key={sale._id}
                      onClick={() => handleOpenSaleDetail(sale)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{sale.invoiceNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{sale.customerName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(sale.saleDate)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">{formatCurrency(sale.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditSale(sale);
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
                <ShoppingCart className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">No sales report data found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
