import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, RotateCcw, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import { handlePopupFormKeyDown } from '../../utils/popupFormKeyboard';

const TOAST_OPTIONS = { autoClose: 1200 };

const PAYMENT_METHODS = ['cash', 'bank', 'upi', 'card', 'other'];

const getInitialForm = () => ({
  party: '',
  amount: '',
  method: 'cash',
  voucherDate: new Date().toISOString().split('T')[0],
  referenceNo: '',
  debitAccount: '',
  creditAccount: '',
  notes: ''
});

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => (
  value ? new Date(value).toLocaleDateString('en-GB') : '-'
);

const getMethodBadgeClass = (method) => {
  const normalized = String(method || '').toLowerCase();
  if (normalized === 'cash') return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'bank') return 'border border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'upi') return 'border border-violet-200 bg-violet-50 text-violet-700';
  if (normalized === 'card') return 'border border-amber-200 bg-amber-50 text-amber-700';
  return 'border border-slate-200 bg-slate-100 text-slate-700';
};

export default function SaleReturn() {
  const [entries, setEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(getInitialForm());

  useEffect(() => {
    fetchEntries();
  }, [search]);

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey) return;
      if (key !== 'n') return;
      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sale-returns', { params: { search } });
      setEntries(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching sale returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties');
      setParties(response.data || []);
    } catch (err) {
      console.error('Error fetching parties:', err);
    }
  };

  const totalAmount = useMemo(
    () => entries.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [entries]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(getInitialForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.party) {
      setError('Party is required');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (!String(formData.debitAccount || '').trim()) {
      setError('Debit account is required');
      return;
    }

    if (!String(formData.creditAccount || '').trim()) {
      setError('Credit account is required');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/sale-returns', {
        party: formData.party,
        amount: Number(formData.amount),
        method: formData.method || 'cash',
        voucherDate: formData.voucherDate ? new Date(formData.voucherDate) : new Date(),
        referenceNo: String(formData.referenceNo || '').trim(),
        debitAccount: String(formData.debitAccount || '').trim(),
        creditAccount: String(formData.creditAccount || '').trim(),
        notes: String(formData.notes || '').trim()
      });

      toast.success('Sale return voucher created successfully', TOAST_OPTIONS);
      handleCloseForm();
      fetchEntries();
      setError('');
    } catch (err) {
      setError(err.message || 'Error creating sale return voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Sale Return Count</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{entries.length}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
                <RotateCcw className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Return Amount</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  <span className="mr-1 text-[10px] font-medium text-slate-400 sm:text-base">Rs</span>
                  {totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 sm:flex">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1"></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sale returns..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                onClick={handleOpenForm}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
              >
                + Add Sale Return
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Voucher No</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Debit Account</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Credit Account</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Method</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Date</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Reference</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">{entry.voucherNumber || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.party?.name || entry.party?.partyName || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.debitAccount || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.creditAccount || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMethodBadgeClass(entry.method)}`}>
                            {entry.method || '-'}
                          </span>
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{formatDate(entry.voucherDate)}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.referenceNo || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-emerald-700">{formatCurrency(entry.amount)}</td>
                      </tr>
                    ))}
                    {!entries.length && (
                      <tr>
                        <td colSpan="8" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                          No sale returns found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/60 p-1.5 backdrop-blur-[1.5px] sm:p-2"
            onClick={handleCloseForm}
          >
            <div
              className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:w-[78vw] md:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-2 text-white md:px-4 md:py-2.5">
                <div>
                  <h2 className="text-lg font-bold md:text-2xl">Sale Return Voucher</h2>
                  <p className="mt-1 text-xs text-cyan-100 md:text-sm">
                    Select the party, enter return accounts, and save the sale return voucher.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-lg p-1.5 text-white transition hover:bg-white/25 md:p-2"
                  aria-label="Close popup"
                >
                  &times;
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                onKeyDown={(event) => handlePopupFormKeyDown(event, handleCloseForm)}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
                  <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,0.95fr)_1px_minmax(0,1.35fr)]">
                    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                      <h3 className="mb-4 text-base font-bold text-gray-800 md:text-lg">Voucher Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Party *</label>
                          <select
                            name="party"
                            value={formData.party}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          >
                            <option value="">Select party</option>
                            {parties.map((party) => (
                              <option key={party._id} value={party._id}>
                                {party.name || party.partyName || 'Party'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Voucher Date</label>
                          <input
                            type="date"
                            name="voucherDate"
                            value={formData.voucherDate}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Amount *</label>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            placeholder="Enter return amount"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Reference No</label>
                          <input
                            type="text"
                            name="referenceNo"
                            value={formData.referenceNo}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            placeholder="Optional reference number"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hidden w-px bg-slate-300 lg:block" aria-hidden="true"></div>

                    <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-gray-800 md:text-lg">Return Posting</h3>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          Amount: {formatCurrency(formData.amount || 0)}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Debit Account *</label>
                          <input
                            type="text"
                            name="debitAccount"
                            value={formData.debitAccount}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Enter debit account"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Credit Account *</label>
                          <input
                            type="text"
                            name="creditAccount"
                            value={formData.creditAccount}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Enter credit account"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Method</label>
                          <select
                            name="method"
                            value={formData.method}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>
                                {method.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Notes</label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="4"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Reason for sale return or additional note"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-3 py-2.5 md:flex-row md:px-4 md:py-3">
                  <div className="text-sm font-semibold text-slate-700">
                    Return Total: <span className="text-emerald-700">{formatCurrency(formData.amount || 0)}</span>
                  </div>
                  <div className="flex w-full gap-2 md:w-auto md:gap-3">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-6"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-8"
                    >
                      {saving ? 'Saving...' : 'Save Sale Return'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
