import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookText, CalendarRange, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../utils/api';

const getTodayInput = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_SUMMARY = {
  entryCount: 0,
  totalInward: 0,
  totalOutward: 0,
  sales: 0,
  purchases: 0,
  receipts: 0,
  payments: 0,
  expenses: 0,
  purchaseReturns: 0,
  saleReturns: 0
};

const formatCurrency = (value) => (
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TYPE_BADGE_CLASS = {
  sale: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  purchase: 'border-rose-200 bg-rose-50 text-rose-700',
  receipt: 'border-sky-200 bg-sky-50 text-sky-700',
  payment: 'border-amber-200 bg-amber-50 text-amber-700',
  expense: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  purchaseReturn: 'border-teal-200 bg-teal-50 text-teal-700',
  saleReturn: 'border-orange-200 bg-orange-50 text-orange-700'
};

function SummaryCard({ label, value, hint, tone }) {
  const toneClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900'
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone] || toneClasses.slate}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

export default function DayBookReport() {
  const today = useMemo(() => getTodayInput(), []);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [report, setReport] = useState({ summary: DEFAULT_SUMMARY, entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const entries = report?.entries || [];
  const summary = report?.summary || DEFAULT_SUMMARY;

  const loadReport = async (nextFromDate = fromDate, nextToDate = toDate) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/day-book', {
        params: {
          fromDate: nextFromDate || undefined,
          toDate: nextToDate || undefined
        }
      });
      setReport(response.data || { summary: DEFAULT_SUMMARY, entries: [] });
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading day book report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(today, today);
  }, [today]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadReport();
  };

  const handleToday = () => {
    setFromDate(today);
    setToDate(today);
    loadReport(today, today);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.05),transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(37,99,235,0.9))] px-5 py-6 text-white md:px-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <BookText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">Reports</p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Day Book Report</h1>
                  <p className="mt-2 max-w-2xl text-sm text-white/75">
                    Sales, purchases, receipts, payments, expenses, and return vouchers in one day-wise register.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => loadReport()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>

                <Link
                  to="/reports"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back To Reports
                </Link>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 md:px-7 md:py-6">
            <form onSubmit={handleSubmit} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">Date Filters</p>
                    <p className="text-xs text-slate-500">Choose the period you want to see in the day book.</p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">From Date</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(event) => setFromDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">To Date</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(event) => setToDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Loading...' : 'Load Day Book'}
                  </button>

                  <button
                    type="button"
                    onClick={handleToday}
                    disabled={loading}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Today
                  </button>
                </div>
              </div>
            </form>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <SummaryCard label="Entries" value={summary.entryCount} hint="Voucher rows loaded" tone="slate" />
              <SummaryCard label="Total Inward" value={formatCurrency(summary.totalInward)} hint="Sales, receipts, purchase returns" tone="emerald" />
              <SummaryCard label="Total Outward" value={formatCurrency(summary.totalOutward)} hint="Purchases, payments, expenses, sale returns" tone="rose" />
              <SummaryCard label="Sales" value={formatCurrency(summary.sales)} hint={`Receipts ${formatCurrency(summary.receipts)}`} tone="sky" />
              <SummaryCard label="Purchases" value={formatCurrency(summary.purchases)} hint={`Payments ${formatCurrency(summary.payments)}`} tone="amber" />
              <SummaryCard label="Expenses" value={formatCurrency(summary.expenses)} hint={`Returns In ${formatCurrency(summary.purchaseReturns)} | Out ${formatCurrency(summary.saleReturns)}`} tone="violet" />
            </div>

            <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="text-lg font-black tracking-tight text-slate-900">Day Book Entries</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Every sale, purchase, payment, receipt, expense, sale return, and purchase return for the selected dates.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead className="bg-slate-900 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Voucher</th>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Party</th>
                      <th className="px-4 py-3">Head</th>
                      <th className="px-4 py-3">Particulars</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">In</th>
                      <th className="px-4 py-3 text-right">Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {!loading && entries.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-14 text-center">
                          <p className="text-base font-semibold text-slate-700">No day-book entries found.</p>
                          <p className="mt-1 text-sm text-slate-500">Try another date or create vouchers for the selected day.</p>
                        </td>
                      </tr>
                    ) : null}

                    {entries.map((entry, index) => (
                      <tr key={`${entry.refId || entry.voucherNumber || entry.type}-${index}`} className="align-top transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatTime(entry.entryCreatedAt || entry.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${TYPE_BADGE_CLASS[entry.type] || TYPE_BADGE_CLASS.sale}`}>
                            {entry.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{entry.voucherNumber || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{entry.partyName || '-'}</div>
                          {entry.quantity ? <div className="mt-1 text-xs text-slate-500">Qty {entry.quantity}</div> : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{entry.accountName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[24rem] text-slate-700">{entry.particulars || entry.note || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{entry.method || '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          {Number(entry.inAmount || 0) > 0 ? formatCurrency(entry.inAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-rose-700">
                          {Number(entry.outAmount || 0) > 0 ? formatCurrency(entry.outAmount) : '-'}
                        </td>
                      </tr>
                    ))}

                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-14 text-center text-sm font-medium text-slate-500">
                          Loading day book entries...
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
