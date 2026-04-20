import { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Banknote, BookText, Package, TrendingUp } from 'lucide-react';
import apiClient from '../utils/api';

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** DD-MM-YYYY banner heading */
const formatDateBanner = (isoKey) => {
  const [yyyy, mm, dd] = isoKey.split('-');
  return `${dd}-${mm}-${yyyy}`;
};

/** Canonical YYYY-MM-DD key for grouping */
const getDateKey = (entry) => {
  const raw = entry?.date || entry?.entryCreatedAt || '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '0000-00-00';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd2 = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd2}`;
};

const buildSummary = (entries) =>
  entries.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount || 0);
      acc.entryCount += 1;
      acc.totalInward += Number(entry.inAmount || 0);
      acc.totalOutward += Number(entry.outAmount || 0);
      if (['sale', 'cash sale', 'credit sale', 'cash', 'partial', 'credit'].includes(entry.type))
        acc.sales += amount;
      if (['purchase', 'cash purchase', 'credit purchase'].includes(entry.type))
        acc.purchases += amount;
      if (entry.type === 'receipt') acc.receipts += amount;
      if (entry.type === 'payment') acc.payments += amount;
      if (entry.type === 'expense') acc.expenses += amount;
      return acc;
    },
    { entryCount: 0, totalInward: 0, totalOutward: 0, sales: 0, purchases: 0, receipts: 0, payments: 0, expenses: 0 }
  );

const TYPE_BADGE = {
  sale: 'bg-amber-100 text-amber-700',
  'cash sale': 'bg-emerald-100 text-emerald-700',
  'credit sale': 'bg-blue-100 text-blue-700',
  cash: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  credit: 'bg-blue-100 text-blue-700',
  payment: 'bg-rose-100 text-rose-700',
  receipt: 'bg-sky-100 text-sky-700',
  purchase: 'bg-orange-100 text-orange-700',
  'cash purchase': 'bg-violet-100 text-violet-700',
  'credit purchase': 'bg-indigo-100 text-indigo-700',
  expense: 'bg-fuchsia-100 text-fuchsia-700',
  saleDiscount: 'bg-violet-100 text-violet-700',
  purchaseDiscount: 'bg-emerald-100 text-emerald-700',
  purchaseReturn: 'bg-teal-100 text-teal-700',
  saleReturn: 'bg-red-100 text-red-700',
};

/* ──────────────────────────────────────────────
   StatCard
────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-2.5 shadow-[0_16px_30px_rgba(15,23,42,0.08)] sm:px-4 sm:py-3 lg:px-2.5 lg:py-2.5 xl:px-3 xl:py-2.5 2xl:px-4 2xl:py-3">
      <div className="flex items-center justify-between gap-3 lg:gap-2 xl:gap-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px] lg:text-[8px] xl:text-[9px] 2xl:text-[10px]">
            {title}
          </p>
          <p className="mt-1 truncate text-sm font-black text-slate-800 sm:text-lg lg:text-[13px] xl:text-[15px] 2xl:text-lg">
            {value}
          </p>
        </div>
        <div className={`rounded-lg bg-gradient-to-br p-1.5 text-white sm:rounded-xl sm:p-2 lg:p-1.5 2xl:p-2 ${tone}`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   DayTable — one complete mini-table per date
   (same style as VahanDashboard expiry table)
────────────────────────────────────────────── */
function DayTable({ dateKey, entries }) {
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Date banner */}
      <div className="flex items-center gap-2 bg-gray-800 px-3 py-2">
        <span className="text-sm font-bold text-white">
          📅 {formatDateBanner(dateKey)}
        </span>
        <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-gray-300">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Table — header + rows */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">Type</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">Ref #</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">Party</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">Method</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600">Amount</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600">In</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600">Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry, idx) => {
              const badge = TYPE_BADGE[entry.type] || 'bg-gray-100 text-gray-700';
              return (
                <tr
                  key={`${entry.refId || entry.voucherNumber || entry.type}-${idx}`}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize ${badge}`}>
                      {entry.label || entry.displayType || entry.type || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-gray-800">
                    {entry.voucherNumber || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-800">{entry.partyName || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-800">{entry.method || '-'}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-gray-800">
                    {Number(entry.amount || 0) > 0 ? formatCurrency(entry.amount) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-emerald-600">
                    {Number(entry.inAmount || 0) > 0 ? formatCurrency(entry.inAmount) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-red-600">
                    {Number(entry.outAmount || 0) > 0 ? formatCurrency(entry.outAmount) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main panel
────────────────────────────────────────────── */
export default function HomeDayBookPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDayBook = async () => {
      try {
        setLoading(true);
        // No date params → backend returns ALL records (withDateFilters skips when both absent)
        const response = await apiClient.get('/reports/day-book');
        setEntries(response?.data?.entries || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load day book');
      } finally {
        setLoading(false);
      }
    };
    loadDayBook();
  }, []);

  /** Sort newest date first, then newest creation time within same date */
  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const aDate = new Date(a.date || a.entryCreatedAt).getTime() || 0;
        const bDate = new Date(b.date || b.entryCreatedAt).getTime() || 0;
        if (bDate !== aDate) return bDate - aDate;
        const aCreated = new Date(a.entryCreatedAt || a.date).getTime() || 0;
        const bCreated = new Date(b.entryCreatedAt || b.date).getTime() || 0;
        return bCreated - aCreated;
      }),
    [entries]
  );

  /** Map of dateKey → entries[], preserving newest-first order */
  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const entry of sortedEntries) {
      const key = getDateKey(entry);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    }
    return map;
  }, [sortedEntries]);

  const summary = useMemo(() => buildSummary(sortedEntries), [sortedEntries]);

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <div className="space-y-5 p-5 sm:p-6 lg:p-5 xl:p-6">

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-2 xl:gap-3">
          <StatCard title="Sales" value={formatCurrency(summary.sales)} icon={TrendingUp} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Purchases" value={formatCurrency(summary.purchases)} icon={Package} tone="from-rose-500 to-pink-500" />
          <StatCard title="Receipts" value={formatCurrency(summary.receipts)} icon={ArrowDownCircle} tone="from-sky-500 to-cyan-500" />
          <StatCard title="Payments" value={formatCurrency(summary.payments)} icon={ArrowUpCircle} tone="from-amber-500 to-orange-500" />
          <StatCard title="Expenses" value={formatCurrency(summary.expenses)} icon={Banknote} tone="from-fuchsia-500 to-violet-500" />
        </div>

        {/* Date-grouped tables */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : groupedByDate.size > 0 ? (
          <div>
            {[...groupedByDate.entries()].map(([dateKey, dayEntries]) => (
              <DayTable key={dateKey} dateKey={dateKey} entries={dayEntries} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white px-4 py-14 text-center">
            <div className="rounded-full bg-gray-100 p-4">
              <BookText className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mt-4 text-base font-semibold text-gray-700">No day book entries found</p>
            <p className="mt-1 text-sm text-gray-500">New vouchers will appear here automatically.</p>
          </div>
        )}
      </div>
    </section>
  );
}
