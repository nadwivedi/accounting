import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Receipt, IndianRupee, Search, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import { getBankDisplayName, normalizeBankName } from '../../utils/bankAccounts';
import AddReceiptPopup from './component/AddReceiptPopup';
import { useAuth } from '../../context/AuthContext';

const formatReceiptDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseReceiptDateInput = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  let year;
  let month;
  let day;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    [year, month, day] = normalized.split('-').map(Number);
  } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(normalized)) {
    [day, month, year] = normalized.split(/[/-]/).map(Number);
  } else {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const getInitialForm = (defaultMethod = 'Cash Account') => ({
  party: '',
  amount: '',
  method: defaultMethod,
  receiptDate: formatReceiptDateInput(),
  notes: '',
  refType: 'none',
  refId: ''
});
const TOAST_OPTIONS = { autoClose: 1200 };

const getReceiptAccountOptions = (banks = []) => {
  const uniqueNames = banks
    .map((bank) => getBankDisplayName(bank))
    .filter((name, index, values) => name && values.indexOf(name) === index);

  return uniqueNames.length > 0 ? uniqueNames : ['Cash Account'];
};

const getDefaultReceiptMethod = (banks = []) => {
  const cashAccount = banks.find((bank) => normalizeBankName(bank?.name) === 'cash account');
  return getBankDisplayName(cashAccount || banks[0]) || 'Cash Account';
};

const formatDisplayDate = (value) => {
  if (!value) return '-';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '-';
  return parsedDate.toLocaleDateString('en-GB');
};

const formatReceiptNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return '-';
  return `Rec-${String(parsed).padStart(2, '0')}`;
};

