import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddLeadgerPopup from './component/AddLeadgerPopup';

const getInitialForm = () => ({
  type: 'supplier',
  name: '',
  mobile: '',
  email: '',
  address: '',
  state: '',
  pincode: '',
  notes: ''
});

const TOAST_OPTIONS = { autoClose: 1200 };

const toTitleCase = (value) => String(value || '')
  .toLowerCase()
  .replace(/\b[a-z]/g, (char) => char.toUpperCase());

export default function Leadger() {
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchParties();
  }, [search]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/parties', { params: { search } });
      setParties(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching parties');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
      return;
    }
    if (name === 'mobile') {
      const normalized = String(value || '').replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    if (name === 'pincode') {
      const normalized = String(value || '').replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleEdit = (party) => {
    setEditingId(party._id);
    setFormData({
      type: party.type === 'customer' ? 'customer' : 'supplier',
      name: String(party.name || ''),
      mobile: String(party.mobile || '').replace(/\D/g, '').slice(0, 10),
      email: String(party.email || ''),
      address: String(party.address || ''),
      state: String(party.state || ''),
      pincode: String(party.pincode || '').replace(/\D/g, '').slice(0, 6),
      notes: String(party.notes || '')
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !String(formData.name).trim()) {
      setError('Party name is required');
      return;
    }

    if (!['supplier', 'customer'].includes(formData.type)) {
      setError('Party type is required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type: formData.type,
        name: String(formData.name || '').trim(),
        mobile: String(formData.mobile || '').trim(),
        email: String(formData.email || '').trim(),
        address: String(formData.address || '').trim(),
        state: String(formData.state || '').trim(),
        pincode: String(formData.pincode || '').trim(),
        notes: String(formData.notes || '').trim()
      };

      if (editingId) {
        await apiClient.put(`/parties/${editingId}`, payload);
      } else {
        await apiClient.post('/parties', payload);
      }

      handleCloseForm();
      fetchParties();
      setError('');
      toast.success(
        editingId ? 'Party updated successfully' : 'Party created successfully',
        TOAST_OPTIONS
      );
    } catch (err) {
      setError(err.message || (editingId ? 'Error updating party' : 'Error creating party'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-[#f8f6f1] min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Party Count</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{parties.length}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search parties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleOpenForm}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Party
        </button>
      </div>

      <AddLeadgerPopup
        showForm={showForm}
        editingId={editingId}
        loading={loading}
        formData={formData}
        handleCloseForm={handleCloseForm}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Party Name</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Notes</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parties.map((item) => (
                <tr key={item._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-700">{item.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold capitalize">{item.type || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{item.notes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && parties.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
                    No parties found
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
