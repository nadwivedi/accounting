import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Wallet, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../utils/useFloatingDropdownPosition';

const PAYMENT_METHODS = ['cash', 'bank', 'upi', 'card', 'other'];
const TOAST_OPTIONS = { autoClose: 1200 };

export default function VoucherRegisterPage({
  title,
  endpoint,
  addButtonLabel,
  fieldDefinitions,
  partyRequired = false,
  buttonClassName = 'bg-indigo-600 hover:bg-indigo-700',
  accountPreview,
  showParty = true,
  partyDisplayMode = 'select',
  showAmount = true,
  showMethod = true,
  showReferenceNo = true,
  staticPayload = {},
  popupVariant = 'default',
  pageVariant = 'default',
  popupFieldOrder = null,
  dateInputType = 'date',
  datePlaceholder = '',
  modalOnly = false,
  onModalFinish = null
}) {
  const parseVoucherDateValue = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return new Date();

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, yearText, monthText, dayText] = isoMatch;
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      const parsed = new Date(year, month - 1, day);
      if (
        !Number.isNaN(parsed.getTime())
        && parsed.getFullYear() === year
        && parsed.getMonth() === month - 1
        && parsed.getDate() === day
      ) {
        return parsed;
      }
    }

    const manualMatch = normalized.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (manualMatch) {
      const [, dayText, monthText, yearText] = manualMatch;
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      const parsed = new Date(year, month - 1, day);
      if (
        !Number.isNaN(parsed.getTime())
        && parsed.getFullYear() === year
        && parsed.getMonth() === month - 1
        && parsed.getDate() === day
      ) {
        return parsed;
      }
    }

    return null;
  };

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
  const firstFieldRef = useRef(null);
  const selectSectionRefs = useRef({});
  const selectInputRefs = useRef({});
  const activeSelectAnchorRef = useRef(null);
  const [fieldQueries, setFieldQueries] = useState({});
  const [activeSelectField, setActiveSelectField] = useState('');
  const [selectListIndices, setSelectListIndices] = useState({});

  useEffect(() => {
    fetchEntries();
  }, [search]);

  useEffect(() => {
    if (showParty) {
      fetchParties();
    }
  }, [showParty]);

  useEffect(() => {
    if (!showForm) return;

    const timer = setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [showForm]);

  useEffect(() => {
    if (!modalOnly || showForm) return;
    handleOpenForm();
  }, [modalOnly, showForm]);

  useEffect(() => {
    if (!showForm || !activeSelectField) {
      activeSelectAnchorRef.current = null;
      return;
    }

    activeSelectAnchorRef.current = selectSectionRefs.current[activeSelectField] || null;
  }, [activeSelectField, showForm]);

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

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const getOptionLabel = (field, option) => {
    if (!option) return '';
    if (typeof field.getOptionLabel === 'function') {
      return field.getOptionLabel(option);
    }
    return option.label || '';
  };

  const getOptionValue = (field, option) => {
    if (!option) return '';
    if (typeof field.getOptionValue === 'function') {
      return field.getOptionValue(option);
    }
    return option.value;
  };

  const partySelectField = {
    name: 'party',
    label: 'Party',
    type: 'select',
    placeholder: 'Type to search party...',
    options: parties,
    getOptionLabel: (party) => String(party?.partyName || party?.name || '').trim(),
    getOptionValue: (party) => party?._id
  };

  const getSelectConfigByName = (fieldName) => {
    if (fieldName === 'party' && showParty) {
      return partySelectField;
    }

    return fieldDefinitions.find((item) => item.name === fieldName) || null;
  };

  const getSelectFieldLabel = (field, value) => {
    const matchedOption = (field.options || []).find((option) => String(getOptionValue(field, option)) === String(value));
    return matchedOption ? getOptionLabel(field, matchedOption) : '';
  };
  const selectedPartyLabel = getSelectFieldLabel(partySelectField, formData.party) || fieldQueries.party || '';

  const buildInitialQueries = () => {
    const nextQueries = {};
    if (showParty) {
      nextQueries.party = '';
    }
    fieldDefinitions.forEach((field) => {
      if (field.type !== 'select') return;
      nextQueries[field.name] = '';
    });
    return nextQueries;
  };

  const getFilteredSelectOptions = (field, queryValue, includeSelectedList = false) => {
    const options = field.options || [];
    const normalizedQuery = normalizeText(queryValue);
    const selectedLabel = getSelectFieldLabel(field, formData[field.name]);

    if (
      includeSelectedList
      && normalizedQuery
      && normalizedQuery === normalizeText(selectedLabel)
    ) {
      return options;
    }

    if (!normalizedQuery) return options;

    const startsWith = options.filter((option) => normalizeText(getOptionLabel(field, option)).startsWith(normalizedQuery));
    const includes = options.filter((option) => (
      !normalizeText(getOptionLabel(field, option)).startsWith(normalizedQuery)
      && normalizeText(getOptionLabel(field, option)).includes(normalizedQuery)
    ));

    return [...startsWith, ...includes];
  };

  const activeSelectOptions = useMemo(() => {
    if (!activeSelectField) return [];
    const field = getSelectConfigByName(activeSelectField);
    if (!field || field.type !== 'select') return [];

    return getFilteredSelectOptions(field, fieldQueries[activeSelectField] || '', true);
  }, [activeSelectField, fieldDefinitions, fieldQueries, formData, parties]);

  const activeSelectDropdownStyle = useFloatingDropdownPosition(
    activeSelectAnchorRef,
    Boolean(activeSelectField),
    [activeSelectField, activeSelectOptions.length, selectListIndices[activeSelectField] ?? -1],
    'auto',
    'viewport'
  );

  useEffect(() => {
    if (!showForm || !activeSelectField) return;

    if (activeSelectOptions.length === 0) {
      setSelectListIndices((prev) => ({ ...prev, [activeSelectField]: -1 }));
      return;
    }

    setSelectListIndices((prev) => {
      const currentIndex = prev[activeSelectField];
      if (currentIndex === undefined || currentIndex < 0) {
        return { ...prev, [activeSelectField]: 0 };
      }
      if (currentIndex >= activeSelectOptions.length) {
        return { ...prev, [activeSelectField]: activeSelectOptions.length - 1 };
      }
      return prev;
    });
  }, [activeSelectField, activeSelectOptions, showForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyLinkedFieldValues = (option) => {
    if (!option || typeof option.linkedFieldValues !== 'object' || option.linkedFieldValues === null) {
      return;
    }

    const nextFormValues = {};
    const nextQueries = {};

    Object.entries(option.linkedFieldValues).forEach(([targetField, targetValue]) => {
      nextFormValues[targetField] = targetValue;
    });

    if (typeof option.linkedFieldLabels === 'object' && option.linkedFieldLabels !== null) {
      Object.entries(option.linkedFieldLabels).forEach(([targetField, targetLabel]) => {
        nextQueries[targetField] = targetLabel || '';
      });
    }

    if (Object.keys(nextFormValues).length > 0) {
      setFormData((prev) => ({ ...prev, ...nextFormValues }));
    }

    if (Object.keys(nextQueries).length > 0) {
      setFieldQueries((prev) => ({ ...prev, ...nextQueries }));
    }
  };

  const focusNextFormField = (fieldName) => {
    const currentField = selectInputRefs.current[fieldName];
    const form = currentField?.form;
    if (!(form instanceof HTMLFormElement)) return;

    const fields = Array.from(form.querySelectorAll(
      'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
    )).filter((field) => field instanceof HTMLElement && field.tabIndex !== -1);
    const currentIndex = fields.indexOf(currentField);
    const nextField = currentIndex >= 0 ? fields[currentIndex + 1] : null;

    if (nextField instanceof HTMLElement) {
      nextField.focus();
      if (nextField instanceof HTMLInputElement && typeof nextField.select === 'function') {
        nextField.select();
      }
    }
  };

  const attachSelectInputRef = (fieldName, forwardedRef) => (node) => {
    selectInputRefs.current[fieldName] = node;

    if (!forwardedRef) return;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
      return;
    }

    forwardedRef.current = node;
  };

  const openSelectField = (field) => {
    const selectedLabel = getSelectFieldLabel(field, formData[field.name]);
    const nextQuery = selectedLabel || fieldQueries[field.name] || '';
    const options = getFilteredSelectOptions(field, nextQuery, true);
    const selectedIndex = options.findIndex((option) => String(getOptionValue(field, option)) === String(formData[field.name]));

    setFieldQueries((prev) => ({ ...prev, [field.name]: nextQuery }));
    setSelectListIndices((prev) => ({
      ...prev,
      [field.name]: selectedIndex >= 0 ? selectedIndex : (options.length > 0 ? 0 : -1)
    }));
    activeSelectAnchorRef.current = selectSectionRefs.current[field.name] || null;
    setActiveSelectField(field.name);
  };

  const closeSelectField = (field) => {
    const selectedLabel = getSelectFieldLabel(field, formData[field.name]);
    setFieldQueries((prev) => ({
      ...prev,
      [field.name]: prev[field.name] || selectedLabel || ''
    }));
    activeSelectAnchorRef.current = null;
    setActiveSelectField((prev) => (prev === field.name ? '' : prev));
  };

  const selectFieldOption = (field, option, moveNext = false) => {
    if (!option) return;

    setFormData((prev) => ({ ...prev, [field.name]: getOptionValue(field, option) }));
    setFieldQueries((prev) => ({ ...prev, [field.name]: getOptionLabel(field, option) }));
    setSelectListIndices((prev) => ({
      ...prev,
      [field.name]: (field.options || []).findIndex((item) => String(getOptionValue(field, item)) === String(getOptionValue(field, option)))
    }));
    activeSelectAnchorRef.current = null;
    setActiveSelectField('');
    applyLinkedFieldValues(option);

    if (moveNext) {
      focusNextFormField(field.name);
    }
  };

  const handleSelectInputChange = (field, value) => {
    const options = getFilteredSelectOptions(field, value, false);
    const exactMatch = (field.options || []).find((option) => normalizeText(getOptionLabel(field, option)) === normalizeText(value));
    const firstMatch = options[0] || null;

    setFieldQueries((prev) => ({ ...prev, [field.name]: value }));
    setActiveSelectField(field.name);
    activeSelectAnchorRef.current = selectSectionRefs.current[field.name] || null;
    setSelectListIndices((prev) => ({ ...prev, [field.name]: firstMatch ? 0 : -1 }));
    setFormData((prev) => ({
      ...prev,
      [field.name]: exactMatch ? getOptionValue(field, exactMatch) : (firstMatch ? getOptionValue(field, firstMatch) : '')
    }));
    applyLinkedFieldValues(exactMatch || firstMatch);
  };

  const handleSelectInputKeyDown = (field, e) => {
    const options = activeSelectField === field.name
      ? activeSelectOptions
      : getFilteredSelectOptions(field, fieldQueries[field.name] || '', true);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (activeSelectField !== field.name) {
        openSelectField(field);
        return;
      }
      if (options.length === 0) return;
      setSelectListIndices((prev) => ({
        ...prev,
        [field.name]: prev[field.name] < 0 ? 0 : Math.min(prev[field.name] + 1, options.length - 1)
      }));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (activeSelectField !== field.name) {
        openSelectField(field);
        return;
      }
      if (options.length === 0) return;
      setSelectListIndices((prev) => ({
        ...prev,
        [field.name]: prev[field.name] < 0 ? 0 : Math.max(prev[field.name] - 1, 0)
      }));
      return;
    }

    if (e.key === 'Escape' && activeSelectField === field.name) {
      e.preventDefault();
      e.stopPropagation();
      closeSelectField(field);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (activeSelectField !== field.name) {
        openSelectField(field);
        return;
      }

      const activeOption = options[selectListIndices[field.name] ?? -1] || null;
      const exactMatch = (field.options || []).find(
        (option) => normalizeText(getOptionLabel(field, option)) === normalizeText(fieldQueries[field.name] || '')
      );
      const matchedOption = activeOption || exactMatch || options[0] || null;

      if (matchedOption) {
        selectFieldOption(field, matchedOption, true);
      }
    }
  };

  const renderFloatingSelectField = (field, tone, ref) => {
    const isActive = activeSelectField === field.name;
    const queryValue = fieldQueries[field.name] ?? getSelectFieldLabel(field, formData[field.name]);
    const selectedLabel = getSelectFieldLabel(field, formData[field.name]);

    return (
      <div
        ref={(node) => {
          selectSectionRefs.current[field.name] = node;
          if (isActive) {
            activeSelectAnchorRef.current = node;
          }
        }}
        className="relative w-full"
        onBlurCapture={(event) => {
          const nextFocused = event.relatedTarget;
          if (
            selectSectionRefs.current[field.name]
            && nextFocused instanceof Node
            && selectSectionRefs.current[field.name].contains(nextFocused)
          ) {
            return;
          }

          closeSelectField(field);
        }}
      >
        <div className="relative">
          <input
            ref={attachSelectInputRef(field.name, ref)}
            type="text"
            value={queryValue}
            onChange={(e) => handleSelectInputChange(field, e.target.value)}
            onFocus={() => openSelectField(field)}
            onKeyDown={(e) => handleSelectInputKeyDown(field, e)}
            className={`${getInlineFieldClass(tone)} pr-10`}
            placeholder={field.placeholder || `Select ${field.label}`}
            autoComplete="off"
          />
          <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${tone === 'emerald' ? 'text-emerald-500' : 'text-indigo-500'} transition-transform ${isActive ? 'rotate-180' : ''}`} />
        </div>

        {isActive && activeSelectDropdownStyle && (
          <div
            className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
            style={activeSelectDropdownStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">{field.label} List</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                {activeSelectOptions.length}
              </span>
            </div>
            <div className="overflow-y-auto py-1" style={{ maxHeight: activeSelectDropdownStyle.maxHeight }}>
              {activeSelectOptions.length === 0 ? (
                <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                  No matching options found.
                </div>
              ) : (
                activeSelectOptions.map((option, index) => {
                  const isOptionActive = index === (selectListIndices[field.name] ?? -1);
                  const isSelected = String(formData[field.name] || '') === String(getOptionValue(field, option));

                  return (
                    <button
                      key={String(getOptionValue(field, option))}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setSelectListIndices((prev) => ({ ...prev, [field.name]: index }))}
                      onClick={() => selectFieldOption(field, option, true)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                        isOptionActive
                          ? 'bg-yellow-200 text-amber-950'
                          : isSelected
                          ? 'bg-yellow-50 text-amber-800'
                          : 'text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <span className="truncate font-medium">{getOptionLabel(field, option)}</span>
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
    );
  };

  const handleOpenForm = () => {
    setFormData(buildInitialForm());
    setFieldQueries(buildInitialQueries());
    setSelectListIndices({});
    setActiveSelectField('');
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(buildInitialForm());
    setFieldQueries(buildInitialQueries());
    setSelectListIndices({});
    setActiveSelectField('');

    if (modalOnly && typeof onModalFinish === 'function') {
      onModalFinish();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showAmount && (!formData.amount || Number(formData.amount) <= 0)) {
      setError('Valid amount is required');
      return;
    }

    if (showParty && partyRequired && !formData.party) {
      setError('Party is required');
      return;
    }

    for (const field of fieldDefinitions) {
      const rawValue = formData[field.name];
      const normalizedValue = String(rawValue ?? '').trim();

      if (field.required && !normalizedValue) {
        setError(`${field.label} is required`);
        return;
      }

      if (field.type === 'number' && normalizedValue) {
        const numberValue = Number(rawValue);
        if (!Number.isFinite(numberValue)) {
          setError(`${field.label} must be a valid number`);
          return;
        }

        const minValue = Number(field.min);
        if (Number.isFinite(minValue) && numberValue < minValue) {
          setError(`${field.label} must be at least ${field.min}`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const parsedVoucherDate = parseVoucherDateValue(formData.voucherDate);
      if (!parsedVoucherDate) {
        setError('Valid date is required');
        setLoading(false);
        return;
      }

      const payload = {
        voucherDate: parsedVoucherDate,
        notes: formData.notes,
        ...staticPayload
      };

      if (showParty) {
        payload.party = formData.party || null;
      }

      if (showAmount) {
        payload.amount = Number(formData.amount);
      }

      if (showMethod) {
        payload.method = formData.method || 'cash';
      }

      if (showReferenceNo) {
        payload.referenceNo = formData.referenceNo;
      }

      fieldDefinitions.forEach((field) => {
        const value = formData[field.name];
        if (field.type === 'number') {
          payload[field.name] = String(value ?? '').trim() ? Number(value) : null;
          return;
        }

        payload[field.name] = String(value || '').trim();
      });

      await apiClient.post(endpoint, payload);

      setError('');
      toast.success(`${title} created successfully`, TOAST_OPTIONS);
      handleCloseForm();
      fetchEntries();
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
  const isPartyPageVariant = pageVariant === 'party';
  const primaryField = fieldDefinitions[0] || null;

  const getFieldDisplayValue = (entry, field) => {
    if (!field) return '-';
    const rawValue = entry?.[field.name];
    if (rawValue === undefined || rawValue === null || rawValue === '') return '-';

    if (field.type === 'select' && Array.isArray(field.options)) {
      const resolvedValue = rawValue && typeof rawValue === 'object'
        ? (rawValue._id || rawValue.id || rawValue.value || '')
        : rawValue;
      const matched = field.options.find((option) => String(option.value) === String(resolvedValue));
      return matched?.label || resolvedValue || '-';
    }

    if (field.type === 'number') {
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed.toLocaleString('en-IN') : rawValue;
    }

    return rawValue;
  };

  const getInlineFieldClass = (tone = 'indigo') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
    return `w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none ${focusTone}`;
  };

  const popupFields = [];

  if (showParty) {
    popupFields.push({
      key: 'party',
      label: `Party${partyRequired ? ' *' : ''}`,
      render: (tone, ref) => (
        partyDisplayMode === 'readonly' ? (
          <input
            ref={ref}
            type="text"
            value={selectedPartyLabel}
            readOnly
            className={`${getInlineFieldClass(tone)} bg-slate-50 text-slate-700`}
            placeholder="Select voucher first"
          />
        ) : isCompactPopupVariant ? (
          renderFloatingSelectField(
            {
              ...partySelectField,
              label: `Party${partyRequired ? ' *' : ''}`
            },
            tone,
            ref
          )
        ) : (
          <select
            ref={ref}
            name="party"
            value={formData.party}
            onChange={handleChange}
            className={getInlineFieldClass(tone)}
          >
            <option value="">Select party</option>
            {parties.map((party) => (
              <option key={party._id} value={party._id}>
                {party.partyName}
              </option>
            ))}
          </select>
        )
      )
    });
  }

  if (showAmount) {
    popupFields.push({
      key: 'amount',
      label: 'Amount *',
      render: (tone, ref) => (
        <input
          ref={ref}
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          className={getInlineFieldClass(tone)}
          required
        />
      )
    });
  }

  popupFields.push({
    key: 'voucherDate',
    label: 'Date',
    render: (tone, ref) => (
      <input
        ref={ref}
        type={dateInputType}
        name="voucherDate"
        value={formData.voucherDate}
        onChange={handleChange}
        className={getInlineFieldClass(tone)}
        placeholder={datePlaceholder}
      />
    )
  });

  fieldDefinitions.forEach((field) => {
    popupFields.push({
      key: field.name,
      label: `${field.label}${field.required ? ' *' : ''}`,
      render: (tone, ref) => (
        field.type === 'select' && isCompactPopupVariant ? (
          renderFloatingSelectField(field, tone, ref)
        ) : field.type === 'select' ? (
          <select
            ref={ref}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            className={getInlineFieldClass(tone)}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {(field.options || []).map((option) => (
              <option key={String(option.value)} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={ref}
            type={field.type || 'text'}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            className={getInlineFieldClass(tone)}
            placeholder={field.placeholder || field.label}
            step={field.step}
            min={field.min}
          />
        )
      )
    });
  });

  if (showMethod) {
    popupFields.push({
      key: 'method',
      label: 'Method',
      render: (tone, ref) => (
        <select
          ref={ref}
          name="method"
          value={formData.method}
          onChange={handleChange}
          className={getInlineFieldClass(tone)}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method.toUpperCase()}
            </option>
          ))}
        </select>
      )
    });
  }

  if (showReferenceNo) {
    popupFields.push({
      key: 'referenceNo',
      label: 'Reference No',
      render: (tone, ref) => (
        <input
          ref={ref}
          type="text"
          name="referenceNo"
          value={formData.referenceNo}
          onChange={handleChange}
          className={getInlineFieldClass(tone)}
        />
      )
    });
  }

  const orderedPopupFields = Array.isArray(popupFieldOrder) && popupFieldOrder.length > 0
    ? [
      ...popupFieldOrder
        .map((fieldKey) => popupFields.find((field) => field.key === fieldKey))
        .filter(Boolean),
      ...popupFields.filter((field) => !popupFieldOrder.includes(field.key))
    ]
    : popupFields;

  const midpoint = Math.max(1, Math.ceil(orderedPopupFields.length / 2));
  const primaryFields = orderedPopupFields.slice(0, midpoint);
  const secondaryFields = orderedPopupFields.slice(midpoint);
  const isCompactPopupVariant = popupVariant === 'stock' || popupVariant === 'payment';
  const isPaymentPopupVariant = popupVariant === 'payment';
  const popupTitle = title;
  const popupSubtitle = isPaymentPopupVariant
    ? 'Capture purchase discount details in the same quick popup flow as payments.'
    : 'Create or update voucher details in a clean accounting format.';
  const popupShellClassName = isPaymentPopupVariant
    ? 'flex max-h-[78vh] w-full max-w-[32rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl'
    : 'flex max-h-[92vh] w-full max-w-[28rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl';
  const popupHeaderClassName = isPaymentPopupVariant
    ? 'flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-white md:px-4 md:py-3'
    : 'flex-shrink-0 border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-1.5 text-white md:px-4 md:py-2';
  const popupSecondarySectionClassName = isPaymentPopupVariant
    ? 'rounded-xl border-2 border-cyan-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-2.5 md:p-4'
    : 'rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4';
  const PopupIcon = isPaymentPopupVariant ? IndianRupee : Wallet;

  return (
    <div className={isPartyPageVariant ? 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50' : 'min-h-screen bg-slate-50 p-4 pt-16 md:px-8 md:pb-8 md:pt-5'}>
      <div className={isPartyPageVariant ? 'w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4' : ''}>
      {error && (
        <div className={isPartyPageVariant ? 'mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700' : 'mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'}>
          {error}
        </div>
      )}

      <div className={isPartyPageVariant ? 'mb-5 mt-1 grid grid-cols-1 gap-2 sm:gap-4 lg:flex lg:justify-start' : `mb-6 grid ${showAmount ? 'grid-cols-2' : 'grid-cols-1'} gap-2 sm:gap-4`}>
        <div className={isPartyPageVariant ? 'group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 lg:min-w-[220px] lg:w-fit' : 'relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group sm:rounded-2xl sm:p-5'}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">{title} Count</p>
              <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{entries.length}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>

        {showAmount && (
          <div className={isPartyPageVariant ? 'group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 lg:min-w-[220px] lg:w-fit' : 'relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group sm:rounded-2xl sm:p-5'}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Amount</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  <span className="mr-1 text-[10px] font-medium text-slate-400 sm:text-base">Rs</span>
                  {totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
          </div>
        )}
      </div>

      <div className={isPartyPageVariant ? 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl' : ''}>
        <div className={isPartyPageVariant ? 'border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5' : 'mb-4'}>
          <div className={isPartyPageVariant ? 'flex flex-col gap-2 lg:flex-row lg:items-center' : 'flex flex-col gap-3 md:flex-row'}>
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={isPartyPageVariant ? 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-[22%] lg:min-w-[260px]' : 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5'}
            />
            <button
              onClick={handleOpenForm}
              className={isPartyPageVariant ? 'inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900' : `${buttonClassName} whitespace-nowrap rounded-lg px-6 py-2.5 text-white transition shadow-sm`}
            >
              {addButtonLabel}
            </button>
          </div>
        </div>
        {!isPartyPageVariant && null}
      </div>

      {showForm && (
        isCompactPopupVariant ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4" onClick={handleCloseForm}>
            <div className={popupShellClassName} onClick={(e) => e.stopPropagation()}>
              <div className={popupHeaderClassName}>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white ring-1 ring-white/30 md:h-8 md:w-8">
                      <PopupIcon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold md:text-xl">{popupTitle}</h2>
                      <p className="mt-0.5 text-[11px] text-cyan-100 md:text-xs">{popupSubtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="rounded-lg p-1.5 text-white transition hover:bg-white/25 md:p-2"
                    aria-label="Close popup"
                  >
                    <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
                  <div className="flex flex-col gap-3 md:gap-4">
                    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800 md:mb-4 md:text-lg">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white md:h-8 md:w-8 md:text-sm">1</span>
                        {isPaymentPopupVariant ? 'Purchase Discount Details' : 'Basic Details'}
                      </h3>

                      <div className="space-y-3 md:space-y-4">
                        {primaryFields.map((field, index) => (
                          <div key={field.key} className="flex items-center gap-2">
                            <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">{field.label}</label>
                            {field.render('indigo', index === 0 ? firstFieldRef : null)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={popupSecondarySectionClassName}>
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800 md:mb-4 md:text-lg">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white md:h-8 md:w-8 md:text-sm ${isPaymentPopupVariant ? 'bg-cyan-600' : 'bg-emerald-600'}`}>2</span>
                        {isPaymentPopupVariant ? 'Notes' : 'Notes & Details'}
                      </h3>

                      <div className="space-y-3 md:space-y-4">
                        {secondaryFields.map((field) => (
                          <div key={field.key} className="flex items-center gap-2">
                            <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">{field.label}</label>
                            {field.render('emerald', null)}
                          </div>
                        ))}

                        <div className="flex items-center gap-2">
                          <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Notes</label>
                          <input
                            type="text"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className={getInlineFieldClass('emerald')}
                            placeholder="Optional note"
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
                      onClick={handleCloseForm}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-1.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50 md:flex-none md:px-6"
                    >
                      {loading ? 'Saving...' : 'Save Voucher'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
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
                {showParty && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Party {partyRequired ? '*' : ''}</label>
                    <select
                      ref={firstFieldRef}
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
                )}

                {showAmount && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Amount *</label>
                    <input
                      ref={!showParty ? firstFieldRef : null}
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Date</label>
                  <input
                    ref={!showParty && !showAmount ? firstFieldRef : null}
                    type={dateInputType}
                    name="voucherDate"
                    value={formData.voucherDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder={datePlaceholder}
                  />
                </div>

                {fieldDefinitions.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm text-slate-600 mb-1">{field.label} {field.required ? '*' : ''}</label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {(field.options || []).map((option) => (
                          <option key={String(option.value)} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder={field.placeholder || field.label}
                        step={field.step}
                        min={field.min}
                      />
                    )}
                  </div>
                ))}

                {showMethod && (
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
                )}

                {showReferenceNo && (
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
                )}

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
        )
      )}

      {isPartyPageVariant ? (
        loading ? (
          <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="space-y-3 md:hidden">
              {entries.map((item) => (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_16px_32px_rgba(8,47,73,0.10)]"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-cyan-900/20 bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] px-4 py-3 text-white">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{getFieldDisplayValue(item, primaryField)}</p>
                      <p className="mt-1 text-xs text-cyan-100">{item.voucherDate ? new Date(item.voucherDate).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Details</p>
                      <p className="mt-1 break-words text-sm text-slate-700">{getAccountsDisplay(item)}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-cyan-50 px-3 py-2.5">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">Voucher No</span>
                      <span className="text-right font-semibold text-slate-800">{item.voucherNumber || '-'}</span>
                    </div>
                  </div>
                </article>
              ))}

              {!loading && entries.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
                  No entries found
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap overflow-hidden">
                <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                  <tr>
                    <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Date</th>
                    <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Voucher No</th>
                    {fieldDefinitions.map((field, index) => (
                      <th
                        key={field.name}
                        className={`border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)] ${index === fieldDefinitions.length - 1 ? '' : ''}`}
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                  {entries.map((item) => (
                    <tr key={item._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                      <td className="border border-slate-400 px-4 py-3 text-center">{item.voucherDate ? new Date(item.voucherDate).toLocaleDateString() : '-'}</td>
                      <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">{item.voucherNumber || '-'}</td>
                      {fieldDefinitions.map((field) => (
                        <td key={field.name} className="border border-slate-400 px-4 py-3 text-center">
                          {getFieldDisplayValue(item, field)}
                        </td>
                      ))}
                      <td className="border border-slate-400 px-4 py-3 text-center">{item.notes || '-'}</td>
                    </tr>
                  ))}
                  {!loading && entries.length === 0 && (
                    <tr>
                      <td colSpan={3 + fieldDefinitions.length} className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                        No entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Voucher No</th>
                  {showParty && <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Party</th>}
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Accounts</th>
                  {showAmount && <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Amount</th>}
{showMethod && <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Method</th>}
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((item) => (
<tr key={item._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div>{item.voucherDate ? new Date(item.voucherDate).toLocaleDateString() : '-'}</div>
                      {showReferenceNo && <div className="text-xs text-slate-400 mt-0.5">{item.referenceNo || ''}</div>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{item.voucherNumber || '-'}</td>
                    {showParty && <td className="px-6 py-4 font-semibold text-slate-700">{item.party?.name || item.party?.partyName || '-'}</td>}
                    <td className="px-6 py-4 text-slate-600">{getAccountsDisplay(item)}</td>
                    {showAmount && <td className="px-6 py-4 text-emerald-600 font-semibold">Rs {Number(item.amount || 0).toFixed(2)}</td>}
                    {showMethod && (
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 capitalize">
                          {item.method || '-'}
                        </span>
                      </td>
)}
                    <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">{item.notes || '-'}</td>
                  </tr>
                ))}
                {!loading && entries.length === 0 && (
                  <tr>
                    <td colSpan={4 + (showParty ? 1 : 0) + (showAmount ? 1 : 0) + (showMethod ? 1 : 0) + (showReferenceNo ? 1 : 0)} className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
                      No entries found
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
