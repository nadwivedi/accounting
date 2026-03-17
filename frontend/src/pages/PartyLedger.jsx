import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, Search, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import apiClient from '../utils/api';

const formatCurrency = (value) => (
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

export default function PartyLedger() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [outstanding, setOutstanding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    setLoading(true);
    setError('');
    try {
      const [partiesRes, outstandingRes] = await Promise.all([
        apiClient.get('/parties'),
        apiClient.get('/reports/outstanding')
      ]);
      setParties(partiesRes.data || []);
      setOutstanding(outstandingRes.data || null);
    } catch (err) {
      setError(err.message || 'Error loading parties');
    } finally {
      setLoading(false);
    }
  };

  const partySummary = useMemo(() => {
    if (!outstanding?.partyOutstanding) return [];
    const partyOutstanding = outstanding.partyOutstanding;
    
    return parties.map(party => {
      const outstandingData = partyOutstanding.find(p => 
        String(p.partyId) === String(party._id)
      );
      return {
        ...party,
        receivable: outstandingData?.receivable || 0,
        payable: outstandingData?.payable || 0,
        netBalance: (outstandingData?.receivable || 0) - (outstandingData?.payable || 0)
      };
    });
  }, [parties, outstanding]);

  const filteredParties = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return partySummary
      .filter((party) => {
        const matchesSearch = !searchTerm || (
          (party.name || '').toLowerCase().includes(term) ||
          (party.mobile || '').includes(term) ||
          (party.email || '').toLowerCase().includes(term)
        );

        if (!matchesSearch) return false;
        if (balanceFilter === 'receivable') return Number(party.receivable || 0) > 0;
        if (balanceFilter === 'payable') return Number(party.payable || 0) > 0;
        return true;
      })
      .sort((a, b) => {
        if (balanceFilter === 'receivable') {
          return Number(b.receivable || 0) - Number(a.receivable || 0);
        }
        if (balanceFilter === 'payable') {
          return Number(b.payable || 0) - Number(a.payable || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [partySummary, searchTerm, balanceFilter]);

  const totalReceivable = useMemo(() => {
    return partySummary.reduce((sum, p) => sum + Number(p.receivable || 0), 0);
  }, [partySummary]);

  const totalPayable = useMemo(() => {
    return partySummary.reduce((sum, p) => sum + Number(p.payable || 0), 0);
  }, [partySummary]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
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
        <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
      </div>
    </div>
  );

  const handlePartyClick = (party) => {
    navigate(`/party/${party._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mx-auto" />
          <p className="mt-4 text-slate-600 font-semibold">Loading parties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-[95%] px-4 py-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard title="Total Parties" value={parties.length} subtitle="registered parties" icon={Users} color="from-blue-500 to-cyan-500" />
              <StatCard title="Total Receivable" value={formatCurrency(totalReceivable)} subtitle="to receive" icon={TrendingUp} color="from-emerald-500 to-teal-500" />
              <StatCard title="Total Payable" value={formatCurrency(totalPayable)} subtitle="to pay" icon={TrendingDown} color="from-rose-500 to-pink-500" />
            </div>

            <div className="rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden mb-6">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">All Parties</h2>
                    <p className="text-sm text-slate-500">Click on a party to view ledger details</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={balanceFilter}
                      onChange={(e) => setBalanceFilter(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all w-full sm:w-48"
                    >
                      <option value="all">All Balances</option>
                      <option value="receivable">Receivable</option>
                      <option value="payable">Payable</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name, mobile, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all w-full sm:w-72"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Party Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Receivable</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Payable</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Net Balance</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParties.length > 0 ? (
                      filteredParties.map((party) => (
                        <tr 
                          key={party._id} 
                          onClick={() => handlePartyClick(party)}
                          className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                                {(party.name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{party.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-500">{party.email || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              party.type === 'customer' ? 'bg-amber-100 text-amber-700' :
                              party.type === 'supplier' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-cyan-100 text-cyan-700'
                            }`}>
                              {party.type === 'customer' ? 'Customer' : party.type === 'supplier' ? 'Supplier' : 'Cash'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-slate-600">{party.mobile || '-'}</p>
                              <p className="text-xs text-slate-400">{party.state || '-'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-emerald-600">
                              {party.receivable > 0 ? formatCurrency(party.receivable) : '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-rose-600">
                              {party.payable > 0 ? formatCurrency(party.payable) : '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className={`text-sm font-black ${(party.netBalance || 0) >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                              {(party.netBalance || 0) >= 0 ? formatCurrency(party.netBalance) : formatCurrency(party.netBalance)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <ChevronRight className="w-5 h-5 text-slate-400 mx-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="p-4 rounded-full bg-slate-100 mb-4">
                              <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-lg font-semibold text-slate-600">No parties found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
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
