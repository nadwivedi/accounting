import { useEffect, useMemo, useState } from 'react';
import { Boxes, TrendingUp, TrendingDown, Package, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import apiClient from '../utils/api';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function StockLedger() {
  const [stockLedger, setStockLedger] = useState({ ledger: [], currentStock: [] });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const stockLedgerRows = stockLedger?.ledger || [];
  const currentStockRows = stockLedger?.currentStock || [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError('');
    try {
      const response = await apiClient.get('/reports/stock-ledger');
      setStockLedger(response.data || { ledger: [], currentStock: [] });
    } catch (err) {
      setError(err.message || 'Error loading data');
    }
  };

  const stockLedgerSummary = useMemo(() => {
    const totals = stockLedgerRows.reduce((acc, row) => {
      acc.inQty += Number(row.inQty || 0);
      acc.outQty += Number(row.outQty || 0);
      return acc;
    }, { inQty: 0, outQty: 0 });

    return {
      movementCount: stockLedgerRows.length,
      totalIn: totals.inQty,
      totalOut: totals.outQty,
      trackedItems: currentStockRows.length,
      netChange: totals.inQty - totals.outQty
    };
  }, [currentStockRows.length, stockLedgerRows]);

  const filteredLedger = useMemo(() => {
    if (!searchTerm) return stockLedgerRows;
    const term = searchTerm.toLowerCase();
    return stockLedgerRows.filter(row => 
      (row.productName || '').toLowerCase().includes(term) ||
      (row.type || '').toLowerCase().includes(term) ||
      (row.refNumber || '').toLowerCase().includes(term)
    );
  }, [stockLedgerRows, searchTerm]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="relative overflow-hidden rounded-2xl bg-white px-5 py-4 shadow-lg border border-slate-100">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${color}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="text-xl font-black leading-tight text-slate-800">{value}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {trend && (
            <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend > 0 ? '+' : ''}{formatNumber(trend)}
            </span>
          )}
          <span className="text-xs text-slate-500">{subtitle}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-[95%] px-4 py-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Movements" value={formatNumber(stockLedgerSummary.movementCount)} subtitle="transactions" icon={ArrowDownLeft} color="from-blue-500 to-cyan-500" />
          <StatCard title="Stock In" value={formatNumber(stockLedgerSummary.totalIn)} subtitle="units received" icon={ArrowDownLeft} color="from-emerald-500 to-teal-500" />
          <StatCard title="Stock Out" value={formatNumber(stockLedgerSummary.totalOut)} subtitle="units dispatched" icon={ArrowUpRight} color="from-rose-500 to-pink-500" trend={-stockLedgerSummary.totalOut} />
          <StatCard title="Net Change" value={formatNumber(stockLedgerSummary.netChange)} subtitle="in/out difference" icon={stockLedgerSummary.netChange >= 0 ? TrendingUp : TrendingDown} color={stockLedgerSummary.netChange >= 0 ? "from-emerald-500 to-green-500" : "from-rose-500 to-red-500"} trend={stockLedgerSummary.netChange} />
          <StatCard title="Products Tracked" value={formatNumber(stockLedgerSummary.trackedItems)} subtitle="active items" icon={Package} color="from-violet-500 to-purple-500" />
        </div>

        <div className="rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">Detailed Ledger</h2>
              <p className="text-sm text-slate-500">Complete transaction history</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all w-full sm:w-64"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Stock In</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Stock Out</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.length > 0 ? (
                  filteredLedger.map((row, index) => (
                    <tr key={`${row.refId || 'row'}-${index}`} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{formatDate(row.date)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800 max-w-[180px] truncate">{row.productName || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          row.type === 'sale' ? 'bg-rose-100 text-rose-700' :
                          row.type === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
                          row.type === 'return' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {row.type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 font-mono">{row.refNumber || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {Number(row.inQty || 0) > 0 ? (
                          <p className="text-sm font-bold text-emerald-600">+{formatNumber(row.inQty)}</p>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {Number(row.outQty || 0) > 0 ? (
                          <p className="text-sm font-bold text-rose-600">-{formatNumber(row.outQty)}</p>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-800">{formatNumber(row.runningQty)}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 rounded-full bg-slate-100 mb-4">
                          <Boxes className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">No stock movements found</p>
                        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or date range</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
