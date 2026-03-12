import { useEffect, useMemo, useState } from 'react';
import { Wallet, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddPaymentPopup from './component/AddPaymentPopup';

const getInitialForm = () => ({
  party: '',
  amount: '',
  method: 'cash',
  paymentDate: new Date().toISOString().split('T')[0],
  notes: '',
  refType: 'none',
  refId: ''
});
const TOAST_OPTIONS = { autoClose: 1200 };

const buildPurchasePaymentMap = (payments) => {
  const map = new Map();

  payments
    .filter((payment) => payment.refType === 'purchase' && payment.refId)
    .forEach((payment) => {
      const key = String(payment.refId);
      map.set(key, (map.get(key) || 0) + Number(payment.amount || 0));
    });

  return map;
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchParties();
    fetchPurchases();
  }, []);

  const purchasePaymentMap = useMemo(() => buildPurchasePaymentMap(payments), [payments]);

  const getFromDateByFilter = () => {
    const now = new Date();
    if (dateFilter === '7d') {
      now.setDate(now.getDate() - 7);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '30d') {
      now.setDate(now.getDate() - 30);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '3m') {
      now.setMonth(now.getMonth() - 3);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '6m') {
      now.setMonth(now.getMonth() - 6);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '1y') {
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString().split('T')[0];
    }
    return '';
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/payments', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
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
      setPurchases(response.data || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const purchaseOptions = useMemo(() => {
    if (formData.refType !== 'purchase') return [];

    return purchases.filter((p) => {
      if (!formData.party) return true;
      return String(p.party?._id || p.party) === String(formData.party);
    }).filter((p) => {
      const pending = Math.max(0, Number(p.totalAmount || 0) - Number(purchasePaymentMap.get(String(p._id)) || 0));
      return pending > 0;
    });
  }, [purchases, purchasePaymentMap, formData.refType, formData.party]);

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
      toast.success('Payment created successfully', TOAST_OPTIONS);
    } catch (err) {
      setError(err.message || 'Error creating payment');
    } finally {
      setLoading(false);
    }
  };

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalPayable = Math.max(0, totalPurchaseAmount - totalPayments);

  const billWisePendingPurchases = useMemo(() => {
    const billWiseRefSet = new Set(
      payments
        .filter((payment) => payment.refType === 'purchase' && payment.refId)
        .map((payment) => String(payment.refId))
    );

    return purchases
      .map((purchase) => {
        const pendingAmount = Math.max(
          0,
          Number(purchase.totalAmount || 0) - Number(purchasePaymentMap.get(String(purchase._id)) || 0)
        );
        return {
          ...purchase,
          pendingAmount
        };
      })
      .filter((purchase) => purchase.pendingAmount > 0 && billWiseRefSet.has(String(purchase._id)));
  }, [purchases, payments, purchasePaymentMap]);

  const billWisePendingTotal = billWisePendingPurchases.reduce((sum, p) => sum + Number(p.pendingAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Payments</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{payments.length}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Amount Paid</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {totalPayments.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Payable</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {totalPayable.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Bill-wise Pending</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {billWisePendingTotal.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-rose-500 to-red-400 opacity-80"></div>
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
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full md:w-56 bg-white px-4 py-2.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value="">Payment History - All Time</option>
          <option value="7d">Payment History - 7 Days</option>
          <option value="30d">Payment History - 30 Days</option>
          <option value="3m">Payment History - 3 Months</option>
          <option value="6m">Payment History - 6 Months</option>
          <option value="1y">Payment History - 1 Year</option>
        </select>
        <button
          onClick={handleOpenForm}
          className="bg-rose-600 text-white px-6 py-2.5 rounded-lg hover:bg-rose-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Payment
        </button>
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-base font-semibold text-slate-800">Pending Bill-wise Purchases</h3>
          <p className="text-xs text-slate-500 mt-1">Only purchases with bill reference and pending balance are shown.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Invoice No</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billWisePendingPurchases.map((purchase) => (
                <tr key={purchase._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 font-semibold text-slate-800">{purchase.invoiceNo || purchase.invoiceNumber || '-'}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{purchase.party?.partyName || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-rose-600 font-semibold">Rs {Number(purchase.pendingAmount || 0).toFixed(2)}</td>
                </tr>
              ))}
              {!loading && billWisePendingPurchases.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">No pending bill-wise purchases</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPaymentPopup
        showForm={showForm}
        loading={loading}
        formData={formData}
        parties={parties}
        purchaseOptions={purchaseOptions}
        purchasePaymentMap={purchasePaymentMap}
        setFormData={setFormData}
        handleCloseForm={handleCloseForm}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Party</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-600 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{payment.party?.partyName || '-'}</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold">Rs {Number(payment.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 capitalize">
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 whitespace-nowrap">
                      {payment.refType === 'purchase' ? 'Against Purchase' : 'On Account'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">{payment.notes || '-'}</td>
                </tr>
              ))}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

