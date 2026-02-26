import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';

const initialAdjustmentForm = {
  type: 'add',
  quantity: '',
  notes: ''
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

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
  const [adjustmentForm, setAdjustmentForm] = useState(initialAdjustmentForm);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
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

  const handleApplyFilter = async () => {
    await loadStockDetails(true);
  };

  const handleClearFilter = async () => {
    setFromDate('');
    setToDate('');
    await loadStockDetails(true, { fromDate: '', toDate: '' });
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();

    const quantity = Number(adjustmentForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setAdjusting(true);
      await apiClient.patch(`/products/${id}/stock`, {
        type: adjustmentForm.type,
        quantity,
        notes: adjustmentForm.notes
      });

      toast.success('Stock adjusted successfully', { autoClose: 1200 });
      setAdjustmentForm(initialAdjustmentForm);
      setError('');
      await loadStockDetails(false);
    } catch (err) {
      setError(err.message || 'Error adjusting stock');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-4">
        <Link to="/stock" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          Back to Stock
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {product?.name || 'Stock Details'}
        </h1>
        <p className="text-sm text-gray-600">
          {product?.stockGroup?.name ? `Group: ${product.stockGroup.name}` : 'Group: -'}
          {' | '}
          {`Unit: ${product?.unit || '-'}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-blue-700">Current Stock</p>
          <p className="text-xl md:text-2xl font-bold text-blue-900 mt-1">{displayedCurrentStock}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-emerald-700">Total In</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-900 mt-1">{totals.totalIn}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-rose-700">Total Out</p>
          <p className="text-xl md:text-2xl font-bold text-rose-900 mt-1">{totals.totalOut}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500">Net Movement</p>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{totals.totalIn - totals.totalOut}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Filter Ledger</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilter}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleAdjustStock} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Stock Adjustment</h2>
          <select
            value={adjustmentForm.type}
            onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="add">Add Stock</option>
            <option value="subtract">Subtract Stock</option>
          </select>
          <input
            type="number"
            min="0.000001"
            step="0.000001"
            placeholder="Quantity"
            value={adjustmentForm.quantity}
            onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, quantity: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <textarea
            placeholder="Notes (optional)"
            value={adjustmentForm.notes}
            onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows="2"
          />
          <button
            type="submit"
            disabled={adjusting}
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {adjusting ? 'Updating...' : 'Save Adjustment'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Source</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Reference</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">In Qty</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Out Qty</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Running Qty</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : sortedLedgerRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No stock movement found for this item</td>
              </tr>
            ) : (
              sortedLedgerRows.map((row, idx) => {
                const typeMeta = getTypeMeta(row);
                return (
                  <tr key={`${row.refId}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3">{formatDate(row.date)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeMeta.className}`}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">{row.refNumber || '-'}</td>
                    <td className="px-6 py-3 text-emerald-700 font-medium">{Number(row.inQty || 0)}</td>
                    <td className="px-6 py-3 text-rose-700 font-medium">{Number(row.outQty || 0)}</td>
                    <td className="px-6 py-3 font-semibold text-slate-800">{Number(row.runningQty || 0)}</td>
                    <td className="px-6 py-3 text-slate-600">{row.note || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
