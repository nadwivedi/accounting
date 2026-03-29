import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../../../utils/useFloatingDropdownPosition';
import apiClient from '../../../utils/api';
import { getBankDisplayName, normalizeBankName } from '../../../utils/bankAccounts';

const TOAST_OPTIONS = { autoClose: 1200 };

const formatPaymentDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parsePaymentDateInput = (value) => {
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
  paymentDate: formatPaymentDateInput(),
  notes: '',
  refType: 'none',
  refId: ''
});

const getPaymentAccountOptions = (banks = []) => {
  const uniqueNames = banks
    .map((bank) => getBankDisplayName(bank))
    .filter((name, index, values) => name && values.indexOf(name) === index);

  return uniqueNames.length > 0 ? uniqueNames : ['Cash Account'];
};

const getDefaultPaymentMethod = (banks = []) => {
  const cashAccount = banks.find((bank) => normalizeBankName(bank?.name) === 'cash account');
  return getBankDisplayName(cashAccount || banks[0]) || 'Cash Account';
};

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

export default function AddPaymentPopup({
  showForm,
  loading,
  formData,
  parties,
  paymentAccountOptions,
  paymentAccountSectionRef,
  partySectionRef,
  paymentAccountQuery,
  partyQuery,
  paymentAccountListIndex,
  partyListIndex,
  filteredPaymentAccounts,
  filteredParties,
  isPaymentAccountSectionActive,
  isPartySectionActive,
  purchaseOptions,
  purchasePaymentMap,
  setFormData,
  setPaymentAccountListIndex,
  setPartyListIndex,
  setIsPaymentAccountSectionActive,
  setIsPartySectionActive,
  getPartyDisplayName,
  handleCloseForm,
  handleSubmit,
  handleChange,
  handlePaymentDateBlur,
  handlePaymentAccountFocus,
  handlePartyFocus,
  handlePaymentAccountInputChange,
  handlePartyInputChange,
  handlePaymentAccountInputKeyDown,
  handlePartyInputKeyDown,
  selectPaymentAccount,
  selectParty,
  editingId
}) {
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 focus:border-transparent focus:outline-none focus:ring-2';
  const partyDropdownStyle = useFloatingDropdownPosition(partySectionRef, isPartySectionActive, [filteredParties.length, partyListIndex]);
  const paymentAccountDropdownStyle = useFloatingDropdownPosition(paymentAccountSectionRef, isPaymentAccountSectionActive, [filteredPaymentAccounts.length, paymentAccountListIndex]);

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4" onClick={handleCloseForm}>
      <div
        className="flex max-h-[78vh] w-full max-w-[32rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-white md:px-4 md:py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold md:text-xl">
                {editingId ? 'Edit Payment' : 'New Payment'}
                <span className="ml-2 text-sm font-medium text-slate-200 md:text-base">Money Paid</span>
              </h2>
              <p className="mt-1 text-xs text-cyan-100 md:text-sm">
              </p>
            </div>
          
          <button
            type="button"
            onClick={handleCloseForm}
            className="rounded-lg p-1.5 text-white transition hover:bg-white/20"
            aria-label="Close popup"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>

        <form
          id="payment-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)}
          className="flex flex-col overflow-hidden"
        >
          <div className="overflow-y-auto p-2.5 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 md:mb-3 md:text-base">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">1</span>
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Payment Date</label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                      <input
                        id="payment-date"
                        type="text"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                        onBlur={handlePaymentDateBlur}
                        className={`${inputClass} pl-10 focus:ring-indigo-500`}
                        placeholder="DD/MM/YYYY"
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="payment-amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      className={`${inputClass} font-semibold focus:ring-indigo-500`}
                      placeholder="Enter payment amount"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label htmlFor="payment-party" className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Party Name
                    </label>
                    <div
                      ref={partySectionRef}
                      className="relative"
                      onFocusCapture={handlePartyFocus}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (partySectionRef.current && nextFocused instanceof Node && partySectionRef.current.contains(nextFocused)) return;
                        setIsPartySectionActive(false);
                      }}
                    >
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                        <input
                          id="payment-party"
                          type="text"
                          value={partyQuery}
                          onChange={handlePartyInputChange}
                          onKeyDown={handlePartyInputKeyDown}
                          className={`${inputClass} pl-9 focus:ring-indigo-500`}
                          placeholder="Type to search party..."
                          autoComplete="off"
                        />
                      </div>

                      {isPartySectionActive && partyDropdownStyle && (
                        <div
                          className="fixed z-[80] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                          style={partyDropdownStyle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Party List</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              {filteredParties.length}
                            </span>
                          </div>
                          <div className="overflow-y-auto py-1" style={{ maxHeight: partyDropdownStyle.maxHeight }}>
                            {filteredParties.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                No matching parties found.
                              </div>
                            ) : (
                              filteredParties.map((party, index) => {
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
                                    <span className="truncate font-medium">{getPartyDisplayName(party)}</span>
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

                  <div className="relative">
                    <label htmlFor="payment-method" className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Payment Account
                    </label>
                    <div
                      ref={paymentAccountSectionRef}
                      className="relative"
                      onFocusCapture={handlePaymentAccountFocus}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (paymentAccountSectionRef.current && nextFocused instanceof Node && paymentAccountSectionRef.current.contains(nextFocused)) return;
                        setIsPaymentAccountSectionActive(false);
                      }}
                    >
                      <div className="relative">
                        <Wallet className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                        <input
                          id="payment-method"
                          type="text"
                          value={paymentAccountQuery}
                          onChange={handlePaymentAccountInputChange}
                          onKeyDown={handlePaymentAccountInputKeyDown}
                          className={`${inputClass} pl-9 focus:ring-indigo-500`}
                          placeholder="Type to search account..."
                          autoComplete="off"
                        />
                      </div>

                      {isPaymentAccountSectionActive && paymentAccountDropdownStyle && (
                        <div
                          className="fixed z-[80] overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                          style={paymentAccountDropdownStyle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">Accounts</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 shadow-sm">
                              {filteredPaymentAccounts.length}
                            </span>
                          </div>
                          <div className="overflow-y-auto py-1" style={{ maxHeight: paymentAccountDropdownStyle.maxHeight }}>
                            {filteredPaymentAccounts.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                No matching accounts found.
                              </div>
                            ) : (
                              filteredPaymentAccounts.map((accountName, index) => {
                                const isActive = index === paymentAccountListIndex;
                                const isSelected = formData.method === accountName;

                                return (
                                  <button
                                    key={accountName}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setPaymentAccountListIndex(index)}
                                    onClick={() => {
                                      selectPaymentAccount(accountName);
                                      setIsPaymentAccountSectionActive(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                                      isActive
                                        ? 'bg-indigo-200 text-indigo-950'
                                        : isSelected
                                        ? 'bg-indigo-50 text-indigo-800'
                                        : 'text-slate-700 hover:bg-indigo-50'
                                    }`}
                                  >
                                    <span className="truncate font-medium">{accountName}</span>
                                    {isSelected && (
                                      <span className="shrink-0 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
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

                  <div className="md:col-span-2">
                    <label htmlFor="payment-notes" className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Notes
                    </label>
                    <textarea
                      id="payment-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' || event.shiftKey) return;
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }}
                      rows="3"
                      className={`${inputClass} resize-none focus:ring-indigo-500`}
                      placeholder="Optional note"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2.5 md:flex-row md:px-4 md:py-3">
            <div className="text-[11px] text-gray-600 md:text-xs">
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-5"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="payment-form"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
              >
                {loading ? 'Saving...' : editingId ? 'Update Payment' : 'Save Payment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddPaymentPopupLauncher({ onFinish = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partyQuery, setPartyQuery] = useState('');
  const [partyListIndex, setPartyListIndex] = useState(-1);
  const [isPartySectionActive, setIsPartySectionActive] = useState(false);
  const [paymentAccountQuery, setPaymentAccountQuery] = useState('');
  const [paymentAccountListIndex, setPaymentAccountListIndex] = useState(-1);
  const [isPaymentAccountSectionActive, setIsPaymentAccountSectionActive] = useState(false);
  const partySectionRef = useRef(null);
  const paymentAccountSectionRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [paymentsResponse, partiesResponse, purchasesResponse, banksResponse] = await Promise.all([
          apiClient.get('/payments'),
          apiClient.get('/parties'),
          apiClient.get('/purchases'),
          apiClient.get('/banks')
        ]);

        setPayments(paymentsResponse.data || []);
        setParties(partiesResponse.data || []);
        setPurchases(purchasesResponse.data || []);
        setBanks(banksResponse.data || []);
      } catch (err) {
        setError(err.message || 'Error loading payment form');
      }
    };

    loadData();
  }, []);

  const purchasePaymentMap = useMemo(() => buildPurchasePaymentMap(payments), [payments]);
  const paymentAccountOptions = useMemo(() => getPaymentAccountOptions(banks), [banks]);
  const defaultPaymentMethod = useMemo(() => getDefaultPaymentMethod(banks), [banks]);
  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  useEffect(() => {
    setFormData((prev) => {
      const currentMethod = String(prev.method || '').trim();
      const hasMatchingAccount = paymentAccountOptions.includes(currentMethod);
      const isLegacyMethod = ['cash', 'bank', 'upi', 'card', 'credit', 'other'].includes(currentMethod.toLowerCase());

      if (currentMethod && hasMatchingAccount && !isLegacyMethod) return prev;
      if (currentMethod === defaultPaymentMethod) return prev;

      return { ...prev, method: defaultPaymentMethod };
    });
  }, [defaultPaymentMethod, paymentAccountOptions]);

  useEffect(() => {
    if (location.state?.editPayment) {
      const payment = location.state.editPayment;
      setEditingId(payment._id);
      setFormData({
        party: payment.party?._id || payment.party || '',
        amount: String(payment.amount),
        method: payment.method || defaultPaymentMethod,
        paymentDate: parsePaymentDateInput(payment.paymentDate) ? formatPaymentDateInput(payment.paymentDate) : formatPaymentDateInput(new Date()),
        notes: payment.notes || '',
        refType: payment.refType || 'none',
        refId: payment.refId || ''
      });
      setPartyQuery(payment.party?.name || payment.party?.partyName || '');
      setPaymentAccountQuery(payment.method || defaultPaymentMethod);
      
      const { editPayment, ...restState } = location.state;
      navigate(location.pathname, { replace: true, state: Object.keys(restState).length > 0 ? restState : undefined });
    }
  }, [location.pathname, location.state, navigate, defaultPaymentMethod]);

  useEffect(() => {
    if (isPaymentAccountSectionActive) return;
    setPaymentAccountQuery(formData.method || '');
  }, [formData.method, isPaymentAccountSectionActive]);

  const getPartyDisplayName = (party) => {
    const partyName = String(party?.partyName || party?.name || '').trim();
    return partyName || 'Party Name';
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
    const includes = parties.filter((party) => !normalizeText(getPartyDisplayName(party)).startsWith(normalized) && normalizeText(getPartyDisplayName(party)).includes(normalized));
    return [...startsWith, ...includes];
  };

  const getMatchingPaymentAccounts = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return paymentAccountOptions;

    const startsWith = paymentAccountOptions.filter((accountName) => normalizeText(accountName).startsWith(normalized));
    const includes = paymentAccountOptions.filter((accountName) => !normalizeText(accountName).startsWith(normalized) && normalizeText(accountName).includes(normalized));
    return [...startsWith, ...includes];
  };

  const selectedPartyName = useMemo(() => resolvePartyNameById(formData.party), [formData.party, parties]);

  const filteredParties = useMemo(() => {
    const normalizedQuery = normalizeText(partyQuery);
    const normalizedSelectedName = normalizeText(selectedPartyName);

    if (isPartySectionActive && normalizedQuery && normalizedQuery === normalizedSelectedName) {
      return parties;
    }

    return getMatchingParties(partyQuery);
  }, [parties, partyQuery, isPartySectionActive, selectedPartyName]);

  const filteredPaymentAccounts = useMemo(() => {
    const normalizedQuery = normalizeText(paymentAccountQuery);
    const normalizedSelectedName = normalizeText(formData.method);

    if (isPaymentAccountSectionActive && normalizedQuery && normalizedQuery === normalizedSelectedName) {
      return paymentAccountOptions;
    }

    return getMatchingPaymentAccounts(paymentAccountQuery);
  }, [formData.method, isPaymentAccountSectionActive, paymentAccountOptions, paymentAccountQuery]);

  useEffect(() => {
    if (filteredParties.length === 0) {
      setPartyListIndex(-1);
      return;
    }

    const shouldHighlightSelectedParty = isPartySectionActive && normalizeText(partyQuery) && normalizeText(partyQuery) === normalizeText(selectedPartyName) && formData.party;
    if (shouldHighlightSelectedParty) {
      const selectedIndex = filteredParties.findIndex((item) => String(item._id) === String(formData.party));
      setPartyListIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    setPartyListIndex((prev) => (prev < 0 ? 0 : Math.min(prev, filteredParties.length - 1)));
  }, [filteredParties, formData.party, isPartySectionActive, partyQuery, selectedPartyName]);

  useEffect(() => {
    if (filteredPaymentAccounts.length === 0) {
      setPaymentAccountListIndex(-1);
      return;
    }

    const shouldHighlightSelectedAccount = isPaymentAccountSectionActive && normalizeText(paymentAccountQuery) && normalizeText(paymentAccountQuery) === normalizeText(formData.method) && formData.method;
    if (shouldHighlightSelectedAccount) {
      const selectedIndex = filteredPaymentAccounts.findIndex((item) => item === formData.method);
      setPaymentAccountListIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    setPaymentAccountListIndex((prev) => (prev < 0 ? 0 : Math.min(prev, filteredPaymentAccounts.length - 1)));
  }, [filteredPaymentAccounts, formData.method, isPaymentAccountSectionActive, paymentAccountQuery]);

  const handlePartyFocus = () => setIsPartySectionActive(true);
  const handlePaymentAccountFocus = () => setIsPaymentAccountSectionActive(true);

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

  const findExactPaymentAccount = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return paymentAccountOptions.find((accountName) => normalizeText(accountName) === normalized) || null;
  };

  const findBestPaymentAccountMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return paymentAccountOptions.find((accountName) => normalizeText(accountName).startsWith(normalized))
      || paymentAccountOptions.find((accountName) => normalizeText(accountName).includes(normalized))
      || null;
  };

  const selectParty = (party) => {
    if (!party) {
      setPartyQuery('');
      setFormData((prev) => ({ ...prev, party: '', refId: '' }));
      setPartyListIndex(-1);
      return;
    }

    const partyName = getPartyDisplayName(party);
    setPartyQuery(partyName);
    setFormData((prev) => ({ ...prev, party: party._id, refId: prev.refType === 'purchase' ? '' : prev.refId }));
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
      setFormData((prev) => ({ ...prev, party: exactParty._id, refId: prev.refType === 'purchase' ? '' : prev.refId }));
      const exactIndex = getMatchingParties(value).findIndex((item) => String(item._id) === String(exactParty._id));
      setPartyListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingParties(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, party: firstMatch?._id || '', refId: prev.refType === 'purchase' ? '' : prev.refId }));
    setPartyListIndex(firstMatch ? 0 : -1);
  };

  const selectPaymentAccount = (accountName) => {
    if (!accountName) {
      setPaymentAccountQuery('');
      setFormData((prev) => ({ ...prev, method: '' }));
      setPaymentAccountListIndex(-1);
      return;
    }

    setPaymentAccountQuery(accountName);
    setFormData((prev) => ({ ...prev, method: accountName }));
    const selectedIndex = filteredPaymentAccounts.findIndex((item) => item === accountName);
    setPaymentAccountListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handlePaymentAccountInputChange = (e) => {
    const value = e.target.value;
    const matches = getMatchingPaymentAccounts(value);
    setPaymentAccountQuery(value);

    if (!normalizeText(value)) {
      selectPaymentAccount(null);
      return;
    }

    const exactAccount = findExactPaymentAccount(value);
    if (exactAccount) {
      setFormData((prev) => ({ ...prev, method: exactAccount }));
      const exactIndex = matches.findIndex((item) => item === exactAccount);
      setPaymentAccountListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const firstMatch = matches[0] || null;
    setFormData((prev) => ({ ...prev, method: firstMatch || '' }));
    setPaymentAccountListIndex(firstMatch ? 0 : -1);
  };

  const focusNextPopupField = (element) => {
    if (!(element instanceof HTMLElement)) return;
    const form = element.closest('form');
    if (!form) return;

    const fields = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])')).filter((field) => {
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
      setPartyListIndex((prev) => (prev < 0 ? 0 : Math.min(prev + 1, filteredParties.length - 1)));
      return;
    }
    if (key === 'arrowup') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredParties.length === 0) return;
      setPartyListIndex((prev) => (prev < 0 ? 0 : Math.max(prev - 1, 0)));
      return;
    }
    if (key === 'enter') {
      e.preventDefault();
      e.stopPropagation();
      const activeParty = partyListIndex >= 0 ? filteredParties[partyListIndex] : null;
      const matchedParty = activeParty || findExactParty(partyQuery) || findBestPartyMatch(partyQuery);
      if (matchedParty) selectParty(matchedParty);
      setIsPartySectionActive(false);
      focusNextPopupField(e.currentTarget);
    }
  };

  const handlePaymentAccountInputKeyDown = (e) => {
    const key = e.key?.toLowerCase();
    if (key === 'arrowdown') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredPaymentAccounts.length === 0) return;
      setPaymentAccountListIndex((prev) => (prev < 0 ? 0 : Math.min(prev + 1, filteredPaymentAccounts.length - 1)));
      return;
    }
    if (key === 'arrowup') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredPaymentAccounts.length === 0) return;
      setPaymentAccountListIndex((prev) => (prev < 0 ? 0 : Math.max(prev - 1, 0)));
      return;
    }
    if (key === 'enter') {
      e.preventDefault();
      e.stopPropagation();
      const activeAccount = paymentAccountListIndex >= 0 ? filteredPaymentAccounts[paymentAccountListIndex] : null;
      const matchedAccount = activeAccount || findExactPaymentAccount(paymentAccountQuery) || findBestPaymentAccountMatch(paymentAccountQuery);
      if (matchedAccount) selectPaymentAccount(matchedAccount);
      setIsPaymentAccountSectionActive(false);
      focusNextPopupField(e.currentTarget);
    }
  };

  const purchaseOptions = useMemo(() => {
    if (formData.refType !== 'purchase') return [];
    return purchases.filter((purchase) => !formData.party || String(purchase.party?._id || purchase.party) === String(formData.party))
      .filter((purchase) => Math.max(0, Number(purchase.totalAmount || 0) - Number(purchasePaymentMap.get(String(purchase._id)) || 0)) > 0);
  }, [formData.party, formData.refType, purchasePaymentMap, purchases]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentDateBlur = (e) => {
    const parsedDate = parsePaymentDateInput(e.target.value);
    if (!parsedDate) return;
    setFormData((prev) => ({ ...prev, paymentDate: formatPaymentDateInput(parsedDate) }));
  };

  const handleCloseForm = () => {
    onFinish?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }
    if (!formData.method) {
      setError('Select payment account');
      return;
    }

    const parsedPaymentDate = parsePaymentDateInput(formData.paymentDate);
    if (!parsedPaymentDate) {
      setError('Enter payment date in DD/MM/YYYY format');
      return;
    }

    if (formData.refType === 'purchase' && !formData.refId) {
      setError('Select purchase bill for bill-wise payment');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        paymentDate: parsedPaymentDate,
        notes: formData.notes,
        refType: formData.refType,
        refId: formData.refType === 'purchase' ? formData.refId : null
      };

      if (editingId) {
        await apiClient.put(`/payments/${editingId}`, payload);
        toast.success('Payment updated successfully', TOAST_OPTIONS);
      } else {
        await apiClient.post('/payments', payload);
        toast.success('Payment created successfully', TOAST_OPTIONS);
      }

      handleCloseForm();
    } catch (err) {
      setError(err.message || 'Error creating payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error ? (
        <div className="fixed left-4 right-4 top-4 z-[60] rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-lg md:left-auto md:right-4 md:w-[26rem]">
          {error}
        </div>
      ) : null}

      <AddPaymentPopup
        showForm
        loading={loading}
        formData={formData}
        parties={parties}
        paymentAccountOptions={paymentAccountOptions}
        paymentAccountSectionRef={paymentAccountSectionRef}
        partySectionRef={partySectionRef}
        paymentAccountQuery={paymentAccountQuery}
        partyQuery={partyQuery}
        paymentAccountListIndex={paymentAccountListIndex}
        partyListIndex={partyListIndex}
        filteredPaymentAccounts={filteredPaymentAccounts}
        filteredParties={filteredParties}
        isPaymentAccountSectionActive={isPaymentAccountSectionActive}
        isPartySectionActive={isPartySectionActive}
        purchaseOptions={purchaseOptions}
        purchasePaymentMap={purchasePaymentMap}
        setFormData={setFormData}
        setPaymentAccountListIndex={setPaymentAccountListIndex}
        setPartyListIndex={setPartyListIndex}
        setIsPaymentAccountSectionActive={setIsPaymentAccountSectionActive}
        setIsPartySectionActive={setIsPartySectionActive}
        getPartyDisplayName={getPartyDisplayName}
        handleCloseForm={handleCloseForm}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        handlePaymentDateBlur={handlePaymentDateBlur}
        handlePaymentAccountFocus={handlePaymentAccountFocus}
        handlePartyFocus={handlePartyFocus}
        handlePaymentAccountInputChange={handlePaymentAccountInputChange}
        handlePartyInputChange={handlePartyInputChange}
        handlePaymentAccountInputKeyDown={handlePaymentAccountInputKeyDown}
        handlePartyInputKeyDown={handlePartyInputKeyDown}
        selectPaymentAccount={selectPaymentAccount}
        selectParty={selectParty}
        editingId={editingId}
      />
    </>
  );
}
