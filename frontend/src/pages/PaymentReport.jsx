import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, IndianRupee, Pencil, RefreshCw, Search, Wallet, XCircle } from 'lucide-react';
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

const formatPaymentNumber = (payment) => {
  const paymentNumber = payment?.paymentNumber;
  if (paymentNumber === null || paymentNumber === undefined || paymentNumber === '') return '-';
  return `Pay-${String(paymentNumber).padStart(4, '0')}`;
};

const getPartyName = (payment) => {
  if (payment?.party && typeof payment.party === 'object') {
    return String(payment.party.name || payment.party.partyName || '').trim() || '-';
  }

  return String(payment?.partyName || '').trim() || '-';
};

function StatCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-lg">
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br opacity-10 ${tone}`} />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1 text-xl font-black leading-tight text-slate-800">{value}</p>
          {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2.5 text-white ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PaymentReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const popup = document.querySelector('.fixed.inset-0.z-50');
      if (popup) return;
      event.preventDefault();
      navigate('/');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/payments');
      setPayments(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load payment report');
    } finally {
      setLoading(false);
    }
  };

  const sortedPayments = useMemo(() => (
    [...payments].sort((first, second) => {
      const firstDate = new Date(first.paymentDate || first.createdAt || 0).getTime() || 0;
      const secondDate = new Date(second.paymentDate || second.createdAt || 0).getTime() || 0;
      if (secondDate !== firstDate) return secondDate - firstDate;
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    })
  ), [payments]);

  const visiblePayments = useMemo(() => {
    const normalizedSearch = String(searchTerm || '').trim().toLowerCase();
    if (!normalizedSearch) return sortedPayments;

    return sortedPayments.filter((payment) => (
      getPartyName(payment).toLowerCase().includes(normalizedSearch)
      || formatPaymentNumber(payment).toLowerCase().includes(normalizedSearch)
      || String(payment.method || '').toLowerCase().includes(normalizedSearch)
      || String(payment.notes || '').toLowerCase().includes(normalizedSearch)
      || String(payment.amount || '').toLowerCase().includes(normalizedSearch)
    ));
  }, [searchTerm, sortedPayments]);

  const summary = useMemo(() => {
    const methods = new Set();
    const totalAmount = sortedPayments.reduce((sum, payment) => {
      methods.add(String(payment.method || '-'));
      return sum + Number(payment.amount || 0);
    }, 0);

    return {
      count: sortedPayments.length,
      totalAmount,
      methodCount: methods.size
    };
  }, [sortedPayments]);

  const handleAddPayment = () => {
    navigate('/', {
      replace: true,
      state: {
        ...(location.state || {}),
        homeQuickSale: false,
        homeQuickPurchase: false,
        homeQuickPayment: true,
        homeQuickReceipt: false,
        homeQuickExpense: false
      }
    });
  };

  const handleEditPayment = (payment) => {
    if (!payment?._id) return;

    navigate('/', {
      replace: true,
      state: {
        ...(location.state || {}),
        homeQuickSale: false,
        homeQuickPurchase: false,
        homeQuickPayment: true,
        homeQuickReceipt: false,
        homeQuickExpense: false,
        editPayment: payment
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-[95%] px-4 py-6">
        {error ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-lg">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700" aria-label="Dismiss error">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Payments" value={summary.count.toLocaleString('en-IN')} subtitle="created payments" icon={CreditCard} tone="from-rose-500 to-pink-500" />
          <StatCard title="Paid Total" value={formatCurrency(summary.totalAmount)} subtitle="money paid" icon={IndianRupee} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Methods" value={summary.methodCount.toLocaleString('en-IN')} subtitle="payment accounts" icon={Wallet} tone="from-amber-500 to-orange-500" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-800">Payment Report</h1>
              <p className="mt-1 text-sm text-slate-500">All payments created in the system</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleAddPayment}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Add Payment
              </button>
              <button
                type="button"
                onClick={loadPayments}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100 sm:w-72"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-500">Loading payment report...</p>
              </div>
            </div>
          ) : visiblePayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Payment No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Party</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePayments.map((payment) => (
                    <tr key={payment._id} className="transition-colors hover:bg-rose-50/40">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatDate(payment.paymentDate)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{formatPaymentNumber(payment)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{getPartyName(payment)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{payment.method || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="block max-w-[260px] truncate">{payment.notes || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-emerald-700">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEditPayment(payment)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
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
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <CreditCard className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-600">No payment data found</p>
              <p className="mt-1 text-sm text-slate-400">Create a payment or clear the search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
