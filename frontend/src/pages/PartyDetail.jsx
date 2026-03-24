import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../utils/api';

const toInputDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const formatQuantity = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const formatLabel = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getTypeMeta = (type) => {
  if (type === 'sale') {
    return {
      label: 'Sale',
      className: 'border-amber-200 bg-amber-50 text-amber-700'
    };
  }

  if (type === 'cash sale') {
    return {
      label: 'Cash Sale',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    };
  }

  if (type === 'credit sale') {
    return {
      label: 'Credit Sale',
      className: 'border-blue-200 bg-blue-50 text-blue-700'
    };
  }

  if (type === 'purchase') {
    return {
      label: 'Purchase',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    };
  }

  if (type === 'receipt') {
    return {
      label: 'Receipt',
      className: 'border-sky-200 bg-sky-50 text-sky-700'
    };
  }

  if (type === 'payment') {
    return {
      label: 'Payment',
      className: 'border-violet-200 bg-violet-50 text-violet-700'
    };
  }

  if (type === 'purchase return') {
    return {
      label: 'Purchase Return',
      className: 'border-rose-200 bg-rose-50 text-rose-700'
    };
  }

  if (type === 'sale return') {
    return {
      label: 'Sale Return',
      className: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700'
    };
  }

  return {
    label: formatLabel(type),
    className: 'border-slate-200 bg-slate-100 text-slate-700'
  };
};

const getBalanceHint = (value) => {
  if (Number(value || 0) > 0) return 'Receivable';
  if (Number(value || 0) < 0) return 'Payable';
  return 'Settled';
};

const getLedgerDetails = (row) => {
  const details = [];

  if (row.itemSummary) {
    details.push(row.itemSummary);
  }

  if (row.method) {
    details.push(`Method: ${formatLabel(row.method)}`);
  }

  if (row.note) {
    details.push(row.note);
  }

  return details;
};

const isLedgerDetailSupported = (row) => Boolean(row?.refId && row?.type);

