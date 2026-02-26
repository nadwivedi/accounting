import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../utils/api';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getTypeMeta = (type) => {
  if (type === 'sale') {
    return { label: 'Sale', className: 'bg-emerald-100 text-emerald-800' };
  }
  if (type === 'purchase') {
    return { label: 'Purchase', className: 'bg-rose-100 text-rose-800' };
  }
  if (type === 'receipt') {
    return { label: 'Receipt', className: 'bg-blue-100 text-blue-800' };
  }
  if (type === 'payment') {
    return { label: 'Payment', className: 'bg-violet-100 text-violet-800' };
  }
  return { label: type || '-', className: 'bg-slate-100 text-slate-700' };
};

export default function PartyDetail() {
  const { id } = useParams();
  const [party, setParty] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPartyDetails = async (showLoader = true, overrides = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const queryFromDate = overrides.fromDate !== undefined ? overrides.fromDate : fromDate;
      const queryToDate = overrides.toDate !== undefined ? overrides.toDate : toDate;

      const [partyResponse, ledgerResponse] = await Promise.all([
        apiClient.get(`/parties/${id}`),
        apiClient.get('/reports/party-ledger', {
          params: {
            partyId: id,
            fromDate: queryFromDate || undefined,
            toDate: queryToDate || undefined
          }
        })
      ]);

      setParty(partyResponse.data || null);
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
    const totals = {
      sale: 0,
      purchase: 0,
      receipt: 0,
      payment: 0
    };

    (ledger || []).forEach((row) => {
      const amount = Number(row.amount || 0);
      if (row.type === 'sale') totals.sale += amount;
      if (row.type === 'purchase') totals.purchase += amount;
      if (row.type === 'receipt') totals.receipt += amount;
      if (row.type === 'payment') totals.payment += amount;
    });

    return totals;
  }, [ledger]);

  const latestFirstLedger = useMemo(() => {
    return [...(ledger || [])].sort((a, b) => {
      const aTime = new Date(a.date).getTime() || 0;
      const bTime = new Date(b.date).getTime() || 0;
      return bTime - aTime;
    });
  }, [ledger]);

  const handleApplyFilter = async () => {
    await loadPartyDetails(true);
  };

  const handleClearFilter = async () => {
    setFromDate('');
    setToDate('');
    await loadPartyDetails(true, { fromDate: '', toDate: '' });
  };

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-4">
        <Link to="/parties" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          Back to Parties
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{party?.partyName || 'Party Details'}</h1>
        <p className="text-gray-600 mt-2">
          Type: <span className="capitalize">{party?.type || '-'}</span>
          {' | '}
          Phone: {party?.phone || '-'}
          {' | '}
          Email: {party?.email || '-'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-emerald-700">Sales</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-900 mt-1">Rs {summary.sale.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-rose-700">Purchases</p>
          <p className="text-xl md:text-2xl font-bold text-rose-900 mt-1">Rs {summary.purchase.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-blue-700">Receipts</p>
          <p className="text-xl md:text-2xl font-bold text-blue-900 mt-1">Rs {summary.receipt.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-violet-700">Payments</p>
          <p className="text-xl md:text-2xl font-bold text-violet-900 mt-1">Rs {summary.payment.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Filter Transactions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApplyFilter}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleClearFilter}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Reference</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Running Balance</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : latestFirstLedger.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No transaction found for this party</td>
              </tr>
            ) : (
              latestFirstLedger.map((row, index) => {
                const typeMeta = getTypeMeta(row.type);
                return (
                  <tr key={`${row.refId}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3">{formatDate(row.date)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeMeta.className}`}>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">{row.refNumber || '-'}</td>
                    <td className="px-6 py-3">Rs {Number(row.amount || 0).toFixed(2)}</td>
                    <td className={`px-6 py-3 font-medium ${Number(row.runningBalance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Rs {Number(row.runningBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{row.note || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
