import { useEffect, useMemo, useState } from 'react';
import { BookText, CalendarRange, RefreshCw, Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown, ArrowRightLeft, Receipt, CreditCard, Banknote, Package } from 'lucide-react';
import apiClient from '../utils/api';

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

const ENTRY_TYPE_META = {
  sale: {
    label: 'Sale',
    icon: TrendingUp,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accent: 'from-emerald-500 to-teal-500',
    amountTone: 'text-emerald-700',
    surface: 'from-emerald-50 to-teal-50',
    bgGradient: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
  },
  purchase: {
    label: 'Purchase',
    icon: TrendingDown,
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
    accent: 'from-rose-500 to-pink-500',
    amountTone: 'text-rose-700',
    surface: 'from-rose-50 to-pink-50',
    bgGradient: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50'
  },
  receipt: {
    label: 'Receipt',
    icon: ArrowRightLeft,
    tone: 'border-sky-200 bg-sky-50 text-sky-700',
    accent: 'from-sky-500 to-cyan-500',
    amountTone: 'text-sky-700',
    surface: 'from-sky-50 to-cyan-50',
    bgGradient: 'bg-gradient-to-br from-sky-50 via-cyan-50 to-sky-50'
  },
  payment: {
    label: 'Payment',
    icon: CreditCard,
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'from-amber-500 to-orange-500',
    amountTone: 'text-amber-700',
    surface: 'from-amber-50 to-orange-50',
    bgGradient: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50'
  },
  expense: {
    label: 'Expense',
    icon: Banknote,
    tone: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    accent: 'from-fuchsia-500 to-pink-500',
    amountTone: 'text-fuchsia-700',
    surface: 'from-fuchsia-50 to-pink-50',
    bgGradient: 'bg-gradient-to-br from-fuchsia-50 via-pink-50 to-fuchsia-50'
  },
  purchaseReturn: {
    label: 'Purchase Return',
    icon: Package,
    tone: 'border-teal-200 bg-teal-50 text-teal-700',
    accent: 'from-teal-500 to-cyan-500',
    amountTone: 'text-teal-700',
    surface: 'from-teal-50 to-cyan-50',
    bgGradient: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50'
  },
  saleReturn: {
    label: 'Sale Return',
    icon: Receipt,
    tone: 'border-orange-200 bg-orange-50 text-orange-700',
    accent: 'from-orange-500 to-amber-500',
    amountTone: 'text-orange-700',
    surface: 'from-orange-50 to-amber-50',
    bgGradient: 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50'
  }
};

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'sale', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'receipt', label: 'Receipts' },
  { value: 'payment', label: 'Payments' },
  { value: 'expense', label: 'Expenses' },
  { value: 'purchaseReturn', label: 'P. Returns' },
  { value: 'saleReturn', label: 'S. Returns' }
];

const getTodayInput = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toInputDate = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) => (
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

const formatDate = (value, options = {}) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
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

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return toInputDate(date);
};

const buildSummary = (entries) => entries.reduce((acc, entry) => {
  const amount = Number(entry.amount || 0);
  const inward = Number(entry.inAmount || 0);
  const outward = Number(entry.outAmount || 0);

  acc.entryCount += 1;
  acc.totalInward += inward;
  acc.totalOutward += outward;

  if (entry.type === 'sale') acc.sales += amount;
  if (entry.type === 'purchase') acc.purchases += amount;
  if (entry.type === 'receipt') acc.receipts += amount;
  if (entry.type === 'payment') acc.payments += amount;
  if (entry.type === 'expense') acc.expenses += amount;
  if (entry.type === 'purchaseReturn') acc.purchaseReturns += amount;
  if (entry.type === 'saleReturn') acc.saleReturns += amount;

  return acc;
}, { ...DEFAULT_SUMMARY });

