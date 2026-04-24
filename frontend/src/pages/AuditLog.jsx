import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import apiClient from '../utils/api';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  UPDATE: 'bg-amber-100 text-amber-800 border-amber-300',
  DELETE: 'bg-red-100 text-red-800 border-red-300'
};

const ACTION_DOT = {
  CREATE: 'bg-emerald-500',
  UPDATE: 'bg-amber-500',
  DELETE: 'bg-red-500'
};

const MODULE_LIST = [
  'Purchase', 'Sale', 'Payment', 'Receipt', 'Expense',
  'SaleReturn', 'PurchaseReturn', 'SaleDiscount', 'PurchaseDiscount',
  'StockAdjustment', 'Party', 'Product', 'Bank', 'Unit', 'StockGroup'
];

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const JsonViewer = ({ data, label }) => {
  if (data === null || data === undefined) {
    return <p className="text-slate-400 italic text-sm">— No data —</p>;
  }
  return (
    <div>
      {label && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>}
      <pre className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700 max-h-72 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default function AuditLog() {
  const navigate = useNavigate();

  // Filters
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  // Data
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detail modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const LIMIT = 50;

  const fetchLogs = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: LIMIT };
      if (module) params.module = module;
      if (action) params.action = action;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get('/audit-logs', { params });
      setLogs(res?.data || []);
      setTotal(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  }, [module, action, fromDate, toDate, search]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const openDetail = async (log) => {
    setDetailLoading(true);
    setSelectedLog(null);
    try {
      const res = await apiClient.get(`/audit-logs/${log._id}`);
      setSelectedLog(res?.data || log);
    } catch {
      setSelectedLog(log);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelectedLog(null);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const resetFilters = () => {
    setModule('');
    setAction('');
    setFromDate('');
    setToDate('');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-2 py-4 md:px-6 md:py-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4" /> Reports
        </button>
        <div>
          <h1 className="text-lg font-bold text-white md:text-2xl">Audit Log</h1>
          <p className="text-[11px] text-slate-400">Track all add, edit, and delete activity across your accounting system</p>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur md:p-4"
      >
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3">
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[12px] text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Modules</option>
            {MODULE_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[12px] text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Edited</option>
            <option value="DELETE">Deleted</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From Date"
            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[12px] text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To Date"
            className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[12px] text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / label..."
            className="col-span-2 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[12px] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:col-span-1"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-indigo-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-1.5 text-[12px] font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            Reset
          </button>
          <span className="ml-auto text-[11px] text-slate-400">
            {total} log{total !== 1 ? 's' : ''} found
          </span>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-xl">
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Ref / Label</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Performed By</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {log.refLabel || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ACTION_DOT[log.action] || 'bg-slate-400'}`} />
                        {log.action === 'CREATE' ? 'Added' : log.action === 'UPDATE' ? 'Edited' : 'Deleted'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {log.performedBy?.role === 'employee' ? (
                        <div>
                          <p className="font-semibold text-slate-800">{log.performedBy.employeeName || 'Employee'}</p>
                          {log.performedBy.employeeCode && (
                            <p className="text-[11px] text-slate-500">{log.performedBy.employeeCode}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                          Owner
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(log)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="text-[12px] text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(selectedLog || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeDetail}>
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 text-white">
              <div>
                <h2 className="text-base font-bold">Audit Log Detail</h2>
                {selectedLog && (
                  <p className="text-[11px] text-slate-400">
                    {selectedLog.module} · {selectedLog.refLabel} ·{' '}
                    <span className={`font-semibold ${selectedLog.action === 'CREATE' ? 'text-emerald-400' : selectedLog.action === 'UPDATE' ? 'text-amber-400' : 'text-red-400'}`}>
                      {selectedLog.action === 'CREATE' ? 'Added' : selectedLog.action === 'UPDATE' ? 'Edited' : 'Deleted'}
                    </span>
                  </p>
                )}
              </div>
              <button type="button" onClick={closeDetail} className="rounded-lg p-1.5 transition hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
              ) : selectedLog ? (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</p>
                      <p className="text-[12px] font-semibold text-slate-800">{formatDateTime(selectedLog.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Module</p>
                      <p className="text-[12px] font-semibold text-indigo-700">{selectedLog.module}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reference</p>
                      <p className="text-[12px] font-semibold text-slate-800">{selectedLog.refLabel || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Performed By</p>
                      <p className="text-[12px] font-semibold text-slate-800">
                        {selectedLog.performedBy?.role === 'employee'
                          ? `${selectedLog.performedBy.employeeName || 'Employee'} (${selectedLog.performedBy.employeeCode || ''})`
                          : 'Owner'}
                      </p>
                    </div>
                  </div>

                  {/* Before / After */}
                  {selectedLog.action === 'UPDATE' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">Before (Old Data)</p>
                        <JsonViewer data={selectedLog.before} />
                      </div>
                      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">After (New Data)</p>
                        <JsonViewer data={selectedLog.after} />
                      </div>
                    </div>
                  ) : selectedLog.action === 'DELETE' ? (
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-red-700">Deleted Record (Snapshot)</p>
                      <JsonViewer data={selectedLog.before} />
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">Created Record</p>
                      <JsonViewer data={selectedLog.after} />
                    </div>
                  )}

                  {selectedLog.note && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Note</p>
                      <p className="mt-1 text-[13px] text-slate-700">{selectedLog.note}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
