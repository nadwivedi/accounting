import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';

const initialForm = {
  productId: '',
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

export default function StockAdjustments() {
  const toastOptions = { autoClose: 1200 };
  const [products, setProducts] = useState([]);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    const response = await apiClient.get('/products');
    setProducts(response.data || []);
  };

  const fetchAdjustments = async () => {
    const response = await apiClient.get('/reports/stock-ledger');
    const rows = (response.data?.ledger || [])
      .filter((row) => row.type === 'adjustment')
      .sort((a, b) => {
        const aTime = new Date(a.entryCreatedAt || a.date).getTime() || 0;
        const bTime = new Date(b.entryCreatedAt || b.date).getTime() || 0;
        return bTime - aTime;
      });
    setLedgerRows(rows);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchAdjustments()]);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading stock adjustment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((product) => String(product._id) === String(formData.productId)) || null;
  }, [products, formData.productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const quantity = Number(formData.quantity);

    if (!formData.productId) {
      setError('Please select a stock item');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      await apiClient.patch(`/products/${formData.productId}/stock`, {
        type: formData.type,
        quantity,
        notes: formData.notes
      });

      toast.success('Stock adjusted successfully', toastOptions);
      setFormData(initialForm);
      await Promise.all([fetchProducts(), fetchAdjustments()]);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving stock adjustment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Stock Adjustment</h1>
        <p className="text-gray-600 mt-2">Add or subtract stock manually and track adjustment entries.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <form onSubmit={handleSubmit} className="xl:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">New Adjustment</h2>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Stock Item *</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">Select stock item</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
              Current Stock: <span className="font-semibold">{Number(selectedProduct.currentStock || 0)}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Subtract Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0.000001"
              step="0.000001"
              placeholder="Enter quantity"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              placeholder="Reason for adjustment (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Adjustment'}
          </button>
        </form>

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Recent Adjustments</h2>
          </div>

          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Stock Item</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">In Qty</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Out Qty</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No stock adjustments found</td>
                </tr>
              ) : (
                ledgerRows.slice(0, 100).map((row, index) => (
                  <tr key={`${row.refId}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3">{formatDate(row.date)}</td>
                    <td className="px-6 py-3">{row.productName || '-'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        Number(row.inQty || 0) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {Number(row.inQty || 0) > 0 ? 'Add' : 'Subtract'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-emerald-700 font-medium">{Number(row.inQty || 0)}</td>
                    <td className="px-6 py-3 text-rose-700 font-medium">{Number(row.outQty || 0)}</td>
                    <td className="px-6 py-3 text-slate-600">{row.note || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
