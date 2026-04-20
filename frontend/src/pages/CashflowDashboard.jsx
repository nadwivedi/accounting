import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Calendar,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  XCircle
} from 'lucide-react';
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

const formatDateForInput = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

const getTodayRange = () => {
  const today = new Date();
  const value = formatDateForInput(today);
  return { fromDate: value, toDate: value };
};

const getMonthRange = () => {
  const now = new Date();
  return {
    fromDate: formatDateForInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    toDate: formatDateForInput(now)
  };
};

const getEntryAmount = (entry) => Number(entry?.amount || 0);
const getEntryIn = (entry) => Number(entry?.inAmount || 0);
const getEntryOut = (entry) => Number(entry?.outAmount || 0);

const isSaleEntry = (entry) => (
  String(entry?.accountName || '').toLowerCase() === 'sales'
  || String(entry?.label || '').toLowerCase().includes('sale') && !String(entry?.label || '').toLowerCase().includes('return')
);

const isPurchaseEntry = (entry) => (
  String(entry?.accountName || '').toLowerCase() === 'purchase'
  || String(entry?.label || '').toLowerCase().includes('purchase') && !String(entry?.label || '').toLowerCase().includes('return')
);

function StatCard({ title, value, subtitle, icon: Icon, tone, valueClassName = 'text-slate-800' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-lg lg:px-3 lg:py-3 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4">
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br opacity-10 lg:h-18 lg:w-18 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24 ${tone}`} />
      <div className="relative z-10 flex items-center justify-between gap-4 lg:gap-2 xl:gap-3 2xl:gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 lg:text-[9px] lg:tracking-[0.1em] xl:text-[10px] xl:tracking-[0.12em] 2xl:text-xs 2xl:tracking-wider">{title}</p>
          <p className={`mt-1 text-xl font-black leading-tight lg:text-base xl:text-lg 2xl:text-xl ${valueClassName}`}>{value}</p>
          {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500 lg:text-[10px] xl:text-[11px] 2xl:text-xs">{subtitle}</p> : null}
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2.5 text-white lg:p-2 xl:p-2 2xl:p-2.5 ${tone}`}>
          <Icon className="h-5 w-5 lg:h-4 lg:w-4 xl:h-4 xl:w-4 2xl:h-5 2xl:w-5" />
        </div>
      </div>
    </div>
  );
}

