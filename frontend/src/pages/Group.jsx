import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Search, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Group() {
  const toastOptions = { autoClose: 1200 };
  const navigate = useNavigate();

  const initialFormData = {
    name: '',
    description: '',
    isActive: true
  };

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchGroups();
  }, [search]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/groups', { params: { search } });
      setGroups(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching groups');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const normalizedValue = name === 'name' ? String(value || '').toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : normalizedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedName = String(formData.name || '').trim().toUpperCase();
    if (!normalizedName) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        name: normalizedName
      };
      if (editingId) {
        await apiClient.put(`/groups/${editingId}`, payload);
        toast.success('Group updated successfully', toastOptions);
      } else {
        await apiClient.post('/groups', payload);
        toast.success('Group added successfully', toastOptions);
      }
      fetchGroups();
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving group');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setFormData({
      name: String(group.name || '').toUpperCase(),
      description: group.description || '',
      isActive: Boolean(group.isActive)
    });
    setEditingId(group._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await apiClient.delete(`/groups/${id}`);
        toast.success('Group deleted successfully', toastOptions);
        fetchGroups();
      } catch (err) {
        setError(err.message || 'Error deleting group');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleOpenGroupDetail = (groupId) => {
    if (!groupId) return;
    navigate(`/groups/${groupId}`);
  };
  
  const handleOpenForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowForm(true);
    setError('');
  };

  const totalGroups = groups.length;
  const activeGroups = groups.filter((group) => group.isActive).length;
  const inactiveGroups = totalGroups - activeGroups;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f4ea] via-[#f6f3e9] to-[#eef3f8] p-4 pt-20 md:ml-64 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
            <p className="text-xs md:text-sm text-slate-500">Total Groups</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-slate-800">{totalGroups}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 shadow-sm md:p-4">
            <p className="text-xs md:text-sm text-green-700">Active</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-green-800">{activeGroups}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 shadow-sm md:p-4">
            <p className="text-xs md:text-sm text-red-700">Inactive</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-red-800">{inactiveGroups}</p>
          </div>
        </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-2 sm:p-4 backdrop-blur-[1px]" onClick={handleCancel}>
          <div className="w-full max-w-3xl overflow-hidden border-2 border-[#17395d] bg-[#f7efd8] shadow-[0_28px_75px_-35px_rgba(15,23,42,0.85)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b-2 border-[#17395d] bg-[#1f4f82] px-4 py-2.5 text-white">
              <div>
                <h2 className="text-base font-bold tracking-wide">{editingId ? 'ALTER GROUP' : 'CREATE GROUP'}</h2>
                <p className="mt-0.5 text-[11px] text-blue-100">Accounting master entry screen</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="h-7 w-7 border border-blue-200 bg-[#245a91] text-lg leading-none text-white transition hover:bg-[#2a67a7]"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)}>
              <div className="border-b border-[#c6b98e]">
                <div className="grid grid-cols-1 border-b border-[#c6b98e] md:grid-cols-[220px_1fr]">
                  <label className="border-b border-[#c6b98e] bg-[#efe2bb] px-4 py-2.5 text-sm font-semibold text-[#29425b] md:border-b-0 md:border-r">
                    Group Name *
                  </label>
                  <div className="bg-[#fffdf6] px-3 py-2">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border border-[#9db0c4] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#1f4f82] focus:ring-2 focus:ring-[#1f4f82]/15"
                      placeholder="Enter group name (for example: Sundry Debtors)"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-[#c6b98e] md:grid-cols-[220px_1fr]">
                  <label className="border-b border-[#c6b98e] bg-[#efe2bb] px-4 py-2.5 text-sm font-semibold text-[#29425b] md:border-b-0 md:border-r">
                    Description
                  </label>
                  <div className="bg-[#fffdf6] px-3 py-2">
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      className="h-8 w-full border border-[#9db0c4] bg-white px-3 py-1 text-sm text-slate-800 outline-none transition focus:border-[#1f4f82] focus:ring-2 focus:ring-[#1f4f82]/15"
                      placeholder="Short note for this accounting group"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 bg-[#ede0b8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] font-medium tracking-wide text-[#364e64]">
                  Esc: Cancel | Enter: Save
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="border border-[#8f8a75] bg-[#f7f3e4] px-5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="border border-[#12375b] bg-[#1f4f82] px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-[#275f98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Saving...' : editingId ? 'Update Group' : 'Create Group'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

        <div className="mb-6 rounded-2xl border border-[#d6deea] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search group name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#ccd5e2] bg-[#fbfcfe] py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#5e85b2] focus:ring-2 focus:ring-[#5e85b2]/20"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenForm}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#14365a] bg-[#1f4f82] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f98]"
            >
              <Plus className="h-4 w-4" />
              Add Group
            </button>
          </div>
        </div>

        {loading && !showForm ? (
          <div className="rounded-2xl border border-[#d6deea] bg-white py-10 text-center text-slate-500 shadow-sm">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-[#d6deea] bg-white p-10 text-center text-slate-500 shadow-sm">
            No group found. Create your first accounting group.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#d6deea] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#dfe5ef] bg-[#f6f9fd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[#294a6d]">Group Ledger Classification</p>
              <p className="text-xs text-slate-500">Showing {groups.length} record(s)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#294a6d] text-[#e8f1fc]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Group Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf4]">
                  {groups.map((group, index) => (
                    <tr key={group._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#fbfcfe]'} hover:bg-[#eef4fd]`}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenGroupDetail(group._id)}
                          className="text-[#1f4f82] hover:text-[#163b61] hover:underline underline-offset-2"
                        >
                          {group.name}
                        </button>
                      </td>
                      <td className="max-w-[420px] px-4 py-3 text-slate-600">
                        <span className="line-clamp-1">{group.description || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          group.isActive
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${group.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenGroupDetail(group._id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                            aria-label="View group"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(group)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-900"
                            aria-label="Edit group"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(group._id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 hover:text-red-800"
                            aria-label="Delete group"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
