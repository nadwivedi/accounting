import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function StockGroups() {
  const toastOptions = { autoClose: 1200 };

  const initialFormData = {
    name: '',
    description: ''
  };

  const [stockGroups, setStockGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const nameInputRef = useRef(null);

  useEffect(() => {
    fetchStockGroups();
  }, [search]);

  useEffect(() => {
    if (!showForm) return;

    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [showForm, editingId]);

  const fetchStockGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/stock-groups', {
        params: { search }
      });
      setStockGroups(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching stock groups');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Stock group name is required');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);
      if (editingId) {
        await apiClient.put(`/stock-groups/${editingId}`, formData);
      } else {
        await apiClient.post('/stock-groups', formData);
      }
      toast.success(
        isEditMode ? 'Stock group updated successfully' : 'Stock group added successfully',
        toastOptions
      );
      fetchStockGroups();
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving stock group');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stockGroup) => {
    setFormData(stockGroup);
    setEditingId(stockGroup._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock group?')) {
      try {
        await apiClient.delete(`/stock-groups/${id}`);
        fetchStockGroups();
      } catch (err) {
        setError(err.message || 'Error deleting stock group');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const totalStockGroups = stockGroups.length;

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-20 md:p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500">Total Stock Group</p>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{totalStockGroups}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-600 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  {editingId ? 'Edit Stock Group' : 'Add New Stock Group'}
                </h2>
                <p className="text-sm text-slate-300 mt-1">Name is required. Description is optional.</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 w-9 rounded-full border border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-300 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="space-y-5 px-6 py-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Stock Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  ref={nameInputRef}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Enter stock group name"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Enter description"
                  rows="3"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Stock Group' : 'Save Stock Group'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search + Add */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search stock group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 transition shadow-sm whitespace-nowrap"
        >
          + Add Stock Group
        </button>
      </div>

      {/* Stock Group List */}
      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : stockGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No stock group found. Create your first stock group!
        </div>
      ) : (
        <div className="darkish-table-shell rounded-2xl overflow-hidden">
          <table className="darkish-table w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockGroups.map((group) => (
                <tr key={group._id} className="border-b border-slate-100 transition-colors hover:bg-slate-700/[0.06]">
                  <td className="px-6 py-3 font-medium text-slate-800">{group.name}</td>
                  <td className="px-6 py-3 text-gray-600">{group.description || '-'}</td>
                  <td className="px-6 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(group._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

