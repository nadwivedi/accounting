import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, TrendingUp, TrendingDown, Package, ArrowDownLeft, ArrowUpRight, Search, ChevronLeft, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../utils/api';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');
const getProductLabel = (product) => String(product?.productName || product?.name || '').trim();

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function StockLedger() {
  const navigate = useNavigate();
  const [stockLedger, setStockLedger] = useState({ ledger: [], currentStock: [] });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const stockLedgerRows = stockLedger?.ledger || [];
  const currentStockRows = stockLedger?.currentStock || [];

  // ESC key: if product detail is open → go back to list; else → go back one page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        const popup = document.querySelector('.fixed.inset-0.z-50');
        if (popup) return;
        e.preventDefault();
        if (selectedProduct) {
          setSelectedProduct(null);
          loadData();
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadProductLedger();
    }
  }, [selectedProduct, fromDate, toDate]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/reports/stock-ledger');
      setStockLedger(response.data || { ledger: [], currentStock: [] });
    } catch (err) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadProductLedger = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('productId', selectedProduct.productId);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      const response = await apiClient.get(`/reports/stock-ledger?${params.toString()}`);
      setStockLedger(response.data || { ledger: [], currentStock: [] });
    } catch (err) {
      setError(err.message || 'Error loading product ledger');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (current, min) => {
    if (current === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: XCircle };
    if (min > 0 && current <= min) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
  };

  const stockSummary = useMemo(() => {
    const totals = stockLedgerRows.reduce((acc, row) => {
      acc.inQty += Number(row.inQty || 0);
      acc.outQty += Number(row.outQty || 0);
      return acc;
    }, { inQty: 0, outQty: 0 });

    const stockValue = currentStockRows.reduce((acc, p) => {
      return acc + (Number(p.currentStock || 0) * Number(p.purchasePrice || 0));
    }, 0);

    const lowStockCount = currentStockRows.filter(p => 
      p.currentStock === 0 || (p.minStockLevel > 0 && p.currentStock <= p.minStockLevel)
    ).length;

    return {
      movementCount: stockLedgerRows.length,
      totalIn: totals.inQty,
      totalOut: totals.outQty,
      trackedItems: currentStockRows.length,
      netChange: totals.inQty - totals.outQty,
      stockValue,
      lowStockCount
    };
  }, [currentStockRows.length, stockLedgerRows, currentStockRows]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return currentStockRows;
    const term = searchTerm.toLowerCase();
    return currentStockRows.filter((p) =>
      getProductLabel(p).toLowerCase().includes(term)
    );
  }, [currentStockRows, searchTerm]);

  const filteredLedger = useMemo(() => {
    if (!searchTerm) return stockLedgerRows;
    const term = searchTerm.toLowerCase();
    return stockLedgerRows.filter(row => 
      (row.productName || '').toLowerCase().includes(term) ||
      (row.type || '').toLowerCase().includes(term) ||
      (row.refNumber || '').toLowerCase().includes(term)
    );
  }, [stockLedgerRows, searchTerm]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const handleBack = () => {
    setSelectedProduct(null);
    loadData();
  };

  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-white px-5 py-4 shadow-lg border border-slate-100 ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
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

  const renderProductSummary = () => (
    <div className="rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800">Product Summary</h2>
          <p className="text-sm text-slate-500">Current stock position for all products</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
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
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Current Stock</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Min Level</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Unit</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Purchase Price</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Stock Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => {
                const status = getStockStatus(product.currentStock, product.minStockLevel);
                const stockValue = (product.currentStock || 0) * (product.purchasePrice || 0);
                return (
                  <tr 
                    key={product.productId || product._id || index} 
                    className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 max-w-[200px] truncate">{getProductLabel(product) || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-slate-800">{formatNumber(product.currentStock)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-slate-600">{formatNumber(product.minStockLevel)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-slate-600">{product.unit || 'pcs'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-slate-600">₹{formatNumber(product.purchasePrice)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-emerald-600">₹{formatNumber(stockValue)}</p>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-full bg-slate-100 mb-4">
                      <Boxes className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600">No products found</p>
                    <p className="text-sm text-slate-400 mt-1">Add products to start tracking stock</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetailedLedger = () => (
    <div className="rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-800">{getProductLabel(selectedProduct) || '-'}</h2>
              <p className="text-sm text-slate-500">Stock movement history</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
                placeholder="From Date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
                placeholder="To Date"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={clearDateFilters}
                  className="px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700"
                >
                  Clear
                </button>
              )}
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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 border border-violet-100">
            <Package className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">Current Stock:</span>
            <span className="text-sm font-black text-violet-800">{formatNumber(selectedProduct?.currentStock)}</span>
            <span className="text-xs text-violet-500">{selectedProduct?.unit}</span>
          </div>
          {selectedProduct?.minStockLevel > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Min Level:</span>
              <span className="text-sm font-black text-amber-800">{formatNumber(selectedProduct?.minStockLevel)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Reference</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Party</th>
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
                    <p className="text-sm font-semibold text-slate-800">{formatDate(row.date)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.type === 'cash sale' ? 'bg-emerald-100 text-emerald-700' :
                      row.type === 'credit sale' ? 'bg-blue-100 text-blue-700' :
                      row.type === 'sale' ? 'bg-rose-100 text-rose-700' :
                      row.type === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
                      row.type === 'purchase return' || row.type === 'sale return' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {row.type === 'sale return' ? 'Sale Return' : row.type === 'purchase return' ? 'Purchase Return' : row.type === 'cash sale' ? 'Cash Sale' : row.type === 'credit sale' ? 'Credit Sale' : row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 font-mono">{row.refNumber || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 max-w-[150px] truncate">{row.partyName || '-'}</p>
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-[95%] px-4 py-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
          {selectedProduct ? (
            <>
              <StatCard title="Current Stock" value={formatNumber(selectedProduct.currentStock)} subtitle={selectedProduct.unit} icon={Package} color="from-violet-500 to-purple-500" />
              <StatCard title="Stock In" value={formatNumber(stockSummary.totalIn)} subtitle="units received" icon={ArrowDownLeft} color="from-emerald-500 to-teal-500" />
              <StatCard title="Stock Out" value={formatNumber(stockSummary.totalOut)} subtitle="units dispatched" icon={ArrowUpRight} color="from-rose-500 to-pink-500" trend={-stockSummary.totalOut} />
              <StatCard title="Net Change" value={formatNumber(stockSummary.netChange)} subtitle="in/out difference" icon={stockSummary.netChange >= 0 ? TrendingUp : TrendingDown} color={stockSummary.netChange >= 0 ? "from-emerald-500 to-green-500" : "from-rose-500 to-red-500"} trend={stockSummary.netChange} />
              <StatCard title="Movements" value={formatNumber(stockSummary.movementCount)} subtitle="transactions" icon={Boxes} color="from-blue-500 to-cyan-500" />
              <StatCard 
                title="Stock Value" 
                value={`₹${formatNumber((selectedProduct.currentStock || 0) * (selectedProduct.purchasePrice || 0))}`} 
                subtitle="at purchase price" 
                icon={TrendingUp} 
                color="from-amber-500 to-orange-500" 
              />
            </>
          ) : (
            <>
              <StatCard title="Products" value={formatNumber(stockSummary.trackedItems)} subtitle="active items" icon={Package} color="from-violet-500 to-purple-500" />
              <StatCard title="Stock In" value={formatNumber(stockSummary.totalIn)} subtitle="units received" icon={ArrowDownLeft} color="from-emerald-500 to-teal-500" />
              <StatCard title="Stock Out" value={formatNumber(stockSummary.totalOut)} subtitle="units dispatched" icon={ArrowUpRight} color="from-rose-500 to-pink-500" trend={-stockSummary.totalOut} />
              <StatCard title="Net Change" value={formatNumber(stockSummary.netChange)} subtitle="in/out difference" icon={stockSummary.netChange >= 0 ? TrendingUp : TrendingDown} color={stockSummary.netChange >= 0 ? "from-emerald-500 to-green-500" : "from-rose-500 to-red-500"} trend={stockSummary.netChange} />
              <StatCard title="Low Stock" value={formatNumber(stockSummary.lowStockCount)} subtitle="items need attention" icon={AlertTriangle} color="from-amber-500 to-orange-500" />
              <StatCard title="Total Value" value={`₹${formatNumber(stockSummary.stockValue)}`} subtitle="at purchase price" icon={TrendingUp} color="from-blue-500 to-cyan-500" />
            </>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Loading...</p>
            </div>
          </div>
        ) : selectedProduct ? (
          renderDetailedLedger()
        ) : (
          renderProductSummary()
        )}
      </div>
    </div>
  );
}
