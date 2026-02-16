import { useEffect, useMemo, useState } from 'react';
import apiClient from '../utils/api';

const getInitialForm = () => ({
  party: '',
  amount: '',
  method: 'cash',
  paymentDate: new Date().toISOString().split('T')[0],
  notes: '',
  refType: 'none',
  refId: ''
});

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [search]);

  useEffect(() => {
    fetchParties();
    fetchPurchases();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments', { params: { search } });
      setPayments(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties');
      setParties((response.data || []).filter((p) => p.type === 'supplier' || p.type === 'both'));
    } catch (err) {
      console.error('Error fetching parties:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await apiClient.get('/purchases');
      const pending = (response.data || []).filter(
        (p) => (Number(p.totalAmount || 0) - Number(p.paidAmount || 0)) > 0
      );
      setPurchases(pending);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const purchaseOptions = useMemo(() => {
    if (formData.refType !== 'purchase') return [];
    return purchases.filter((p) => {
      if (!formData.party) return true;
      return String(p.party?._id || p.party) === String(formData.party);
    });
  }, [purchases, formData.refType, formData.party]);

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

    if (formData.refType === 'purchase' && !formData.refId) {
      setError('Select purchase bill for bill-wise payment');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/payments', {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : new Date(),
        notes: formData.notes,
        refType: formData.refType,
        refId: formData.refType === 'purchase' ? formData.refId : null
      });

      handleCloseForm();
      setError('');
      fetchPayments();
      fetchPurchases();
    } catch (err) {
      setError(err.message || 'Error creating payment');
    } finally {
      setLoading(false);
    }
  };

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Payments</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{payments.length}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm text-rose-700">Amount Paid</p>
          <p className="text-2xl font-bold text-rose-800 mt-1">Rs {totalPayments.toFixed(2)}</p>
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
          className="bg-rose-600 text-white px-6 py-2.5 rounded-lg hover:bg-rose-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Payment
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">New Payment (Money Paid)</h2>
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
                  name="paymentDate"
                  value={formData.paymentDate}
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
                <label className="block text-sm text-slate-600 mb-1">Payment Type</label>
                <select
                  name="refType"
                  value={formData.refType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, refType: e.target.value, refId: '' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="none">On Account</option>
                  <option value="purchase">Against Purchase Bill</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Purchase Bill</label>
                <select
                  name="refId"
                  value={formData.refId}
                  onChange={handleChange}
                  disabled={formData.refType !== 'purchase'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                >
                  <option value="">Select purchase bill</option>
                  {purchaseOptions.map((purchase) => {
                    const pending = Number(purchase.totalAmount || 0) - Number(purchase.paidAmount || 0);
                    return (
                      <option key={purchase._id} value={purchase._id}>
                        {purchase.invoiceNumber} - {purchase.party?.partyName || '-'} - Pending Rs {pending.toFixed(2)}
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
                  className="w-full bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Payment'}
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
            {payments.map((payment) => (
              <tr key={payment._id} className="border-b border-slate-100">
                <td className="px-6 py-3">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td className="px-6 py-3">{payment.party?.partyName || '-'}</td>
                <td className="px-6 py-3 text-rose-700 font-semibold">Rs {Number(payment.amount || 0).toFixed(2)}</td>
                <td className="px-6 py-3 capitalize">{payment.method}</td>
                <td className="px-6 py-3">{payment.refType === 'purchase' ? 'Against Purchase' : 'On Account'}</td>
                <td className="px-6 py-3">{payment.notes || '-'}</td>
              </tr>
            ))}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
