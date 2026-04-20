import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import apiClient from '../../../utils/api';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../../../utils/useFloatingDropdownPosition';
import { useAuth } from '../../../context/AuthContext';

const TYPE_OF_SUPPLY_OPTIONS = [
  { value: 'goods', label: 'Goods' },
  { value: 'services', label: 'Services' }
];

const TRACK_EXPIRY_OPTIONS = [
  { value: false, label: 'No' },
  { value: true, label: 'Yes' }
];

const DEFAULT_UNIT_OPTIONS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'hrs', 'minutes'];

const getNormalizedTypeOfSupply = (value) => (
  String(value || '').trim().toLowerCase() === 'services' ? 'services' : 'goods'
);

const getPopupInitialState = (initialName = '', product = null, defaultTrackExpiry = false) => {
  const normalizedStockGroupId = product
    ? (typeof product.stockGroup === 'object' ? product.stockGroup?._id || '' : product.stockGroup || '')
    : '';
  const resolvedStockGroupName = product
    ? (typeof product.stockGroup === 'object' ? product.stockGroup?.name || '' : '')
    : '';
  const resolvedUnit = String(product?.unit || 'pcs').trim() || 'pcs';
  const resolvedTypeOfSupply = getNormalizedTypeOfSupply(product?.typeOfSupply);
  const resolvedTrackExpiry = product ? Boolean(product?.trackExpiry) : Boolean(defaultTrackExpiry);
  const typeOfSupplyQuery = TYPE_OF_SUPPLY_OPTIONS.find(
    (option) => option.value === resolvedTypeOfSupply
  )?.label || TYPE_OF_SUPPLY_OPTIONS[0].label;
  const trackExpiryQuery = TRACK_EXPIRY_OPTIONS.find(
    (option) => option.value === resolvedTrackExpiry
  )?.label || TRACK_EXPIRY_OPTIONS[0].label;

  return {
    formData: {
      name: product ? String(product.name || '').trim() : String(initialName || '').trim(),
      stockGroup: normalizedStockGroupId,
      unit: resolvedUnit,
      typeOfSupply: resolvedTypeOfSupply,
      minStockLevel: product?.minStockLevel ?? '',
      salePrice: product?.salePrice ?? '',
      taxRate: product?.taxRate ?? 0,
      trackExpiry: resolvedTrackExpiry
    },
    stockGroupQuery: resolvedStockGroupName,
    unitQuery: resolvedUnit,
    trackExpiryQuery,
    trackExpiryListIndex: Math.max(
      TRACK_EXPIRY_OPTIONS.findIndex((option) => option.value === resolvedTrackExpiry),
      0
    ),
    typeOfSupplyQuery,
    typeOfSupplyListIndex: Math.max(
      TYPE_OF_SUPPLY_OPTIONS.findIndex((option) => option.value === resolvedTypeOfSupply),
      0
    )
  };
};

const getInlineFieldClass = (tone = 'indigo') => {
  const focusTone = tone === 'emerald'
    ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
    : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

  return `w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none ${focusTone}`;
};

