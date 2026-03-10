import { useEffect, useState } from 'react';
import { Layers3, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

const TOAST_OPTIONS = { autoClose: 1200 };

const getInitialForm = () => ({
  name: '',
  description: '',
  isActive: true
});

export default function ExpenseGroups() {
  const [expenseGroups, setExpenseGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getInitialForm());

  useEffect(() => {
    fetchExpenseGroups();
  }, [search]);

  const fetchExpenseGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/expense-groups', { params: { search } });
      setExpenseGroups(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching expense groups');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(getInitialForm());
  };

  const handleEdit = (expenseGroup) => {
    setFormData({
      name: expenseGroup.name || '',
      description: expenseGroup.description || '',
      isActive: Boolean(expenseGroup.isActive)
    });
    setEditingId(expenseGroup._id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!String(formData.name || '').trim()) {
      setError('Expense group name is required');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await apiClient.put(`/expense-groups/${editingId}`, formData);
        toast.success('Expense group updated successfully', TOAST_OPTIONS);
      } else {
        await apiClient.post('/expense-groups', formData);
        toast.success('Expense group created successfully', TOAST_OPTIONS);
      }

      handleCloseForm();
      fetchExpenseGroups();
    } catch (err) {
      setError(err.message || 'Error saving expense group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense group?')) return;

    try {
      await apiClient.delete(`/expense-groups/${id}`);
      toast.success('Expense group deleted successfully', TOAST_OPTIONS);
      fetchExpenseGroups();
    } catch (err) {
      setError(err.message || 'Error deleting expense group');
    }
  };

  const totalGroups = expenseGroups.length;
  const activeGroups = expenseGroups.filter((item) => item.isActive).length;
  const inactiveGroups = totalGroups - activeGroups;

  return (
    <div className="min-h-screen bg-[#f3f6fb] p-4 pt-16 md:ml-[13.25rem] md:px-8 md:pb-8 md:pt-5">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Total Groups</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalGroups}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{activeGroups}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">{inactiveGroups}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Search expense group..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="button"
          onClick={handleOpenForm}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Expense Group
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div
            className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingId ? 'Edit Expense Group' : 'Add Expense Group'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Create heads like Electricity, Rent, Transport, or Repairs.
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
              className="space-y-5 px-6 py-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Expense Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Enter expense group name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Optional description"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={Boolean(formData.isActive)}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                />
                Keep this expense group active
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Expense Group' : 'Save Expense Group'}
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
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em]">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenseGroups.map((expenseGroup) => (
                <tr key={expenseGroup._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{expenseGroup.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{expenseGroup.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expenseGroup.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {expenseGroup.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(expenseGroup)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(expenseGroup._id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && expenseGroups.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-slate-500">
                    No expense groups found. Add your first expense group.
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
