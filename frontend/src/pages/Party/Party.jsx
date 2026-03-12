import { useEffect, useState } from 'react';
import { Pencil, Search, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddPartyPopup from './component/AddPartyPopup';

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

const getTypeBadgeClass = (type) => (
  type === 'customer'
    ? 'border border-amber-200 bg-amber-50 text-amber-700'
    : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
);

export default function Party() {
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
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-2 sm:gap-4 lg:flex lg:justify-start">
        <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 lg:min-w-[220px] lg:w-fit">
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

      <AddPartyPopup
        showForm={showForm}
        editingId={editingId}
        loading={loading}
        formData={formData}
        handleCloseForm={handleCloseForm}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
      />

      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(148,163,184,0.14)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Party Master</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:min-w-0 lg:flex-1 lg:justify-end">
              <div className="relative w-full sm:max-w-md lg:max-w-sm xl:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search parties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-500 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <button
                onClick={handleOpenForm}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 whitespace-nowrap"
              >
                + Add Party
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="space-y-3 md:hidden">
              {parties.map((item) => (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(59,130,246,0.04))] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{item.name || '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">Party details</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3 px-4 py-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Type</span>
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(item.type)}`}>
                        {item.type || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Mobile</span>
                      <span className="text-right font-semibold text-slate-700">{item.mobile || '-'}</span>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Notes</p>
                      <p className="mt-1 text-sm text-slate-600 break-words">{item.notes || '-'}</p>
                    </div>
                  </div>
                </article>
              ))}

              {parties.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
                  No parties found
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap overflow-hidden">
                <thead className="bg-[linear-gradient(135deg,#16a34a_0%,#059669_58%,#0f766e_100%)] text-white">
                  <tr>
                    <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Party Name</th>
                    <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Type</th>
                    <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Mobile Number</th>
                    <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Notes</th>
                    <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                  {parties.map((item) => (
                    <tr key={item._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                      <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">{item.name || '-'}</td>
                      <td className="border border-slate-400 px-4 py-3 text-center">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(item.type)}`}>
                          {item.type || '-'}
                        </span>
                      </td>
                      <td className="border border-slate-400 px-4 py-3 text-center">{item.mobile || '-'}</td>
                      <td className="border border-slate-400 px-4 py-3">
                        <div className="max-w-[20rem] truncate">{item.notes || '-'}</div>
                      </td>
                      <td className="border border-slate-400 px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {parties.length === 0 && (
                    <tr>
                      <td colSpan="5" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                        No parties found
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
  );
}
