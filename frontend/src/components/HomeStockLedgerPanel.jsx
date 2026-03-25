import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Boxes, Package, TrendingUp } from 'lucide-react';
import apiClient from '../utils/api';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');
const getProductLabel = (product) => String(product?.productName || product?.name || '').trim();

function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 text-lg font-black text-slate-800">{value}</p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2 text-white ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function HomeStockLedgerPanel() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/products');
        setProducts(response.data || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load stock ledger');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalCurrentStock = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.currentStock || 0), 0),
    [products]
  );
  const totalStockValue = useMemo(
    () => products.reduce((sum, product) => sum + (Number(product.currentStock || 0) * Number(product.purchasePrice || 0)), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.currentStock || 0) <= Number(product.minStockLevel || 0)).length,
    [products]
  );
  const visibleRows = products.slice(0, 8);

  const handleProductClick = (product) => {
    const productId = product?._id || product?.productId;
    if (!productId) return;
    navigate(`/stock/${productId}`);
  };

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Live Preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">Stock Ledger</h2>
          </div>
          <Link
            to="/reports/stock-ledger"
            className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            Open Full Stock Ledger
          </Link>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard title="Items" value={formatNumber(products.length)} icon={Package} tone="from-violet-500 to-purple-500" />
          <StatCard title="Total Stock" value={formatNumber(totalCurrentStock)} icon={ArrowDownLeft} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Low Stock" value={formatNumber(lowStockCount)} icon={ArrowUpRight} tone="from-rose-500 to-pink-500" />
          <StatCard title="Stock Value" value={`Rs ${formatNumber(totalStockValue)}`} icon={Boxes} tone="from-blue-500 to-cyan-500" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Loading stock ledger...</div>
          ) : visibleRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Current Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Min Level</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Purchase Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((row, index) => (
                    <tr
                      key={`${row.productId || row._id || getProductLabel(row)}-${index}`}
                      onClick={() => handleProductClick(row)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{getProductLabel(row) || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{formatNumber(row.currentStock)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">{formatNumber(row.minStockLevel)}</td>
                      <td className="px-4 py-3 text-right text-sm text-emerald-700">Rs {formatNumber(row.purchasePrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <TrendingUp className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">No stock ledger data found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
