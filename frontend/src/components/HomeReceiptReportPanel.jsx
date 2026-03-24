import { useEffect, useMemo, useState } from 'react';
import { BanknoteArrowDown, IndianRupee, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/api';

const formatCurrency = (value) => (
  `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
);

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

export default function HomeReceiptReportPanel() {
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReceipts = async () => {
      try {
        setLoading(true);
        const [receiptResponse, partyResponse] = await Promise.all([
          apiClient.get('/receipts'),
          apiClient.get('/parties')
        ]);
        setReceipts(receiptResponse.data || []);
        setParties(partyResponse.data || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load money received report');
      } finally {
        setLoading(false);
      }
    };

    loadReceipts();
  }, []);

  const sortedReceipts = useMemo(() => (
    [...receipts].sort((a, b) => new Date(b.receiptDate || 0).getTime() - new Date(a.receiptDate || 0).getTime())
  ), [receipts]);

  const partyNameMap = useMemo(
    () => new Map((parties || []).map((party) => [String(party._id), String(party.name || party.partyName || 'Party').trim() || 'Party'])),
    [parties]
  );

  const getPartyName = (receipt) => {
    if (receipt?.party && typeof receipt.party === 'object') {
      return String(receipt.party.name || receipt.party.partyName || receipt.party.customerName || '').trim() || '-';
    }

    if (receipt?.partyName) {
      return String(receipt.partyName).trim() || '-';
    }

    return partyNameMap.get(String(receipt?.party || '')) || '-';
  };

  const totalAmount = sortedReceipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
  const visibleReceipts = sortedReceipts.slice(0, 8);

  return (
    <section className="w-full rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Live Preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-800">Money Received Report</h2>
          </div>
          <Link
            to="/reports/receipt-report"
            className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            Open Full Money Received Report
          </Link>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard title="Receipts" value={sortedReceipts.length} icon={ReceiptText} tone="from-sky-500 to-cyan-500" />
          <StatCard title="Received Total" value={formatCurrency(totalAmount)} icon={IndianRupee} tone="from-emerald-500 to-teal-500" />
          <StatCard title="Methods" value={new Set(sortedReceipts.map((receipt) => receipt.method || '-')).size} icon={BanknoteArrowDown} tone="from-violet-500 to-purple-500" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500">Loading money received report...</div>
          ) : visibleReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Voucher No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Party</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em]">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.14em]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleReceipts.map((receipt) => (
                    <tr key={receipt._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(receipt.receiptDate)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{receipt.voucherNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{getPartyName(receipt)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{receipt.method || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">{formatCurrency(receipt.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <ReceiptText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">No money received report data found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