export default function AddProductPopup({
  showForm,
  initialName = '',
  product = null,
  onClose,
  onProductCreated,
  onProductSaved
}) {
  const { user } = useAuth();
  const defaultTrackExpiry = Boolean(user?.userSettings?.expiryAlert);
  const initialPopupState = getPopupInitialState(initialName, product, defaultTrackExpiry);
  const [formData, setFormData] = useState(initialPopupState.formData);
  const [stockGroups, setStockGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockGroupQuery, setStockGroupQuery] = useState(initialPopupState.stockGroupQuery);
  const [stockGroupListIndex, setStockGroupListIndex] = useState(-1);
  const [isStockGroupSectionActive, setIsStockGroupSectionActive] = useState(false);
  const [unitQuery, setUnitQuery] = useState(initialPopupState.unitQuery);
  const [unitListIndex, setUnitListIndex] = useState(-1);
  const [isUnitSectionActive, setIsUnitSectionActive] = useState(false);
  const [trackExpiryQuery, setTrackExpiryQuery] = useState(initialPopupState.trackExpiryQuery);
  const [trackExpiryListIndex, setTrackExpiryListIndex] = useState(initialPopupState.trackExpiryListIndex);
  const [isTrackExpiryOpen, setIsTrackExpiryOpen] = useState(false);
  const [typeOfSupplyQuery, setTypeOfSupplyQuery] = useState(initialPopupState.typeOfSupplyQuery);
  const [typeOfSupplyListIndex, setTypeOfSupplyListIndex] = useState(initialPopupState.typeOfSupplyListIndex);
  const [isTypeOfSupplyOpen, setIsTypeOfSupplyOpen] = useState(false);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [unitFormData, setUnitFormData] = useState({ name: '', description: '' });
  const [unitFormLoading, setUnitFormLoading] = useState(false);
  const [unitFormError, setUnitFormError] = useState('');
  const nameInputRef = useRef(null);
  const stockGroupSectionRef = useRef(null);
  const unitSectionRef = useRef(null);
  const unitInputRef = useRef(null);
  const minStockInputRef = useRef(null);
  const salePriceInputRef = useRef(null);
  const trackExpiryRef = useRef(null);
  const trackExpirySectionRef = useRef(null);
  const typeOfSupplyRef = useRef(null);
  const typeOfSupplySectionRef = useRef(null);
  const editingId = product?._id || null;
  const isEditMode = Boolean(editingId);

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

  const selectedTypeOfSupplyLabel = useMemo(() => {
    const selectedOption = TYPE_OF_SUPPLY_OPTIONS.find(
      (option) => option.value === String(formData.typeOfSupply || 'goods').trim().toLowerCase()
    );
    return selectedOption?.label || TYPE_OF_SUPPLY_OPTIONS[0].label;
  }, [formData.typeOfSupply]);

  const selectedTrackExpiryLabel = useMemo(() => {
    const selectedOption = TRACK_EXPIRY_OPTIONS.find(
      (option) => option.value === Boolean(formData.trackExpiry)
    );
    return selectedOption?.label || TRACK_EXPIRY_OPTIONS[0].label;
  }, [formData.trackExpiry]);

  const filteredTrackExpiryOptions = useMemo(() => {
    const normalized = normalizeText(trackExpiryQuery);
    const normalizedSelected = normalizeText(selectedTrackExpiryLabel);

    if (
      isTrackExpiryOpen
      && normalized
      && normalized === normalizedSelected
    ) {
      return TRACK_EXPIRY_OPTIONS;
    }

    if (!normalized) return TRACK_EXPIRY_OPTIONS;

    const startsWith = TRACK_EXPIRY_OPTIONS.filter((option) => normalizeText(option.label).startsWith(normalized));
    const includes = TRACK_EXPIRY_OPTIONS.filter((option) => (
      !normalizeText(option.label).startsWith(normalized)
      && normalizeText(option.label).includes(normalized)
    ));

    return [...startsWith, ...includes];
  }, [isTrackExpiryOpen, selectedTrackExpiryLabel, trackExpiryQuery]);

  const filteredTypeOfSupplyOptions = useMemo(() => {
    const normalized = normalizeText(typeOfSupplyQuery);
    const normalizedSelected = normalizeText(selectedTypeOfSupplyLabel);

    if (
      isTypeOfSupplyOpen
      && normalized
      && normalized === normalizedSelected
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

  const unitDropdownStyle = useFloatingDropdownPosition(
    unitSectionRef,
    isUnitSectionActive,
    [unitPanelOptions.length, unitListIndex],
    'auto',
    'viewport'
  );

  const typeOfSupplyDropdownStyle = useFloatingDropdownPosition(
    typeOfSupplySectionRef,
    isTypeOfSupplyOpen,
    [filteredTypeOfSupplyOptions.length, typeOfSupplyListIndex],
    'down',
    'viewport'
  );
  const trackExpiryDropdownStyle = useFloatingDropdownPosition(
    trackExpirySectionRef,
    isTrackExpiryOpen,
    [filteredTrackExpiryOptions.length, trackExpiryListIndex],
    'down',
    'viewport'
  );

  useEffect(() => {
    if (!showForm) {
      const nextState = getPopupInitialState(initialName, product, defaultTrackExpiry);
      setFormData(nextState.formData);
      setError('');
      setStockGroupQuery(nextState.stockGroupQuery);
      setStockGroupListIndex(-1);
      setIsStockGroupSectionActive(false);
      setUnitQuery(nextState.unitQuery);
      setUnitListIndex(-1);
      setIsUnitSectionActive(false);
      setTrackExpiryQuery(nextState.trackExpiryQuery);
      setTrackExpiryListIndex(nextState.trackExpiryListIndex);
      setIsTrackExpiryOpen(false);
      setTypeOfSupplyQuery(nextState.typeOfSupplyQuery);
      setTypeOfSupplyListIndex(nextState.typeOfSupplyListIndex);
      setIsTypeOfSupplyOpen(false);
      return;
    }

    const nextState = getPopupInitialState(initialName, product, defaultTrackExpiry);
    setFormData(nextState.formData);
    setError('');
    setStockGroupQuery(nextState.stockGroupQuery);
    setStockGroupListIndex(-1);
    setIsStockGroupSectionActive(false);
    setUnitQuery(nextState.unitQuery);
    setUnitListIndex(-1);
    setIsUnitSectionActive(false);
    setTrackExpiryQuery(nextState.trackExpiryQuery);
    setTrackExpiryListIndex(nextState.trackExpiryListIndex);
    setIsTrackExpiryOpen(false);
    setTypeOfSupplyQuery(nextState.typeOfSupplyQuery);
    setTypeOfSupplyListIndex(nextState.typeOfSupplyListIndex);
    setIsTypeOfSupplyOpen(false);

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
  }, [defaultTrackExpiry, initialName, product, showForm]);

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

  useEffect(() => {
    setTrackExpiryQuery(selectedTrackExpiryLabel);

    if (!showForm) {
      setTrackExpiryListIndex(0);
      setIsTrackExpiryOpen(false);
      return;
    }

    const selectedIndex = filteredTrackExpiryOptions.findIndex(
      (option) => option.label === selectedTrackExpiryLabel
    );
    setTrackExpiryListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredTrackExpiryOptions, selectedTrackExpiryLabel, showForm]);

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
    const { name, value, type, checked } = event.target;

    if (name === 'minStockLevel' || name === 'salePrice' || name === 'taxRate') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

  const openInlineUnitForm = () => {
    setUnitFormData({ name: String(unitQuery || '').toLowerCase().trim(), description: '' });
    setUnitFormError('');
    setIsUnitSectionActive(false);
    setIsUnitFormOpen(true);
  };

  const closeInlineUnitForm = (shouldRefocus = true) => {
    setIsUnitFormOpen(false);
    setUnitFormData({ name: '', description: '' });
    setUnitFormError('');

    if (shouldRefocus) {
      requestAnimationFrame(() => {
        unitInputRef.current?.focus();
        unitInputRef.current?.select?.();
      });
    }
  };

  const handleUnitFormInputChange = (e) => {
    const { name, value } = e.target;
    setUnitFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUnitFormSubmit = async (e) => {
    e.preventDefault();
    if (!unitFormData.name.trim()) {
      setUnitFormError('Unit name is required');
      return;
    }

    try {
      setUnitFormLoading(true);
      const response = await apiClient.post('/units', unitFormData);
      const newUnit = response.data;
      
      if (!newUnit?._id) throw new Error('Unit created but response was incomplete');

      setUnits((prev) => [...prev, newUnit]);
      selectUnit(newUnit.name, true);
      closeInlineUnitForm(false);
    } catch (err) {
      setUnitFormError(err.message || 'Error creating unit');
    } finally {
      setUnitFormLoading(false);
    }
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
    const key = event.key?.toLowerCase();

    if (key === 'control' && !event.altKey && !event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      openInlineUnitForm();
      return;
    }

    if (key === 'arrowdown') {
      event.preventDefault();
      event.stopPropagation();
      if (unitPanelOptions.length === 0) return;
      setUnitListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, unitPanelOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
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

  const selectTrackExpiry = (option, moveNext = false) => {
    if (!option) return;

    setFormData((prev) => ({ ...prev, trackExpiry: Boolean(option.value) }));
    setTrackExpiryQuery(option.label);
    setTrackExpiryListIndex(
      Math.max(filteredTrackExpiryOptions.findIndex((item) => item.value === option.value), 0)
    );
    setIsTrackExpiryOpen(false);

    if (moveNext) {
      requestAnimationFrame(() => {
        typeOfSupplyRef.current?.focus();
        typeOfSupplyRef.current?.select?.();
      });
    }
  };

  const handleTrackExpiryInputChange = (event) => {
    const value = event.target.value;
    setTrackExpiryQuery(value);
    setIsTrackExpiryOpen(true);

    const exactMatch = TRACK_EXPIRY_OPTIONS.find(
      (option) => normalizeText(option.label) === normalizeText(value)
    );

    if (exactMatch) {
      setFormData((prev) => ({ ...prev, trackExpiry: exactMatch.value }));
    }
  };

  const handleTrackExpiryKeyDown = (event) => {
    const key = event.key?.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      event.stopPropagation();
      setIsTrackExpiryOpen(true);
      if (filteredTrackExpiryOptions.length === 0) return;
      setTrackExpiryListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredTrackExpiryOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      event.preventDefault();
      event.stopPropagation();
      setIsTrackExpiryOpen(true);
      if (filteredTrackExpiryOptions.length === 0) return;
      setTrackExpiryListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'escape' && isTrackExpiryOpen) {
      event.preventDefault();
      event.stopPropagation();
      setTrackExpiryQuery(selectedTrackExpiryLabel);
      setIsTrackExpiryOpen(false);
      return;
    }

    if (key === 'enter') {
      event.preventDefault();
      event.stopPropagation();

      if (!isTrackExpiryOpen) {
        setIsTrackExpiryOpen(true);
        return;
      }

      const activeOption = trackExpiryListIndex >= 0 ? filteredTrackExpiryOptions[trackExpiryListIndex] : null;
      const exactMatch = TRACK_EXPIRY_OPTIONS.find(
        (option) => normalizeText(option.label) === normalizeText(trackExpiryQuery)
      );
      const matchedOption = activeOption || exactMatch || filteredTrackExpiryOptions[0] || TRACK_EXPIRY_OPTIONS[0];
      selectTrackExpiry(matchedOption, true);
    }
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

    if (!moveNext || !(parentForm instanceof HTMLFormElement)) return;

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
  };

  const handleTypeOfSupplyInputChange = (event) => {
    const value = event.target.value;
    setTypeOfSupplyQuery(value);
    setIsTypeOfSupplyOpen(true);

    const exactMatch = TYPE_OF_SUPPLY_OPTIONS.find(
      (option) => normalizeText(option.label) === normalizeText(value)
    );

    if (exactMatch) {
      setFormData((prev) => ({ ...prev, typeOfSupply: exactMatch.value }));
    }
  };

  const handleTypeOfSupplyKeyDown = (event) => {
    const key = event.key?.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      event.stopPropagation();
      setIsTypeOfSupplyOpen(true);
      if (filteredTypeOfSupplyOptions.length === 0) return;
      setTypeOfSupplyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredTypeOfSupplyOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      event.preventDefault();
      event.stopPropagation();
      setIsTypeOfSupplyOpen(true);
      if (filteredTypeOfSupplyOptions.length === 0) return;
      setTypeOfSupplyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'escape' && isTypeOfSupplyOpen) {
      event.preventDefault();
      event.stopPropagation();
      setTypeOfSupplyQuery(selectedTypeOfSupplyLabel);
      setIsTypeOfSupplyOpen(false);
      return;
    }

    if (key === 'enter') {
      event.preventDefault();
      event.stopPropagation();

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

  const handleTaxRateKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (salePriceInputRef.current) {
      salePriceInputRef.current.focus();
      salePriceInputRef.current.select?.();
    }
  };

  const handleSalePriceKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();

    const selectedIndex = TRACK_EXPIRY_OPTIONS.findIndex(
      (option) => option.value === Boolean(formData.trackExpiry)
    );
    setTrackExpiryQuery(selectedTrackExpiryLabel);
    setTrackExpiryListIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsTrackExpiryOpen(true);

    requestAnimationFrame(() => {
      trackExpiryRef.current?.focus();
      trackExpiryRef.current?.select?.();
    });
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
        typeOfSupply: getNormalizedTypeOfSupply(formData.typeOfSupply),
        minStockLevel: Number(formData.minStockLevel || 0),
        salePrice: Number(formData.salePrice || 0),
        taxRate: Number(formData.taxRate || 0),
        trackExpiry: Boolean(formData.trackExpiry)
      };

      const response = isEditMode
        ? await apiClient.put(`/products/${editingId}`, payload)
        : await apiClient.post('/products', payload);
      const savedProduct = response?.data || null;

      if (!savedProduct?._id) {
        throw new Error(
          isEditMode
            ? 'Stock item updated but response was incomplete'
            : 'Stock item created but response was incomplete'
        );
      }

      if (!isEditMode) {
        onProductCreated?.(savedProduct);
      }
      onProductSaved?.(savedProduct, { isEditMode });

      if (!onProductSaved && !isEditMode) {
        const resetState = getPopupInitialState('', null, defaultTrackExpiry);
        setFormData(resetState.formData);
        setStockGroupQuery(resetState.stockGroupQuery);
        setStockGroupListIndex(-1);
        setIsStockGroupSectionActive(false);
        setUnitQuery(resetState.unitQuery);
        setUnitListIndex(-1);
        setIsUnitSectionActive(false);
        setTrackExpiryQuery(resetState.trackExpiryQuery);
        setTrackExpiryListIndex(resetState.trackExpiryListIndex);
        setIsTrackExpiryOpen(false);
        setTypeOfSupplyQuery(resetState.typeOfSupplyQuery);
        setTypeOfSupplyListIndex(resetState.typeOfSupplyListIndex);
        setIsTypeOfSupplyOpen(false);
      }
    } catch (err) {
      setError(err.message || (isEditMode ? 'Error updating stock item' : 'Error creating stock item'));
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
                <h2 className="text-base font-bold md:text-xl">{isEditMode ? 'Edit Stock Item' : 'Add New Stock Item'}</h2>
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
                    <div className="relative mb-1 min-h-[16px] w-32 shrink-0">
                      <label className="block text-xs font-semibold text-gray-700 md:text-sm">Unit *</label>
                      {isUnitSectionActive && (
                        <button
                          type="button"
                          onClick={openInlineUnitForm}
                          className="absolute -right-2 -top-1.5 inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                          <span className="rounded bg-indigo-100 px-1 py-0.5 font-mono text-[8px] text-indigo-700">Ctrl</span>
                          New
                        </button>
                      )}
                    </div>
                    <div
                      ref={unitSectionRef}
                      className="relative min-w-0 flex-1"
                      onFocusCapture={() => {
                        const defaultUnit = getPopupInitialState('', null).formData.unit;
                        const selectedUnit = String(formData.unit || defaultUnit).trim() || defaultUnit;
                        const selectedIndex = unitOptions.findIndex(
                          (unitName) => normalizeText(unitName) === normalizeText(selectedUnit)
                        );
                        setIsStockGroupSectionActive(false);
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
                                <p>No units found.</p>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={openInlineUnitForm}
                                  className="mt-2 inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                >
                                  Create New Unit
                                  <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-indigo-600">Ctrl</span>
                                </button>
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

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Min Stock Level</label>
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

                    <div className="flex items-center gap-2">
                      <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Tax Rate</label>
                      <input
                        type="number"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleChange}
                        onKeyDown={handleTaxRateKeyDown}
                        min="0"
                        step="0.01"
                        className={getInlineFieldClass('emerald')}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Selling Price</label>
                      <input
                        ref={salePriceInputRef}
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleChange}
                        onKeyDown={handleSalePriceKeyDown}
                        min="0"
                        step="0.01"
                        className={getInlineFieldClass('emerald')}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Track Expiry</label>
                      <div
                        ref={trackExpirySectionRef}
                        className="relative min-w-0 flex-1"
                        onBlurCapture={(event) => {
                          const nextFocused = event.relatedTarget;
                          if (
                            trackExpirySectionRef.current
                            && nextFocused instanceof Node
                            && trackExpirySectionRef.current.contains(nextFocused)
                          ) {
                            return;
                          }
                          setTrackExpiryQuery(selectedTrackExpiryLabel);
                          setIsTrackExpiryOpen(false);
                        }}
                      >
                        <div className="relative">
                          <input
                            ref={trackExpiryRef}
                            type="text"
                            value={trackExpiryQuery}
                            onChange={handleTrackExpiryInputChange}
                            onFocus={() => {
                              const selectedOption = TRACK_EXPIRY_OPTIONS.find(
                                (option) => option.value === Boolean(formData.trackExpiry)
                              ) || TRACK_EXPIRY_OPTIONS[0];
                              setTrackExpiryQuery(selectedOption.label);
                              setIsTrackExpiryOpen(true);
                              setTrackExpiryListIndex(
                                Math.max(filteredTrackExpiryOptions.findIndex((option) => option.value === selectedOption.value), 0)
                              );
                            }}
                            onKeyDown={handleTrackExpiryKeyDown}
                            className={`${getInlineFieldClass('emerald')} pr-10`}
                            placeholder="Select yes or no"
                          />
                          <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 transition-transform ${isTrackExpiryOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isTrackExpiryOpen && trackExpiryDropdownStyle && (
                          <div
                            className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                            style={trackExpiryDropdownStyle}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Track Expiry</span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                                {filteredTrackExpiryOptions.length}
                              </span>
                            </div>
                            <div className="overflow-y-auto py-1" style={{ maxHeight: trackExpiryDropdownStyle.maxHeight }}>
                              {filteredTrackExpiryOptions.map((option, index) => {
                                const isActive = index === trackExpiryListIndex;
                                const isSelected = Boolean(formData.trackExpiry) === option.value;

                                return (
                                  <button
                                    key={option.label}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setTrackExpiryListIndex(index)}
                                    onClick={() => selectTrackExpiry(option, true)}
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
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Type Of Supply</label>
                      <div
                        ref={typeOfSupplySectionRef}
                        className="relative min-w-0 flex-1"
                        onBlurCapture={(event) => {
                          const nextFocused = event.relatedTarget;
                          if (
                            typeOfSupplySectionRef.current
                            && nextFocused instanceof Node
                            && typeOfSupplySectionRef.current.contains(nextFocused)
                          ) {
                            return;
                          }
                          setTypeOfSupplyQuery(selectedTypeOfSupplyLabel);
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
                              const selectedOption = TYPE_OF_SUPPLY_OPTIONS.find(
                                (option) => option.value === String(formData.typeOfSupply || 'goods').trim().toLowerCase()
                              ) || TYPE_OF_SUPPLY_OPTIONS[0];
                              setTypeOfSupplyQuery(selectedOption.label);
                              setIsTypeOfSupplyOpen(true);
                              setTypeOfSupplyListIndex(
                                Math.max(filteredTypeOfSupplyOptions.findIndex((option) => option.value === selectedOption.value), 0)
                              );
                            }}
                            onKeyDown={handleTypeOfSupplyKeyDown}
                            className={`${getInlineFieldClass('emerald')} pr-10`}
                            placeholder="Select type of supply"
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
                              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Type Of Supply</span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                                {filteredTypeOfSupplyOptions.length}
                              </span>
                            </div>
                            <div className="overflow-y-auto py-1" style={{ maxHeight: typeOfSupplyDropdownStyle.maxHeight }}>
                              {filteredTypeOfSupplyOptions.map((option, index) => {
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
                              })}
                            </div>
                          </div>
                        )}
                      </div>
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
                {loading ? 'Saving...' : isEditMode ? 'Update Stock Item' : 'Save Stock'}
              </button>
            </div>
          </div>
        </form>

        {isUnitFormOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-2 backdrop-blur-[1px]" onClick={() => closeInlineUnitForm(true)}>
            <div className="w-full max-w-[24rem] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
                <h3 className="text-sm font-bold text-gray-800">Add New Unit</h3>
                <button type="button" onClick={() => closeInlineUnitForm(true)} className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-200">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleUnitFormSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, () => closeInlineUnitForm(true))} className="flex flex-col p-4">
                {unitFormError && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{unitFormError}</div>}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Unit Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={unitFormData.name}
                      onChange={handleUnitFormInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="e.g. pcs, kg"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={unitFormData.description}
                      onChange={handleUnitFormInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Optional details"
                    />
                  </div>
                </div>
                <div className="mt-5 flex gap-2 pt-2">
                  <button type="button" onClick={() => closeInlineUnitForm(true)} className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={unitFormLoading} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                    {unitFormLoading ? 'Saving...' : 'Save Unit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
