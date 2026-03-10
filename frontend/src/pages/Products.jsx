import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, PackageX, Pencil, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Products() {
  const toastOptions = { autoClose: 1200 };
  const navigate = useNavigate();

  const initialFormData = {
    name: '',
    stockGroup: '',
    unit: 'pcs',
    typeOfSupply: 'goods',
    minStockLevel: '',
    taxRate: 0
  };

  const [products, setProducts] = useState([]);
  const [stockGroups, setStockGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [stockGroupQuery, setStockGroupQuery] = useState('');
  const [stockGroupListIndex, setStockGroupListIndex] = useState(-1);
  const [isStockGroupSectionActive, setIsStockGroupSectionActive] = useState(false);
  const [unitQuery, setUnitQuery] = useState(initialFormData.unit);
  const [unitListIndex, setUnitListIndex] = useState(-1);
  const [isUnitSectionActive, setIsUnitSectionActive] = useState(false);
  const [isTypeOfSupplyOpen, setIsTypeOfSupplyOpen] = useState(false);
  const nameInputRef = useRef(null);
  const unitInputRef = useRef(null);
  const minStockInputRef = useRef(null);
  const typeOfSupplyRef = useRef(null);
  const stockGroupSectionRef = useRef(null);
  const unitSectionRef = useRef(null);
  const getInlineFieldClass = (tone = 'indigo') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
    return `flex-1 min-w-0 px-3 py-2 border border-transparent rounded-lg bg-transparent text-sm font-bold text-gray-900 transition-all focus:outline-none focus:bg-white placeholder:font-normal placeholder:text-transparent focus:placeholder:text-gray-400 ${focusTone}`;
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useEffect(() => {
    fetchStockGroups();
    fetchUnits();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products', {
        params: { search }
      });
      setProducts(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching stock items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockGroups = async () => {
    try {
      const response = await apiClient.get('/stock-groups');
      setStockGroups(response.data || []);
    } catch (err) {
      console.error('Error fetching stock groups:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await apiClient.get('/units', {
        params: { isActive: true }
      });
      setUnits(response.data || []);
    } catch (err) {
      console.error('Error fetching units:', err);
      setUnits([]);
    }
  };

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const availableStockGroups = useMemo(
    () => stockGroups,
    [stockGroups]
  );

  const unitOptions = useMemo(() => {
    const defaults = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'hrs', 'minutes'];
    const fromUnits = units.length > 0
      ? units.map((unit) => String(unit.name || '').trim()).filter(Boolean)
      : defaults;
    const unique = Array.from(new Set(fromUnits));

    if (formData.unit && !unique.includes(formData.unit)) {
      return [formData.unit, ...unique];
    }
    return unique;
  }, [units, formData.unit]);

  const getMatchingStockGroups = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return availableStockGroups;

    const startsWith = availableStockGroups.filter((group) => normalizeText(group.name).startsWith(normalized));
    const includes = availableStockGroups.filter((group) => (
      !normalizeText(group.name).startsWith(normalized)
      && normalizeText(group.name).includes(normalized)
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

  const filteredStockGroups = useMemo(
    () => getMatchingStockGroups(stockGroupQuery),
    [availableStockGroups, stockGroupQuery]
  );
  const stockGroupOptions = useMemo(
    () => (isStockGroupSectionActive ? availableStockGroups : filteredStockGroups),
    [isStockGroupSectionActive, availableStockGroups, filteredStockGroups]
  );

  const filteredUnits = useMemo(
    () => getMatchingUnits(unitQuery),
    [unitOptions, unitQuery]
  );
  const unitPanelOptions = useMemo(
    () => (isUnitSectionActive ? unitOptions : filteredUnits),
    [isUnitSectionActive, unitOptions, filteredUnits]
  );

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

  useEffect(() => {
    if (!showForm || editingId) return;

    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [showForm, editingId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeOfSupplyKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsTypeOfSupplyOpen(false);
      return;
    }
    if (e.key !== 'Enter') return;
    const selected = String(e.target.value || 'goods').trim().toLowerCase() === 'services' ? 'services' : 'goods';
    setFormData((prev) => ({ ...prev, typeOfSupply: selected }));
    setIsTypeOfSupplyOpen(false);
    e.preventDefault();
    e.stopPropagation();
    const form = e.currentTarget.form;
    if (form && typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    }
  };

  const handleTaxRateKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    setIsTypeOfSupplyOpen(true);
    if (typeOfSupplyRef.current) {
      typeOfSupplyRef.current.focus();
    }
  };

  const findExactStockGroup = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return availableStockGroups.find((group) => normalizeText(group.name) === normalized) || null;
  };

  const findBestStockGroupMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return availableStockGroups.find((group) => normalizeText(group.name).startsWith(normalized))
      || availableStockGroups.find((group) => normalizeText(group.name).includes(normalized))
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
    const selectedIndex = availableStockGroups.findIndex((item) => String(item._id) === String(group._id));
    setStockGroupListIndex(selectedIndex >= 0 ? selectedIndex : -1);

    if (focusUnit && unitInputRef.current) {
      unitInputRef.current.focus();
    }
  };

  const selectUnit = (unitName, focusMinStock = false) => {
    if (!unitName) return;
    setUnitQuery(unitName);
    setFormData((prev) => ({ ...prev, unit: unitName }));
    const selectedIndex = unitOptions.findIndex((item) => normalizeText(item) === normalizeText(unitName));
    setUnitListIndex(selectedIndex >= 0 ? selectedIndex : -1);
    if (focusMinStock && minStockInputRef.current) {
      minStockInputRef.current.focus();
    }
  };

  const handleStockGroupInputChange = (e) => {
    const value = e.target.value;
    setStockGroupQuery(value);

    if (!normalizeText(value)) {
      setFormData((prev) => ({ ...prev, stockGroup: '' }));
      setStockGroupListIndex(-1);
      return;
    }

    const exactGroup = findExactStockGroup(value);
    if (exactGroup) {
      setFormData((prev) => ({ ...prev, stockGroup: exactGroup._id }));
      setStockGroupListIndex(availableStockGroups.length > 0 ? 0 : -1);
      return;
    }

    const matches = getMatchingStockGroups(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, stockGroup: firstMatch?._id || '' }));
    setStockGroupListIndex(availableStockGroups.length > 0 ? 0 : -1);
  };

  const handleStockGroupInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (stockGroupOptions.length === 0) return;
      setStockGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, stockGroupOptions.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (stockGroupOptions.length === 0) return;
      setStockGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeGroup = stockGroupListIndex >= 0 ? stockGroupOptions[stockGroupListIndex] : null;
      const matchedGroup = activeGroup || findExactStockGroup(stockGroupQuery) || findBestStockGroupMatch(stockGroupQuery);
      if (matchedGroup) {
        selectStockGroup(matchedGroup, true);
        return;
      }

      if (unitInputRef.current) {
        unitInputRef.current.focus();
      }
    }
  };

  const handleUnitInputChange = (e) => {
    const value = e.target.value;
    setUnitQuery(value);

    const exactUnit = findExactUnit(value);
    if (exactUnit) {
      setFormData((prev) => ({ ...prev, unit: exactUnit }));
      setUnitListIndex(unitOptions.length > 0 ? 0 : -1);
      return;
    }

    const matches = getMatchingUnits(value);
    const firstMatch = matches[0] || '';
    setFormData((prev) => ({ ...prev, unit: firstMatch }));
    setUnitListIndex(unitOptions.length > 0 ? 0 : -1);
  };

  const handleUnitInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (unitPanelOptions.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, unitPanelOptions.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (unitPanelOptions.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeUnit = unitListIndex >= 0 ? unitPanelOptions[unitListIndex] : '';
      const matchedUnit = activeUnit || findExactUnit(unitQuery) || findBestUnitMatch(unitQuery);
      if (matchedUnit) {
        selectUnit(matchedUnit, true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required');
      return;
    }

    const matchedStockGroup = findExactStockGroup(stockGroupQuery) || findBestStockGroupMatch(stockGroupQuery);
    const selectedStockGroupId = formData.stockGroup || matchedStockGroup?._id || '';
    const matchedUnit = findExactUnit(unitQuery) || findBestUnitMatch(unitQuery) || formData.unit;

    if (!matchedUnit) {
      setError('Unit is required');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);
      const submitData = {
        ...formData,
        stockGroup: selectedStockGroupId || null,
        unit: matchedUnit,
        typeOfSupply: String(formData.typeOfSupply || 'goods').trim().toLowerCase() === 'services' ? 'services' : 'goods',
        minStockLevel: parseInt(formData.minStockLevel || 0),
        taxRate: parseFloat(formData.taxRate || 0)
      };

      if (editingId) {
        await apiClient.put(`/products/${editingId}`, submitData);
      } else {
        await apiClient.post('/products', submitData);
      }

      toast.success(
        isEditMode ? 'Stock Item updated successfully' : 'Stock Item added successfully',
        toastOptions
      );
      fetchProducts();
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setStockGroupQuery('');
      setStockGroupListIndex(-1);
      setIsStockGroupSectionActive(false);
      setUnitQuery(initialFormData.unit);
      setUnitListIndex(0);
      setIsUnitSectionActive(false);
      setIsTypeOfSupplyOpen(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    const normalizedStockGroupId = typeof product.stockGroup === 'object'
      ? product.stockGroup?._id || ''
      : (product.stockGroup || '');
    const resolvedStockGroupName = typeof product.stockGroup === 'object'
      ? (product.stockGroup?.name || '')
      : (availableStockGroups.find((group) => String(group._id) === String(normalizedStockGroupId))?.name || '');
    const resolvedUnit = String(product.unit || initialFormData.unit || '').trim();
    const normalizedTypeOfSupply = String(product.typeOfSupply || '').trim().toLowerCase();
    const resolvedTypeOfSupply = normalizedTypeOfSupply === 'services'
      ? 'services'
      : normalizedTypeOfSupply === 'goods'
        ? 'goods'
        : 'goods';

    setFormData({
      ...initialFormData,
      ...product,
      stockGroup: normalizedStockGroupId,
      unit: resolvedUnit || initialFormData.unit,
      typeOfSupply: resolvedTypeOfSupply
    });
    setStockGroupQuery(resolvedStockGroupName);
    setStockGroupListIndex(resolvedStockGroupName ? 0 : -1);
    setIsStockGroupSectionActive(false);
    setUnitQuery(resolvedUnit || initialFormData.unit);
    setUnitListIndex(0);
    setIsUnitSectionActive(false);
    setIsTypeOfSupplyOpen(false);
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleOpenForm = () => {
    const nextFormData = { ...initialFormData };
    setEditingId(null);
    setFormData(nextFormData);
    setStockGroupQuery('');
    setStockGroupListIndex(-1);
    setIsStockGroupSectionActive(false);
    setUnitQuery(nextFormData.unit || '');
    setUnitListIndex(0);
    setIsUnitSectionActive(false);
    setIsTypeOfSupplyOpen(false);
    setError('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        toast.success('Stock Item deleted successfully', toastOptions);
        fetchProducts();
      } catch (err) {
        setError(err.message || 'Error deleting product');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setStockGroupQuery('');
    setStockGroupListIndex(-1);
    setIsStockGroupSectionActive(false);
    setUnitQuery(initialFormData.unit);
    setUnitListIndex(0);
    setIsUnitSectionActive(false);
    setIsTypeOfSupplyOpen(false);
  };

  const handleOpenLedger = (productId) => {
    navigate(`/stock/${productId}`);
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (product) => Number(product.currentStock || 0) <= Number(product.minStockLevel || 0)
  ).length;

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Stock Items</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{totalProducts}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Low Stock</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{lowStockProducts}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <PackageX className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-rose-500 to-orange-400 opacity-80"></div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1.5px] z-50 flex items-stretch justify-start p-1.5 sm:p-2" onClick={handleCancel}>
          <div
            className="bg-white h-full w-full md:w-[75vw] overflow-hidden flex flex-col shadow-2xl ring-1 ring-slate-200/80 rounded-xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-2 md:px-4 md:py-2.5 text-white flex-shrink-0 border-b border-white/15">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-white">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold">{editingId ? 'Edit Stock Item' : 'Add New Stock Item'}</h2>
                    <p className="text-cyan-100 text-xs md:text-sm mt-1">Create or update stock details in a clean accounting format.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white hover:bg-white/25 rounded-lg p-1.5 md:p-2 transition"
                  aria-label="Close popup"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.2fr)] gap-2.5 md:gap-4 items-stretch">
                  <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-2.5 md:p-4">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                      <span className="bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</span>
                      Basic Details
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">Item Name *</label>
                        <input
                          ref={nameInputRef}
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={getInlineFieldClass('indigo')}
                          placeholder="Enter product name"
                          autoFocus={!editingId}
                          required
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">Stock Group</label>
                        <div
                          ref={stockGroupSectionRef}
                          className="relative flex-1 min-w-0"
                          onFocusCapture={() => {
                            const selectedIndex = availableStockGroups.findIndex(
                              (group) => String(group?._id || '') === String(formData.stockGroup || '')
                            );
                            setIsUnitSectionActive(false);
                            setIsStockGroupSectionActive(true);
                            setStockGroupListIndex(selectedIndex >= 0 ? selectedIndex : (availableStockGroups.length > 0 ? 0 : -1));
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

                          {isStockGroupSectionActive && (
                            <div className="mt-2 md:mt-0 md:fixed md:right-4 md:top-20 md:bottom-6 w-full md:w-80 z-30">
                              <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 via-sky-50 to-white shadow-xl overflow-hidden md:h-full md:flex md:flex-col">
                                <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-white border-b border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600">
                                  Stock Group List
                                </div>
                                <div className="max-h-60 md:max-h-none md:flex-1 overflow-y-auto bg-white/80">
                                  {stockGroupOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-slate-500">No stock groups found</div>
                                  ) : (
                                    stockGroupOptions.map((group, index) => {
                                      const isActive = index === stockGroupListIndex;
                                      return (
                                        <button
                                          key={group._id}
                                          type="button"
                                          onMouseDown={(event) => event.preventDefault()}
                                          onMouseEnter={() => setStockGroupListIndex(index)}
                                          onClick={() => selectStockGroup(group, true)}
                                          className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                            isActive
                                              ? 'bg-yellow-300 text-black font-semibold'
                                              : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          {group.name}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">Unit *</label>
                        <div
                          ref={unitSectionRef}
                          className="relative flex-1 min-w-0"
                          onFocusCapture={() => {
                            const selectedIndex = unitOptions.findIndex(
                              (unitName) => normalizeText(unitName) === normalizeText(formData.unit)
                            );
                            setIsStockGroupSectionActive(false);
                            setIsUnitSectionActive(true);
                            setUnitListIndex(selectedIndex >= 0 ? selectedIndex : (unitOptions.length > 0 ? 0 : -1));
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
                            className={getInlineFieldClass('indigo')}
                            placeholder="Type unit, use Up/Down, press Enter"
                            required
                          />

                          {isUnitSectionActive && (
                            <div className="mt-2 md:mt-0 md:fixed md:right-4 md:top-20 md:bottom-6 w-full md:w-80 z-30">
                              <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 via-sky-50 to-white shadow-xl overflow-hidden md:h-full md:flex md:flex-col">
                                <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-white border-b border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600">
                                  Unit List
                                </div>
                                <div className="max-h-60 md:max-h-none md:flex-1 overflow-y-auto bg-white/80">
                                  {unitPanelOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-slate-500">No units found</div>
                                ) : (
                                  unitPanelOptions.map((unitName, index) => {
                                    const isActive = index === unitListIndex;
                                    return (
                                      <button
                                        key={unitName}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setUnitListIndex(index)}
                                        onClick={() => selectUnit(unitName, true)}
                                        className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                          isActive
                                            ? 'bg-yellow-300 text-black font-semibold'
                                            : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        {unitName}
                                      </button>
                                    );
                                  })
                                )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block h-full w-px bg-slate-300" aria-hidden="true"></div>

                  <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-2.5 md:p-4">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</span>
                      Stock & Tax
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                          <span className="inline-flex items-baseline gap-1 whitespace-nowrap">Min Stock Level</span>
                          <span className="ml-2">:</span>
                        </label>
                        <input
                          ref={minStockInputRef}
                          type="number"
                          name="minStockLevel"
                          value={formData.minStockLevel}
                          onChange={handleInputChange}
                          className={getInlineFieldClass('emerald')}
                          placeholder="10"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                          <span className="inline-flex items-baseline gap-1 whitespace-nowrap">Tax Rate (%)</span>
                          <span className="ml-2">:</span>
                        </label>
                        <input
                          type="number"
                          name="taxRate"
                          value={formData.taxRate}
                          onChange={handleInputChange}
                          onKeyDown={handleTaxRateKeyDown}
                          className={getInlineFieldClass('emerald')}
                          placeholder="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                          <span className="inline-flex items-baseline gap-1 whitespace-nowrap">Type Of Supply</span>
                          <span className="ml-2">:</span>
                        </label>
                        <select
                          ref={typeOfSupplyRef}
                          name="typeOfSupply"
                          value={formData.typeOfSupply || 'goods'}
                          onChange={handleInputChange}
                          onKeyDown={handleTypeOfSupplyKeyDown}
                          onFocus={() => setIsTypeOfSupplyOpen(true)}
                          onBlur={() => setIsTypeOfSupplyOpen(false)}
                          size={isTypeOfSupplyOpen ? 2 : 1}
                          className="flex-1 min-w-0 px-3 py-2 border border-emerald-200 rounded-lg bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          <option value="goods">Goods</option>
                          <option value="services">Services</option>
                        </select>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-3 py-2.5 md:px-4 md:py-3 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0">
                <div className="text-xs md:text-sm text-gray-600">
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close
                </div>

                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingId ? 'Update Stock Item' : 'Save Stock Item'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(148,163,184,0.14)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Stock Items</h2>
              <p className="text-sm text-slate-500">Manage inventory and open item ledger directly from each row.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:min-w-0 lg:flex-1 lg:justify-end">
              <div className="relative w-full sm:max-w-md lg:max-w-sm xl:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stock items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <button
                onClick={handleOpenForm}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 whitespace-nowrap"
              >
                + Add Stock Item
              </button>
            </div>
          </div>
        </div>

        {loading && !showForm ? (
          <div className="px-6 py-10 text-center text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            No stock items found. Create your first stock item!
          </div>
        ) : (
          <div className="darkish-table-shell overflow-x-auto rounded-[18px] p-3 sm:p-5">
            <table className="darkish-table w-full min-w-[760px] text-left text-sm whitespace-nowrap">
              <thead>
                <tr>
                  <th className="border border-slate-200 px-4 py-3.5 text-sm font-semibold">Name</th>
                  <th className="border border-slate-200 px-4 py-3.5 text-sm font-semibold">Stock Group</th>
                  <th className="border border-slate-200 px-4 py-3.5 text-sm font-semibold">Unit</th>
                  <th className="border border-slate-200 px-4 py-3.5 text-center text-sm font-semibold">Stock</th>
                  <th className="border border-slate-200 px-4 py-3.5 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-slate-700/[0.06]"
                    onClick={() => handleOpenLedger(product._id)}
                  >
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{product.name}</span>
                        <span className="text-xs font-medium text-slate-400">Open ledger</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">{product.stockGroup?.name || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3">{product.unit || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className={`inline-flex min-w-14 items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                        Number(product.currentStock || 0) > Number(product.minStockLevel || 0)
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/70 bg-white/70 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product._id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/70 bg-white/70 text-slate-500 transition hover:bg-red-50/90 hover:text-red-600"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


