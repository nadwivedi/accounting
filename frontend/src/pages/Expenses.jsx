import { useEffect, useState } from 'react';
import { Plus, ReceiptIndianRupee } from 'lucide-react';
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
      const response = await apiClient.get('/expense-groups', {
        params: { isActive: true }
      });
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
    <div className="min-h-screen bg-[#f3f6fb] p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Total Expenses</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalExpenses}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-red-700">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold text-red-900">Rs {totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-700">Groups Used</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-900">{usedGroups}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">This Month</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">Rs {currentMonthTotal.toFixed(2)}</p>
        </div>
      </div>

      {expenseGroups.length === 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Create an expense group first, then add expenses under that head.
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Search by notes, group, or party..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
        <select
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 md:w-56"
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
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div
            className="w-full max-w-5xl rounded-[28px] border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <ReceiptIndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Add Expense</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Record a business expense against a selected expense head.
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
                  className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Expense Group</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Party</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Method</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {expense.expenseGroup?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {expense.party?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-700">
                    Rs {Number(expense.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {expense.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{expense.notes || '-'}</td>
                </tr>
              ))}

              {!loading && expenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
