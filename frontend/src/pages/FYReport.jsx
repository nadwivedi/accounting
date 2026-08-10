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
  const [voucherType, setVoucherType] = useState('sales'); // default to 'sales'
  const [activeTab, setActiveTab] = useState('sales'); // default to 'sales'

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
      salesAoa.push([]);
      salesAoa.push([
        'TOTAL SALES',
        `Invoices: ${reportData.sales.length}`,
        '',
        `Items: ${totalSalesItemsCount}`,
        totalSalesItemsCount,
        '-',
        '',
        totalSalesAmount,
        totalSalesAmount,
        totalPaidSalesAmount,
        ''
      ]);
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
      purchaseAoa.push([]);
      purchaseAoa.push([
        'TOTAL PURCHASES',
        `Bills: ${reportData.purchases.length}`,
        '',
        `Items: ${totalPurchasesItemsCount}`,
        totalPurchasesItemsCount,
        '-',
        '',
        totalPurchasesAmount,
        totalPurchasesAmount,
        totalPaidPurchasesAmount,
        ''
      ]);
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
      receiptsAoa.push([]);
      receiptsAoa.push([
        'TOTAL MONEY RECEIVED',
        `Receipts: ${reportData.receipts.length}`,
        '',
        totalReceiptsAmount,
        '',
        ''
      ]);
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
      paymentsAoa.push([]);
      paymentsAoa.push([
        'TOTAL PAYMENTS MADE',
        `Payments: ${reportData.payments.length}`,
        '',
        totalPaymentsAmount,
        '',
        ''
      ]);
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

  const totalSalesAmount = reportData.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPaidSalesAmount = reportData.sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalSalesQty = reportData.sales.reduce((sum, s) => sum + (s.totalQty || 0), 0);
  const totalSalesItemsCount = reportData.sales.reduce((sum, s) => sum + (s.itemsCount || 0), 0);

  const totalPurchasesAmount = reportData.purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPaidPurchasesAmount = reportData.purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalPurchasesQty = reportData.purchases.reduce((sum, p) => sum + (p.totalQty || 0), 0);
  const totalPurchasesItemsCount = reportData.purchases.reduce((sum, p) => sum + (p.itemsCount || 0), 0);

  const totalReceiptsAmount = reportData.receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPaymentsAmount = reportData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const currentCategory = voucherType !== 'all' ? voucherType : activeTab;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-amber-600/30 bg-amber-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                  Date Range: {getDateRangeLabel()}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {getReportTitle()}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </button>
        </div>

        {/* Filter Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">
              <Filter className="h-4 w-4 text-amber-600" />
              <span>Select Filter Option</span>
            </div>            {/* Filter mode switcher */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setFilterType('fy');
                  fetchReport({ ft: 'fy', fy: selectedFY, month: selectedMonth, from: fromDate, to: toDate, vt: voucherType });
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  filterType === 'fy'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Financial Year & Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType('custom');
                  fetchReport({ ft: 'custom', fy: selectedFY, month: selectedMonth, from: fromDate, to: toDate, vt: voucherType });
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  filterType === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Indian Financial Year
                  </label>
                  <select
                    value={selectedFY}
                    onChange={(e) => {
                      const newFy = e.target.value;
                      setSelectedFY(newFy);
                      fetchReport({ ft: filterType, fy: newFy, month: selectedMonth, from: fromDate, to: toDate, vt: voucherType });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    {FY_OPTIONS.map((fy) => (
                      <option key={fy.value} value={fy.value} className="bg-white text-slate-900 py-1.5">
                        {fy.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Month Filter
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const newMonth = e.target.value;
                      setSelectedMonth(newMonth);
                      fetchReport({ ft: filterType, fy: selectedFY, month: newMonth, from: fromDate, to: toDate, vt: voucherType });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    {INDIAN_MONTHS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-white text-slate-900 py-1.5">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </>
            )}

            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
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
                  fetchReport({ ft: filterType, fy: selectedFY, month: selectedMonth, from: fromDate, to: toDate, vt });
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all" className="bg-white text-slate-900 py-1.5">All Transactions</option>
                <option value="sales" className="bg-white text-slate-900 py-1.5">Sales Only</option>
                <option value="purchases" className="bg-white text-slate-900 py-1.5">Purchases Only</option>
                <option value="receipts" className="bg-white text-slate-900 py-1.5">Money Received Only</option>
                <option value="payments" className="bg-white text-slate-900 py-1.5">Payments Made Only</option>
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
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* Summary KPI Grid */}
        <div className={`mb-6 grid grid-cols-1 gap-3.5 ${currentCategory === 'all' || currentCategory === 'overview' ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-1 lg:grid-cols-3 max-w-xl'}`}>
          {/* Sales Card */}
          {(currentCategory === 'all' || currentCategory === 'overview' || currentCategory === 'sales') && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                <ShoppingCart className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-2 text-lg font-extrabold text-amber-950 sm:text-xl">{formatCurrency(reportData.summary.totalSales || totalSalesAmount)}</p>
              <p className="mt-0.5 text-xs text-amber-800/80 font-medium">{reportData.summary.salesCount || reportData.sales.length} Sales Invoices</p>
            </div>
          )}

          {/* Purchases Card */}
          {(currentCategory === 'all' || currentCategory === 'overview' || currentCategory === 'purchases') && (
            <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/70 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between text-fuchsia-800">
                <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
                <Package className="h-5 w-5 text-fuchsia-600" />
              </div>
              <p className="mt-2 text-lg font-extrabold text-fuchsia-950 sm:text-xl">{formatCurrency(reportData.summary.totalPurchases || totalPurchasesAmount)}</p>
              <p className="mt-0.5 text-xs text-fuchsia-800/80 font-medium">{reportData.summary.purchasesCount || reportData.purchases.length} Purchase Bills</p>
            </div>
          )}

          {/* Money Received (Receipts) Card */}
          {(currentCategory === 'all' || currentCategory === 'overview' || currentCategory === 'receipts') && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-bold uppercase tracking-wider">Money Received</span>
                <ReceiptText className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-lg font-extrabold text-emerald-950 sm:text-xl">{formatCurrency(reportData.summary.totalReceipts || totalReceiptsAmount)}</p>
              <p className="mt-0.5 text-xs text-emerald-800/80 font-medium">{reportData.summary.receiptsCount || reportData.receipts.length} Receipts</p>
            </div>
          )}

          {/* Payments Made Card */}
          {(currentCategory === 'all' || currentCategory === 'overview' || currentCategory === 'payments') && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between text-rose-800">
                <span className="text-xs font-bold uppercase tracking-wider">Payments Made</span>
                <CreditCard className="h-5 w-5 text-rose-600" />
              </div>
              <p className="mt-2 text-lg font-extrabold text-rose-950 sm:text-xl">{formatCurrency(reportData.summary.totalPayments || totalPaymentsAmount)}</p>
              <p className="mt-0.5 text-xs text-rose-800/80 font-medium">{reportData.summary.paymentsCount || reportData.payments.length} Payments</p>
            </div>
          )}

          {/* Net Cash Flow Card */}
          {(currentCategory === 'all' || currentCategory === 'overview') && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between text-sky-800">
                <span className="text-xs font-bold uppercase tracking-wider">Net Cash Flow</span>
                <TrendingUp className="h-5 w-5 text-sky-600" />
              </div>
              <p className={`mt-2 text-lg font-extrabold sm:text-xl ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(netCashFlow)}
              </p>
              <p className="mt-0.5 text-xs text-sky-800/80 font-medium">Receipts - Payments</p>
            </div>
          )}
        </div>

        {/* Data Tables Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500 mb-3" />
              <p className="text-base font-semibold text-slate-700">Loading report data...</p>
            </div>
          ) : (
            <>

              {/* Sales Tab Table */}
              {(activeTab === 'sales' || activeTab === 'all') && (
                <div className="overflow-x-auto">
                  {activeTab === 'all' && (
                    <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 text-xs font-bold uppercase tracking-wider text-amber-800 flex justify-between items-center">
                      <span>Sales Report</span>
                      <span>{reportData.sales.length} Invoices</span>
                    </div>
                  )}
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
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
                    <tbody className="divide-y divide-slate-100">
                      {reportData.sales.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{s.invoiceNumber}</td>
                          <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDate(s.date)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{s.partyName}</td>
                          <td className="px-5 py-3 text-xs text-slate-700 min-w-[240px]">
                            {Array.isArray(s.items) && s.items.length > 0 ? (
                              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                {s.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                                    <span className="font-bold text-slate-900">{item.productName}</span>
                                    <span className="text-slate-500 text-[11px]">({item.quantity} {item.unit} @ Rs {item.unitPrice})</span>
                                    <span className="font-bold text-emerald-700 text-[11px]">Rs {item.total}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No line items</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center text-slate-700 font-medium">{s.itemsCount}</td>
                          <td className="px-5 py-3 text-center text-slate-700 font-medium">{s.totalQty}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatCurrency(s.totalAmount)}</td>
                          <td className="px-5 py-3 text-right text-slate-600">{formatCurrency(s.paidAmount)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 capitalize">
                              {s.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportData.sales.length === 0 && (
                        <tr>
                          <td colSpan="9" className="px-5 py-10 text-center text-slate-400">
                            No sales records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.sales.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-sm">
                        <tr>
                          <td colSpan="3" className="px-5 py-3.5 text-amber-800 font-black uppercase tracking-wider">
                            TOTAL SALES ({reportData.sales.length} Invoices)
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700 font-semibold">
                            Total Line Items: {totalSalesItemsCount}
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-900 font-bold">{totalSalesItemsCount}</td>
                          <td className="px-5 py-3.5 text-center text-slate-900 font-bold">{totalSalesQty}</td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-base">{formatCurrency(totalSalesAmount)}</td>
                          <td className="px-5 py-3.5 text-right text-slate-800 font-bold">{formatCurrency(totalPaidSalesAmount)}</td>
                          <td className="px-5 py-3.5"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Purchases Tab Table */}
              {(activeTab === 'purchases' || activeTab === 'all') && (
                <div className="overflow-x-auto border-t border-slate-200">
                  {activeTab === 'all' && (
                    <div className="bg-fuchsia-50 px-5 py-2.5 border-b border-fuchsia-200 text-xs font-bold uppercase tracking-wider text-fuchsia-800 flex justify-between items-center">
                      <span>Purchase Report</span>
                      <span>{reportData.purchases.length} Bills</span>
                    </div>
                  )}
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
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
                    <tbody className="divide-y divide-slate-100">
                      {reportData.purchases.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{p.invoiceNumber}</td>
                          <td className="px-5 py-3 text-slate-600">{formatDate(p.date)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{p.partyName}</td>
                          <td className="px-5 py-3 text-center text-slate-700 font-medium">{p.itemsCount}</td>
                          <td className="px-5 py-3 text-center text-slate-700 font-medium">{p.totalQty}</td>
                          <td className="px-5 py-3 text-right font-bold text-fuchsia-700">{formatCurrency(p.totalAmount)}</td>
                          <td className="px-5 py-3 text-right text-slate-600">{formatCurrency(p.paidAmount)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-bold text-fuchsia-800 border border-fuchsia-200 capitalize">
                              {p.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportData.purchases.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-5 py-10 text-center text-slate-400">
                            No purchase records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.purchases.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-sm">
                        <tr>
                          <td colSpan="3" className="px-5 py-3.5 text-fuchsia-800 font-black uppercase tracking-wider">
                            TOTAL PURCHASES ({reportData.purchases.length} Bills)
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-900 font-bold">{totalPurchasesItemsCount}</td>
                          <td className="px-5 py-3.5 text-center text-slate-900 font-bold">{totalPurchasesQty}</td>
                          <td className="px-5 py-3.5 text-right font-black text-fuchsia-700 text-base">{formatCurrency(totalPurchasesAmount)}</td>
                          <td className="px-5 py-3.5 text-right text-slate-800 font-bold">{formatCurrency(totalPaidPurchasesAmount)}</td>
                          <td className="px-5 py-3.5"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Receipts Tab Table */}
              {(activeTab === 'receipts' || activeTab === 'all') && (
                <div className="overflow-x-auto border-t border-slate-200">
                  {activeTab === 'all' && (
                    <div className="bg-emerald-50 px-5 py-2.5 border-b border-emerald-200 text-xs font-bold uppercase tracking-wider text-emerald-800 flex justify-between items-center">
                      <span>Money Received</span>
                      <span>{reportData.receipts.length} Receipts</span>
                    </div>
                  )}
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Receipt #</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Party Name</th>
                        <th className="px-5 py-3.5">Payment Method</th>
                        <th className="px-5 py-3.5">Notes</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.receipts.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{r.receiptNumber}</td>
                          <td className="px-5 py-3 text-slate-600">{formatDate(r.date)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{r.partyName}</td>
                          <td className="px-5 py-3 text-slate-700">{r.method}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{r.notes || '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatCurrency(r.amount)}</td>
                        </tr>
                      ))}
                      {reportData.receipts.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-5 py-10 text-center text-slate-400">
                            No money received (receipt) records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.receipts.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-sm">
                        <tr>
                          <td colSpan="5" className="px-5 py-3.5 text-emerald-800 font-black uppercase tracking-wider">
                            TOTAL MONEY RECEIVED ({reportData.receipts.length} Receipts)
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-base">{formatCurrency(totalReceiptsAmount)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Payments Tab Table */}
              {(activeTab === 'payments' || activeTab === 'all') && (
                <div className="overflow-x-auto border-t border-slate-200">
                  {activeTab === 'all' && (
                    <div className="bg-rose-50 px-5 py-2.5 border-b border-rose-200 text-xs font-bold uppercase tracking-wider text-rose-800 flex justify-between items-center">
                      <span>Payments Made</span>
                      <span>{reportData.payments.length} Payments</span>
                    </div>
                  )}
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Payment #</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Party Name</th>
                        <th className="px-5 py-3.5">Payment Method</th>
                        <th className="px-5 py-3.5">Notes</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.payments.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{p.paymentNumber}</td>
                          <td className="px-5 py-3 text-slate-600">{formatDate(p.date)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{p.partyName}</td>
                          <td className="px-5 py-3 text-slate-700">{p.method}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{p.notes || '-'}</td>
                          <td className="px-5 py-3 text-right font-bold text-rose-700">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {reportData.payments.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-5 py-10 text-center text-slate-400">
                            No payment records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.payments.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-sm">
                        <tr>
                          <td colSpan="5" className="px-5 py-3.5 text-rose-800 font-black uppercase tracking-wider">
                            TOTAL PAYMENTS MADE ({reportData.payments.length} Payments)
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-rose-700 text-base">{formatCurrency(totalPaymentsAmount)}</td>
                        </tr>
                      </tfoot>
                    )}
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
