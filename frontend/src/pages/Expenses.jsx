import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, ReceiptIndianRupee, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../utils/useFloatingDropdownPosition';

const TOAST_OPTIONS = { autoClose: 1200 };

const getInitialForm = () => ({
  expenseGroup: '',
  party: '',
  amount: '',
  method: 'cash',
  expenseDate: new Date().toISOString().split('T')[0],
  notes: ''
});

const EXPENSE_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'credit', label: 'Credit' },
  { value: 'other', label: 'Other' }
];

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (value) => (
  value
    ? new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    : '-'
);

const getMethodBadgeClass = (method) => {
  const normalized = String(method || '').toLowerCase();
  if (normalized === 'cash') return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'bank') return 'border border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'upi') return 'border border-violet-200 bg-violet-50 text-violet-700';
  if (normalized === 'card') return 'border border-amber-200 bg-amber-50 text-amber-700';
  if (normalized === 'credit') return 'border border-rose-200 bg-rose-50 text-rose-700';
  return 'border border-slate-200 bg-slate-100 text-slate-700';
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [expenseGroups, setExpenseGroups] = useState([]);
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const expenseGroupInputRef = useRef(null);
  const partyInputRef = useRef(null);
  const methodInputRef = useRef(null);
  const expenseGroupSectionRef = useRef(null);
  const partySectionRef = useRef(null);
  const methodSectionRef = useRef(null);
  const [expenseGroupQuery, setExpenseGroupQuery] = useState('');
  const [partyQuery, setPartyQuery] = useState('');
  const [methodQuery, setMethodQuery] = useState('Cash');
  const [expenseGroupListIndex, setExpenseGroupListIndex] = useState(-1);
  const [partyListIndex, setPartyListIndex] = useState(-1);
  const [methodListIndex, setMethodListIndex] = useState(0);
  const [isExpenseGroupSectionActive, setIsExpenseGroupSectionActive] = useState(false);
  const [isPartySectionActive, setIsPartySectionActive] = useState(false);
  const [isMethodSectionActive, setIsMethodSectionActive] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchExpenseGroups();
    fetchParties();
  }, []);

  useEffect(() => {
    if (!showForm) return;

    const timer = setTimeout(() => {
      expenseGroupInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [showForm]);

  const getFromDateByFilter = () => {
    const now = new Date();
    if (dateFilter === '7d') {
      now.setDate(now.getDate() - 7);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '30d') {
      now.setDate(now.getDate() - 30);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '3m') {
      now.setMonth(now.getMonth() - 3);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '6m') {
      now.setMonth(now.getMonth() - 6);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '1y') {
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString().split('T')[0];
    }
    return '';
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/expenses', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
      setExpenses(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseGroups = async () => {
    try {
      const response = await apiClient.get('/expense-groups');
      setExpenseGroups(response.data || []);
    } catch (err) {
      console.error('Error fetching expense groups:', err);
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

  const getInlineFieldClass = (tone = 'indigo') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
    return `flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none ${focusTone}`;
  };

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const focusNextPopupField = (element) => {
    if (!(element instanceof HTMLElement)) return;
    const form = element.closest('form');
    if (!form) return;

    const fields = Array.from(form.querySelectorAll(
      'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
    )).filter((field) => {
      if (!(field instanceof HTMLElement)) return false;
      if (field.tabIndex === -1) return false;
      const style = window.getComputedStyle(field);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    const currentIndex = fields.indexOf(element);
    if (currentIndex === -1) return;

    const nextField = fields[currentIndex + 1];
    if (!(nextField instanceof HTMLElement)) return;
    nextField.focus();
    if (nextField instanceof HTMLInputElement && typeof nextField.select === 'function') {
      nextField.select();
    }
  };

  const selectedExpenseGroupName = useMemo(() => {
    const selectedGroup = expenseGroups.find(
      (group) => String(group._id || '') === String(formData.expenseGroup || '')
    );
    return selectedGroup?.name || '';
  }, [expenseGroups, formData.expenseGroup]);

  const selectedPartyName = useMemo(() => {
    const selectedParty = parties.find(
      (party) => String(party._id || '') === String(formData.party || '')
    );
    return selectedParty?.name || '';
  }, [formData.party, parties]);

  const selectedMethodLabel = useMemo(() => {
    const selectedOption = EXPENSE_METHOD_OPTIONS.find(
      (option) => option.value === String(formData.method || 'cash').trim().toLowerCase()
    );
    return selectedOption?.label || EXPENSE_METHOD_OPTIONS[0].label;
  }, [formData.method]);

  const getMatchingExpenseGroups = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return expenseGroups;

    const startsWith = expenseGroups.filter((group) => normalizeText(group.name).startsWith(normalized));
    const includes = expenseGroups.filter((group) => (
      !normalizeText(group.name).startsWith(normalized)
      && normalizeText(group.name).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const getMatchingParties = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return parties;

    const startsWith = parties.filter((party) => normalizeText(party.name).startsWith(normalized));
    const includes = parties.filter((party) => (
      !normalizeText(party.name).startsWith(normalized)
      && normalizeText(party.name).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const filteredExpenseGroups = useMemo(
    () => getMatchingExpenseGroups(expenseGroupQuery),
    [expenseGroups, expenseGroupQuery]
  );

  const filteredParties = useMemo(
    () => getMatchingParties(partyQuery),
    [parties, partyQuery]
  );

  const expenseGroupOptions = useMemo(() => {
    const normalizedQuery = normalizeText(expenseGroupQuery);
    const normalizedSelectedName = normalizeText(selectedExpenseGroupName);

    if (
      isExpenseGroupSectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelectedName
    ) {
      return expenseGroups;
    }

    return filteredExpenseGroups;
  }, [expenseGroupQuery, expenseGroups, filteredExpenseGroups, isExpenseGroupSectionActive, selectedExpenseGroupName]);

  const partyOptions = useMemo(() => {
    const normalizedQuery = normalizeText(partyQuery);
    const normalizedSelectedName = normalizeText(selectedPartyName);

    if (
      isPartySectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelectedName
    ) {
      return parties;
    }

    return filteredParties;
  }, [filteredParties, isPartySectionActive, parties, partyQuery, selectedPartyName]);

  const filteredMethodOptions = useMemo(() => {
    const normalized = normalizeText(methodQuery);
    const normalizedSelectedMethod = normalizeText(selectedMethodLabel);

    if (
      isMethodSectionActive
      && normalized
      && normalized === normalizedSelectedMethod
    ) {
      return EXPENSE_METHOD_OPTIONS;
    }

    if (!normalized) return EXPENSE_METHOD_OPTIONS;

    const startsWith = EXPENSE_METHOD_OPTIONS.filter((option) => normalizeText(option.label).startsWith(normalized));
    const includes = EXPENSE_METHOD_OPTIONS.filter((option) => (
      !normalizeText(option.label).startsWith(normalized)
      && normalizeText(option.label).includes(normalized)
    ));

    return [...startsWith, ...includes];
  }, [isMethodSectionActive, methodQuery, selectedMethodLabel]);

  const expenseGroupDropdownStyle = useFloatingDropdownPosition(
    expenseGroupSectionRef,
    isExpenseGroupSectionActive,
    [expenseGroupOptions.length, expenseGroupListIndex]
  );

  const partyDropdownStyle = useFloatingDropdownPosition(
    partySectionRef,
    isPartySectionActive,
    [partyOptions.length, partyListIndex]
  );

  const methodDropdownStyle = useFloatingDropdownPosition(
    methodSectionRef,
    isMethodSectionActive,
    [filteredMethodOptions.length, methodListIndex],
    'down',
    'viewport'
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!showForm) return;

    if (expenseGroupOptions.length === 0) {
      setExpenseGroupListIndex(-1);
      return;
    }

    setExpenseGroupListIndex((prev) => {
      if (prev < 0) return isExpenseGroupSectionActive ? 0 : -1;
      if (prev >= expenseGroupOptions.length) return expenseGroupOptions.length - 1;
      return prev;
    });
  }, [expenseGroupOptions, isExpenseGroupSectionActive, showForm]);

  useEffect(() => {
    if (!showForm) return;

    if (partyOptions.length === 0) {
      setPartyListIndex(-1);
      return;
    }

    setPartyListIndex((prev) => {
      if (prev < 0) return isPartySectionActive ? 0 : -1;
      if (prev >= partyOptions.length) return partyOptions.length - 1;
      return prev;
    });
  }, [isPartySectionActive, partyOptions, showForm]);

  useEffect(() => {
    if (!showForm) {
      setMethodQuery(selectedMethodLabel);
      setMethodListIndex(0);
      setIsMethodSectionActive(false);
      return;
    }

    const selectedIndex = filteredMethodOptions.findIndex(
      (option) => option.label === selectedMethodLabel
    );
    setMethodListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredMethodOptions, selectedMethodLabel, showForm]);

  const findExactExpenseGroup = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return expenseGroups.find((group) => normalizeText(group.name) === normalized) || null;
  };

  const findBestExpenseGroupMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return expenseGroups.find((group) => normalizeText(group.name).startsWith(normalized))
      || expenseGroups.find((group) => normalizeText(group.name).includes(normalized))
      || null;
  };

  const findExactParty = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return parties.find((party) => normalizeText(party.name) === normalized) || null;
  };

  const findBestPartyMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return parties.find((party) => normalizeText(party.name).startsWith(normalized))
      || parties.find((party) => normalizeText(party.name).includes(normalized))
      || null;
  };

  const findExactMethod = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return EXPENSE_METHOD_OPTIONS.find((option) => normalizeText(option.label) === normalized) || null;
  };

  const selectExpenseGroup = (group) => {
    if (!group) {
      setExpenseGroupQuery('');
      setFormData((prev) => ({ ...prev, expenseGroup: '' }));
      setExpenseGroupListIndex(-1);
      return;
    }

    setExpenseGroupQuery(group.name);
    setFormData((prev) => ({ ...prev, expenseGroup: group._id }));
    const selectedIndex = getMatchingExpenseGroups(group.name).findIndex((item) => String(item._id) === String(group._id));
    setExpenseGroupListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const selectParty = (party) => {
    if (!party) {
      setPartyQuery('');
      setFormData((prev) => ({ ...prev, party: '' }));
      setPartyListIndex(-1);
      return;
    }

    setPartyQuery(party.name);
    setFormData((prev) => ({ ...prev, party: party._id }));
    const selectedIndex = getMatchingParties(party.name).findIndex((item) => String(item._id) === String(party._id));
    setPartyListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const selectMethod = (option) => {
    if (!option) return;

    setMethodQuery(option.label);
    setFormData((prev) => ({ ...prev, method: option.value }));
    setMethodListIndex(
      Math.max(filteredMethodOptions.findIndex((item) => item.value === option.value), 0)
    );
    setIsMethodSectionActive(false);
  };

  const handleExpenseGroupInputChange = (event) => {
    const value = event.target.value;
    setExpenseGroupQuery(value);

    if (!normalizeText(value)) {
      selectExpenseGroup(null);
      return;
    }

    const exactGroup = findExactExpenseGroup(value);
    if (exactGroup) {
      setFormData((prev) => ({ ...prev, expenseGroup: exactGroup._id }));
      const exactIndex = getMatchingExpenseGroups(value).findIndex((item) => String(item._id) === String(exactGroup._id));
      setExpenseGroupListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingExpenseGroups(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, expenseGroup: firstMatch?._id || '' }));
    setExpenseGroupListIndex(firstMatch ? 0 : -1);
  };

  const handlePartyInputChange = (event) => {
    const value = event.target.value;
    setPartyQuery(value);

    if (!normalizeText(value)) {
      selectParty(null);
      return;
    }

    const exactParty = findExactParty(value);
    if (exactParty) {
      setFormData((prev) => ({ ...prev, party: exactParty._id }));
      const exactIndex = getMatchingParties(value).findIndex((item) => String(item._id) === String(exactParty._id));
      setPartyListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingParties(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, party: firstMatch?._id || '' }));
    setPartyListIndex(firstMatch ? 0 : -1);
  };

  const handleMethodInputChange = (event) => {
    const value = event.target.value;
    setMethodQuery(value);
    setIsMethodSectionActive(true);

    const exactMatch = findExactMethod(value);
    if (exactMatch) {
      setFormData((prev) => ({ ...prev, method: exactMatch.value }));
    }
  };

  const handleExpenseGroupInputKeyDown = (event) => {
    const key = event.key?.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      event.stopPropagation();
      setIsExpenseGroupSectionActive(true);
      if (expenseGroupOptions.length === 0) return;
      setExpenseGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, expenseGroupOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      event.preventDefault();
      event.stopPropagation();
      setIsExpenseGroupSectionActive(true);
      if (expenseGroupOptions.length === 0) return;
      setExpenseGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'enter') {
      event.preventDefault();
      event.stopPropagation();

      const activeGroup = expenseGroupListIndex >= 0 ? expenseGroupOptions[expenseGroupListIndex] : null;
      const matchedGroup = activeGroup || findExactExpenseGroup(expenseGroupQuery) || findBestExpenseGroupMatch(expenseGroupQuery);
      if (matchedGroup) {
        selectExpenseGroup(matchedGroup);
      }
      setIsExpenseGroupSectionActive(false);
      focusNextPopupField(event.currentTarget);
    }
  };

  const handlePartyInputKeyDown = (event) => {
    const key = event.key?.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      event.stopPropagation();
      setIsPartySectionActive(true);
      if (partyOptions.length === 0) return;
      setPartyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, partyOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      event.preventDefault();
      event.stopPropagation();
      setIsPartySectionActive(true);
      if (partyOptions.length === 0) return;
      setPartyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'enter') {
      event.preventDefault();
      event.stopPropagation();

      const activeParty = partyListIndex >= 0 ? partyOptions[partyListIndex] : null;
      const matchedParty = activeParty || findExactParty(partyQuery) || findBestPartyMatch(partyQuery);
      if (matchedParty) {
        selectParty(matchedParty);
      }
      setIsPartySectionActive(false);
      focusNextPopupField(event.currentTarget);
    }
  };

  const handleMethodInputKeyDown = (event) => {
    const key = event.key?.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      event.stopPropagation();
      setIsMethodSectionActive(true);
      if (filteredMethodOptions.length === 0) return;
      setMethodListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredMethodOptions.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      event.preventDefault();
      event.stopPropagation();
      setIsMethodSectionActive(true);
      if (filteredMethodOptions.length === 0) return;
      setMethodListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'escape' && isMethodSectionActive) {
      event.preventDefault();
      event.stopPropagation();
      setMethodQuery(selectedMethodLabel);
      setIsMethodSectionActive(false);
      return;
    }

    if (key === 'enter') {
      event.preventDefault();
      event.stopPropagation();

      if (!isMethodSectionActive) {
        setIsMethodSectionActive(true);
        return;
      }

      const activeOption = methodListIndex >= 0 ? filteredMethodOptions[methodListIndex] : null;
      const exactMatch = findExactMethod(methodQuery);
      const matchedOption = activeOption || exactMatch || filteredMethodOptions[0] || EXPENSE_METHOD_OPTIONS[0];
      if (matchedOption) {
        selectMethod(matchedOption);
      }
      focusNextPopupField(event.currentTarget);
    }
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setExpenseGroupQuery('');
    setExpenseGroupListIndex(-1);
    setIsExpenseGroupSectionActive(false);
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setMethodQuery(EXPENSE_METHOD_OPTIONS[0].label);
    setMethodListIndex(0);
    setIsMethodSectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(getInitialForm());
    setExpenseGroupQuery('');
    setExpenseGroupListIndex(-1);
    setIsExpenseGroupSectionActive(false);
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setMethodQuery(EXPENSE_METHOD_OPTIONS[0].label);
    setMethodListIndex(0);
    setIsMethodSectionActive(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.expenseGroup) {
      setError('Expense group is required');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/expenses', {
        expenseGroup: formData.expenseGroup,
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        expenseDate: formData.expenseDate ? new Date(formData.expenseDate) : new Date(),
        notes: formData.notes
      });

      handleCloseForm();
      fetchExpenses();
      setError('');
      toast.success('Expense created successfully', TOAST_OPTIONS);
    } catch (err) {
      setError(err.message || 'Error creating expense');
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const usedGroups = new Set(expenses.map((item) => item.expenseGroup?._id).filter(Boolean)).size;
  const currentMonthTotal = expenses.reduce((sum, item) => {
    const expenseDate = new Date(item.expenseDate);
    const now = new Date();
    if (
      expenseDate.getMonth() === now.getMonth()
      && expenseDate.getFullYear() === now.getFullYear()
    ) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Expense Count</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{totalExpenses}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Amount</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-500 to-sky-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Groups Used</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{usedGroups}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">This Month</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{formatCurrency(currentMonthTotal)}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition-transform group-hover:scale-110 sm:flex">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 sm:h-1"></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            {expenseGroups.length === 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Create an expense group first, then add expenses under that head.
              </div>
            )}

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-56"
              >
                <option value="">Expense History - All Time</option>
                <option value="7d">Expense History - 7 Days</option>
                <option value="30d">Expense History - 30 Days</option>
                <option value="3m">Expense History - 3 Months</option>
                <option value="6m">Expense History - 6 Months</option>
                <option value="1y">Expense History - 1 Year</option>
              </select>

              <button
                type="button"
                onClick={handleOpenForm}
                disabled={expenseGroups.length === 0}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>
          </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4" onClick={handleCloseForm}>
          <div
            className="flex max-h-[92vh] w-full max-w-[35rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-shrink-0 border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-1.5 text-white md:px-4 md:py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white ring-1 ring-white/30 md:h-8 md:w-8">
                    <ReceiptIndianRupee className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold md:text-xl">Add Expense</h2>
                    <p className="mt-0.5 text-[11px] text-cyan-100 md:text-xs">
                      Create expense entries in a clean accounting format.
                    </p>
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

            <form
              onSubmit={handleSubmit}
              onKeyDown={(event) => handlePopupFormKeyDown(event, handleCloseForm)}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800 md:mb-4 md:text-lg">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white md:h-8 md:w-8 md:text-sm">1</span>
                      Basic Details
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Expense Group</label>
                        <div
                          ref={expenseGroupSectionRef}
                          className="relative flex-1 min-w-0"
                          onFocusCapture={() => {
                            const selectedIndex = expenseGroupOptions.findIndex(
                              (group) => String(group?._id || '') === String(formData.expenseGroup || '')
                            );
                            setIsPartySectionActive(false);
                            setIsMethodSectionActive(false);
                            setIsExpenseGroupSectionActive(true);
                            setExpenseGroupListIndex(selectedIndex >= 0 ? selectedIndex : (expenseGroupOptions.length > 0 ? 0 : -1));
                          }}
                          onBlurCapture={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              expenseGroupSectionRef.current
                              && nextFocused instanceof Node
                              && expenseGroupSectionRef.current.contains(nextFocused)
                            ) {
                              return;
                            }
                            setIsExpenseGroupSectionActive(false);
                          }}
                        >
                          <div className="relative">
                            <input
                              ref={expenseGroupInputRef}
                              type="text"
                              value={expenseGroupQuery}
                              onChange={handleExpenseGroupInputChange}
                              onKeyDown={handleExpenseGroupInputKeyDown}
                              className={`${getInlineFieldClass('indigo')} pr-10`}
                              placeholder="Type expense group..."
                              autoComplete="off"
                              required
                            />
                            <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500 transition-transform ${isExpenseGroupSectionActive ? 'rotate-180' : ''}`} />
                          </div>

                          {isExpenseGroupSectionActive && expenseGroupDropdownStyle && (
                            <div
                              className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                              style={expenseGroupDropdownStyle}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Expense Groups</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                                  {expenseGroupOptions.length}
                                </span>
                              </div>
                              <div className="overflow-y-auto py-1" style={{ maxHeight: expenseGroupDropdownStyle.maxHeight }}>
                                {expenseGroupOptions.length === 0 ? (
                                  <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                    No expense groups found.
                                  </div>
                                ) : (
                                  expenseGroupOptions.map((group, index) => {
                                    const isActive = index === expenseGroupListIndex;
                                    const isSelected = String(formData.expenseGroup || '') === String(group._id);

                                    return (
                                      <button
                                        key={group._id}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setExpenseGroupListIndex(index)}
                                        onClick={() => {
                                          selectExpenseGroup(group);
                                          setIsExpenseGroupSectionActive(false);
                                        }}
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
                        <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Party</label>
                        <div
                          ref={partySectionRef}
                          className="relative flex-1 min-w-0"
                          onFocusCapture={() => {
                            const selectedIndex = partyOptions.findIndex(
                              (party) => String(party?._id || '') === String(formData.party || '')
                            );
                            setIsExpenseGroupSectionActive(false);
                            setIsMethodSectionActive(false);
                            setIsPartySectionActive(true);
                            setPartyListIndex(selectedIndex >= 0 ? selectedIndex : (partyOptions.length > 0 ? 0 : -1));
                          }}
                          onBlurCapture={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              partySectionRef.current
                              && nextFocused instanceof Node
                              && partySectionRef.current.contains(nextFocused)
                            ) {
                              return;
                            }
                            setIsPartySectionActive(false);
                          }}
                        >
                          <div className="relative">
                            <input
                              ref={partyInputRef}
                              type="text"
                              value={partyQuery}
                              onChange={handlePartyInputChange}
                              onKeyDown={handlePartyInputKeyDown}
                              className={`${getInlineFieldClass('indigo')} pr-10`}
                              placeholder="Type party..."
                              autoComplete="off"
                            />
                            <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500 transition-transform ${isPartySectionActive ? 'rotate-180' : ''}`} />
                          </div>

                          {isPartySectionActive && partyDropdownStyle && (
                            <div
                              className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                              style={partyDropdownStyle}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Party List</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                                  {partyOptions.length}
                                </span>
                              </div>
                              <div className="overflow-y-auto py-1" style={{ maxHeight: partyDropdownStyle.maxHeight }}>
                                {partyOptions.length === 0 ? (
                                  <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                    No parties found.
                                  </div>
                                ) : (
                                  partyOptions.map((party, index) => {
                                    const isActive = index === partyListIndex;
                                    const isSelected = String(formData.party || '') === String(party._id);

                                    return (
                                      <button
                                        key={party._id}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setPartyListIndex(index)}
                                        onClick={() => {
                                          selectParty(party);
                                          setIsPartySectionActive(false);
                                        }}
                                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                                          isActive
                                            ? 'bg-yellow-200 text-amber-950'
                                            : isSelected
                                            ? 'bg-yellow-50 text-amber-800'
                                            : 'text-slate-700 hover:bg-amber-50'
                                        }`}
                                      >
                                        <span className="truncate font-medium">{party.name}</span>
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
                        <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Amount</label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          step="0.01"
                          className={getInlineFieldClass('indigo')}
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800 md:mb-4 md:text-lg">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white md:h-8 md:w-8 md:text-sm">2</span>
                      Payment Details
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2">
                        <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Expense Date</label>
                        <input
                          type="date"
                          name="expenseDate"
                          value={formData.expenseDate}
                          onChange={handleChange}
                          className={getInlineFieldClass('emerald')}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="mb-0 w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Method</label>
                        <div
                          ref={methodSectionRef}
                          className="relative flex-1 min-w-0"
                          onBlurCapture={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              methodSectionRef.current
                              && nextFocused instanceof Node
                              && methodSectionRef.current.contains(nextFocused)
                            ) {
                              return;
                            }
                            setMethodQuery(selectedMethodLabel);
                            setIsMethodSectionActive(false);
                          }}
                        >
                          <div className="relative">
                            <input
                              ref={methodInputRef}
                              type="text"
                              value={methodQuery}
                              onChange={handleMethodInputChange}
                              onFocus={() => {
                                const selectedIndex = filteredMethodOptions.findIndex(
                                  (option) => option.value === String(formData.method || 'cash').trim().toLowerCase()
                                );
                                setIsExpenseGroupSectionActive(false);
                                setIsPartySectionActive(false);
                                setIsMethodSectionActive(true);
                                setMethodListIndex(selectedIndex >= 0 ? selectedIndex : 0);
                              }}
                              onKeyDown={handleMethodInputKeyDown}
                              className={`${getInlineFieldClass('emerald')} pr-10`}
                              placeholder="Select method..."
                              autoComplete="off"
                            />
                            <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 transition-transform ${isMethodSectionActive ? 'rotate-180' : ''}`} />
                          </div>

                          {isMethodSectionActive && methodDropdownStyle && (
                            <div
                              className="fixed z-[90] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                              style={methodDropdownStyle}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Method List</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                                  {filteredMethodOptions.length}
                                </span>
                              </div>
                              <div className="overflow-y-auto py-1" style={{ maxHeight: methodDropdownStyle.maxHeight }}>
                                {filteredMethodOptions.length === 0 ? (
                                  <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                    No matching methods found.
                                  </div>
                                ) : (
                                  filteredMethodOptions.map((option, index) => {
                                    const isActive = index === methodListIndex;
                                    const isSelected = String(formData.method || 'cash') === String(option.value);

                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => setMethodListIndex(index)}
                                        onClick={() => selectMethod(option)}
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
                    {loading ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="space-y-3 md:hidden">
                {expenses.map((expense) => (
                  <article
                    key={expense._id}
                    className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_16px_32px_rgba(8,47,73,0.10)]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-cyan-900/20 bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] px-4 py-3 text-white">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{expense.expenseGroup?.name || 'Expense'}</p>
                        <p className="mt-1 text-xs text-cyan-100">{formatDate(expense.expenseDate)}</p>
                      </div>
                      <div className="rounded-xl bg-white/15 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100">Amount</p>
                        <p className="mt-1 text-sm font-bold text-white">{formatCurrency(expense.amount)}</p>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-cyan-50 px-3 py-2.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">Party</span>
                        <span className="text-right font-semibold text-slate-800">{expense.party?.name || '-'}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 px-3 py-2.5">
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-sky-700">Method</span>
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMethodBadgeClass(expense.method)}`}>
                          {expense.method}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Notes</p>
                        <p className="mt-1 break-words text-sm text-slate-700">{expense.notes || '-'}</p>
                      </div>
                    </div>
                  </article>
                ))}

                {expenses.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
                    No expenses found
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap overflow-hidden">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Date</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Expense Group</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Amount</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Method</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-medium text-slate-700">
                          {formatDate(expense.expenseDate)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">
                          {expense.expenseGroup?.name || '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{expense.party?.name || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMethodBadgeClass(expense.method)}`}>
                            {expense.method}
                          </span>
                        </td>
                        <td className="border border-slate-400 px-4 py-3">
                          <div className="max-w-[24rem] truncate">{expense.notes || '-'}</div>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan="6" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                          No expenses found
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
    </div>
  );
}