function VoucherDetailModal({ detail, loading, error, onClose }) {
  if (!detail && !loading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-cyan-900 to-sky-800 px-5 py-4 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">Voucher Detail</p>
            <h2 className="mt-1 text-xl font-bold">{detail?.title || 'Loading details'}</h2>
            {detail ? (
              <p className="mt-1 text-sm text-cyan-50">
                {detail.refNumber || '-'} | {detail.partyName || '-'}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close voucher detail"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
              Loading voucher details...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && detail ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(detail.amount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(detail.date)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Qty</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{detail.quantity ? formatQuantity(detail.quantity) : '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Method</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{detail.method || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(detail.fields || []).map((field) => (
                  <div key={`${field.label}-${field.value || 'empty'}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{field.label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {field.label.toLowerCase().includes('date') ? formatDate(field.value) : (field.value || '-')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Account</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{detail.accountName || '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Opened</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{formatDateTime(detail.date)}</p>
                </div>
              </div>

              {detail.linkedReference ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Linked Reference</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-900">{detail.linkedReference}</p>
                </div>
              ) : null}

              {detail.notes ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{detail.notes}</p>
                </div>
              ) : null}

              {(detail.items || []).length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Items</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-white text-slate-600">
                        <tr>
                          <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Product</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Qty</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Rate</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id} className="bg-white">
                            <td className="border-b border-slate-100 px-4 py-3">
                              <p className="font-medium text-slate-800">{item.productName}</p>
                              {item.unit ? <p className="text-xs text-slate-500">{item.unit}</p> : null}
                            </td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-medium text-slate-800">{formatQuantity(item.quantity)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-medium text-slate-800">{formatCurrency(item.unitPrice)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-center font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const resolveDateRange = (filterType, fromDate, toDate, monthKey) => {
  const now = new Date();

  if (filterType === 'last7Days') {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    return {
      fromDate: toInputDate(startDate),
      toDate: toInputDate(now)
    };
  }

  if (filterType === 'last30Days') {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    return {
      fromDate: toInputDate(startDate),
      toDate: toInputDate(now)
    };
  }

  if (filterType === 'last1Year') {
    const startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
    return {
      fromDate: toInputDate(startDate),
      toDate: toInputDate(now)
    };
  }

  if (filterType === 'monthwise' && monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      fromDate: toInputDate(startDate),
      toDate: toInputDate(endDate)
    };
  }

  return {
    fromDate: fromDate || '',
    toDate: toDate || ''
  };
};

export default function PartyDetail() {
  const { id } = useParams();
  const [party, setParty] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState('custom');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState(null);
  const [voucherDetail, setVoucherDetail] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  const loadPartyDetails = async (showLoader = true, overrides = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const queryFromDate = overrides.fromDate !== undefined ? overrides.fromDate : fromDate;
      const queryToDate = overrides.toDate !== undefined ? overrides.toDate : toDate;

      const [partyResponse, ledgerResponse] = await Promise.all([
        apiClient.get('/parties'),
        apiClient.get('/reports/party-ledger', {
          params: {
            partyId: id,
            fromDate: queryFromDate || undefined,
            toDate: queryToDate || undefined
          }
        })
      ]);

      const matchedParty = (partyResponse.data || []).find((item) => String(item._id) === String(id)) || null;
      setParty(matchedParty);
      setLedger(ledgerResponse.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading party details');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    loadPartyDetails(true);
  }, [id]);

  const summary = useMemo(() => {
    return ledger.reduce((acc, row) => {
      const amount = Number(row.amount || 0);
      const quantity = Number(row.quantity || 0);

      acc.entries += 1;

      if (row.type === 'sale' || row.type === 'cash sale' || row.type === 'credit sale') {
        acc.totalSales += amount;
        acc.saleQty += quantity;
      }

      if (row.type === 'purchase') {
        acc.totalPurchases += amount;
        acc.purchaseQty += quantity;
      }

      if (row.type === 'receipt') {
        acc.totalReceipts += amount;
      }

      if (row.type === 'payment') {
        acc.totalPayments += amount;
      }

      if (row.type === 'purchase return') {
        acc.totalPurchaseReturns += amount;
        acc.purchaseReturnQty += quantity;
      }

      if (row.type === 'sale return') {
        acc.totalSaleReturns += amount;
      }

      return acc;
    }, {
      entries: 0,
      totalSales: 0,
      totalPurchases: 0,
      totalReceipts: 0,
      totalPayments: 0,
      totalPurchaseReturns: 0,
      totalSaleReturns: 0,
      saleQty: 0,
      purchaseQty: 0,
      purchaseReturnQty: 0
    });
  }, [ledger]);

  const closingBalance = ledger.length > 0 ? Number(ledger[ledger.length - 1].runningBalance || 0) : 0;

  const sortedLedgerRows = useMemo(() => {
    const closing = ledger.length > 0 ? Number(ledger[ledger.length - 1].runningBalance || 0) : 0;
    const sortedRows = [...ledger].sort((firstRow, secondRow) => {
      const firstTime = new Date(firstRow.entryCreatedAt || firstRow.date).getTime() || 0;
      const secondTime = new Date(secondRow.entryCreatedAt || secondRow.date).getTime() || 0;
      return secondTime - firstTime;
    });

    let reverseRunningBalance = closing;

    return sortedRows.map((row) => {
      const displayRunningBalance = reverseRunningBalance;
      reverseRunningBalance -= Number(row.impact || 0);

      return {
        ...row,
        displayRunningBalance
      };
    });
  }, [ledger]);

  const handleApplyFilter = async () => {
    const resolvedRange = resolveDateRange(filterType, fromDate, toDate, selectedMonth);

    if (filterType === 'monthwise' && !selectedMonth) {
      setError('Please select a month for month-wise ledger.');
      return;
    }

    setFromDate(resolvedRange.fromDate);
    setToDate(resolvedRange.toDate);
    await loadPartyDetails(true, resolvedRange);
  };

  const handleClearFilter = async () => {
    setFilterType('custom');
    setSelectedMonth('');
    setFromDate('');
    setToDate('');
    await loadPartyDetails(true, { fromDate: '', toDate: '' });
  };

  const handleOpenVoucherDetail = async (row) => {
    if (!isLedgerDetailSupported(row)) return;

    setSelectedLedgerEntry(row);
    setVoucherDetail(null);
    setVoucherError('');
    setVoucherLoading(true);

    try {
      const response = await apiClient.get('/reports/party-ledger-entry-detail', {
        params: {
          type: row.type,
          refId: row.refId
        }
      });

      setVoucherDetail(response.data || null);
    } catch (err) {
      setVoucherError(err.message || 'Error loading voucher detail');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleCloseVoucherDetail = () => {
    setSelectedLedgerEntry(null);
    setVoucherDetail(null);
    setVoucherError('');
    setVoucherLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 px-3 pb-6 pt-4 md:px-6 md:pt-6">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-5 md:py-4">
        <div className="flex items-start gap-3">
          <Link
            to="/party"
            aria-label="Back to party"
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              {party?.name || 'Party Ledger'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              {party?.type ? `Type: ${formatLabel(party.type)}` : 'Type: -'}
              {' | '}
              {`Mobile: ${party?.mobile || '-'}`}
            </p>
            {party?.address ? (
              <p className="mt-1 text-xs text-slate-500 md:text-sm">{party.address}</p>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">Closing Balance</p>
          <p className={`mt-1 text-lg font-bold md:text-xl ${closingBalance >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
            {formatCurrency(closingBalance)}
          </p>
          <p className="mt-1 text-[11px] text-blue-700">{getBalanceHint(closingBalance)}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Sale To Party</p>
          <p className="mt-1 text-lg font-bold text-amber-900 md:text-xl">{formatCurrency(summary.totalSales)}</p>
          <p className="mt-1 text-[11px] text-amber-700">Qty {formatQuantity(summary.saleQty)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Purchase From Party</p>
          <p className="mt-1 text-lg font-bold text-emerald-900 md:text-xl">{formatCurrency(summary.totalPurchases)}</p>
          <p className="mt-1 text-[11px] text-emerald-700">Qty {formatQuantity(summary.purchaseQty)}</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">Party Paid Me</p>
          <p className="mt-1 text-lg font-bold text-sky-900 md:text-xl">{formatCurrency(summary.totalReceipts)}</p>
          <p className="mt-1 text-[11px] text-sky-700">Receipt vouchers</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm md:px-3.5 md:py-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Ledger Filter</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Ledger</label>
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="custom">Custom Range</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
              <option value="last1Year">Last 1 Year</option>
              <option value="monthwise">Month Wise Ledger</option>
            </select>
          </div>
          {filterType === 'monthwise' ? (
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleApplyFilter}
              className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-900"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleClearFilter}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-cyan-50 to-blue-50 px-4 py-3 md:px-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 md:text-lg">Party Ledger</h2>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              Sale, purchase, receipt, payment, and return history for this party.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="p-3 md:p-4">
            <div className="space-y-3 md:hidden">
              {sortedLedgerRows.map((row, index) => {
                const typeMeta = getTypeMeta(row.type);
                const detailRows = getLedgerDetails(row);

                return (
                  <article
                    key={`${row.refId || 'party-ledger'}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${typeMeta.className}`}>
                          {typeMeta.label}
                        </span>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(row.date)}</p>
                        {isLedgerDetailSupported(row) ? (
                          <button
                            type="button"
                            onClick={() => handleOpenVoucherDetail(row)}
                            className="mt-1 text-xs font-semibold text-cyan-700 underline decoration-cyan-300 underline-offset-2 transition hover:text-cyan-900"
                          >
                            {row.refNumber && row.refNumber !== '-' ? row.refNumber : 'View details'}
                          </button>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">{row.refNumber || '-'}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(row.amount)}</p>
                        <p className={`mt-1 text-xs font-semibold ${Number(row.displayRunningBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          Bal {formatCurrency(row.displayRunningBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
                        <span className="font-medium uppercase tracking-[0.16em] text-slate-500">Qty</span>
                        <span className="font-semibold text-slate-800">{row.quantity ? formatQuantity(row.quantity) : '-'}</span>
                      </div>
                      {detailRows.length > 0 ? (
                        <div className="rounded-xl bg-white px-3 py-2.5">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Details</p>
                          <div className="mt-1.5 space-y-1">
                            {detailRows.map((detail, detailIndex) => (
                              <p key={`${row.refId || index}-detail-${detailIndex}`} className="text-xs text-slate-700">
                                {detail}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {sortedLedgerRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  No ledger data found.
                </div>
              ) : null}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                  <tr>
                    <th className="border-y-2 border-l-2 border-r border-black px-4 py-3 text-center font-semibold">Date</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 text-center font-semibold">Type</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 text-center font-semibold">Ref No</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 font-semibold">Details</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 text-center font-semibold">Qty</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 text-center font-semibold">Amount</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 text-center font-semibold text-emerald-700">Money In</th>
                    <th className="border-y-2 border-r border-black px-4 py-3 text-center font-semibold text-rose-700">Money Out</th>
                    <th className="border-y-2 border-r-2 border-black px-4 py-3 text-center font-semibold">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.98)_100%)] text-slate-700">
                  {sortedLedgerRows.map((row, index) => {
                    const typeMeta = getTypeMeta(row.type);
                    const detailRows = getLedgerDetails(row);

                    return (
                      <tr key={`${row.refId || 'party-ledger'}-${index}`} className="transition-colors hover:bg-slate-200/45">
                        <td className="border border-slate-300 px-4 py-3 text-center">{formatDate(row.date)}</td>
                        <td className="border border-slate-300 px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeMeta.className}`}>
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-medium text-slate-800">
                          {isLedgerDetailSupported(row) ? (
                            <button
                              type="button"
                              onClick={() => handleOpenVoucherDetail(row)}
                              className="font-semibold text-cyan-700 underline decoration-cyan-300 underline-offset-2 transition hover:text-cyan-900"
                            >
                              {row.refNumber && row.refNumber !== '-' ? row.refNumber : 'View details'}
                            </button>
                          ) : (
                            row.refNumber || '-'
                          )}
                        </td>
                        <td className="border border-slate-300 px-4 py-3">
                          {detailRows.length > 0 ? (
                            <div className="space-y-1">
                              {detailRows.map((detail, detailIndex) => (
                                <p key={`${row.refId || index}-detail-${detailIndex}`} className="text-sm text-slate-700">
                                  {detail}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800">
                          {row.quantity ? formatQuantity(row.quantity) : '-'}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-900">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-emerald-700">
                          {Number(row.inAmount || 0) > 0 ? formatCurrency(row.inAmount) : '-'}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-rose-700">
                          {Number(row.outAmount || 0) > 0 ? formatCurrency(row.outAmount) : '-'}
                        </td>
                        <td className={`border border-slate-300 px-4 py-3 text-center font-semibold ${Number(row.displayRunningBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(row.displayRunningBalance)}
                        </td>
                      </tr>
                    );
                  })}

                  {sortedLedgerRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="border border-slate-300 px-4 py-10 text-center text-slate-500">
                        No ledger data found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <VoucherDetailModal
        detail={voucherDetail || (selectedLedgerEntry ? {
          title: 'Voucher Details',
          refNumber: selectedLedgerEntry.refNumber || '-',
          partyName: selectedLedgerEntry.partyName || '-'
        } : null)}
        loading={voucherLoading}
        error={voucherError}
        onClose={handleCloseVoucherDetail}
      />
    </div>
  );
}
