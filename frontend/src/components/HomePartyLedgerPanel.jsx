import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingDown, TrendingUp, Users } from 'lucide-react';
import apiClient from '../utils/api';

const formatCurrency = (value) => (
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

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

export default function HomePartyLedgerPanel({ dateRange = null }) {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [partiesRes, ledgerRes] = await Promise.all([
          apiClient.get('/parties'),
          apiClient.get('/reports/party-ledger', {
            params: {
              fromDate: dateRange?.fromDate || '',
              toDate: dateRange?.toDate || ''
            }
          })
        ]);
        setParties(partiesRes.data || []);
        setLedgerEntries(ledgerRes.data || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load party ledger');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange?.fromDate, dateRange?.toDate]);

  const rows = useMemo(() => {
    const balanceByParty = ledgerEntries.reduce((acc, entry) => {
      if (!entry?.partyId) return acc;
      const key = String(entry.partyId);
      acc.set(key, (acc.get(key) || 0) + Number(entry.impact || 0));
      return acc;
    }, new Map());

    return parties.map((party) => {
      const netBalance = Number(balanceByParty.get(String(party._id)) || 0);
      return {
        ...party,
        receivable: netBalance > 0 ? netBalance : 0,
        payable: netBalance < 0 ? Math.abs(netBalance) : 0
      };
    })
      .filter((party) => party.receivable > 0 || party.payable > 0)
      .sort((a, b) => (Number(b.receivable || 0) + Number(b.payable || 0)) - (Number(a.receivable || 0) + Number(a.payable || 0)));
  }, [ledgerEntries, parties]);

  const totalReceivable = rows.reduce((sum, party) => sum + Number(party.receivable || 0), 0);
  const totalPayable = rows.reduce((sum, party) => sum + Number(party.payable || 0), 0);
  const visibleRows = rows.slice(0, 8);

  const handlePartyClick = (party) => {
    if (!party?._id) return;
    navigate(`/party/${party._id}`);
  };

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Live Preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">Party Ledger</h2>
            {dateRange?.label ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{dateRange.label}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard title="Parties" value={parties.length} icon={Users} tone="from-blue-500 to-cyan-500" />
          <StatCard title="Receivable" value={formatCurrency(totalReceivable)} icon={TrendingUp} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Payable" value={formatCurrency(totalPayable)} icon={TrendingDown} tone="from-rose-500 to-pink-500" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Loading party ledger...</div>
          ) : visibleRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Mobile</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Receivable</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((party) => (
                    <tr
                      key={party._id}
                      onClick={() => handlePartyClick(party)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{party.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 capitalize">{party.type || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{party.mobile || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{party.receivable > 0 ? formatCurrency(party.receivable) : '-'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-rose-600">{party.payable > 0 ? formatCurrency(party.payable) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <RefreshCw className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">No party ledger data found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