function MetricCard({ title, value, subtitle, accentClass, valueClass = 'text-slate-900', icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-slate-300/60">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accentClass} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          {Icon && <div className={`p-2 rounded-xl bg-gradient-to-br ${accentClass}`}><Icon className="w-4 h-4 text-white" /></div>}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        </div>
        <p className={`text-2xl font-black tracking-tight ${valueClass}`}>{value}</p>
        {subtitle && <p className="mt-1.5 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function DayGroupCard({ group, expanded, onToggle }) {
  const netAmount = group.inward - group.outward;
  const isPositive = netAmount >= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <CalendarRange className="w-6 h-6 text-white/80" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black tracking-tight">{group.dateLabel}</h3>
            <p className="text-xs font-medium text-white/60">{group.entries.length} entries</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-6">
          <div className="text-center px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Inward</p>
            <p className="text-sm font-black text-emerald-200">{formatCurrency(group.inward)}</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Outward</p>
            <p className="text-sm font-black text-rose-200">{formatCurrency(group.outward)}</p>
          </div>
          <div className={`text-center px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm min-w-[120px]`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Net</p>
            <p className={`text-sm font-black ${isPositive ? 'text-teal-300' : 'text-orange-300'}`}>
              {formatCurrency(netAmount)}
            </p>
          </div>
          <div className={`p-2 rounded-lg transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-white/60" />
          </div>
        </div>
        
        <div className="lg:hidden flex items-center gap-3">
          <div className={`text-right px-3 py-1.5 rounded-lg ${isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            <p className={`text-sm font-bold ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatCurrency(netAmount)}
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-white/60 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-200">
          {group.entries.map((entry, index) => {
            const meta = ENTRY_TYPE_META[entry.type] || ENTRY_TYPE_META.sale;
            const TypeIcon = meta.icon;
            const isInward = Number(entry.inAmount || 0) > 0;
            const amount = isInward ? Number(entry.inAmount || 0) : Number(entry.outAmount || 0);

            return (
              <article
                key={`${entry.refId || entry.voucherNumber || entry.type}-${index}`}
                className="grid grid-cols-1 lg:grid-cols-[180px_1fr_200px] gap-4 px-6 py-5 hover:bg-slate-50/80 transition-colors duration-200"
              >
                <div className="flex lg:flex-col items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${meta.tone}`}>
                      <TypeIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                  
                  <div className="flex lg:flex-col gap-3 lg:gap-1">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Time</p>
                      <p className="text-sm font-semibold text-slate-800">{formatTime(entry.entryCreatedAt || entry.date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Voucher</p>
                      <p className="text-sm font-semibold text-slate-800">{entry.voucherNumber || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className={`rounded-2xl border border-slate-200/60 ${meta.bgGradient} px-5 py-4`}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-lg font-black tracking-tight text-slate-900">{entry.partyName || 'No party'}</p>
                        <p className="mt-1 text-sm font-medium text-slate-600">{entry.accountName || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.quantity && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                            <Package className="w-3 h-3" />
                            Qty: {entry.quantity}
                          </span>
                        )}
                        {entry.method && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                            {entry.method}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.particulars && (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {entry.particulars}
                      </span>
                    )}
                    {entry.note && entry.note !== entry.particulars && (
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                        Note: {entry.note}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start lg:justify-end">
                  <div className={`w-full max-w-[200px] rounded-2xl border ${isInward ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'} p-4`}>
                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${meta.accent}`} />
                    <p className={`mt-3 text-[11px] font-bold uppercase tracking-wider ${isInward ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isInward ? '↓ Money In' : '↑ Money Out'}
                    </p>
                    <p className={`mt-1.5 text-2xl font-black tracking-tight ${meta.amountTone}`}>
                      {formatCurrency(amount)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DayBook() {
  const today = useMemo(() => getTodayInput(), []);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [dayBook, setDayBook] = useState({ summary: DEFAULT_SUMMARY, entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

  const entries = dayBook?.entries || [];

  const loadDayBook = async (nextFromDate = fromDate, nextToDate = toDate) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/day-book', {
        params: {
          fromDate: nextFromDate || undefined,
          toDate: nextToDate || undefined
        }
      });

      setDayBook(response.data || { summary: DEFAULT_SUMMARY, entries: [] });
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading day book');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDayBook(today, today);
  }, [today]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = String(search || '').trim().toLowerCase();

    return [...entries]
      .filter((entry) => typeFilter === 'all' || entry.type === typeFilter)
      .filter((entry) => {
        if (!normalizedSearch) return true;

        const haystack = [
          entry.label,
          entry.voucherNumber,
          entry.partyName,
          entry.accountName,
          entry.particulars,
          entry.note,
          entry.method
        ].join(' ').toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const aTime = new Date(a.entryCreatedAt || a.date).getTime() || 0;
        const bTime = new Date(b.entryCreatedAt || b.date).getTime() || 0;
        return bTime - aTime;
      });
  }, [entries, search, typeFilter]);

  const visibleSummary = useMemo(() => buildSummary(filteredEntries), [filteredEntries]);

  const groupedEntries = useMemo(() => {
    const groups = filteredEntries.reduce((acc, entry) => {
      const key = getDateKey(entry.date);
      if (!acc[key]) {
        acc[key] = {
          key,
          dateLabel: formatDate(entry.date),
          entries: [],
          inward: 0,
          outward: 0
        };
      }

      acc[key].entries.push(entry);
      acc[key].inward += Number(entry.inAmount || 0);
      acc[key].outward += Number(entry.outAmount || 0);
      return acc;
    }, {});

    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredEntries]);

  const typeCounts = useMemo(() => filteredEntries.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {}), [filteredEntries]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadDayBook();
  };

  const applyRangeAndLoad = (nextFromDate, nextToDate) => {
    setFromDate(nextFromDate);
    setToDate(nextToDate);
    loadDayBook(nextFromDate, nextToDate);
  };

  const handleToday = () => applyRangeAndLoad(today, today);
  const handleLast7Days = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    applyRangeAndLoad(toInputDate(startDate), today);
  };
  const handleThisMonth = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    applyRangeAndLoad(toInputDate(startDate), today);
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <MetricCard
              title="Sales"
              value={formatCurrency(visibleSummary.sales)}
              subtitle="Total sales amount"
              accentClass="from-emerald-600 to-green-600"
              valueClass="text-emerald-700"
              icon={TrendingUp}
            />
            <MetricCard
              title="Purchases"
              value={formatCurrency(visibleSummary.purchases)}
              subtitle="Total purchase amount"
              accentClass="from-rose-600 to-pink-600"
              valueClass="text-rose-700"
              icon={Package}
            />
            <MetricCard
              title="Receipt"
              value={formatCurrency(visibleSummary.receipts)}
              subtitle="Money received"
              accentClass="from-sky-500 to-cyan-500"
              valueClass="text-sky-700"
              icon={Receipt}
            />
            <MetricCard
              title="Payment"
              value={formatCurrency(visibleSummary.payments)}
              subtitle="Money paid out"
              accentClass="from-amber-500 to-orange-500"
              valueClass="text-amber-700"
              icon={CreditCard}
            />
            <MetricCard
              title="Expenses"
              value={formatCurrency(visibleSummary.expenses)}
              subtitle="Expense vouchers"
              accentClass="from-fuchsia-500 to-pink-500"
              valueClass="text-fuchsia-700"
              icon={Banknote}
            />
          </div>

          <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <CalendarRange className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-white">Date Selection</p>
                  <p className="text-xs text-white/60">Select date range</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 px-5 py-5">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Loading...' : 'Load Report'}
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={handleToday} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Today</button>
                <button type="button" onClick={handleLast7Days} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">7 Days</button>
                <button type="button" onClick={handleThisMonth} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">This Month</button>
              </div>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px,1fr] gap-6">
          <aside className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
                <p className="text-sm font-bold tracking-tight text-slate-900">Search & Filter</p>
                <p className="mt-1 text-xs text-slate-500">Find entries</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search entries..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {TYPE_FILTERS.map((filter) => {
                    const isActive = typeFilter === filter.value;
                    const count = filter.value === 'all' ? visibleSummary.entryCount : (typeCounts[filter.value] || 0);

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setTypeFilter(filter.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {filter.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
                <p className="text-sm font-bold tracking-tight text-slate-900">Quick Stats</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Sales</span>
                  </div>
                  <span className="text-sm font-black text-emerald-700">{formatCurrency(visibleSummary.sales)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-semibold text-rose-700">Purchases</span>
                  </div>
                  <span className="text-sm font-black text-rose-700">{formatCurrency(visibleSummary.purchases)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-sky-600" />
                    <span className="text-xs font-semibold text-sky-700">Receipts</span>
                  </div>
                  <span className="text-sm font-black text-sky-700">{formatCurrency(visibleSummary.receipts)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Payments</span>
                  </div>
                  <span className="text-sm font-black text-amber-700">{formatCurrency(visibleSummary.payments)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-fuchsia-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-fuchsia-600" />
                    <span className="text-xs font-semibold text-fuchsia-700">Expenses</span>
                  </div>
                  <span className="text-sm font-black text-fuchsia-700">{formatCurrency(visibleSummary.expenses)}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-medium text-slate-500 shadow-xl">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                <p className="mt-3">Loading day book entries...</p>
              </div>
            ) : null}

            {!loading && groupedEntries.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 px-6 py-16 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <BookText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-800">No daybook entries found</p>
                <p className="mt-2 text-sm text-slate-500">Try another date range or clear filters</p>
              </div>
            ) : null}

            {!loading && groupedEntries.map((group) => (
              <DayGroupCard
                key={group.key}
                group={group}
                expanded={expandedGroups[group.key] !== false}
                onToggle={() => toggleGroup(group.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
