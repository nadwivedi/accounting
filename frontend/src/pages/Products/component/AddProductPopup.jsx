import { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import apiClient from '../../../utils/api';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

const TYPE_OF_SUPPLY_OPTIONS = [
  { value: 'goods', label: 'Goods' },
  { value: 'services', label: 'Services' }
];

const DEFAULT_UNIT_OPTIONS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'hrs', 'minutes'];

const getInitialFormData = (initialName = '') => ({
  name: String(initialName || '').trim(),
  stockGroup: '',
  unit: 'pcs',
  typeOfSupply: 'goods',
  minStockLevel: '',
  taxRate: 0
});

const getInlineFieldClass = (tone = 'indigo') => {
  const focusTone = tone === 'emerald'
    ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
    : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

  return `w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none ${focusTone}`;
};

export default function AddProductPopup({
  showForm,
  initialName = '',
  onClose,
  onProductCreated
}) {
  const [formData, setFormData] = useState(getInitialFormData(initialName));
  const [stockGroups, setStockGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unitOptions = useMemo(() => {
    const fetchedUnits = units
      .map((unit) => String(unit?.name || '').trim())
      .filter(Boolean);
    const merged = fetchedUnits.length > 0 ? fetchedUnits : DEFAULT_UNIT_OPTIONS;
    const unique = Array.from(new Set(merged));

    if (formData.unit && !unique.includes(formData.unit)) {
      return [formData.unit, ...unique];
    }

    return unique;
  }, [formData.unit, units]);

  useEffect(() => {
    if (!showForm) {
      setFormData(getInitialFormData(initialName));
      setError('');
      return;
    }

    setFormData(getInitialFormData(initialName));
    setError('');

    const loadOptions = async () => {
      try {
        const [stockGroupResponse, unitResponse] = await Promise.all([
          apiClient.get('/stock-groups'),
          apiClient.get('/units', { params: { isActive: true } })
        ]);

        setStockGroups(stockGroupResponse?.data || []);
        setUnits(unitResponse?.data || []);
      } catch (err) {
        setError(err.message || 'Error loading stock popup options');
        setStockGroups([]);
        setUnits([]);
      }
    };

    loadOptions();
  }, [initialName, showForm]);

  if (!showForm) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'minStockLevel' || name === 'taxRate') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!String(formData.name || '').trim()) {
      setError('Name is required');
      return;
    }

    if (!String(formData.unit || '').trim()) {
      setError('Unit is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: String(formData.name || '').trim(),
        stockGroup: formData.stockGroup || null,
        unit: String(formData.unit || '').trim(),
        typeOfSupply: String(formData.typeOfSupply || 'goods').trim().toLowerCase() === 'services' ? 'services' : 'goods',
        minStockLevel: Number(formData.minStockLevel || 0),
        taxRate: Number(formData.taxRate || 0)
      };

      const response = await apiClient.post('/products', payload);
      const createdProduct = response?.data || null;

      if (!createdProduct?._id) {
        throw new Error('Stock item created but response was incomplete');
      }

      onProductCreated?.(createdProduct);
      setFormData(getInitialFormData(''));
    } catch (err) {
      setError(err.message || 'Error creating stock item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-[34rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-1.5 text-white md:px-4 md:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white ring-1 ring-white/30 md:h-8 md:w-8">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold md:text-xl">Add New Stock Item</h2>
                <p className="mt-0.5 text-[11px] text-cyan-100 md:text-xs">Create a stock item without leaving this popup.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white transition hover:bg-white/25 md:p-2"
              aria-label="Close popup"
            >
              <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, onClose)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800 md:mb-4 md:text-lg">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white md:h-8 md:w-8 md:text-sm">1</span>
                  Basic Details
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-gray-700 md:text-sm">Item Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={getInlineFieldClass('indigo')}
                      placeholder="Enter product name"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 md:text-sm">Stock Group</label>
                    <select
                      name="stockGroup"
                      value={formData.stockGroup}
                      onChange={handleChange}
                      className={getInlineFieldClass('indigo')}
                    >
                      <option value="">Select stock group</option>
                      {stockGroups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 md:text-sm">Unit *</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className={getInlineFieldClass('indigo')}
                      required
                    >
                      {unitOptions.map((unitName) => (
                        <option key={unitName} value={unitName}>
                          {unitName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 md:text-sm">Type Of Supply</label>
                    <select
                      name="typeOfSupply"
                      value={formData.typeOfSupply}
                      onChange={handleChange}
                      className={getInlineFieldClass('emerald')}
                    >
                      {TYPE_OF_SUPPLY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 md:text-sm">Min Stock Level</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleChange}
                      min="0"
                      className={getInlineFieldClass('emerald')}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700 md:text-sm">Tax Rate</label>
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={getInlineFieldClass('emerald')}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 md:flex-row md:px-4">
            <div className="text-[11px] text-gray-600 md:text-xs">
              <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">Esc</kbd> to close
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-1.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
              >
                {loading ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
