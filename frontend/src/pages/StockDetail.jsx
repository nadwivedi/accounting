import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../utils/api';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatQuantity = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const getTypeMeta = (row) => {
  if (row.type === 'purchase') {
    return {
      label: 'Purchase',
      className: 'bg-emerald-100 text-emerald-800'
    };
  }

  if (row.type === 'sale') {
    return {
      label: 'Sale',
      className: 'bg-rose-100 text-rose-800'
    };
  }

  if (row.type === 'purchase return') {
    return {
      label: 'Purchase Return',
      className: 'bg-amber-100 text-amber-800'
    };
  }

  if (row.type === 'sale return') {
    return {
      label: 'Sale Return',
      className: 'bg-violet-100 text-violet-800'
    };
  }

  if (row.type === 'adjustment') {
    return {
      label: row.inQty > 0 ? 'Adjustment (+)' : 'Adjustment (-)',
      className: 'bg-blue-100 text-blue-800'
    };
  }

  return {
    label: row.type || '-',
    className: 'bg-slate-100 text-slate-700'
  };
};

export default function StockDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [stockLedger, setStockLedger] = useState({ ledger: [], currentStock: [] });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStockDetails = async (showLoader = true, overrides = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const queryFromDate = overrides.fromDate !== undefined ? overrides.fromDate : fromDate;
      const queryToDate = overrides.toDate !== undefined ? overrides.toDate : toDate;

      const [productResponse, ledgerResponse] = await Promise.all([
        apiClient.get(`/products/${id}`),
        apiClient.get('/reports/stock-ledger', {
          params: {
            productId: id,
            fromDate: queryFromDate || undefined,
            toDate: queryToDate || undefined
          }
        })
      ]);

      setProduct(productResponse.data || null);
      setStockLedger(ledgerResponse.data || { ledger: [], currentStock: [] });
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading stock details');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    loadStockDetails(true);
  }, [id]);

  const totals = useMemo(() => {
    return (stockLedger.ledger || []).reduce((acc, row) => {
      acc.totalIn += Number(row.inQty || 0);
      acc.totalOut += Number(row.outQty || 0);
      return acc;
    }, { totalIn: 0, totalOut: 0 });
  }, [stockLedger]);

  const displayedCurrentStock = useMemo(() => {
    if (product) {
      return Number(product.currentStock || 0);
    }

    const found = (stockLedger.currentStock || []).find((row) => String(row.productId) === String(id));
    return Number(found?.currentStock || 0);
  }, [product, stockLedger, id]);

  const sortedLedgerRows = useMemo(() => {
    return [...(stockLedger.ledger || [])].sort((a, b) => {
      const aTime = new Date(a.entryCreatedAt || a.date).getTime() || 0;
      const bTime = new Date(b.entryCreatedAt || b.date).getTime() || 0;
      return bTime - aTime;
    });
  }, [stockLedger]);

  const ledgerSummary = useMemo(() => {
    if (sortedLedgerRows.length === 0) {
      return {
        movementCount: 0,
        latestMovement: '-',
        oldestMovement: '-'
      };
    }

    return {
      movementCount: sortedLedgerRows.length,
      latestMovement: formatDate(sortedLedgerRows[0]?.date),
      oldestMovement: formatDate(sortedLedgerRows[sortedLedgerRows.length - 1]?.date)
    };
  }, [sortedLedgerRows]);

  const handleApplyFilter = async () => {
    await loadStockDetails(true);
  };

  const handleClearFilter = async () => {
    setFromDate('');
    setToDate('');
    await loadStockDetails(true, { fromDate: '', toDate: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-3 pb-6 pt-4 md:px-6 md:pt-6">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-5 md:py-4">
        <div className="flex items-start gap-3">
          <Link
            to="/stock"
            aria-label="Back to stock"
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              {product?.name || 'Stock Details'}
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              {product?.stockGroup?.name ? `Group: ${product.stockGroup.name}` : 'Group: -'}
              {' | '}
              {`Unit: ${product?.unit || '-'}`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">Current Stock</p>
          <p className="mt-1 text-lg font-bold text-blue-900 md:text-xl">{formatQuantity(displayedCurrentStock)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Total In</p>
          <p className="mt-1 text-lg font-bold text-emerald-900 md:text-xl">{formatQuantity(totals.totalIn)}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-rose-700">Total Out</p>
          <p className="mt-1 text-lg font-bold text-rose-900 md:text-xl">{formatQuantity(totals.totalOut)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Net Movement</p>
          <p className="mt-1 text-lg font-bold text-slate-800 md:text-xl">{formatQuantity(totals.totalIn - totals.totalOut)}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm md:px-3.5 md:py-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Ledger Filter</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-900"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilter}
                className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-cyan-50 px-4 py-3 md:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 md:text-lg">Stock Ledger</h2>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                Purchase, sale, and purchase return movement for this stock item.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                Movements: {ledgerSummary.movementCount}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                Latest: {ledgerSummary.latestMovement}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                Oldest: {ledgerSummary.oldestMovement}
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Date</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Source</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Reference</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">In Qty</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Out Qty</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Running Qty</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : sortedLedgerRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">No stock movement found for this item</td>
              </tr>
            ) : (
              sortedLedgerRows.map((row, idx) => {
                const typeMeta = getTypeMeta(row);
                return (
                  <tr key={`${row.refId}-${idx}`} className="border-b border-slate-100 transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-slate-700/[0.06]">
                    <td className="px-4 py-2.5 text-slate-700">{formatDate(row.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeMeta.className}`}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{row.refNumber || '-'}</td>
                    <td className="px-4 py-2.5 font-medium text-emerald-700">{formatQuantity(row.inQty || 0)}</td>
                    <td className="px-4 py-2.5 font-medium text-rose-700">{formatQuantity(row.outQty || 0)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-800">
                        {formatQuantity(row.runningQty || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.note || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