export default function Receipts({ modalOnly = false, onModalFinish = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isEmployee } = useAuth();
  const canEdit = !isEmployee || user?.permissions?.edit === true;
  const canAdd = !isEmployee || user?.permissions?.add === true;
  const [editingId, setEditingId] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [sales, setSales] = useState([]);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [partyQuery, setPartyQuery] = useState('');
  const [partyListIndex, setPartyListIndex] = useState(-1);
  const [isPartySectionActive, setIsPartySectionActive] = useState(false);
  const [receiptAccountQuery, setReceiptAccountQuery] = useState('');
  const [receiptAccountListIndex, setReceiptAccountListIndex] = useState(-1);
  const [isReceiptAccountSectionActive, setIsReceiptAccountSectionActive] = useState(false);
  const partySectionRef = useRef(null);
  const receiptAccountSectionRef = useRef(null);

  useEffect(() => {
    fetchReceipts();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchParties();
    fetchSales();
    fetchBanks();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.target?.isContentEditable;
      const key = event.key?.toLowerCase();

      if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget || showForm) return;
      if (key !== 'r') return;

      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  const handleEdit = (receipt) => {
    if (!receipt) return;
    setEditingId(receipt._id);
    setFormData({
      party: receipt.party?._id || receipt.party || '',
      amount: String(receipt.amount),
      method: receipt.method || getDefaultReceiptMethod(banks),
      receiptDate: parseReceiptDateInput(receipt.receiptDate) ? formatReceiptDateInput(receipt.receiptDate) : formatReceiptDateInput(new Date()),
      notes: receipt.notes || '',
      refType: receipt.refType || 'none',
      refId: receipt.refId || ''
    });
    setPartyQuery(getPartyDisplayName(receipt.party) || '');
    setReceiptAccountQuery(receipt.method || getDefaultReceiptMethod(banks));
    setPartyListIndex(-1);
    setReceiptAccountListIndex(-1);
    setIsPartySectionActive(false);
    setIsReceiptAccountSectionActive(false);
    setShowForm(true);
    setLoading(false);
    setError('');
  };

  useEffect(() => {
    if (location.state?.editReceipt) {
      handleEdit(location.state.editReceipt);
      const { editReceipt, ...restState } = location.state;
      navigate(location.pathname, { replace: true, state: Object.keys(restState).length > 0 ? restState : undefined });
      return;
    }

    if (location.state?.openShortcut !== 'receipt' || showForm) return;

    handleOpenForm();
    const { openShortcut, ...restState } = location.state;
    navigate(location.pathname, { replace: true, state: Object.keys(restState).length > 0 ? restState : undefined });
  }, [location.pathname, location.state, navigate, showForm, banks]);

  useEffect(() => {
    if (!modalOnly || showForm) return;
    handleOpenForm();
  }, [modalOnly, showForm]);

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

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/receipts', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
      setReceipts(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching receipts');
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

  const fetchSales = async () => {
    try {
      const response = await apiClient.get('/sales');
      setSales(response.data || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await apiClient.get('/banks');
      setBanks(response.data || []);
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const receiptAccountOptions = useMemo(() => getReceiptAccountOptions(banks), [banks]);
  const defaultReceiptMethod = useMemo(() => getDefaultReceiptMethod(banks), [banks]);
  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  useEffect(() => {
    setFormData((prev) => {
      const currentMethod = String(prev.method || '').trim();
      const hasMatchingAccount = receiptAccountOptions.includes(currentMethod);
      const isLegacyMethod = ['cash', 'bank', 'upi', 'card', 'credit', 'other'].includes(currentMethod.toLowerCase());

      if (currentMethod && hasMatchingAccount && !isLegacyMethod) {
        return prev;
      }

      if (currentMethod === defaultReceiptMethod) {
        return prev;
      }

      return {
        ...prev,
        method: defaultReceiptMethod
      };
    });
  }, [defaultReceiptMethod, receiptAccountOptions]);

  useEffect(() => {
    if (isReceiptAccountSectionActive) return;
    setReceiptAccountQuery(formData.method || '');
  }, [formData.method, isReceiptAccountSectionActive]);

  const getPartyDisplayName = (party) => {
    const partyName = String(party?.partyName || party?.name || '').trim();
    if (partyName) return partyName;
    return 'Party Name';
  };

  const resolvePartyNameById = (partyId) => {
    const resolvedId = typeof partyId === 'object' ? partyId?._id : partyId;
    if (!resolvedId) return '';
    const matching = parties.find((party) => String(party._id) === String(resolvedId));
    return matching ? getPartyDisplayName(matching) : '';
  };

  const getMatchingParties = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return parties;

    const startsWith = parties.filter((party) => normalizeText(getPartyDisplayName(party)).startsWith(normalized));
    const includes = parties.filter((party) => (
      !normalizeText(getPartyDisplayName(party)).startsWith(normalized)
      && normalizeText(getPartyDisplayName(party)).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const getMatchingReceiptAccounts = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return receiptAccountOptions;

    const startsWith = receiptAccountOptions.filter((accountName) => normalizeText(accountName).startsWith(normalized));
    const includes = receiptAccountOptions.filter((accountName) => (
      !normalizeText(accountName).startsWith(normalized)
      && normalizeText(accountName).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const selectedPartyName = useMemo(() => resolvePartyNameById(formData.party), [formData.party, parties]);

  const filteredParties = useMemo(() => {
    const normalizedQuery = normalizeText(partyQuery);
    const normalizedSelectedName = normalizeText(selectedPartyName);

    if (
      isPartySectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelectedName
    ) {
      return parties;
    }

    return getMatchingParties(partyQuery);
  }, [parties, partyQuery, isPartySectionActive, selectedPartyName]);

  const filteredReceiptAccounts = useMemo(() => {
    const normalizedQuery = normalizeText(receiptAccountQuery);
    const normalizedSelectedName = normalizeText(formData.method);

    if (
      isReceiptAccountSectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelectedName
    ) {
      return receiptAccountOptions;
    }

    return getMatchingReceiptAccounts(receiptAccountQuery);
  }, [formData.method, isReceiptAccountSectionActive, receiptAccountOptions, receiptAccountQuery]);

  useEffect(() => {
    if (!showForm) return;

    if (filteredParties.length === 0) {
      setPartyListIndex(-1);
      return;
    }

    const shouldHighlightSelectedParty = (
      isPartySectionActive
      && normalizeText(partyQuery)
      && normalizeText(partyQuery) === normalizeText(selectedPartyName)
      && formData.party
    );

    if (shouldHighlightSelectedParty) {
      const selectedIndex = filteredParties.findIndex((item) => String(item._id) === String(formData.party));
      setPartyListIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    setPartyListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredParties.length) return filteredParties.length - 1;
      return prev;
    });
  }, [showForm, filteredParties, isPartySectionActive, partyQuery, selectedPartyName, formData.party]);

  useEffect(() => {
    if (!showForm) return;

    if (filteredReceiptAccounts.length === 0) {
      setReceiptAccountListIndex(-1);
      return;
    }

    const shouldHighlightSelectedAccount = (
      isReceiptAccountSectionActive
      && normalizeText(receiptAccountQuery)
      && normalizeText(receiptAccountQuery) === normalizeText(formData.method)
      && formData.method
    );

    if (shouldHighlightSelectedAccount) {
      const selectedIndex = filteredReceiptAccounts.findIndex((item) => item === formData.method);
      setReceiptAccountListIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    setReceiptAccountListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredReceiptAccounts.length) return filteredReceiptAccounts.length - 1;
      return prev;
    });
  }, [showForm, filteredReceiptAccounts, isReceiptAccountSectionActive, receiptAccountQuery, formData.method]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReceiptDateBlur = (e) => {
    const parsedDate = parseReceiptDateInput(e.target.value);
    if (!parsedDate) return;

    setFormData((prev) => ({
      ...prev,
      receiptDate: formatReceiptDateInput(parsedDate)
    }));
  };

  const handlePartyFocus = () => {
    setIsPartySectionActive(true);
  };

  const handleReceiptAccountFocus = () => {
    setIsReceiptAccountSectionActive(true);
  };

  const findExactParty = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return parties.find((party) => normalizeText(getPartyDisplayName(party)) === normalized) || null;
  };

  const findBestPartyMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return parties.find((party) => normalizeText(getPartyDisplayName(party)).startsWith(normalized))
      || parties.find((party) => normalizeText(getPartyDisplayName(party)).includes(normalized))
      || null;
  };

  const findExactReceiptAccount = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return receiptAccountOptions.find((accountName) => normalizeText(accountName) === normalized) || null;
  };

  const findBestReceiptAccountMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return receiptAccountOptions.find((accountName) => normalizeText(accountName).startsWith(normalized))
      || receiptAccountOptions.find((accountName) => normalizeText(accountName).includes(normalized))
      || null;
  };

  const selectParty = (party) => {
    if (!party) {
      setPartyQuery('');
      setFormData((prev) => ({
        ...prev,
        party: ''
      }));
      setPartyListIndex(-1);
      return;
    }

    const partyName = getPartyDisplayName(party);
    setPartyQuery(partyName);
    setFormData((prev) => ({
      ...prev,
      party: party._id
    }));

    const selectedIndex = filteredParties.findIndex((item) => String(item._id) === String(party._id));
    setPartyListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handlePartyInputChange = (e) => {
    const value = e.target.value;
    setPartyQuery(value);

    if (!normalizeText(value)) {
      selectParty(null);
      return;
    }

    const exactParty = findExactParty(value);
    if (exactParty) {
      setFormData((prev) => ({
        ...prev,
        party: exactParty._id
      }));
      const exactIndex = getMatchingParties(value).findIndex((item) => String(item._id) === String(exactParty._id));
      setPartyListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingParties(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({
      ...prev,
      party: firstMatch?._id || ''
    }));
    setPartyListIndex(firstMatch ? 0 : -1);
  };

  const selectReceiptAccount = (accountName) => {
    if (!accountName) {
      setReceiptAccountQuery('');
      setFormData((prev) => ({
        ...prev,
        method: ''
      }));
      setReceiptAccountListIndex(-1);
      return;
    }

    setReceiptAccountQuery(accountName);
    setFormData((prev) => ({
      ...prev,
      method: accountName
    }));

    const selectedIndex = filteredReceiptAccounts.findIndex((item) => item === accountName);
    setReceiptAccountListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handleReceiptAccountInputChange = (e) => {
    const value = e.target.value;
    const matches = getMatchingReceiptAccounts(value);
    setReceiptAccountQuery(value);

    if (!normalizeText(value)) {
      selectReceiptAccount(null);
      return;
    }

    const exactAccount = findExactReceiptAccount(value);
    if (exactAccount) {
      setFormData((prev) => ({
        ...prev,
        method: exactAccount
      }));
      const exactIndex = matches.findIndex((item) => item === exactAccount);
      setReceiptAccountListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const firstMatch = matches[0] || null;
    setFormData((prev) => ({
      ...prev,
      method: firstMatch || ''
    }));
    setReceiptAccountListIndex(firstMatch ? 0 : -1);
  };

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

  const handlePartyInputKeyDown = (e) => {
    const key = e.key?.toLowerCase();

    if (key === 'arrowdown') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredParties.length === 0) return;
      setPartyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredParties.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredParties.length === 0) return;
      setPartyListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeParty = partyListIndex >= 0 ? filteredParties[partyListIndex] : null;
      const matchedParty = activeParty || findExactParty(partyQuery) || findBestPartyMatch(partyQuery);
      if (matchedParty) {
        selectParty(matchedParty);
      }
      setIsPartySectionActive(false);
      focusNextPopupField(e.currentTarget);
    }
  };

  const handleReceiptAccountInputKeyDown = (e) => {
    const key = e.key?.toLowerCase();

    if (key === 'arrowdown') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredReceiptAccounts.length === 0) return;
      setReceiptAccountListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredReceiptAccounts.length - 1);
      });
      return;
    }

    if (key === 'arrowup') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredReceiptAccounts.length === 0) return;
      setReceiptAccountListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (key === 'enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeAccount = receiptAccountListIndex >= 0 ? filteredReceiptAccounts[receiptAccountListIndex] : null;
      const matchedAccount = activeAccount || findExactReceiptAccount(receiptAccountQuery) || findBestReceiptAccountMatch(receiptAccountQuery);
      if (matchedAccount) {
        selectReceiptAccount(matchedAccount);
      }
      setIsReceiptAccountSectionActive(false);
      focusNextPopupField(e.currentTarget);
    }
  };

  const handleOpenForm = () => {
    setEditingId(null);
    setFormData(getInitialForm(defaultReceiptMethod));
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setReceiptAccountQuery(defaultReceiptMethod);
    setReceiptAccountListIndex(-1);
    setIsReceiptAccountSectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (modalOnly && typeof onModalFinish === 'function') {
      onModalFinish();
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(getInitialForm(defaultReceiptMethod));
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setReceiptAccountQuery(defaultReceiptMethod);
    setReceiptAccountListIndex(-1);
    setIsReceiptAccountSectionActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (!formData.method) {
      setError('Select receipt account');
      return;
    }

    const parsedReceiptDate = parseReceiptDateInput(formData.receiptDate);
    if (!parsedReceiptDate) {
      setError('Enter receipt date in DD/MM/YYYY format');
      return;
    }

    try {
      setLoading(true);
      const resolvedRefType = formData.refId ? 'sale' : 'none';
      const payload = {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        receiptDate: parsedReceiptDate,
        notes: formData.notes,
        refType: formData.refType || 'none',
        refId: formData.refId || null
      };

      if (editingId) {
        await apiClient.put(`/receipts/${editingId}`, payload);
        toast.success('Receipt updated successfully', TOAST_OPTIONS);
      } else {
        await apiClient.post('/receipts', payload);
        toast.success('Receipt created successfully', TOAST_OPTIONS);
      }

      handleCloseForm();
      setError('');
      fetchReceipts();
      fetchSales();
      if (modalOnly && typeof onModalFinish === 'function') {
        onModalFinish();
      }
    } catch (err) {
      setError(err.message || 'Error saving receipt');
    } finally {
      setLoading(false);
    }
  };

  const totalReceipts = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalSalesAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalReceivable = Math.max(0, totalSalesAmount - totalReceipts);

  if (modalOnly) {
    return (
      <>
        {error && (
          <div className="fixed left-4 right-4 top-4 z-[60] rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-lg md:left-auto md:right-4 md:w-[26rem]">
            {error}
          </div>
        )}
        <AddReceiptPopup
          showForm={showForm}
          loading={loading}
          formData={formData}
          parties={parties}
          receiptAccountOptions={receiptAccountOptions}
          partySectionRef={partySectionRef}
          receiptAccountSectionRef={receiptAccountSectionRef}
          partyQuery={partyQuery}
          receiptAccountQuery={receiptAccountQuery}
          partyListIndex={partyListIndex}
          receiptAccountListIndex={receiptAccountListIndex}
          filteredParties={filteredParties}
          filteredReceiptAccounts={filteredReceiptAccounts}
          isPartySectionActive={isPartySectionActive}
          isReceiptAccountSectionActive={isReceiptAccountSectionActive}
          setFormData={setFormData}
          setPartyListIndex={setPartyListIndex}
          setReceiptAccountListIndex={setReceiptAccountListIndex}
          setIsPartySectionActive={setIsPartySectionActive}
          setIsReceiptAccountSectionActive={setIsReceiptAccountSectionActive}
          getPartyDisplayName={getPartyDisplayName}
          handleCloseForm={handleCloseForm}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          handleReceiptDateBlur={handleReceiptDateBlur}
          handlePartyFocus={handlePartyFocus}
          handleReceiptAccountFocus={handleReceiptAccountFocus}
          handlePartyInputChange={handlePartyInputChange}
          handleReceiptAccountInputChange={handleReceiptAccountInputChange}
          handlePartyInputKeyDown={handlePartyInputKeyDown}
          handleReceiptAccountInputKeyDown={handleReceiptAccountInputKeyDown}
          selectParty={selectParty}
          selectReceiptAccount={selectReceiptAccount}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2 xl:flex xl:justify-start">
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 xl:min-w-[220px] xl:w-fit">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Receipts</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{receipts.length}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1" />
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 xl:min-w-[220px] xl:w-fit">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Amount Received</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  Rs {totalReceipts.toFixed(2)}
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 sm:flex">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1" />
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 xl:min-w-[220px] xl:w-fit">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Receivable</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  Rs {totalReceivable.toFixed(2)}
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110 sm:flex">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 sm:h-1" />
          </div>
        </div>

        <AddReceiptPopup
          showForm={showForm}
          loading={loading}
          formData={formData}
          parties={parties}
          receiptAccountOptions={receiptAccountOptions}
          partySectionRef={partySectionRef}
          receiptAccountSectionRef={receiptAccountSectionRef}
          partyQuery={partyQuery}
          receiptAccountQuery={receiptAccountQuery}
          partyListIndex={partyListIndex}
          receiptAccountListIndex={receiptAccountListIndex}
          filteredParties={filteredParties}
          filteredReceiptAccounts={filteredReceiptAccounts}
          isPartySectionActive={isPartySectionActive}
          isReceiptAccountSectionActive={isReceiptAccountSectionActive}
          setFormData={setFormData}
          setPartyListIndex={setPartyListIndex}
          setReceiptAccountListIndex={setReceiptAccountListIndex}
          setIsPartySectionActive={setIsPartySectionActive}
          setIsReceiptAccountSectionActive={setIsReceiptAccountSectionActive}
          getPartyDisplayName={getPartyDisplayName}
          handleCloseForm={handleCloseForm}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          handleReceiptDateBlur={handleReceiptDateBlur}
          handlePartyFocus={handlePartyFocus}
          handleReceiptAccountFocus={handleReceiptAccountFocus}
          handlePartyInputChange={handlePartyInputChange}
          handleReceiptAccountInputChange={handleReceiptAccountInputChange}
          handlePartyInputKeyDown={handlePartyInputKeyDown}
          handleReceiptAccountInputKeyDown={handleReceiptAccountInputKeyDown}
          selectParty={selectParty}
          selectReceiptAccount={selectReceiptAccount}
          editingId={editingId}
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-[22%] lg:min-w-[260px]"
              >
                <option value="">Receipt History - All Time</option>
                <option value="7d">Receipt History - 7 Days</option>
                <option value="30d">Receipt History - 30 Days</option>
                <option value="3m">Receipt History - 3 Months</option>
                <option value="6m">Receipt History - 6 Months</option>
                <option value="1y">Receipt History - 1 Year</option>
              </select>

              {canAdd && (
              <button
                type="button"
                onClick={handleOpenForm}
                className="inline-flex flex-col items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-white shadow-sm transition hover:bg-slate-900"
              >
                <span className="text-sm font-semibold">+ New Receipt</span>
                <span className="text-[11px] font-medium text-slate-300">Money Received</span>
              </button>
              )}
            </div>
          </div>

          {loading && !showForm ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="space-y-3 md:hidden">
                {receipts.map((receipt) => (
                  <article
                    key={receipt._id}
                    className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_16px_32px_rgba(8,47,73,0.10)]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-cyan-900/20 bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] px-4 py-3 text-white">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          {formatReceiptNumber(receipt.receiptNumber)}
                        </p>
                        <p className="truncate text-sm font-bold text-white">{getPartyDisplayName(receipt.party) || 'Walk-in / Unassigned'}</p>
                        <p className="mt-1 text-xs text-cyan-100">
                          {formatDisplayDate(receipt.receiptDate)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100">Amount</p>
                        <p className="mt-1 text-sm font-bold text-white">Rs {Number(receipt.amount || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Receipt Account</p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-700">{receipt.method || '-'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Reference</p>
                        <p className="mt-1 break-words text-sm text-slate-700">
                          {receipt.refType === 'sale' ? 'Against Sale' : 'On Account'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Notes</p>
                        <p className="mt-1 break-words text-sm text-slate-700">{receipt.notes || '-'}</p>
                      </div>
                    </div>
                  </article>
                ))}

                {receipts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
                    No receipts found
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] overflow-hidden whitespace-nowrap border-separate border-spacing-0 text-left text-sm">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">No.</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Date</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Amount</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Receipt Account</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Reference</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Notes</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {receipts.map((receipt) => (
                      <tr key={receipt._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">
                          {formatReceiptNumber(receipt.receiptNumber)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-medium text-slate-700">
                          {formatDisplayDate(receipt.receiptDate)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-800">
                          {getPartyDisplayName(receipt.party) || '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-emerald-700">
                          Rs {Number(receipt.amount || 0).toFixed(2)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">
                          {receipt.method || '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">
                          {receipt.refType === 'sale' ? 'Against Sale' : 'On Account'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3">
                          <div className="max-w-[24rem] truncate">{receipt.notes || '-'}</div>
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">
                          {canEdit && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(receipt);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {receipts.length === 0 && (
                      <tr>
                        <td colSpan="6" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                          No receipts found
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