export default function CashflowDashboard() {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => getMonthRange(), []);
  const [entries, setEntries] = useState([]);
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
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

  const loadDashboard = async (range = { fromDate, toDate }) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/reports/day-book', {
        params: {
          fromDate: range.fromDate || undefined,
          toDate: range.toDate || undefined
        }
      });
      setEntries(response.data?.entries || []);
    } catch (err) {
      setError(err.message || 'Unable to load cashflow dashboard');
    } finally {
      setLoading(false);
    }
  };

  const applyToday = () => {
    const range = getTodayRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    loadDashboard(range);
  };

  const applyThisMonth = () => {
    const range = getMonthRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    loadDashboard(range);
  };

  const clearRange = () => {
    const range = { fromDate: '', toDate: '' };
    setFromDate('');
    setToDate('');
    loadDashboard(range);
  };

  const summary = useMemo(() => entries.reduce((acc, entry) => {
    const amount = getEntryAmount(entry);
    const inward = getEntryIn(entry);
    const outward = getEntryOut(entry);
    const balance = Number(entry.balance || 0);

    acc.actualReceived += inward;
    acc.actualPaid += outward;

    if (isSaleEntry(entry)) {
      acc.sales += amount;
      acc.salePaid += inward;
      acc.receivable += Math.max(0, balance);
    }

    if (isPurchaseEntry(entry)) {
      acc.purchases += amount;
      acc.purchasePaid += outward;
      acc.payable += Math.max(0, amount - outward);
    }

    if (entry.type === 'receipt') acc.receipts += amount;
    if (entry.type === 'payment') acc.payments += amount;
    if (entry.type === 'expense') acc.expenses += amount;
    if (entry.type === 'saleReturn') acc.saleReturns += amount;
    if (entry.type === 'purchaseReturn') acc.purchaseReturns += amount;

    return acc;
  }, {
    actualReceived: 0,
    actualPaid: 0,
    sales: 0,
    salePaid: 0,
    purchases: 0,
    purchasePaid: 0,
    receivable: 0,
    payable: 0,
    receipts: 0,
    payments: 0,
    expenses: 0,
    saleReturns: 0,
    purchaseReturns: 0
  }), [entries]);

  const netCashflow = summary.actualReceived - summary.actualPaid;

  const cashInRows = useMemo(() => entries
    .filter((entry) => getEntryIn(entry) > 0)
    .sort((first, second) => new Date(second.date || 0).getTime() - new Date(first.date || 0).getTime())
    .slice(0, 8), [entries]);

  const cashOutRows = useMemo(() => entries
    .filter((entry) => getEntryOut(entry) > 0)
    .sort((first, second) => new Date(second.date || 0).getTime() - new Date(first.date || 0).getTime())
    .slice(0, 8), [entries]);

  const renderFlowTable = (rows, direction) => (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 lg:px-4 lg:py-3 xl:px-5 xl:py-4 2xl:px-6 2xl:py-5">
        <h2 className="text-lg font-black text-slate-800 lg:text-base xl:text-[17px] 2xl:text-lg">{direction === 'in' ? 'Latest Cash In' : 'Latest Cash Out'}</h2>
        <p className="mt-1 text-sm text-slate-500 lg:text-xs xl:text-[13px] 2xl:text-sm">{direction === 'in' ? 'Sale paid amount and receipts' : 'Purchase paid amount, payments, expenses, and returns'}</p>
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider lg:px-3 lg:py-2 lg:text-[9px] lg:tracking-[0.1em] xl:px-4 xl:text-[10px] xl:tracking-[0.12em] 2xl:px-5 2xl:py-3 2xl:text-xs 2xl:tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider lg:px-3 lg:py-2 lg:text-[9px] lg:tracking-[0.1em] xl:px-4 xl:text-[10px] xl:tracking-[0.12em] 2xl:px-5 2xl:py-3 2xl:text-xs 2xl:tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider lg:px-3 lg:py-2 lg:text-[9px] lg:tracking-[0.1em] xl:px-4 xl:text-[10px] xl:tracking-[0.12em] 2xl:px-5 2xl:py-3 2xl:text-xs 2xl:tracking-wider">Party</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider lg:px-3 lg:py-2 lg:text-[9px] lg:tracking-[0.1em] xl:px-4 xl:text-[10px] xl:tracking-[0.12em] 2xl:px-5 2xl:py-3 2xl:text-xs 2xl:tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((entry, index) => (
                <tr key={`${entry.refId || entry.type}-${index}`} className="hover:bg-slate-50">
                  <td className="px-5 py-3 lg:px-3 lg:py-2 xl:px-4 2xl:px-5 2xl:py-3">
                    <p className="text-sm font-semibold text-slate-800 lg:text-[11px] xl:text-xs 2xl:text-sm">{formatDate(entry.date)}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400 lg:text-[9px] xl:text-[10px] 2xl:text-xs">{entry.voucherNumber || '-'}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 lg:px-3 lg:py-2 lg:text-[11px] xl:px-4 xl:text-xs 2xl:px-5 2xl:py-3 2xl:text-sm">{entry.label || entry.type || '-'}</td>
                  <td className="px-5 py-3 text-sm text-slate-700 lg:px-3 lg:py-2 lg:text-[11px] xl:px-4 xl:text-xs 2xl:px-5 2xl:py-3 2xl:text-sm">{entry.partyName || '-'}</td>
                  <td className={`px-5 py-3 text-right text-sm font-black lg:px-3 lg:py-2 lg:text-[11px] xl:px-4 xl:text-xs 2xl:px-5 2xl:py-3 2xl:text-sm ${direction === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(direction === 'in' ? entry.inAmount : entry.outAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500 lg:px-4 lg:py-8 lg:text-xs xl:py-10 xl:text-[13px] 2xl:px-6 2xl:py-12 2xl:text-sm">No cash {direction === 'in' ? 'in' : 'out'} entries found</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-[95%] px-4 py-6 lg:py-4 xl:py-5 2xl:py-6">
        {error ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-lg">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700" aria-label="Dismiss error">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl lg:mb-4 xl:mb-5 2xl:mb-6">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white lg:flex-row lg:items-center lg:justify-between lg:px-4 lg:py-4 xl:px-5 xl:py-5 2xl:px-6 2xl:py-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200 lg:text-[10px] lg:tracking-[0.12em] xl:text-[11px] xl:tracking-[0.14em] 2xl:text-xs 2xl:tracking-[0.18em]">Actual Cashflow</p>
              <h1 className="mt-1 text-2xl font-black lg:text-lg xl:text-xl 2xl:text-2xl">Sales, Purchase And Cashflow Dashboard</h1>
              <p className="mt-1 text-sm text-slate-300 lg:text-xs xl:text-[13px] 2xl:text-sm">Partial sales use paid amount as actual money received.</p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={applyToday} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs">Today</button>
                <button type="button" onClick={applyThisMonth} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs">This Month</button>
                <button type="button" onClick={clearRange} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/15 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs">All</button>
                <button type="button" onClick={() => loadDashboard()} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs">
                  <RefreshCw className="h-3.5 w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5" />
                  Refresh
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-300 lg:h-3.5 lg:w-3.5 xl:h-4 xl:w-4" />
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white outline-none [color-scheme:dark] lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs" />
                <span className="text-xs font-semibold text-slate-300 lg:text-[10px] xl:text-[11px] 2xl:text-xs">to</span>
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white outline-none [color-scheme:dark] lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs" />
                <button type="button" onClick={() => loadDashboard()} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 lg:px-2.5 lg:py-1.5 lg:text-[10px] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:py-2 2xl:text-xs">Apply</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-500">Loading cashflow dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:mb-5 lg:gap-3 xl:mb-6 xl:gap-3 2xl:mb-8 2xl:gap-4">
              <StatCard title="Actual Money Received" value={formatCurrency(summary.actualReceived)} subtitle="sale paid amount + receipts + purchase returns" icon={ArrowDownCircle} tone="from-emerald-500 to-teal-500" valueClassName="text-emerald-700" />
              <StatCard title="Actual Money Paid" value={formatCurrency(summary.actualPaid)} subtitle="purchase paid amount + payments + expenses" icon={ArrowUpCircle} tone="from-rose-500 to-pink-500" valueClassName="text-rose-700" />
              <StatCard title="Net Cashflow" value={formatCurrency(netCashflow)} subtitle="received minus paid" icon={netCashflow >= 0 ? TrendingUp : TrendingDown} tone={netCashflow >= 0 ? 'from-blue-500 to-cyan-500' : 'from-amber-500 to-orange-500'} valueClassName={netCashflow >= 0 ? 'text-blue-700' : 'text-amber-700'} />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 lg:mb-5 lg:gap-3 xl:mb-6 xl:gap-3 2xl:mb-8 2xl:gap-4">
              <StatCard title="Sales" value={formatCurrency(summary.sales)} subtitle={`paid now: ${formatCurrency(summary.salePaid)}`} icon={ShoppingCart} tone="from-violet-500 to-purple-500" />
              <StatCard title="Purchases" value={formatCurrency(summary.purchases)} subtitle={`paid now: ${formatCurrency(summary.purchasePaid)}`} icon={Package} tone="from-sky-500 to-cyan-500" />
              <StatCard title="Receivable" value={formatCurrency(summary.receivable)} subtitle="pending from sales in this range" icon={IndianRupee} tone="from-emerald-500 to-green-500" />
              <StatCard title="Payable" value={formatCurrency(summary.payable)} subtitle="pending from purchases in this range" icon={Banknote} tone="from-rose-500 to-red-500" />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 lg:mb-5 lg:gap-3 xl:mb-6 xl:gap-3 2xl:mb-8 2xl:gap-4">
              <StatCard title="Receipts" value={formatCurrency(summary.receipts)} subtitle="money received later" icon={ArrowDownCircle} tone="from-emerald-500 to-teal-500" />
              <StatCard title="Payments" value={formatCurrency(summary.payments)} subtitle="money paid later" icon={ArrowUpCircle} tone="from-rose-500 to-pink-500" />
              <StatCard title="Expenses" value={formatCurrency(summary.expenses)} subtitle="expense cash out" icon={Banknote} tone="from-fuchsia-500 to-purple-500" />
              <StatCard title="Returns" value={`${formatCurrency(summary.purchaseReturns)} / ${formatCurrency(summary.saleReturns)}`} subtitle="purchase return in / sale return out" icon={RefreshCw} tone="from-amber-500 to-orange-500" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {renderFlowTable(cashInRows, 'in')}
              {renderFlowTable(cashOutRows, 'out')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
