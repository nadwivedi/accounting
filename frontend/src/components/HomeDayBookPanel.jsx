import { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Banknote, BookText, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/api';
import HomePaymentReportPanel from './HomePaymentReportPanel';
import HomePartyLedgerPanel from './HomePartyLedgerPanel';
import HomePurchaseReportPanel from './HomePurchaseReportPanel';
import HomeExpenseReportPanel from './HomeExpenseReportPanel';
import HomeReceiptReportPanel from './HomeReceiptReportPanel';
import HomeSalesLedgerPanel from './HomeSalesLedgerPanel';
import HomeStockLedgerPanel from './HomeStockLedgerPanel';

const DEFAULT_SUMMARY = {
  entryCount: 0,
  totalInward: 0,
  totalOutward: 0,
  sales: 0,
  purchases: 0,
  receipts: 0,
  payments: 0,
  expenses: 0
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
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildSummary = (entries) => entries.reduce((acc, entry) => {
  const amount = Number(entry.amount || 0);
  const inward = Number(entry.inAmount || 0);
  const outward = Number(entry.outAmount || 0);

  acc.entryCount += 1;
  acc.totalInward += inward;
  acc.totalOutward += outward;

  if (entry.type === 'sale' || entry.type === 'cash sale' || entry.type === 'credit sale') acc.sales += amount;
  if (entry.type === 'purchase' || entry.type === 'cash purchase' || entry.type === 'credit purchase') acc.purchases += amount;
  if (entry.type === 'receipt') acc.receipts += amount;
  if (entry.type === 'payment') acc.payments += amount;
  if (entry.type === 'expense') acc.expenses += amount;

  return acc;
}, { ...DEFAULT_SUMMARY });

const TYPE_BADGE_STYLES = {
  sale: 'bg-amber-100 text-amber-700',
  'cash sale': 'bg-emerald-100 text-emerald-700',
  'credit sale': 'bg-blue-100 text-blue-700',
  payment: 'bg-rose-100 text-rose-700',
  receipt: 'bg-sky-100 text-sky-700',
  purchase: 'bg-orange-100 text-orange-700',
  'cash purchase': 'bg-violet-100 text-violet-700',
  'credit purchase': 'bg-indigo-100 text-indigo-700',
  expense: 'bg-fuchsia-100 text-fuchsia-700',
  saleDiscount: 'bg-violet-100 text-violet-700',
  purchaseDiscount: 'bg-emerald-100 text-emerald-700'
};

const DATE_FILTER_OPTIONS = [
  { value: '1day', label: '1 Day' },
  { value: '7day', label: '7 Day' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Month' },
  { value: '6month', label: '6 Month' },
  { value: '1year', label: '1 Year' },
  { value: 'monthwise', label: 'Monthwise' },
  { value: 'yearwise', label: 'Yearwise' }
];

const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDateByDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const shiftDateByMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const getRangeLabel = (selectedRange) => DATE_FILTER_OPTIONS.find((option) => option.value === selectedRange)?.label || '1 Day';

const getRecordedDateValue = (entry) => entry?.date || entry?.entryCreatedAt || '';

const resolveDateRange = (selectedRange) => {
  const today = new Date();
  const endDate = formatInputDate(today);
  let startDate = endDate;

  switch (selectedRange) {
    case '7day':
      startDate = formatInputDate(shiftDateByDays(today, -6));
      break;
    case '1month':
      startDate = formatInputDate(shiftDateByMonths(today, -1));
      break;
    case '3month':
      startDate = formatInputDate(shiftDateByMonths(today, -3));
      break;
    case '6month':
      startDate = formatInputDate(shiftDateByMonths(today, -6));
      break;
    case '1year':
      startDate = formatInputDate(shiftDateByMonths(today, -12));
      break;
    case 'monthwise':
      startDate = formatInputDate(new Date(today.getFullYear(), today.getMonth(), 1));
      break;
    case 'yearwise':
      startDate = formatInputDate(new Date(today.getFullYear(), 0, 1));
      break;
    case '1day':
    default:
      startDate = endDate;
      break;
  }

  return {
    key: selectedRange,
    label: getRangeLabel(selectedRange),
    fromDate: startDate,
    toDate: endDate
  };
};

function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-2.5 shadow-[0_16px_30px_rgba(15,23,42,0.08)] sm:px-4 sm:py-3 lg:px-2.5 lg:py-2.5 xl:px-3 xl:py-2.5 2xl:px-4 2xl:py-3">
      <div className="flex items-center justify-between gap-3 lg:gap-2 xl:gap-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px] sm:tracking-[0.18em] lg:text-[8px] lg:tracking-[0.1em] xl:text-[9px] xl:tracking-[0.12em] 2xl:text-[10px]">
            {title}
          </p>
          <p className="mt-1 truncate text-sm font-black text-slate-800 sm:text-lg lg:text-[13px] xl:text-[15px] 2xl:text-lg">{value}</p>
        </div>
        <div className={`rounded-lg bg-gradient-to-br p-1.5 text-white sm:rounded-xl sm:p-2 lg:p-1.5 xl:p-1.5 2xl:p-2 ${tone}`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4" />
        </div>
      </div>
    </div>
  );
}

export default function HomeDayBookPanel() {
  const [activeView, setActiveView] = useState('daybook');
  const [selectedRange, setSelectedRange] = useState('1day');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dateRange = useMemo(() => resolveDateRange(selectedRange), [selectedRange]);

  useEffect(() => {
    const loadDayBook = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/reports/day-book', {
          params: {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate
          }
        });
        setEntries(response?.data?.entries || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load day book');
      } finally {
        setLoading(false);
      }
    };

    loadDayBook();
  }, [dateRange.fromDate, dateRange.toDate]);

  const sortedEntries = useMemo(() => (
    [...entries].sort((a, b) => {
      const aDate = new Date(getRecordedDateValue(a)).getTime() || 0;
      const bDate = new Date(getRecordedDateValue(b)).getTime() || 0;
      if (bDate !== aDate) return bDate - aDate;

      const aCreated = new Date(a.entryCreatedAt || a.date).getTime() || 0;
      const bCreated = new Date(b.entryCreatedAt || b.date).getTime() || 0;
      return bCreated - aCreated;
    })
  ), [entries]);

  const summary = useMemo(() => buildSummary(sortedEntries), [sortedEntries]);
  const recentEntries = sortedEntries.slice(0, 8);
  const showDateFilter = activeView !== 'party-ledger' && activeView !== 'stock-ledger';

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">


      <div className="space-y-5 p-5 sm:p-6 lg:p-5 xl:p-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}



        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-2 xl:gap-3">
          <StatCard title="Sales" value={formatCurrency(summary.sales)} icon={TrendingUp} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Purchases" value={formatCurrency(summary.purchases)} icon={Package} tone="from-rose-500 to-pink-500" />
          <StatCard title="Receipts" value={formatCurrency(summary.receipts)} icon={ArrowDownCircle} tone="from-sky-500 to-cyan-500" />
          <StatCard title="Payments" value={formatCurrency(summary.payments)} icon={ArrowUpCircle} tone="from-amber-500 to-orange-500" />
          <StatCard title="Expenses" value={formatCurrency(summary.expenses)} icon={Banknote} tone="from-fuchsia-500 to-violet-500" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Loading day book...</div>
          ) : recentEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px]">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Ref</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">In</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentEntries.map((entry, index) => {
                    const typeBadgeClass = TYPE_BADGE_STYLES[entry.type] || 'bg-slate-100 text-slate-700';

                    return (
                      <tr key={`${entry.refId || entry.voucherNumber || entry.type}-${index}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{formatDate(getRecordedDateValue(entry))}</p>
                            <p className="text-xs text-slate-500">Recorded Date</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${typeBadgeClass}`}>
                            {entry.label || entry.displayType || entry.type || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{entry.voucherNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{entry.partyName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{entry.method || '-'}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                          {Number(entry.amount || 0) > 0 ? formatCurrency(entry.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                          {Number(entry.inAmount || 0) > 0 ? formatCurrency(entry.inAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-rose-600">
                          {Number(entry.outAmount || 0) > 0 ? formatCurrency(entry.outAmount) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <BookText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">No day book entries for today</p>
              <p className="mt-1 text-sm text-slate-500">New vouchers created today will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
