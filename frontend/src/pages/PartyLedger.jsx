import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Search, Users, Wallet, XCircle } from 'lucide-react';
import apiClient from '../utils/api';

const PARTY_TYPE_LABELS = {
  supplier: 'Supplier',
  customer: 'Customer',
  'cash-in-hand': 'Cash In Hand'
};

const formatCurrency = (value) => (
  `Rs ${Math.abs(Number(value || 0)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

const getTypeLabel = (type) => PARTY_TYPE_LABELS[type] || 'Supplier';

const getBalanceTone = (balance) => {
  if (Number(balance || 0) > 0) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (Number(balance || 0) < 0) return 'text-rose-700 bg-rose-50 border-rose-200';
  return 'text-slate-700 bg-slate-50 border-slate-200';
};

const getBalanceLabel = (balance) => {
  const numericBalance = Number(balance || 0);
  if (numericBalance < 0) return `-${formatCurrency(numericBalance)}`;
  return formatCurrency(numericBalance);
};

function StatCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-lg">
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br opacity-10 ${tone}`} />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1 text-xl font-black leading-tight text-slate-800">{value}</p>
          {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2.5 text-white ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PartyLedger() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const popup = document.querySelector('.fixed.inset-0.z-50');
      if (popup) return;
      event.preventDefault();
      navigate('/');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [partiesResponse, ledgerResponse] = await Promise.all([
        apiClient.get('/parties'),
        apiClient.get('/reports/party-ledger')
      ]);
      setParties(partiesResponse.data || []);
      setLedgerEntries(ledgerResponse.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load party ledger');
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    const movementByParty = ledgerEntries.reduce((acc, entry) => {
      if (!entry?.partyId) return acc;
      const key = String(entry.partyId);
      acc.set(key, (acc.get(key) || 0) + Number(entry.impact || 0));
      return acc;
    }, new Map());

    return parties
      .map((party) => {
        const openingBalance = Number(party.openingBalance || 0);
        const runningBalance = openingBalance + Number(movementByParty.get(String(party._id)) || 0);
        return {
          ...party,
          runningBalance
        };
      })
      .sort((first, second) => {
        const firstBalance = Math.abs(Number(first.runningBalance || 0));
        const secondBalance = Math.abs(Number(second.runningBalance || 0));
        if (secondBalance !== firstBalance) return secondBalance - firstBalance;
        return String(first.name || '').localeCompare(String(second.name || ''));
      });
  }, [ledgerEntries, parties]);

  const visibleRows = useMemo(() => {
    const normalizedSearch = String(searchTerm || '').trim().toLowerCase();
    if (!normalizedSearch) return rows;

    return rows.filter((party) => (
      String(party.name || '').toLowerCase().includes(normalizedSearch)
      || String(getTypeLabel(party.type)).toLowerCase().includes(normalizedSearch)
      || String(party.mobile || '').toLowerCase().includes(normalizedSearch)
    ));
  }, [rows, searchTerm]);

  const summary = useMemo(() => rows.reduce((acc, party) => {
    const balance = Number(party.runningBalance || 0);
    acc.totalParties += 1;
    if (balance > 0) acc.receivable += balance;
    if (balance < 0) acc.payable += Math.abs(balance);
    return acc;
  }, {
    totalParties: 0,
    receivable: 0,
    payable: 0
  }), [rows]);

  const handleRowClick = (party) => {
    if (!party?._id) return;
    navigate(`/party/${party._id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-[95%] px-4 py-6">
        {error ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-lg">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700" aria-label="Dismiss error">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Parties" value={summary.totalParties.toLocaleString('en-IN')} subtitle="ledger accounts" icon={Users} tone="from-blue-500 to-cyan-500" />
          <StatCard title="Receivable" value={formatCurrency(summary.receivable)} subtitle="amount to receive" icon={ArrowUpRight} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Payable" value={formatCurrency(summary.payable)} subtitle="amount to pay" icon={ArrowDownLeft} tone="from-rose-500 to-pink-500" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-800">Party Ledger</h1>
              <p className="mt-1 text-sm text-slate-500">Party name, type, and current running balance</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search party..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-72"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-500">Loading party ledger...</p>
              </div>
            </div>
          ) : visibleRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Party Type</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((party) => (
                    <tr
                      key={party._id}
                      onClick={() => handleRowClick(party)}
                      className="cursor-pointer transition-colors hover:bg-emerald-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-2 text-white">
                            <Wallet className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="max-w-[280px] truncate text-sm font-bold text-slate-800">{party.name || '-'}</p>
                            {party.mobile ? <p className="mt-0.5 text-xs font-medium text-slate-400">{party.mobile}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {getTypeLabel(party.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-black ${getBalanceTone(party.runningBalance)}`}>
                          {getBalanceLabel(party.runningBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-600">No party ledger data found</p>
              <p className="mt-1 text-sm text-slate-400">Try clearing the search or add parties first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
