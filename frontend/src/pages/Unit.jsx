import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Unit() {
  const toastOptions = { autoClose: 1200 };

  const initialFormData = {
    name: '',
    description: '',
    isActive: true
  };

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchUnits();
  }, [search]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/units', { params: { search } });
      setUnits(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching units');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Unit name is required');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await apiClient.put(`/units/${editingId}`, formData);
        toast.success('Unit updated successfully', toastOptions);
      } else {
        await apiClient.post('/units', formData);
        toast.success('Unit added successfully', toastOptions);
      }
      fetchUnits();
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving unit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit) => {
    setFormData({
      name: unit.name || '',
      description: unit.description || '',
      isActive: Boolean(unit.isActive)
    });
    setEditingId(unit._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this unit?')) {
      try {
        await apiClient.delete(`/units/${id}`);
        toast.success('Unit deleted successfully', toastOptions);
        fetchUnits();
      } catch (err) {
        setError(err.message || 'Error deleting unit');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const totalUnits = units.length;
  const activeUnits = units.filter((unit) => unit.isActive).length;
  const inactiveUnits = totalUnits - activeUnits;

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500">Total Units</p>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{totalUnits}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-green-700">Active</p>
          <p className="text-xl md:text-2xl font-bold text-green-800 mt-1">{activeUnits}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-red-700">Inactive</p>
          <p className="text-xl md:text-2xl font-bold text-red-800 mt-1">{inactiveUnits}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? 'Edit Unit' : 'Add Unit'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Used in stock item master</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 w-9 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="space-y-5 px-6 py-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Unit Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter unit name (e.g. pcs, kg)"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter description"
                  rows="3"
                />
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={Boolean(formData.isActive)}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                  />
                  Active
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Unit' : 'Save Unit'}
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

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Unit
        </button>
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : units.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No unit found. Add your first unit.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{unit.name}</td>
                  <td className="px-6 py-3 text-gray-600">{unit.description || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      unit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {unit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 space-x-2">
                    <button onClick={() => handleEdit(unit)} className="text-blue-600 hover:text-blue-800 font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(unit._id)} className="text-red-600 hover:text-red-800 font-medium">
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
