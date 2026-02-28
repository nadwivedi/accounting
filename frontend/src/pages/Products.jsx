import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, PackageCheck, PackageX } from 'lucide-react';
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
    minStockLevel: 10,
    taxRate: 0,
    isActive: true
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
  const nameInputRef = useRef(null);
  const unitInputRef = useRef(null);
  const stockGroupSectionRef = useRef(null);
  const unitSectionRef = useRef(null);

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
    () => stockGroups.filter((group) => group.isActive !== false),
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

  const filteredUnits = useMemo(
    () => getMatchingUnits(unitQuery),
    [unitOptions, unitQuery]
  );

  useEffect(() => {
    if (!showForm) return;

    if (filteredStockGroups.length === 0) {
      setStockGroupListIndex(-1);
      return;
    }

    setStockGroupListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredStockGroups.length) return filteredStockGroups.length - 1;
      return prev;
    });
  }, [showForm, filteredStockGroups]);

  useEffect(() => {
    if (!showForm) return;

    if (filteredUnits.length === 0) {
      setUnitListIndex(-1);
      return;
    }

    setUnitListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredUnits.length) return filteredUnits.length - 1;
      return prev;
    });
  }, [showForm, filteredUnits]);

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
    const selectedIndex = filteredStockGroups.findIndex((item) => String(item._id) === String(group._id));
    setStockGroupListIndex(selectedIndex >= 0 ? selectedIndex : 0);

    if (focusUnit && unitInputRef.current) {
      unitInputRef.current.focus();
    }
  };

  const selectUnit = (unitName) => {
    if (!unitName) return;
    setUnitQuery(unitName);
    setFormData((prev) => ({ ...prev, unit: unitName }));
    const selectedIndex = filteredUnits.findIndex((item) => normalizeText(item) === normalizeText(unitName));
    setUnitListIndex(selectedIndex >= 0 ? selectedIndex : 0);
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
      const exactIndex = getMatchingStockGroups(value).findIndex((group) => String(group._id) === String(exactGroup._id));
      setStockGroupListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingStockGroups(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, stockGroup: firstMatch?._id || '' }));
    setStockGroupListIndex(firstMatch ? 0 : -1);
  };

  const handleStockGroupInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredStockGroups.length === 0) return;
      setStockGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredStockGroups.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredStockGroups.length === 0) return;
      setStockGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeGroup = stockGroupListIndex >= 0 ? filteredStockGroups[stockGroupListIndex] : null;
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
      const exactIndex = getMatchingUnits(value).findIndex((unitName) => normalizeText(unitName) === normalizeText(exactUnit));
      setUnitListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingUnits(value);
    const firstMatch = matches[0] || '';
    setFormData((prev) => ({ ...prev, unit: firstMatch }));
    setUnitListIndex(firstMatch ? 0 : -1);
  };

  const handleUnitInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredUnits.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredUnits.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredUnits.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeUnit = unitListIndex >= 0 ? filteredUnits[unitListIndex] : '';
      const matchedUnit = activeUnit || findExactUnit(unitQuery) || findBestUnitMatch(unitQuery);
      if (matchedUnit) {
        selectUnit(matchedUnit);
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

    setFormData({
      ...initialFormData,
      ...product,
      stockGroup: normalizedStockGroupId,
      unit: resolvedUnit || initialFormData.unit
    });
    setStockGroupQuery(resolvedStockGroupName);
    setStockGroupListIndex(resolvedStockGroupName ? 0 : -1);
    setIsStockGroupSectionActive(false);
    setUnitQuery(resolvedUnit || initialFormData.unit);
    setUnitListIndex(0);
    setIsUnitSectionActive(false);
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
  };

  const handleOpenLedger = (productId) => {
    navigate(`/stock/${productId}`);
  };

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const lowStockProducts = products.filter(
    (product) => Number(product.currentStock || 0) <= Number(product.minStockLevel || 0)
  ).length;

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
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
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Active</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{activeProducts}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <PackageCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {editingId ? 'Edit Stock Item' : 'Add New Stock Item'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Fill the details and save your stock item.</p>
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

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="space-y-6 px-6 py-6 bg-white">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Basic Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Stock Item Name *</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                      autoFocus={!editingId}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Stock Group</label>
                    <div
                      ref={stockGroupSectionRef}
                      className="relative"
                      onFocusCapture={() => setIsStockGroupSectionActive(true)}
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type stock group, use Up/Down, press Enter"
                      />

                      {isStockGroupSectionActive && (
                        <div className="mt-2 md:mt-0 md:fixed md:right-4 md:top-20 md:bottom-6 w-full md:w-80 z-30">
                          <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 via-sky-50 to-white shadow-xl overflow-hidden md:h-full md:flex md:flex-col">
                            <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-white border-b border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600">
                              Stock Group List
                            </div>
                            <div className="max-h-60 md:max-h-none md:flex-1 overflow-y-auto bg-white/80">
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setStockGroupQuery('');
                                  setFormData((prev) => ({ ...prev, stockGroup: '' }));
                                  setStockGroupListIndex(-1);
                                }}
                                className={`w-full border-b border-slate-100 px-3 py-2 text-left text-sm transition-colors ${
                                  !formData.stockGroup
                                    ? 'bg-emerald-100 text-emerald-800 font-medium'
                                    : 'text-slate-700 hover:bg-blue-50'
                                }`}
                              >
                                No stock group
                              </button>
                              {filteredStockGroups.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-slate-500">No matching stock groups</div>
                              ) : (
                                filteredStockGroups.map((group, index) => {
                                  const isActive = index === stockGroupListIndex;
                                  const isSelected = String(formData.stockGroup || '') === String(group._id);
                                  return (
                                    <button
                                      key={group._id}
                                      type="button"
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => selectStockGroup(group, true)}
                                      className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                        isActive
                                          ? 'bg-blue-100 text-blue-800 font-semibold'
                                          : isSelected
                                            ? 'bg-emerald-100 text-emerald-800 font-medium'
                                            : 'text-slate-700 hover:bg-blue-50'
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

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Unit *</label>
                    <div
                      ref={unitSectionRef}
                      className="relative"
                      onFocusCapture={() => setIsUnitSectionActive(true)}
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type unit, use Up/Down, press Enter"
                        required
                      />

                      {isUnitSectionActive && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1">
                          <div className="max-h-52 overflow-y-auto rounded-lg border border-blue-200 bg-white shadow-lg">
                            {filteredUnits.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-slate-500">No matching units</div>
                            ) : (
                              filteredUnits.map((unitName, index) => {
                                const isActive = index === unitListIndex;
                                const isSelected = normalizeText(formData.unit) === normalizeText(unitName);
                                return (
                                  <button
                                    key={unitName}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectUnit(unitName)}
                                    className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                      isActive
                                        ? 'bg-blue-100 text-blue-800 font-semibold'
                                        : isSelected
                                          ? 'bg-emerald-100 text-emerald-800 font-medium'
                                          : 'text-slate-700 hover:bg-blue-50'
                                    }`}
                                  >
                                    {unitName}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Stock & Tax</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Min Stock Level</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-gray-700 font-medium">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                  />
                  Active product
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Stock Item' : 'Save Stock Item'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition"
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
          placeholder="Search stock items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={handleOpenForm}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Stock Item
        </button>
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No stock items found. Create your first stock item!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Stock Group</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="bg-white hover:bg-slate-50 transition-colors duration-200 cursor-pointer group"
                    onClick={() => handleOpenLedger(product._id)}
                  >
                    <td className="px-6 py-4-slate-800 font-semibold text">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs font-normal text-blue-600">View ledger</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{product.stockGroup?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{product.unit || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        Number(product.currentStock || 0) > Number(product.minStockLevel || 0)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6 space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product._id);
                        }}
                        className="inline-flex items-center justify-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

