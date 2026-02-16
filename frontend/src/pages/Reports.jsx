import { useEffect, useState } from 'react';
import apiClient from '../utils/api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('outstanding');
  const [outstanding, setOutstanding] = useState(null);
  const [partyLedger, setPartyLedger] = useState([]);
  const [stockLedger, setStockLedger] = useState({ ledger: [], currentStock: [] });
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLookups();
    fetchOutstanding();
    fetchPartyLedger();
    fetchStockLedger();
  }, []);

  const fetchLookups = async () => {
    try {
      const [partyRes, productRes] = await Promise.all([
        apiClient.get('/parties'),
        apiClient.get('/products')
      ]);
      setParties(partyRes.data || []);
      setProducts(productRes.data || []);
    } catch (err) {
      console.error('Lookup fetch failed', err);
    }
  };

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/outstanding');
      setOutstanding(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading outstanding report');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartyLedger = async (selectedPartyId = partyId) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/party-ledger', {
        params: { partyId: selectedPartyId || undefined }
      });
      setPartyLedger(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading party ledger');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLedger = async (selectedProductId = productId) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reports/stock-ledger', {
        params: { productId: selectedProductId || undefined }
      });
      setStockLedger(response.data || { ledger: [], currentStock: [] });
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading stock ledger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-64 p-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600 mt-2">Party ledger, stock ledger and pending amount</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'outstanding' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('partyLedger')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'partyLedger' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Party Ledger
        </button>
        <button
          onClick={() => setActiveTab('stockLedger')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'stockLedger' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Stock Ledger
        </button>
      </div>

      {loading && (
        <div className="mb-4 text-slate-500">Loading...</div>
      )}

      {activeTab === 'outstanding' && outstanding && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Sale Pending</p>
              <p className="text-2xl font-bold text-amber-900">Rs {Number(outstanding.totals?.totalSalePending || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-700">Purchase Pending</p>
              <p className="text-2xl font-bold text-rose-900">Rs {Number(outstanding.totals?.totalPurchasePending || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Receivable</p>
              <p className="text-2xl font-bold text-emerald-900">Rs {Number(outstanding.totals?.totalReceivable || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm text-violet-700">Payable</p>
              <p className="text-2xl font-bold text-violet-900">Rs {Number(outstanding.totals?.totalPayable || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <h3 className="px-6 py-4 font-semibold text-slate-800 border-b border-slate-200">Party Outstanding</h3>
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Party</th>
                  <th className="px-6 py-3 text-left">Receivable</th>
                  <th className="px-6 py-3 text-left">Payable</th>
                  <th className="px-6 py-3 text-left">Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {(outstanding.partyOutstanding || []).map((row) => (
                  <tr key={row.partyId} className="border-b border-slate-100">
                    <td className="px-6 py-3">{row.partyName}</td>
                    <td className="px-6 py-3 text-emerald-700">Rs {Number(row.receivable || 0).toFixed(2)}</td>
                    <td className="px-6 py-3 text-rose-700">Rs {Number(row.payable || 0).toFixed(2)}</td>
                    <td className={`px-6 py-3 ${Number(row.netBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Rs {Number(row.netBalance || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'partyLedger' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full md:w-80 bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">All Parties</option>
              {parties.map((party) => (
                <option key={party._id} value={party._id}>{party.partyName}</option>
              ))}
            </select>
            <button
              onClick={() => fetchPartyLedger(partyId)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700"
            >
              Load Ledger
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Party</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {partyLedger.map((row, idx) => (
                  <tr key={`${row.refId}-${idx}`} className="border-b border-slate-100">
                    <td className="px-6 py-3">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 capitalize">{row.type}</td>
                    <td className="px-6 py-3">{row.partyName}</td>
                    <td className="px-6 py-3">Rs {Number(row.amount || 0).toFixed(2)}</td>
                    <td className={`px-6 py-3 ${Number(row.runningBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Rs {Number(row.runningBalance || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {!loading && partyLedger.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No ledger data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stockLedger' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full md:w-80 bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
            <button
              onClick={() => fetchStockLedger(productId)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700"
            >
              Load Stock Ledger
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">In Qty</th>
                  <th className="px-6 py-3 text-left">Out Qty</th>
                  <th className="px-6 py-3 text-left">Running Qty</th>
                </tr>
              </thead>
              <tbody>
                {(stockLedger.ledger || []).map((row, idx) => (
                  <tr key={`${row.refId}-${idx}`} className="border-b border-slate-100">
                    <td className="px-6 py-3">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{row.productName}</td>
                    <td className="px-6 py-3 capitalize">{row.type}</td>
                    <td className="px-6 py-3 text-emerald-700">{Number(row.inQty || 0)}</td>
                    <td className="px-6 py-3 text-rose-700">{Number(row.outQty || 0)}</td>
                    <td className="px-6 py-3">{Number(row.runningQty || 0)}</td>
                  </tr>
                ))}
                {!loading && (stockLedger.ledger || []).length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No stock movement found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
