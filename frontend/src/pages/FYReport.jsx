import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  Package,
  ReceiptText,
  CreditCard,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '../utils/api';

const INDIAN_MONTHS = [
  { value: '', label: 'All Months' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' }
];

const FY_OPTIONS = [
  { value: '2026', label: 'FY 26-27 (2026 - 2027)' },
  { value: '2025', label: 'FY 25-26 (2025 - 2026)' },
  { value: '2024', label: 'FY 24-25 (2024 - 2025)' },
  { value: '2023', label: 'FY 23-24 (2023 - 2024)' }
];

const formatCurrency = (val) =>
  `Rs ${Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatDate = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function FYReport() {
  const getCurrentFY = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month < 4 ? String(year - 1) : String(year);
  };

  const [filterType, setFilterType] = useState('fy'); // 'fy' or 'custom'
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [voucherType, setVoucherType] = useState('all'); // 'all', 'sales', 'purchases', 'receipts', 'payments'
  const [activeTab, setActiveTab] = useState('overview');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState({
    period: {},
    summary: {
      totalSales: 0,
      totalPurchases: 0,
      totalReceipts: 0,
      totalPayments: 0,
      salesCount: 0,
      purchasesCount: 0,
      receiptsCount: 0,
      paymentsCount: 0
    },
    sales: [],
    purchases: [],
    receipts: [],
    payments: []
  });

  // Pass all filter values explicitly to avoid stale closure issues
  const fetchReport = async ({
    ft = filterType,
    fy = selectedFY,
    month = selectedMonth,
    from = fromDate,
    to = toDate,
    vt = voucherType
  } = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = { voucherType: vt };
      if (ft === 'custom') {
        if (from) params.fromDate = from;
        if (to) params.toDate = to;
      } else {
        params.fy = fy;
        if (month) params.month = month;
      }

      const response = await apiClient.get('/reports/fy-report', { params });
      if (response?.success) {
        setReportData({
          period: response.period || {},
          summary: response.summary || {},
          sales: response.sales || [],
          purchases: response.purchases || [],
          receipts: response.receipts || [],
          payments: response.payments || []
        });
        if (vt !== 'all') {
          setActiveTab(vt);
        }
      } else {
        setError('Failed to fetch report data.');
      }
    } catch (err) {
      console.error('Error fetching FY report:', err);
      setError(typeof err === 'string' ? err : (err?.message || 'Error loading report.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport({
      ft: filterType,
      fy: selectedFY,
      month: selectedMonth,
      from: fromDate,
      to: toDate,
      vt: voucherType
    });
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReport({
      ft: filterType,
      fy: selectedFY,
      month: selectedMonth,
      from: fromDate,
      to: toDate,
      vt: voucherType
    });
  };

  const getFilterLabel = () => {
    if (filterType === 'custom') {
      if (fromDate && toDate) return `Custom (${formatDate(fromDate)} to ${formatDate(toDate)})`;
      if (fromDate) return `From ${formatDate(fromDate)}`;
      if (toDate) return `Up to ${formatDate(toDate)}`;
      return 'Custom Date Range';
    }
    const fyLabel = FY_OPTIONS.find((f) => f.value === selectedFY)?.label || `FY ${selectedFY}`;
    const monthLabel = INDIAN_MONTHS.find((m) => m.value === selectedMonth)?.label || '';
    return monthLabel && monthLabel !== 'All Months' ? `${fyLabel} (${monthLabel})` : fyLabel;
  };

  const getReportTitle = () => {
    const currentView = voucherType !== 'all' ? voucherType : activeTab;
    if (currentView === 'sales') return 'Sales Report';
    if (currentView === 'purchases') return 'Purchase Report';
    if (currentView === 'receipts') return 'Money Received Report';
    if (currentView === 'payments') return 'Payments Made Report';
    return 'Financial Period Report';
  };

  const getDateRangeLabel = () => {
    if (filterType === 'custom') {
      if (fromDate && toDate) return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
      if (fromDate) return `From ${formatDate(fromDate)}`;
      if (toDate) return `Up to ${formatDate(toDate)}`;
      return 'Custom Date Range';
    }
    if (reportData.period?.startDate && reportData.period?.endDate) {
      return `${formatDate(reportData.period.startDate)} to ${formatDate(reportData.period.endDate)}`;
    }
    const startYear = parseInt(selectedFY, 10) || 2026;
    if (selectedMonth && !isNaN(parseInt(selectedMonth, 10))) {
      const m = parseInt(selectedMonth, 10);
      const year = m >= 4 ? startYear : startYear + 1;
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0);
      return `${formatDate(start)} to ${formatDate(end)}`;
    }
    return `01 Apr ${startYear} to 31 Mar ${startYear + 1}`;
  };

  // Excel Export — use Blob + anchor click (works in all browsers)
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const mainTitle = getReportTitle();
    const dateRange = getDateRangeLabel();

    const createTopHeader = (headingText) => [
      [headingText.toUpperCase()],
      [`REPORT DATE RANGE: ${dateRange}`],
      [`Filter / Period: ${getFilterLabel()}`],
      [`Generated On: ${new Date().toLocaleString('en-IN')}`],
      []
    ];

    // 1. Sales Sheet
    const salesHeader = ['Sale Date', 'Invoice No', 'Party / Customer', 'Product Name', 'Qty', 'Unit', 'Rate (Rs)', 'Sale Amount (Rs)', 'Invoice Total (Rs)', 'Paid Amount (Rs)', 'Type'];
    const salesAoa = [
      ...createTopHeader('SALES REPORT'),
      salesHeader
    ];

    if (reportData.sales.length > 0) {
      reportData.sales.forEach((s) => {
        if (Array.isArray(s.items) && s.items.length > 0) {
          s.items.forEach((item) => {
            salesAoa.push([
              formatDate(s.date),
              s.invoiceNumber,
              s.partyName,
              item.productName || 'N/A',
              item.quantity,
              item.unit || '-',
              item.unitPrice,
              item.total,
              s.totalAmount,
              s.paidAmount,
              s.type
            ]);
          });
        } else {
          salesAoa.push([
            formatDate(s.date),
            s.invoiceNumber,
            s.partyName,
            'General Sale',
            s.totalQty || 0,
            '-',
            s.totalAmount,
            s.totalAmount,
            s.totalAmount,
            s.paidAmount,
            s.type
          ]);
        }
      });
    } else {
      salesAoa.push(['-', '-', 'No sales data for selected period', '-', '-', '-', '-', '-', '-', '-', '-']);
    }
    const wsSales = XLSX.utils.aoa_to_sheet(salesAoa);

    // 2. Purchases Sheet
    const purchaseHeader = ['Purchase Date', 'Bill / Invoice No', 'Party / Vendor', 'Product Name', 'Qty', 'Unit', 'Rate (Rs)', 'Amount (Rs)', 'Bill Total (Rs)', 'Paid Amount (Rs)', 'Type'];
    const purchaseAoa = [
      ...createTopHeader('PURCHASE REPORT'),
      purchaseHeader
    ];

    if (reportData.purchases.length > 0) {
      reportData.purchases.forEach((p) => {
        if (Array.isArray(p.items) && p.items.length > 0) {
          p.items.forEach((item) => {
            purchaseAoa.push([
              formatDate(p.date),
              p.invoiceNumber,
              p.partyName,
              item.productName || 'N/A',
              item.quantity,
              item.unit || '-',
              item.unitPrice,
              item.total,
              p.totalAmount,
              p.paidAmount,
              p.type
            ]);
          });
        } else {
          purchaseAoa.push([
            formatDate(p.date),
            p.invoiceNumber,
            p.partyName,
            'General Purchase',
            p.totalQty || 0,
            '-',
            p.totalAmount,
            p.totalAmount,
            p.totalAmount,
            p.paidAmount,
            p.type
          ]);
        }
      });
    } else {
      purchaseAoa.push(['-', '-', 'No purchase data for selected period', '-', '-', '-', '-', '-', '-', '-', '-']);
    }
    const wsPurchases = XLSX.utils.aoa_to_sheet(purchaseAoa);

    // 3. Receipts Sheet
    const receiptsHeader = ['Receipt No', 'Date', 'Party Name', 'Amount (Rs)', 'Payment Method', 'Notes'];
    const receiptsAoa = [
      ...createTopHeader('MONEY RECEIVED REPORT'),
      receiptsHeader
    ];
    if (reportData.receipts.length > 0) {
      reportData.receipts.forEach((r) => {
        receiptsAoa.push([
          r.receiptNumber,
          formatDate(r.date),
          r.partyName,
          r.amount,
          r.method,
          r.notes || '-'
        ]);
      });
    } else {
      receiptsAoa.push(['-', '-', 'No money received data for selected period', '-', '-', '-']);
    }
    const wsReceipts = XLSX.utils.aoa_to_sheet(receiptsAoa);

    // 4. Payments Sheet
    const paymentsHeader = ['Payment No', 'Date', 'Party Name', 'Amount (Rs)', 'Payment Method', 'Notes'];
    const paymentsAoa = [
      ...createTopHeader('PAYMENTS MADE REPORT'),
      paymentsHeader
    ];
    if (reportData.payments.length > 0) {
      reportData.payments.forEach((p) => {
        paymentsAoa.push([
          p.paymentNumber,
          formatDate(p.date),
          p.partyName,
          p.amount,
          p.method,
          p.notes || '-'
        ]);
      });
    } else {
      paymentsAoa.push(['-', '-', 'No payment data for selected period', '-', '-', '-']);
    }
    const wsPayments = XLSX.utils.aoa_to_sheet(paymentsAoa);

    // 5. Summary Sheet
    const summaryAoa = [
      ...createTopHeader('FINANCIAL SUMMARY REPORT'),
      ['Metric', 'Amount (INR)', 'Count'],
      ['Total Sales', reportData.summary.totalSales, reportData.summary.salesCount],
      ['Total Purchases', reportData.summary.totalPurchases, reportData.summary.purchasesCount],
      ['Money Received (Receipts)', reportData.summary.totalReceipts, reportData.summary.receiptsCount],
      ['Payments Made', reportData.summary.totalPayments, reportData.summary.paymentsCount],
      ['Net Cash Flow (Receipts - Payments)', (reportData.summary.totalReceipts || 0) - (reportData.summary.totalPayments || 0), '']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);

    // Append sheets in order depending on active filter/tab
    if (voucherType === 'sales' || activeTab === 'sales') {
      XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Report');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchases');
      XLSX.utils.book_append_sheet(wb, wsReceipts, 'Money Received');
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments Made');
    } else if (voucherType === 'purchases' || activeTab === 'purchases') {
      XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchase Report');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');
      XLSX.utils.book_append_sheet(wb, wsReceipts, 'Money Received');
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments Made');
    } else {
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Report');
      XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchase Report');
      XLSX.utils.book_append_sheet(wb, wsReceipts, 'Money Received');
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments Made');
    }

    const filename = `${mainTitle.replace(/\s+/g, '_')}_${dateRange.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    const wbBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const netCashFlow = (reportData.summary.totalReceipts || 0) - (reportData.summary.totalPayments || 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#020617] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  Date Range: {getDateRangeLabel()}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {getReportTitle()}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </button>
        </div>

        {/* Filter Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
              <Filter className="h-4 w-4 text-amber-400" />
              <span>Select Filter Option</span>
            </div>

            {/* Filter mode switcher */}
            <div className="flex rounded-lg border border-white/10 bg-slate-800/80 p-1">
              <button
                type="button"
                onClick={() => setFilterType('fy')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === 'fy'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Financial Year & Month
              </button>
              <button
                type="button"
                onClick={() => setFilterType('custom')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom Date Range
              </button>
            </div>
          </div>

          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
            {filterType === 'fy' ? (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Indian Financial Year
                  </label>
                  <select
                    value={selectedFY}
                    onChange={(e) => setSelectedFY(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-sm font-medium text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  >
                    {FY_OPTIONS.map((fy) => (
                      <option key={fy.value} value={fy.value}>
                        {fy.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Month Filter
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-sm font-medium text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  >
                    {INDIAN_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-sm font-medium text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-sm font-medium text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </>
            )}

            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Transaction / Voucher Filter
              </label>
              <select
                value={voucherType}
                onChange={(e) => {
                  const vt = e.target.value;
                  setVoucherType(vt);
                  if (vt !== 'all') {
                    setActiveTab(vt);
                  }
                }}
                className="w-full rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-sm font-medium text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                <option value="all">All Transactions</option>
                <option value="sales">Sales Only</option>
                <option value="purchases">Purchases Only</option>
                <option value="receipts">Money Received Only</option>
                <option value="payments">Payments Made Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching...' : 'Apply Filter'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-300">
            {error}
          </div>
        )}

        {/* Summary KPI Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Sales */}
          <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-lg">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xl font-black text-amber-900">{formatCurrency(reportData.summary.totalSales)}</p>
            <p className="mt-1 text-xs text-amber-700/70">{reportData.summary.salesCount} Sales Invoices</p>
          </div>

          {/* Purchases */}
          <div className="rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-4 shadow-lg">
            <div className="flex items-center justify-between text-fuchsia-700">
              <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
              <Package className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xl font-black text-fuchsia-900">{formatCurrency(reportData.summary.totalPurchases)}</p>
            <p className="mt-1 text-xs text-fuchsia-700/70">{reportData.summary.purchasesCount} Purchase Bills</p>
          </div>

          {/* Money Received (Receipts) */}
          <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-lg">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Money Received</span>
              <ReceiptText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xl font-black text-emerald-900">{formatCurrency(reportData.summary.totalReceipts)}</p>
            <p className="mt-1 text-xs text-emerald-700/70">{reportData.summary.receiptsCount} Receipts</p>
          </div>

          {/* Payments Made */}
          <div className="rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-50 to-pink-50 p-4 shadow-lg">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-bold uppercase tracking-wider">Payments Made</span>
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xl font-black text-rose-900">{formatCurrency(reportData.summary.totalPayments)}</p>
            <p className="mt-1 text-xs text-rose-700/70">{reportData.summary.paymentsCount} Payments</p>
          </div>

          {/* Net Cash Flow */}
          <div className="rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-lg">
            <div className="flex items-center justify-between text-sky-700">
              <span className="text-xs font-bold uppercase tracking-wider">Net Cash Flow</span>
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className={`mt-3 text-xl font-black ${netCashFlow >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              {formatCurrency(netCashFlow)}
            </p>
            <p className="mt-1 text-xs text-sky-700/70">Receipts - Payments</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex overflow-x-auto border-b border-white/10 pb-2">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'sales', label: 'Sales Report', count: reportData.sales.length },
              { id: 'purchases', label: 'Purchase Report', count: reportData.purchases.length },
              { id: 'receipts', label: 'Money Received', count: reportData.receipts.length },
              { id: 'payments', label: 'Payments Made', count: reportData.payments.length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white shadow'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      activeTab === tab.id ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Data Tables Container */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500 mb-3" />
              <p className="text-base font-semibold">Loading report data...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Sales Summary */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                        <span>Recent Sales ({reportData.sales.length})</span>
                        <button
                          onClick={() => setActiveTab('sales')}
                          className="text-xs text-amber-400 underline hover:text-amber-300"
                        >
                          View All
                        </button>
                      </h3>
                      {reportData.sales.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No sales records in this period.</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {reportData.sales.slice(0, 5).map((s) => (
                            <div key={s._id} className="py-2 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-200">{s.partyName}</p>
                                <p className="text-slate-400">{s.invoiceNumber} • {formatDate(s.date)}</p>
                              </div>
                              <span className="font-bold text-emerald-400">{formatCurrency(s.totalAmount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Purchases Summary */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                        <span>Recent Purchases ({reportData.purchases.length})</span>
                        <button
                          onClick={() => setActiveTab('purchases')}
                          className="text-xs text-fuchsia-400 underline hover:text-fuchsia-300"
                        >
                          View All
                        </button>
                      </h3>
                      {reportData.purchases.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No purchase records in this period.</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {reportData.purchases.slice(0, 5).map((p) => (
                            <div key={p._id} className="py-2 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-200">{p.partyName}</p>
                                <p className="text-slate-400">{p.invoiceNumber} • {formatDate(p.date)}</p>
                              </div>
                              <span className="font-bold text-fuchsia-400">{formatCurrency(p.totalAmount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Receipts */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                        <span>Recent Receipts ({reportData.receipts.length})</span>
                        <button
                          onClick={() => setActiveTab('receipts')}
                          className="text-xs text-emerald-400 underline hover:text-emerald-300"
                        >
                          View All
                        </button>
                      </h3>
                      {reportData.receipts.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No receipt records in this period.</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {reportData.receipts.slice(0, 5).map((r) => (
                            <div key={r._id} className="py-2 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-200">{r.partyName}</p>
                                <p className="text-slate-400">{r.receiptNumber} • {formatDate(r.date)}</p>
                              </div>
                              <span className="font-bold text-emerald-400">{formatCurrency(r.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Payments */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                        <span>Recent Payments ({reportData.payments.length})</span>
                        <button
                          onClick={() => setActiveTab('payments')}
                          className="text-xs text-rose-400 underline hover:text-rose-300"
                        >
                          View All
                        </button>
                      </h3>
                      {reportData.payments.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No payment records in this period.</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {reportData.payments.slice(0, 5).map((p) => (
                            <div key={p._id} className="py-2 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-200">{p.partyName}</p>
                                <p className="text-slate-400">{p.paymentNumber} • {formatDate(p.date)}</p>
                              </div>
                              <span className="font-bold text-rose-400">{formatCurrency(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Tab Table */}
              {activeTab === 'sales' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3.5">Invoice #</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Party / Customer</th>
                        <th className="px-5 py-3.5">Products Sold (Qty @ Rate)</th>
                        <th className="px-5 py-3.5 text-center">Items</th>
                        <th className="px-5 py-3.5 text-center">Total Qty</th>
                        <th className="px-5 py-3.5 text-right">Total Amount</th>
                        <th className="px-5 py-3.5 text-right">Paid Amount</th>
                        <th className="px-5 py-3.5 text-center">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportData.sales.map((s) => (
                        <tr key={s._id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 font-semibold text-white">{s.invoiceNumber}</td>
                          <td className="px-5 py-3 whitespace-nowrap">{formatDate(s.date)}</td>
                          <td className="px-5 py-3 font-medium text-slate-200">{s.partyName}</td>
                          <td className="px-5 py-3 text-xs text-slate-300 min-w-[240px]">
                            {Array.isArray(s.items) && s.items.length > 0 ? (
                              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                {s.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 rounded border border-white/5 bg-slate-800/60 px-2 py-1">
                                    <span className="font-semibold text-amber-300">{item.productName}</span>
                                    <span className="text-slate-400 text-[11px]">({item.quantity} {item.unit} @ Rs {item.unitPrice})</span>
                                    <span className="font-bold text-emerald-400 text-[11px]">Rs {item.total}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No line items</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">{s.itemsCount}</td>
                          <td className="px-5 py-3 text-center">{s.totalQty}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-400">{formatCurrency(s.totalAmount)}</td>
                          <td className="px-5 py-3 text-right text-slate-300">{formatCurrency(s.paidAmount)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 capitalize">
                              {s.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportData.sales.length === 0 && (
                        <tr>
                          <td colSpan="9" className="px-5 py-10 text-center text-slate-500">
                            No sales records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Purchases Tab Table */}
              {activeTab === 'purchases' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3.5">Bill / Invoice #</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Party / Vendor</th>
                        <th className="px-5 py-3.5 text-center">Items</th>
                        <th className="px-5 py-3.5 text-center">Total Qty</th>
                        <th className="px-5 py-3.5 text-right">Total Amount</th>
                        <th className="px-5 py-3.5 text-right">Paid Amount</th>
                        <th className="px-5 py-3.5 text-center">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportData.purchases.map((p) => (
                        <tr key={p._id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 font-semibold text-white">{p.invoiceNumber}</td>
                          <td className="px-5 py-3">{formatDate(p.date)}</td>
                          <td className="px-5 py-3 font-medium text-slate-200">{p.partyName}</td>
                          <td className="px-5 py-3 text-center">{p.itemsCount}</td>
                          <td className="px-5 py-3 text-center">{p.totalQty}</td>
                          <td className="px-5 py-3 text-right font-bold text-fuchsia-400">{formatCurrency(p.totalAmount)}</td>
                          <td className="px-5 py-3 text-right text-slate-300">{formatCurrency(p.paidAmount)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-400 border border-fuchsia-500/20 capitalize">
                              {p.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportData.purchases.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                            No purchase records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Receipts Tab Table */}
              {activeTab === 'receipts' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3.5">Receipt #</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Party Name</th>
                        <th className="px-5 py-3.5">Payment Method</th>
                        <th className="px-5 py-3.5">Notes</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportData.receipts.map((r) => (
                        <tr key={r._id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 font-semibold text-white">{r.receiptNumber}</td>
                          <td className="px-5 py-3">{formatDate(r.date)}</td>
                          <td className="px-5 py-3 font-medium text-slate-200">{r.partyName}</td>
                          <td className="px-5 py-3 text-slate-300">{r.method}</td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{r.notes || '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-400">{formatCurrency(r.amount)}</td>
                        </tr>
                      ))}
                      {reportData.receipts.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                            No money received (receipt) records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payments Tab Table */}
              {activeTab === 'payments' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3.5">Payment #</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Party Name</th>
                        <th className="px-5 py-3.5">Payment Method</th>
                        <th className="px-5 py-3.5">Notes</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportData.payments.map((p) => (
                        <tr key={p._id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-3 font-semibold text-white">{p.paymentNumber}</td>
                          <td className="px-5 py-3">{formatDate(p.date)}</td>
                          <td className="px-5 py-3 font-medium text-slate-200">{p.partyName}</td>
                          <td className="px-5 py-3 text-slate-300">{p.method}</td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{p.notes || '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-rose-400">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {reportData.payments.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                            No payment records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
