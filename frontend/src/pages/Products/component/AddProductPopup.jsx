import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import apiClient from '../../../utils/api';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../../../utils/useFloatingDropdownPosition';

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
  const [stockGroupQuery, setStockGroupQuery] = useState('');
  const [stockGroupListIndex, setStockGroupListIndex] = useState(-1);
  const [isStockGroupSectionActive, setIsStockGroupSectionActive] = useState(false);
  const [unitQuery, setUnitQuery] = useState('pcs');
  const [unitListIndex, setUnitListIndex] = useState(-1);
  const [isUnitSectionActive, setIsUnitSectionActive] = useState(false);
  const nameInputRef = useRef(null);
  const stockGroupSectionRef = useRef(null);
  const unitSectionRef = useRef(null);
  const unitInputRef = useRef(null);
  const minStockInputRef = useRef(null);

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

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

  const getMatchingStockGroups = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return stockGroups;

    const startsWith = stockGroups.filter((group) => normalizeText(group?.name).startsWith(normalized));
    const includes = stockGroups.filter((group) => (
      !normalizeText(group?.name).startsWith(normalized)
      && normalizeText(group?.name).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const getMatchingUnits = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return unitOptions;

    const startsWith = unitOptions.filter((unitName) => normalizeText(unitName).startsWith(normalized));
    const includes = unitOptions.filter((unitName) => (
      !normalizeText(unitName).startsWith(normalized)
      && normalizeText(unitName).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const selectedStockGroupName = useMemo(() => {
    const selectedGroup = stockGroups.find(
      (group) => String(group?._id || '') === String(formData.stockGroup || '')
    );
    return selectedGroup?.name || '';
  }, [formData.stockGroup, stockGroups]);

  const filteredStockGroups = useMemo(
    () => getMatchingStockGroups(stockGroupQuery),
    [stockGroups, stockGroupQuery]
  );

  const stockGroupOptions = useMemo(() => {
    const normalizedQuery = normalizeText(stockGroupQuery);
    const normalizedSelected = normalizeText(selectedStockGroupName);

    if (
      isStockGroupSectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelected
    ) {
      return stockGroups;
    }

    return filteredStockGroups;
  }, [filteredStockGroups, isStockGroupSectionActive, selectedStockGroupName, stockGroupQuery, stockGroups]);

  const filteredUnits = useMemo(
    () => getMatchingUnits(unitQuery),
    [unitOptions, unitQuery]
  );

  const unitPanelOptions = useMemo(() => {
    const normalizedQuery = normalizeText(unitQuery);
    const normalizedSelected = normalizeText(formData.unit);

    if (
      isUnitSectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelected
    ) {
      return unitOptions;
    }

    return filteredUnits;
  }, [filteredUnits, formData.unit, isUnitSectionActive, unitOptions, unitQuery]);

  const stockGroupDropdownStyle = useFloatingDropdownPosition(
    stockGroupSectionRef,
    isStockGroupSectionActive,
    [stockGroupOptions.length, stockGroupListIndex]
  );

  const unitDropdownStyle = useFloatingDropdownPosition(
    unitSectionRef,
    isUnitSectionActive,
    [unitPanelOptions.length, unitListIndex],
    'auto',
    'viewport'
  );

  useEffect(() => {
    if (!showForm) {
      setFormData(getInitialFormData(initialName));
      setError('');
      setStockGroupQuery('');
      setStockGroupListIndex(-1);
      setIsStockGroupSectionActive(false);
      setUnitQuery(getInitialFormData(initialName).unit);
      setUnitListIndex(-1);
      setIsUnitSectionActive(false);
      return;
    }

    const nextFormData = getInitialFormData(initialName);
    setFormData(nextFormData);
    setError('');
    setStockGroupQuery('');
    setStockGroupListIndex(-1);
    setIsStockGroupSectionActive(false);
    setUnitQuery(nextFormData.unit);
    setUnitListIndex(-1);
    setIsUnitSectionActive(false);

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

  useEffect(() => {
    if (!showForm) return;

    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [showForm]);

  useEffect(() => {
    if (!showForm) return;

    if (stockGroupOptions.length === 0) {
      setStockGroupListIndex(-1);
      return;
    }

    setStockGroupListIndex((prev) => {
      if (prev < 0) return isStockGroupSectionActive ? 0 : -1;
      if (prev >= stockGroupOptions.length) return stockGroupOptions.length - 1;
      return prev;
    });
  }, [showForm, stockGroupOptions, isStockGroupSectionActive]);

  useEffect(() => {
    if (!showForm) return;

    if (unitPanelOptions.length === 0) {
      setUnitListIndex(-1);
      return;
    }

    setUnitListIndex((prev) => {
      if (prev < 0) return isUnitSectionActive ? 0 : -1;
      if (prev >= unitPanelOptions.length) return unitPanelOptions.length - 1;
      return prev;
    });
  }, [showForm, unitPanelOptions, isUnitSectionActive]);

  if (!showForm) return null;

  const findExactStockGroup = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return stockGroups.find((group) => normalizeText(group?.name) === normalized) || null;
  };

  const findBestStockGroupMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return stockGroups.find((group) => normalizeText(group?.name).startsWith(normalized))
      || stockGroups.find((group) => normalizeText(group?.name).includes(normalized))
      || null;
  };

  const findExactUnit = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return '';
    return unitOptions.find((unitName) => normalizeText(unitName) === normalized) || '';
  };

  const findBestUnitMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return '';
    return unitOptions.find((unitName) => normalizeText(unitName).startsWith(normalized))
      || unitOptions.find((unitName) => normalizeText(unitName).includes(normalized))
      || '';
  };

  const selectStockGroup = (group, focusUnit = true) => {
    if (!group) {
      setStockGroupQuery('');
      setFormData((prev) => ({ ...prev, stockGroup: '' }));
      setStockGroupListIndex(-1);
      return;
    }

    setStockGroupQuery(group.name);
    setFormData((prev) => ({ ...prev, stockGroup: group._id }));
    const selectedIndex = getMatchingStockGroups(group.name).findIndex((item) => String(item._id) === String(group._id));
    setStockGroupListIndex(selectedIndex >= 0 ? selectedIndex : -1);
    setIsStockGroupSectionActive(false);

    if (focusUnit) {
      requestAnimationFrame(() => {
        unitInputRef.current?.focus();
      });
    }
  };

  const selectUnit = (unitName, focusMinStock = false) => {
    if (!unitName) return;

    setUnitQuery(unitName);
    setFormData((prev) => ({ ...prev, unit: unitName }));
    const selectedIndex = getMatchingUnits(unitName).findIndex((item) => normalizeText(item) === normalizeText(unitName));
    setUnitListIndex(selectedIndex >= 0 ? selectedIndex : -1);
    setIsUnitSectionActive(false);

    if (focusMinStock) {
      requestAnimationFrame(() => {
        minStockInputRef.current?.focus();
      });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'minStockLevel' || name === 'taxRate') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockGroupInputChange = (event) => {
    const value = event.target.value;
    setStockGroupQuery(value);

    if (!normalizeText(value)) {
      setFormData((prev) => ({ ...prev, stockGroup: '' }));
      setStockGroupListIndex(-1);
      return;
    }

    const exactGroup = findExactStockGroup(value);
    if (exactGroup) {
      setFormData((prev) => ({ ...prev, stockGroup: exactGroup._id }));
      const exactIndex = getMatchingStockGroups(value).findIndex((item) => String(item._id) === String(exactGroup._id));
      setStockGroupListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingStockGroups(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, stockGroup: firstMatch?._id || '' }));
    setStockGroupListIndex(firstMatch ? 0 : -1);
  };

  const handleStockGroupInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (stockGroupOptions.length === 0) return;
      setStockGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, stockGroupOptions.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (stockGroupOptions.length === 0) return;
      setStockGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      const activeGroup = stockGroupListIndex >= 0 ? stockGroupOptions[stockGroupListIndex] : null;
      const matchedGroup = activeGroup || findExactStockGroup(stockGroupQuery) || findBestStockGroupMatch(stockGroupQuery);
      if (matchedGroup) {
        selectStockGroup(matchedGroup, true);
        return;
      }

      unitInputRef.current?.focus();
    }
  };

  const handleUnitInputChange = (event) => {
    const value = event.target.value;
    setUnitQuery(value);

    const exactUnit = findExactUnit(value);
    if (exactUnit) {
      setFormData((prev) => ({ ...prev, unit: exactUnit }));
      const exactIndex = getMatchingUnits(value).findIndex((item) => normalizeText(item) === normalizeText(exactUnit));
      setUnitListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingUnits(value);
    const firstMatch = matches[0] || '';
    setFormData((prev) => ({ ...prev, unit: firstMatch }));
    setUnitListIndex(firstMatch ? 0 : -1);
  };

  const handleUnitInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (unitPanelOptions.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, unitPanelOptions.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (unitPanelOptions.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      const activeUnit = unitListIndex >= 0 ? unitPanelOptions[unitListIndex] : '';
      const matchedUnit = activeUnit || findExactUnit(unitQuery) || findBestUnitMatch(unitQuery);
      if (matchedUnit) {
        selectUnit(matchedUnit, true);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!String(formData.name || '').trim()) {
      setError('Name is required');
      return;
    }

    const matchedStockGroup = findExactStockGroup(stockGroupQuery) || findBestStockGroupMatch(stockGroupQuery);
    const selectedStockGroupId = formData.stockGroup || matchedStockGroup?._id || '';
    const matchedUnit = findExactUnit(unitQuery) || findBestUnitMatch(unitQuery) || formData.unit;

    if (!String(matchedUnit || '').trim()) {
      setError('Unit is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: String(formData.name || '').trim(),
        stockGroup: selectedStockGroupId || null,
        unit: String(matchedUnit || '').trim(),
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
                <p className="mt-0.5 text-[11px] text-cyan-100 md:text-xs">Create or update stock details in a clean accounting format.</p>
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

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Item Name *</label>
                    <input
                      ref={nameInputRef}
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

                  <div className="flex items-center gap-2">
                    <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Stock Group</label>
                    <div
                      ref={stockGroupSectionRef}
                      className="relative min-w-0 flex-1"
                      onFocusCapture={() => {
                        const selectedIndex = stockGroupOptions.findIndex(
                          (group) => String(group?._id || '') === String(formData.stockGroup || '')
                        );
                        setIsUnitSectionActive(false);
                        setIsStockGroupSectionActive(true);
                        setStockGroupListIndex(selectedIndex >= 0 ? selectedIndex : (stockGroupOptions.length > 0 ? 0 : -1));
                      }}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (
                          stockGroupSectionRef.current
                          && nextFocused instanceof Node
                          && stockGroupSectionRef.current.contains(nextFocused)
                        ) {
                          return;
                        }
                        setIsStockGroupSectionActive(false);
                      }}
                    >
                      <input
                        type="text"
                        value={stockGroupQuery}
                        onChange={handleStockGroupInputChange}
                        onKeyDown={handleStockGroupInputKeyDown}
                        className={getInlineFieldClass('indigo')}
                        placeholder="Select or type stock group..."
                      />

                      {isStockGroupSectionActive && stockGroupDropdownStyle && (
                        <div
                          className="fixed z-[80] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                          style={stockGroupDropdownStyle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Stock Group List</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              {stockGroupOptions.length}
                            </span>
                          </div>
                          <div className="overflow-y-auto py-1" style={{ maxHeight: stockGroupDropdownStyle.maxHeight }}>
                            {stockGroupOptions.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                No stock groups found.
                              </div>
                            ) : (
                              stockGroupOptions.map((group, index) => {
                                const isActive = index === stockGroupListIndex;
                                const isSelected = String(formData.stockGroup || '') === String(group._id);

                                return (
                                  <button
                                    key={group._id}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setStockGroupListIndex(index)}
                                    onClick={() => selectStockGroup(group, true)}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                                      isActive
                                        ? 'bg-yellow-200 text-amber-950'
                                        : isSelected
                                        ? 'bg-yellow-50 text-amber-800'
                                        : 'text-slate-700 hover:bg-amber-50'
                                    }`}
                                  >
                                    <span className="truncate font-medium">{group.name}</span>
                                    {isSelected && (
                                      <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Unit *</label>
                    <div
                      ref={unitSectionRef}
                      className="relative min-w-0 flex-1"
                      onFocusCapture={() => {
                        const selectedIndex = unitPanelOptions.findIndex(
                          (unitName) => normalizeText(unitName) === normalizeText(formData.unit)
                        );
                        setIsStockGroupSectionActive(false);
                        setIsUnitSectionActive(true);
                        setUnitListIndex(selectedIndex >= 0 ? selectedIndex : (unitPanelOptions.length > 0 ? 0 : -1));
                      }}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (
                          unitSectionRef.current
                          && nextFocused instanceof Node
                          && unitSectionRef.current.contains(nextFocused)
                        ) {
                          return;
                        }
                        setIsUnitSectionActive(false);
                      }}
                    >
                      <input
                        ref={unitInputRef}
                        type="text"
                        value={unitQuery}
                        onChange={handleUnitInputChange}
                        onKeyDown={handleUnitInputKeyDown}
                        className={`${getInlineFieldClass('indigo')} pr-10`}
                        placeholder="Type unit, use Up/Down, press Enter"
                        required
                      />
                      <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500 transition-transform ${isUnitSectionActive ? 'rotate-180' : ''}`} />

                      {isUnitSectionActive && unitDropdownStyle && (
                        <div
                          className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                          style={unitDropdownStyle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Unit List</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              {unitPanelOptions.length}
                            </span>
                          </div>
                          <div className="overflow-y-auto py-1" style={{ maxHeight: unitDropdownStyle.maxHeight }}>
                            {unitPanelOptions.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                No units found.
                              </div>
                            ) : (
                              unitPanelOptions.map((unitName, index) => {
                                const isActive = index === unitListIndex;
                                const isSelected = normalizeText(formData.unit) === normalizeText(unitName);

                                return (
                                  <button
                                    key={unitName}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setUnitListIndex(index)}
                                    onClick={() => selectUnit(unitName, true)}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                                      isActive
                                        ? 'bg-yellow-200 text-amber-950'
                                        : isSelected
                                        ? 'bg-yellow-50 text-amber-800'
                                        : 'text-slate-700 hover:bg-amber-50'
                                    }`}
                                  >
                                    <span className="truncate font-medium">{unitName}</span>
                                    {isSelected && (
                                      <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
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
                        ref={minStockInputRef}
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
