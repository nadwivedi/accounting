import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Package, PackageX, Pencil, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../utils/useFloatingDropdownPosition';

const TYPE_OF_SUPPLY_OPTIONS = [
  { value: 'goods', label: 'Goods' },
  { value: 'services', label: 'Services' }
];

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
  const [typeOfSupplyQuery, setTypeOfSupplyQuery] = useState('Goods');
  const [typeOfSupplyListIndex, setTypeOfSupplyListIndex] = useState(0);
  const [isTypeOfSupplyOpen, setIsTypeOfSupplyOpen] = useState(false);
  const nameInputRef = useRef(null);
  const unitInputRef = useRef(null);
  const minStockInputRef = useRef(null);
  const typeOfSupplyRef = useRef(null);
  const typeOfSupplySectionRef = useRef(null);
  const stockGroupSectionRef = useRef(null);
  const unitSectionRef = useRef(null);
  const getInlineFieldClass = (tone = 'indigo') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
    return `flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none ${focusTone}`;
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
  const selectedStockGroupName = useMemo(() => {
    const selectedGroup = availableStockGroups.find(
      (group) => String(group._id) === String(formData.stockGroup || '')
    );
    return selectedGroup?.name || '';
  }, [availableStockGroups, formData.stockGroup]);
  const stockGroupOptions = useMemo(
    () => {
      const normalizedQuery = normalizeText(stockGroupQuery);
      const normalizedSelectedStockGroup = normalizeText(selectedStockGroupName);

      if (
        isStockGroupSectionActive
        && normalizedQuery
        && normalizedQuery === normalizedSelectedStockGroup
      ) {
        return availableStockGroups;
      }

      return filteredStockGroups;
    },
    [availableStockGroups, filteredStockGroups, isStockGroupSectionActive, selectedStockGroupName, stockGroupQuery]
  );

  const filteredUnits = useMemo(
    () => getMatchingUnits(unitQuery),
    [unitOptions, unitQuery]
  );
  const selectedTypeOfSupplyLabel = useMemo(() => {
    const selectedOption = TYPE_OF_SUPPLY_OPTIONS.find(
      (option) => option.value === String(formData.typeOfSupply || 'goods').trim().toLowerCase()
    );
    return selectedOption?.label || TYPE_OF_SUPPLY_OPTIONS[0].label;
  }, [formData.typeOfSupply]);
  const unitPanelOptions = useMemo(
    () => {
      const normalizedQuery = normalizeText(unitQuery);
      const normalizedSelectedUnit = normalizeText(formData.unit);

      if (
        isUnitSectionActive
        && normalizedQuery
        && normalizedQuery === normalizedSelectedUnit
      ) {
        return unitOptions;
      }

      return filteredUnits;
    },
    [filteredUnits, formData.unit, isUnitSectionActive, unitOptions]
  );
  const filteredTypeOfSupplyOptions = useMemo(() => {
    const normalized = normalizeText(typeOfSupplyQuery);
    const normalizedSelectedType = normalizeText(selectedTypeOfSupplyLabel);

    if (
      isTypeOfSupplyOpen
      && normalized
      && normalized === normalizedSelectedType
    ) {
      return TYPE_OF_SUPPLY_OPTIONS;
    }

    if (!normalized) return TYPE_OF_SUPPLY_OPTIONS;

    const startsWith = TYPE_OF_SUPPLY_OPTIONS.filter((option) => normalizeText(option.label).startsWith(normalized));
    const includes = TYPE_OF_SUPPLY_OPTIONS.filter((option) => (
      !normalizeText(option.label).startsWith(normalized)
      && normalizeText(option.label).includes(normalized)
    ));

    return [...startsWith, ...includes];
  }, [isTypeOfSupplyOpen, selectedTypeOfSupplyLabel, typeOfSupplyQuery]);
  const stockGroupDropdownStyle = useFloatingDropdownPosition(
    stockGroupSectionRef,
    isStockGroupSectionActive,
    [stockGroupOptions.length, stockGroupListIndex]
  );
  const typeOfSupplyDropdownStyle = useFloatingDropdownPosition(
    typeOfSupplySectionRef,
    isTypeOfSupplyOpen,
    [filteredTypeOfSupplyOptions.length, typeOfSupplyListIndex],
    'down',
    'viewport'
  );
  const unitDropdownStyle = useFloatingDropdownPosition(
    unitSectionRef,
    isUnitSectionActive,
    [unitPanelOptions.length, unitListIndex],
    'auto',
    'viewport'
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
    setTypeOfSupplyQuery(selectedTypeOfSupplyLabel);

    if (!showForm) {
      setTypeOfSupplyListIndex(0);
      setIsTypeOfSupplyOpen(false);
      return;
    }

    const selectedIndex = filteredTypeOfSupplyOptions.findIndex(
      (option) => option.label === selectedTypeOfSupplyLabel
    );
    setTypeOfSupplyListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredTypeOfSupplyOptions, selectedTypeOfSupplyLabel, showForm]);

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

  const selectTypeOfSupply = (option, moveNext = false, submitAfterSelect = false) => {
    if (!option) return;

    const parentForm = typeOfSupplyRef.current?.form;
    setFormData((prev) => ({ ...prev, typeOfSupply: option.value }));
    setTypeOfSupplyQuery(option.label);
    setTypeOfSupplyListIndex(
      Math.max(filteredTypeOfSupplyOptions.findIndex((item) => item.value === option.value), 0)
    );
    setIsTypeOfSupplyOpen(false);

    if (submitAfterSelect && parentForm instanceof HTMLFormElement) {
      requestAnimationFrame(() => {
        parentForm.requestSubmit();
      });
      return;
    }

    if (moveNext) {
      if (!(parentForm instanceof HTMLFormElement)) return;

      const fields = Array.from(parentForm.querySelectorAll(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
      )).filter((field) => field instanceof HTMLElement && field.tabIndex !== -1);
      const currentIndex = fields.indexOf(typeOfSupplyRef.current);
      const nextField = currentIndex >= 0 ? fields[currentIndex + 1] : null;

      if (nextField instanceof HTMLElement) {
        nextField.focus();
        if (nextField instanceof HTMLInputElement && typeof nextField.select === 'function') {
          nextField.select();
        }
      }
    }
  };

  const handleTypeOfSupplyInputChange = (e) => {
    const value = e.target.value;
    setTypeOfSupplyQuery(value);
    setIsTypeOfSupplyOpen(true);

    const exactMatch = TYPE_OF_SUPPLY_OPTIONS.find(
      (option) => normalizeText(option.label) === normalizeText(value)
    );

    if (exactMatch) {
      setFormData((prev) => ({ ...prev, typeOfSupply: exactMatch.value }));
    }
  };

  const handleTypeOfSupplyKeyDown = (e) => {
    const key = e.key?.toLowerCase();

    if (key === 'arrowdown') {
      e.preventDefault();
      e.stopPropagation();
      setIsTypeOfSupplyOpen(true);
      if (filteredTypeOfSupplyOptions.length === 0) return;
      setTypeOfSupplyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredTypeOfSupplyOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      e.preventDefault();
      e.stopPropagation();
      setIsTypeOfSupplyOpen(true);
      if (filteredTypeOfSupplyOptions.length === 0) return;
      setTypeOfSupplyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'escape' && isTypeOfSupplyOpen) {
      e.preventDefault();
      e.stopPropagation();
      const selectedOption = TYPE_OF_SUPPLY_OPTIONS.find(
        (option) => option.value === String(formData.typeOfSupply || 'goods').trim().toLowerCase()
      ) || TYPE_OF_SUPPLY_OPTIONS[0];
      setTypeOfSupplyQuery(selectedOption.label);
      setIsTypeOfSupplyOpen(false);
      return;
    }

    if (key === 'enter') {
      e.preventDefault();
      e.stopPropagation();

      if (!isTypeOfSupplyOpen) {
        setIsTypeOfSupplyOpen(true);
        return;
      }

      const activeOption = typeOfSupplyListIndex >= 0 ? filteredTypeOfSupplyOptions[typeOfSupplyListIndex] : null;
      const exactMatch = TYPE_OF_SUPPLY_OPTIONS.find(
        (option) => normalizeText(option.label) === normalizeText(typeOfSupplyQuery)
      );
      const matchedOption = activeOption || exactMatch || filteredTypeOfSupplyOptions[0] || TYPE_OF_SUPPLY_OPTIONS[0];
      selectTypeOfSupply(matchedOption, false, true);
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
    const selectedIndex = getMatchingStockGroups(group.name).findIndex((item) => String(item._id) === String(group._id));
    setStockGroupListIndex(selectedIndex >= 0 ? selectedIndex : -1);

    if (focusUnit && unitInputRef.current) {
      unitInputRef.current.focus();
    }
  };

  const selectUnit = (unitName, focusMinStock = false) => {
    if (!unitName) return;
    setUnitQuery(unitName);
    setFormData((prev) => ({ ...prev, unit: unitName }));
    const selectedIndex = getMatchingUnits(unitName).findIndex((item) => normalizeText(item) === normalizeText(unitName));
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
      const exactIndex = getMatchingStockGroups(value).findIndex((item) => String(item._id) === String(exactGroup._id));
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
      const exactIndex = getMatchingUnits(value).findIndex((item) => normalizeText(item) === normalizeText(exactUnit));
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 md:px-4 lg:px-6 pt-4 lg:pt-4 pb-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-5 mt-1 grid grid-cols-2 gap-2 sm:gap-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4" onClick={handleCancel}>
          <div
            className="flex max-h-[92vh] w-full max-w-[28rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-1.5 text-white md:px-4 md:py-2">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white ring-1 ring-white/30 md:h-8 md:w-8">
                    <Package className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold md:text-xl">{editingId ? 'Edit Stock Item' : 'Add New Stock Item'}</h2>
                    <p className="mt-0.5 text-[11px] text-cyan-100 md:text-xs">Create or update stock details in a clean accounting format.</p>
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
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                      <span className="bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</span>
                      Basic Details
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="w-32 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">Item Name *</label>
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

                      <div className="flex items-center gap-2">
                        <label className="w-32 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">Stock Group</label>
                        <div
                          ref={stockGroupSectionRef}
                          className="relative flex-1 min-w-0"
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
                        <label className="w-32 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">Unit *</label>
                      <div
                        ref={unitSectionRef}
                        className="relative flex-1 min-w-0"
                        onFocusCapture={() => {
                          const selectedUnit = String(formData.unit || initialFormData.unit).trim() || initialFormData.unit;
                          const selectedIndex = unitOptions.findIndex(
                            (unitName) => normalizeText(unitName) === normalizeText(selectedUnit)
                          );
                          setIsStockGroupSectionActive(false);
                          setIsTypeOfSupplyOpen(false);
                          setUnitQuery(selectedUnit);
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
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</span>
                      Stock & Tax
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="w-32 shrink-0 mb-0 text-xs md:text-sm font-semibold text-gray-700">
                          Min Stock Level
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

                      <div className="flex items-center gap-2">
                        <label className="w-32 shrink-0 mb-0 text-xs md:text-sm font-semibold text-gray-700">
                          Tax Rate (%)
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

                      <div className="flex items-center gap-2">
                        <label className="w-32 shrink-0 mb-0 text-xs md:text-sm font-semibold text-gray-700">
                          Type Of Supply
                        </label>
                        <div
                          ref={typeOfSupplySectionRef}
                          className="relative flex-1 min-w-0"
                          onBlurCapture={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              typeOfSupplySectionRef.current
                              && nextFocused instanceof Node
                              && typeOfSupplySectionRef.current.contains(nextFocused)
                            ) {
                              return;
                            }

                            const selectedOption = TYPE_OF_SUPPLY_OPTIONS.find(
                              (option) => option.value === String(formData.typeOfSupply || 'goods').trim().toLowerCase()
                            ) || TYPE_OF_SUPPLY_OPTIONS[0];
                            setTypeOfSupplyQuery(selectedOption.label);
                            setIsTypeOfSupplyOpen(false);
                          }}
                        >
                          <div className="relative">
                            <input
                              ref={typeOfSupplyRef}
                              type="text"
                              value={typeOfSupplyQuery}
                              onChange={handleTypeOfSupplyInputChange}
                              onFocus={() => {
                                const selectedIndex = filteredTypeOfSupplyOptions.findIndex(
                                  (option) => option.value === String(formData.typeOfSupply || 'goods').trim().toLowerCase()
                                );
                                setIsTypeOfSupplyOpen(true);
                                setTypeOfSupplyListIndex(selectedIndex >= 0 ? selectedIndex : 0);
                              }}
                              onKeyDown={handleTypeOfSupplyKeyDown}
                              className={`${getInlineFieldClass('emerald')} pr-10`}
                              placeholder="Select type of supply..."
                              autoComplete="off"
                            />
                            <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 transition-transform ${isTypeOfSupplyOpen ? 'rotate-180' : ''}`} />
                          </div>

                          {isTypeOfSupplyOpen && typeOfSupplyDropdownStyle && (
                            <div
                              className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                              style={typeOfSupplyDropdownStyle}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Type List</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                                  {filteredTypeOfSupplyOptions.length}
                                </span>
                              </div>
                              <div className="overflow-y-auto py-1" style={{ maxHeight: typeOfSupplyDropdownStyle.maxHeight }}>
                                {filteredTypeOfSupplyOptions.length === 0 ? (
                                  <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                    No matching types found.
                                  </div>
                                ) : (
                                  filteredTypeOfSupplyOptions.map((option, index) => {
                                    const isActive = index === typeOfSupplyListIndex;
                                    const isSelected = String(formData.typeOfSupply || 'goods') === String(option.value);

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setTypeOfSupplyListIndex(index)}
                                        onClick={() => selectTypeOfSupply(option, true)}
                                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                                          isActive
                                            ? 'bg-yellow-200 text-amber-950'
                                            : isSelected
                                            ? 'bg-yellow-50 text-amber-800'
                                            : 'text-slate-700 hover:bg-amber-50'
                                        }`}
                                      >
                                        <span className="truncate font-medium">{option.label}</span>
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

                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 md:flex-row md:px-4">
                <div className="text-[11px] text-gray-600 md:text-xs">
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close
                </div>

                <div className="flex w-full gap-2 md:w-auto">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-1.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stock items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                onClick={handleOpenForm}
                className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 whitespace-nowrap"
              >
                + Add Stock Item
              </button>
            </div>
          </div>

        {loading && !showForm ? (
          <div className="px-6 py-10 text-center text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            No stock items found. Create your first stock item!
          </div>
        ) : (
          <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap overflow-hidden">
              <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                <tr>
                  <th className="border border-slate-200 px-4 py-3.5 text-center text-sm font-semibold">Name</th>
                  <th className="border border-slate-200 px-4 py-3.5 text-center text-sm font-semibold">Stock Group</th>
                  <th className="border border-slate-200 px-4 py-3.5 text-center text-sm font-semibold">Unit</th>
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
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-slate-800">{product.name}</span>
                        <span className="text-[10px] font-medium text-sky-600 underline underline-offset-2">Open ledger</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{product.stockGroup?.name || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{product.unit || '-'}</td>
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
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
          </div>
        )}
      </div>
      </div>
    </div>
  );
}


