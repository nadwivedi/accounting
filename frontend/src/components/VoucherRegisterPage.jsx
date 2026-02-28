import { useEffect, useMemo, useState } from 'react';
import { Wallet, IndianRupee } from 'lucide-react';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

const PAYMENT_METHODS = ['cash', 'bank', 'upi', 'card', 'other'];

export default function VoucherRegisterPage({
  title,
  endpoint,
  addButtonLabel,
  fieldDefinitions,
  partyRequired = false,
  buttonClassName = 'bg-indigo-600 hover:bg-indigo-700',
  accountPreview
}) {
  const buildInitialForm = () => {
    const baseForm = {
      party: '',
      amount: '',
      method: 'cash',
      voucherDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      notes: ''
    };

    fieldDefinitions.forEach((field) => {
      baseForm[field.name] = '';
    });

    return baseForm;
  };

  const [entries, setEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState(buildInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [search]);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(endpoint, { params: { search } });
      setEntries(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || `Error fetching ${title.toLowerCase()}`);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormData(buildInitialForm());
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(buildInitialForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (partyRequired && !formData.party) {
      setError('Party is required');
      return;
    }

    for (const field of fieldDefinitions) {
      if (field.required && !String(formData[field.name] || '').trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method || 'cash',
        voucherDate: formData.voucherDate ? new Date(formData.voucherDate) : new Date(),
        referenceNo: formData.referenceNo,
        notes: formData.notes
      };

      fieldDefinitions.forEach((field) => {
        payload[field.name] = String(formData[field.name] || '').trim();
      });

      await apiClient.post(endpoint, payload);

      handleCloseForm();
      fetchEntries();
      setError('');
    } catch (err) {
      setError(err.message || `Error saving ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = useMemo(
    () => entries.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [entries]
  );

  const getAccountsDisplay = (entry) => {
    if (accountPreview) return accountPreview(entry);
    return fieldDefinitions
      .map((field) => `${field.label}: ${entry[field.name] || '-'}`)
      .join(' | ');
  };

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">{title} Count</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{entries.length}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Amount</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleOpenForm}
          className={`${buttonClassName} text-white px-6 py-2.5 rounded-lg transition shadow-sm whitespace-nowrap`}
        >
          {addButtonLabel}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="h-9 w-9 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Party {partyRequired ? '*' : ''}</label>
                <select
                  name="party"
                  value={formData.party}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select party</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.partyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  name="voucherDate"
                  value={formData.voucherDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {fieldDefinitions.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm text-slate-600 mb-1">{field.label} {field.required ? '*' : ''}</label>
                  <input
                    type="text"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder={field.placeholder || field.label}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm text-slate-600 mb-1">Method</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Reference No</label>
                <input
                  type="text"
                  name="referenceNo"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Optional note"
                />
              </div>

              <div className="md:col-span-3 flex items-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`${buttonClassName} text-white px-4 py-2 rounded-lg disabled:opacity-50`}
                >
                  {loading ? 'Saving...' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Voucher No</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Party</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Accounts</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((item) => (
                <tr key={item._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-600 font-medium">{item.voucherDate ? new Date(item.voucherDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{item.voucherNumber || '-'}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{item.party?.partyName || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{getAccountsDisplay(item)}</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold">Rs {Number(item.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 capitalize">
                      {item.method || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.referenceNo || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">{item.notes || '-'}</td>
                </tr>
              ))}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
                    No entries found
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
