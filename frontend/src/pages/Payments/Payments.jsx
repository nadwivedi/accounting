import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, IndianRupee, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddPaymentPopup from './component/AddPaymentPopup';

const getInitialForm = () => ({
  party: '',
  amount: '',
  method: 'cash',
  paymentDate: new Date().toISOString().split('T')[0],
  notes: '',
  refType: 'none',
  refId: ''
});
const TOAST_OPTIONS = { autoClose: 1200 };

const buildPurchasePaymentMap = (payments) => {
  const map = new Map();

  payments
    .filter((payment) => payment.refType === 'purchase' && payment.refId)
    .forEach((payment) => {
      const key = String(payment.refId);
      map.set(key, (map.get(key) || 0) + Number(payment.amount || 0));
    });

  return map;
};

export default function Payments({ modalOnly = false, onModalFinish = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [partyQuery, setPartyQuery] = useState('');
  const [partyListIndex, setPartyListIndex] = useState(-1);
  const [isPartySectionActive, setIsPartySectionActive] = useState(false);
  const partySectionRef = useRef(null);

  useEffect(() => {
    fetchPayments();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchParties();
    fetchPurchases();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.target?.isContentEditable;
      const key = event.key?.toLowerCase();

      if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget || showForm) return;
      if (key !== 'm') return;

      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  useEffect(() => {
    if (location.state?.openShortcut !== 'payment' || showForm) return;

    handleOpenForm();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, showForm]);

  useEffect(() => {
    if (!modalOnly || showForm) return;
    handleOpenForm();
  }, [modalOnly, showForm]);

  const purchasePaymentMap = useMemo(() => buildPurchasePaymentMap(payments), [payments]);

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

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

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/payments', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
      setPayments(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties');
      setParties((response.data || []).filter((p) => p.type === 'supplier' || p.type === 'both'));
    } catch (err) {
      console.error('Error fetching parties:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await apiClient.get('/purchases');
      setPurchases(response.data || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

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

  const handlePartyFocus = () => {
    setIsPartySectionActive(true);
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

  const selectParty = (party) => {
    if (!party) {
      setPartyQuery('');
      setFormData((prev) => ({
        ...prev,
        party: '',
        refId: ''
      }));
      setPartyListIndex(-1);
      return;
    }

    const partyName = getPartyDisplayName(party);
    setPartyQuery(partyName);
    setFormData((prev) => ({
      ...prev,
      party: party._id,
      refId: prev.refType === 'purchase' ? '' : prev.refId
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
        party: exactParty._id,
        refId: prev.refType === 'purchase' ? '' : prev.refId
      }));
      const exactIndex = getMatchingParties(value).findIndex((item) => String(item._id) === String(exactParty._id));
      setPartyListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingParties(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({
      ...prev,
      party: firstMatch?._id || '',
      refId: prev.refType === 'purchase' ? '' : prev.refId
    }));
    setPartyListIndex(firstMatch ? 0 : -1);
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

  const purchaseOptions = useMemo(() => {
    if (formData.refType !== 'purchase') return [];

    return purchases.filter((p) => {
      if (!formData.party) return true;
      return String(p.party?._id || p.party) === String(formData.party);
    }).filter((p) => {
      const pending = Math.max(0, Number(p.totalAmount || 0) - Number(purchasePaymentMap.get(String(p._id)) || 0));
      return pending > 0;
    });
  }, [purchases, purchasePaymentMap, formData.refType, formData.party]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (modalOnly && typeof onModalFinish === 'function') {
      onModalFinish();
      return;
    }

    setShowForm(false);
    setFormData(getInitialForm());
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (formData.refType === 'purchase' && !formData.refId) {
      setError('Select purchase bill for bill-wise payment');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/payments', {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : new Date(),
        notes: formData.notes,
        refType: formData.refType,
        refId: formData.refType === 'purchase' ? formData.refId : null
      });

      handleCloseForm();
      setError('');
      fetchPayments();
      fetchPurchases();
      toast.success('Payment created successfully', TOAST_OPTIONS);
      if (modalOnly && typeof onModalFinish === 'function') {
        onModalFinish();
      }
    } catch (err) {
      setError(err.message || 'Error creating payment');
    } finally {
      setLoading(false);
    }
  };

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalPayable = Math.max(0, totalPurchaseAmount - totalPayments);

  if (modalOnly) {
    return (
      <>
        {error && (
          <div className="fixed left-4 right-4 top-4 z-[60] rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-lg md:left-auto md:right-4 md:w-[26rem]">
            {error}
          </div>
        )}
        <AddPaymentPopup
          showForm={showForm}
          loading={loading}
          formData={formData}
          parties={parties}
          partySectionRef={partySectionRef}
          partyQuery={partyQuery}
          partyListIndex={partyListIndex}
          filteredParties={filteredParties}
          isPartySectionActive={isPartySectionActive}
          purchaseOptions={purchaseOptions}
          purchasePaymentMap={purchasePaymentMap}
          setFormData={setFormData}
          setPartyListIndex={setPartyListIndex}
          setIsPartySectionActive={setIsPartySectionActive}
          getPartyDisplayName={getPartyDisplayName}
          handleCloseForm={handleCloseForm}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          handlePartyFocus={handlePartyFocus}
          handlePartyInputChange={handlePartyInputChange}
          handlePartyInputKeyDown={handlePartyInputKeyDown}
          selectParty={selectParty}
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
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Payments</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{payments.length}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1" />
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5 xl:min-w-[220px] xl:w-fit">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Amount Paid</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  Rs {totalPayments.toFixed(2)}
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
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Total Payable</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  Rs {totalPayable.toFixed(2)}
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110 sm:flex">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 sm:h-1" />
          </div>
        </div>

        <AddPaymentPopup
          showForm={showForm}
          loading={loading}
          formData={formData}
          parties={parties}
          partySectionRef={partySectionRef}
          partyQuery={partyQuery}
          partyListIndex={partyListIndex}
          filteredParties={filteredParties}
          isPartySectionActive={isPartySectionActive}
          purchaseOptions={purchaseOptions}
          purchasePaymentMap={purchasePaymentMap}
          setFormData={setFormData}
          setPartyListIndex={setPartyListIndex}
          setIsPartySectionActive={setIsPartySectionActive}
          getPartyDisplayName={getPartyDisplayName}
          handleCloseForm={handleCloseForm}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          handlePartyFocus={handlePartyFocus}
          handlePartyInputChange={handlePartyInputChange}
          handlePartyInputKeyDown={handlePartyInputKeyDown}
          selectParty={selectParty}
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
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
                <option value="">Payment History - All Time</option>
                <option value="7d">Payment History - 7 Days</option>
                <option value="30d">Payment History - 30 Days</option>
                <option value="3m">Payment History - 3 Months</option>
                <option value="6m">Payment History - 6 Months</option>
                <option value="1y">Payment History - 1 Year</option>
              </select>

              <button
                type="button"
                onClick={handleOpenForm}
                className="inline-flex flex-col items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-white shadow-sm transition hover:bg-slate-900"
              >
                <span className="text-sm font-semibold">+ New Payment</span>
                <span className="text-[11px] font-medium text-slate-300">Money Paid</span>
              </button>
            </div>
          </div>

          {loading && !showForm ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="space-y-3 md:hidden">
                {payments.map((payment) => (
                  <article
                    key={payment._id}
                    className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_16px_32px_rgba(8,47,73,0.10)]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-cyan-900/20 bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] px-4 py-3 text-white">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{payment.party?.partyName || 'Walk-in / Unassigned'}</p>
                        <p className="mt-1 text-xs text-cyan-100">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100">Amount</p>
                        <p className="mt-1 text-sm font-bold text-white">Rs {Number(payment.amount || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Method</p>
                        <p className="mt-1 break-words text-sm font-medium capitalize text-slate-700">{payment.method || '-'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Reference</p>
                        <p className="mt-1 break-words text-sm text-slate-700">
                          {payment.refType === 'purchase' ? 'Against Purchase' : 'On Account'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Notes</p>
                        <p className="mt-1 break-words text-sm text-slate-700">{payment.notes || '-'}</p>
                      </div>
                    </div>
                  </article>
                ))}

                {payments.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
                    No payments found
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] overflow-hidden whitespace-nowrap border-separate border-spacing-0 text-left text-sm">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Date</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Amount</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Method</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Reference</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-sm font-semibold shadow-[inset_0_-1px_0_rgba(148,163,184,0.2)]">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-medium text-slate-700">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-slate-800">
                          {payment.party?.partyName || '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 font-semibold text-emerald-700">
                          Rs {Number(payment.amount || 0).toFixed(2)}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 capitalize text-slate-700">
                          {payment.method || '-'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-slate-700">
                          {payment.refType === 'purchase' ? 'Against Purchase' : 'On Account'}
                        </td>
                        <td className="border border-slate-400 px-4 py-3">
                          <div className="max-w-[24rem] truncate">{payment.notes || '-'}</div>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan="6" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                          No payments found
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

