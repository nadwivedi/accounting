import { useEffect, useState } from 'react';
import { Plus, ReceiptIndianRupee, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

const TOAST_OPTIONS = { autoClose: 1200 };

const getInitialForm = () => ({
  expenseGroup: '',
  party: '',
  amount: '',
  method: 'cash',
  expenseDate: new Date().toISOString().split('T')[0],
  notes: ''
});

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (value) => (
  value
    ? new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    : '-'
);

const getMethodBadgeClass = (method) => {
  const normalized = String(method || '').toLowerCase();
  if (normalized === 'cash') return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'bank') return 'border border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'upi') return 'border border-violet-200 bg-violet-50 text-violet-700';
  if (normalized === 'card') return 'border border-amber-200 bg-amber-50 text-amber-700';
  if (normalized === 'credit') return 'border border-rose-200 bg-rose-50 text-rose-700';
  return 'border border-slate-200 bg-slate-100 text-slate-700';
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [expenseGroups, setExpenseGroups] = useState([]);
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchExpenseGroups();
    fetchParties();
  }, []);

  const getFromDateByFilter = () => {
    const now = new Date();
    if (dateFilter === '7d') {
      now.setDate(now.getDate() - 7);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '30d') {
      now.setDate(now.getDate() - 30);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '3m') {
      now.setMonth(now.getMonth() - 3);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '6m') {
      now.setMonth(now.getMonth() - 6);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '1y') {
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString().split('T')[0];
    }
    return '';
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/expenses', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
      setExpenses(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseGroups = async () => {
    try {
      const response = await apiClient.get('/expense-groups');
      setExpenseGroups(response.data || []);
    } catch (err) {
      console.error('Error fetching expense groups:', err);
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

    if (!formData.expenseGroup) {
      setError('Expense group is required');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/expenses', {
        expenseGroup: formData.expenseGroup,
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        expenseDate: formData.expenseDate ? new Date(formData.expenseDate) : new Date(),
        notes: formData.notes
      });

      handleCloseForm();
      fetchExpenses();
      setError('');
      toast.success('Expense created successfully', TOAST_OPTIONS);
    } catch (err) {
      setError(err.message || 'Error creating expense');
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const usedGroups = new Set(expenses.map((item) => item.expenseGroup?._id).filter(Boolean)).size;
  const currentMonthTotal = expenses.reduce((sum, item) => {
    const expenseDate = new Date(item.expenseDate);
    const now = new Date();
    if (
      expenseDate.getMonth() === now.getMonth()
      && expenseDate.getFullYear() === now.getFullYear()
    ) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Expense Count</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{totalExpenses}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Amount</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-500 to-sky-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Groups Used</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{usedGroups}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">This Month</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{formatCurrency(currentMonthTotal)}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 sm:h-1"></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            {expenseGroups.length === 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Create an expense group first, then add expenses under that head.
              </div>
            )}

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-56"
              >
                <option value="">Expense History - All Time</option>
                <option value="7d">Expense History - 7 Days</option>
                <option value="30d">Expense History - 30 Days</option>
                <option value="3m">Expense History - 3 Months</option>
                <option value="6m">Expense History - 6 Months</option>
                <option value="1y">Expense History - 1 Year</option>
              </select>

              <button
                type="button"
                onClick={handleOpenForm}
                disabled={expenseGroups.length === 0}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>
          </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div
            className="w-full max-w-5xl rounded-[28px] border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <ReceiptIndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Add Expense</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Record an expense entry with the same flow as party management.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="h-10 w-10 rounded-full border border-slate-300 text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              onKeyDown={(event) => handlePopupFormKeyDown(event, handleCloseForm)}
              className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Expense Group</label>
                <select
                  name="expenseGroup"
                  value={formData.expenseGroup}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
                  required
                >
                  <option value="">Select expense group</option>
                  {expenseGroups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Party</label>
                <select
                  name="party"
                  value={formData.party}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
                >
                  <option value="">Select party (optional)</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Expense Date</label>
                <input
                  type="date"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Method</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="credit">Credit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700"
                  placeholder="Optional note"
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Expense'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="space-y-3 md:hidden">
                {expenses.map((expense) => (
                  <article
                    key={expense._id}
                    className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_16px_32px_rgba(8,47,73,0.10)]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-cyan-900/20 bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] px-4 py-3 text-white">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{expense.expenseGroup?.name || 'Expense'}</p>
                        <p className="mt-1 text-xs text-cyan-100">{formatDate(expense.expenseDate)}</p>
                      </div>
                      <div className="rounded-xl bg-white/15 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100">Amount</p>
                        <p className="mt-1 text-sm font-bold text-white">{formatCurrency(expense.amount)}</p>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-cyan-50 px-3 py-2.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">Party</span>
                        <span className="text-right font-semibold text-slate-800">{expense.party?.name || '-'}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 px-3 py-2.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-sky-700">Method</span>
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMethodBadgeClass(expense.method)}`}>
                          {expense.method}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Notes</p>
                        <p className="mt-1 break-words text-sm text-slate-700">{expense.notes || '-'}</p>
                      </div>
                    </div>
                  </article>
                ))}

                {expenses.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
                    No expenses found
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap overflow-hidden">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Date</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Expense Group</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Amount</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Method</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-medium text-slate-700">
                          {formatDate(expense.expenseDate)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">
                          {expense.expenseGroup?.name || '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{expense.party?.name || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMethodBadgeClass(expense.method)}`}>
                            {expense.method}
                          </span>
                        </td>
                        <td className="border border-slate-400 px-4 py-3">
                          <div className="max-w-[24rem] truncate">{expense.notes || '-'}</div>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan="6" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                          No expenses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
