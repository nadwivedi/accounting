import { useEffect, useMemo, useState } from 'react';
import { Boxes, RefreshCw, TrendingUp, TrendingDown, Package, ArrowDownLeft, ArrowUpRight, Search, Filter } from 'lucide-react';
import apiClient from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const COLORS = {
  primary: '#059669',
  secondary: '#0891b2',
  danger: '#e11d48',
  warning: '#d97706',
  purple: '#7c3aed',
  slate: '#475569'
};

export default function StockLedger() {
  const [stockLedger, setStockLedger] = useState({ ledger: [], currentStock: [] });
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const stockLedgerRows = stockLedger?.ledger || [];
  const currentStockRows = stockLedger?.currentStock || [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, stockRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/reports/stock-ledger', {
          params: { productId: productId || undefined }
        })
      ]);
      setProducts(productsRes.data || []);
      setStockLedger(stockRes.data || { ledger: [], currentStock: [] });
    } catch (err) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const refreshStockLedger = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/stock-ledger', {
        params: { productId: productId || undefined }
      });
      setStockLedger(response.data || { ledger: [], currentStock: [] });
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading stock ledger');
    } finally {
      setLoading(false);
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

  const chartData = useMemo(() => {
    const dailyData = {};
    stockLedgerRows.forEach((row) => {
      const dateKey = formatDate(row.date);
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, in: 0, out: 0, net: 0 };
      }
      dailyData[dateKey].in += Number(row.inQty || 0);
      dailyData[dateKey].out += Number(row.outQty || 0);
      dailyData[dateKey].net += Number(row.inQty || 0) - Number(row.outQty || 0);
    });
    return Object.values(dailyData).reverse().slice(-30);
  }, [stockLedgerRows]);

  const filteredLedger = useMemo(() => {
    if (!searchTerm) return stockLedgerRows;
    const term = searchTerm.toLowerCase();
    return stockLedgerRows.filter(row => 
      (row.productName || '').toLowerCase().includes(term) ||
      (row.type || '').toLowerCase().includes(term) ||
      (row.refNumber || '').toLowerCase().includes(term)
    );
  }, [stockLedgerRows, searchTerm]);

  const filteredStock = useMemo(() => {
    if (!searchTerm) return currentStockRows;
    const term = searchTerm.toLowerCase();
    return currentStockRows.filter(row => 
      (row.productName || '').toLowerCase().includes(term)
    );
  }, [currentStockRows, searchTerm]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${color}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
        <div className="flex items-center gap-2 mt-2">
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
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Stock Ledger</h1>
            </div>
            <p className="text-slate-500 ml-14">Monitor inventory movements and current stock levels</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 ml-14 lg:ml-0">
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.name || 'Product'}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={refreshStockLedger}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-black text-slate-800">Stock Movement Trend</h2>
              <p className="text-sm text-slate-500">Daily in/out quantities over time</p>
            </div>
            <div className="p-6">
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fill: COLORS.slate, fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                      <YAxis tick={{ fill: COLORS.slate, fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
                        formatter={(value) => formatNumber(value)}
                      />
                      <Area type="monotone" dataKey="in" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" name="Stock In" />
                      <Area type="monotone" dataKey="out" stroke={COLORS.danger} strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" name="Stock Out" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
              <h2 className="text-lg font-black text-slate-800">Current Stock</h2>
              <p className="text-sm text-slate-500">Available inventory by product</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {filteredStock.length > 0 ? (
                <div className="space-y-3">
                  {filteredStock.slice(0, 10).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{row.productName || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">ID: {String(row.productId).slice(-6)}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className={`text-lg font-black ${Number(row.currentStock || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatNumber(row.currentStock)}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">No stock data</div>
              )}
            </div>
          </div>
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
