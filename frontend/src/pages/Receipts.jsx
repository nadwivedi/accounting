import { useEffect, useMemo, useState } from 'react';
import apiClient from '../utils/api';

const getInitialForm = () => ({
  party: '',
  amount: '',
  method: 'cash',
  receiptDate: new Date().toISOString().split('T')[0],
  notes: '',
  refType: 'none',
  refId: ''
});

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [search]);

  useEffect(() => {
    fetchParties();
    fetchSales();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/receipts', { params: { search } });
      setReceipts(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties');
      setParties((response.data || []).filter((p) => p.type === 'customer' || p.type === 'both'));
    } catch (err) {
      console.error('Error fetching parties:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await apiClient.get('/sales');
      const pending = (response.data || []).filter(
        (s) => (Number(s.totalAmount || 0) - Number(s.paidAmount || 0)) > 0
      );
      setSales(pending);
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  const saleOptions = useMemo(() => {
    if (formData.refType !== 'sale') return [];
    return sales.filter((s) => {
      if (!formData.party) return true;
      return String(s.party?._id || s.party) === String(formData.party);
    });
  }, [sales, formData.refType, formData.party]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(getInitialForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (formData.refType === 'sale' && !formData.refId) {
      setError('Select sale bill for bill-wise receipt');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/receipts', {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        receiptDate: formData.receiptDate ? new Date(formData.receiptDate) : new Date(),
        notes: formData.notes,
        refType: formData.refType,
        refId: formData.refType === 'sale' ? formData.refId : null
      });

      handleCloseForm();
      setError('');
      fetchReceipts();
      fetchSales();
    } catch (err) {
      setError(err.message || 'Error creating receipt');
    } finally {
      setLoading(false);
    }
  };

  const totalReceipts = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="ml-64 p-8 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Receipts</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{receipts.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm text-emerald-700">Amount Received</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">Rs {totalReceipts.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleOpenForm}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Receipt
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">New Receipt (Money Received)</h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="h-9 w-9 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Party</label>
                <select
                  name="party"
                  value={formData.party}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select party</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.partyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  name="receiptDate"
                  value={formData.receiptDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Method</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Receipt Type</label>
                <select
                  name="refType"
                  value={formData.refType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, refType: e.target.value, refId: '' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="none">On Account</option>
                  <option value="sale">Against Sale Bill</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Sale Bill</label>
                <select
                  name="refId"
                  value={formData.refId}
                  onChange={handleChange}
                  disabled={formData.refType !== 'sale'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                >
                  <option value="">Select sale bill</option>
                  {saleOptions.map((sale) => {
                    const pending = Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0);
                    return (
                      <option key={sale._id} value={sale._id}>
                        {sale.invoiceNumber} - {sale.party?.partyName || sale.customerName || '-'} - Pending Rs {pending.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Optional note"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Party</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Method</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Reference</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt._id} className="border-b border-slate-100">
                <td className="px-6 py-3">{new Date(receipt.receiptDate).toLocaleDateString()}</td>
                <td className="px-6 py-3">{receipt.party?.partyName || '-'}</td>
                <td className="px-6 py-3 text-emerald-700 font-semibold">Rs {Number(receipt.amount || 0).toFixed(2)}</td>
                <td className="px-6 py-3 capitalize">{receipt.method}</td>
                <td className="px-6 py-3">{receipt.refType === 'sale' ? 'Against Sale' : 'On Account'}</td>
                <td className="px-6 py-3">{receipt.notes || '-'}</td>
              </tr>
            ))}
            {!loading && receipts.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No receipts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
