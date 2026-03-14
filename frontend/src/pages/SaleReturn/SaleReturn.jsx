import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, IndianRupee, RotateCcw, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import { handlePopupFormKeyDown } from '../../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../../utils/useFloatingDropdownPosition';

const TOAST_OPTIONS = { autoClose: 1200 };

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' }
];

const getInitialForm = () => ({
  party: '',
  amount: '',
  method: 'cash',
  voucherDate: new Date().toISOString().split('T')[0],
  referenceNo: '',
  debitAccount: '',
  creditAccount: '',
  notes: ''
});

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => (
  value ? new Date(value).toLocaleDateString('en-GB') : '-'
);

const getMethodBadgeClass = (method) => {
  const normalized = String(method || '').toLowerCase();
  if (normalized === 'cash') return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'bank') return 'border border-blue-200 bg-blue-50 text-blue-700';
  if (normalized === 'upi') return 'border border-violet-200 bg-violet-50 text-violet-700';
  if (normalized === 'card') return 'border border-amber-200 bg-amber-50 text-amber-700';
  return 'border border-slate-200 bg-slate-100 text-slate-700';
};

export default function SaleReturn() {
  const [entries, setEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(getInitialForm());
  const partyInputRef = useRef(null);
  const methodInputRef = useRef(null);
  const partySectionRef = useRef(null);
  const methodSectionRef = useRef(null);
  const [partyQuery, setPartyQuery] = useState('');
  const [methodQuery, setMethodQuery] = useState(PAYMENT_METHOD_OPTIONS[0].label);
  const [partyListIndex, setPartyListIndex] = useState(-1);
  const [methodListIndex, setMethodListIndex] = useState(0);
  const [isPartySectionActive, setIsPartySectionActive] = useState(false);
  const [isMethodSectionActive, setIsMethodSectionActive] = useState(false);
  const getInlineFieldClass = (tone = 'indigo') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
    return `flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none ${focusTone}`;
  };
  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  useEffect(() => {
    fetchEntries();
  }, [search]);

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey) return;
      if (key !== 'n') return;
      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showForm) return;

    const timer = setTimeout(() => {
      partyInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [showForm]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sale-returns', { params: { search } });
      setEntries(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching sale returns');
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

  const totalAmount = useMemo(
    () => entries.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [entries]
  );

  const selectedPartyName = useMemo(() => {
    const selectedParty = parties.find(
      (party) => String(party._id || '') === String(formData.party || '')
    );
    return selectedParty?.name || selectedParty?.partyName || '';
  }, [formData.party, parties]);

  const selectedMethodLabel = useMemo(() => {
    const selectedOption = PAYMENT_METHOD_OPTIONS.find(
      (option) => option.value === String(formData.method || 'cash').trim().toLowerCase()
    );
    return selectedOption?.label || PAYMENT_METHOD_OPTIONS[0].label;
  }, [formData.method]);

  const getMatchingParties = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return parties;

    const startsWith = parties.filter((party) => normalizeText(party.name || party.partyName).startsWith(normalized));
    const includes = parties.filter((party) => (
      !normalizeText(party.name || party.partyName).startsWith(normalized)
      && normalizeText(party.name || party.partyName).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const filteredParties = useMemo(
    () => getMatchingParties(partyQuery),
    [parties, partyQuery]
  );

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
      return PAYMENT_METHOD_OPTIONS;
    }

    if (!normalized) return PAYMENT_METHOD_OPTIONS;

    const startsWith = PAYMENT_METHOD_OPTIONS.filter((option) => normalizeText(option.label).startsWith(normalized));
    const includes = PAYMENT_METHOD_OPTIONS.filter((option) => (
      !normalizeText(option.label).startsWith(normalized)
      && normalizeText(option.label).includes(normalized)
    ));

    return [...startsWith, ...includes];
  }, [isMethodSectionActive, methodQuery, selectedMethodLabel]);

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

  const findExactParty = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return parties.find((party) => normalizeText(party.name || party.partyName) === normalized) || null;
  };

  const findBestPartyMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return parties.find((party) => normalizeText(party.name || party.partyName).startsWith(normalized))
      || parties.find((party) => normalizeText(party.name || party.partyName).includes(normalized))
      || null;
  };

  const findExactMethod = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return PAYMENT_METHOD_OPTIONS.find((option) => normalizeText(option.label) === normalized) || null;
  };

  const selectParty = (party) => {
    if (!party) {
      setPartyQuery('');
      setFormData((prev) => ({ ...prev, party: '' }));
      setPartyListIndex(-1);
      return;
    }

    const partyName = party.name || party.partyName || 'Party';
    setPartyQuery(partyName);
    setFormData((prev) => ({ ...prev, party: party._id }));
    const selectedIndex = getMatchingParties(partyName).findIndex((item) => String(item._id) === String(party._id));
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const matchedOption = activeOption || exactMatch || filteredMethodOptions[0] || PAYMENT_METHOD_OPTIONS[0];
      if (matchedOption) {
        selectMethod(matchedOption);
      }
    }
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setMethodQuery(PAYMENT_METHOD_OPTIONS[0].label);
    setMethodListIndex(0);
    setIsMethodSectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(getInitialForm());
    setPartyQuery('');
    setPartyListIndex(-1);
    setIsPartySectionActive(false);
    setMethodQuery(PAYMENT_METHOD_OPTIONS[0].label);
    setMethodListIndex(0);
    setIsMethodSectionActive(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.party) {
      setError('Party is required');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (!String(formData.debitAccount || '').trim()) {
      setError('Debit account is required');
      return;
    }

    if (!String(formData.creditAccount || '').trim()) {
      setError('Credit account is required');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/sale-returns', {
        party: formData.party,
        amount: Number(formData.amount),
        method: formData.method || 'cash',
        voucherDate: formData.voucherDate ? new Date(formData.voucherDate) : new Date(),
        referenceNo: String(formData.referenceNo || '').trim(),
        debitAccount: String(formData.debitAccount || '').trim(),
        creditAccount: String(formData.creditAccount || '').trim(),
        notes: String(formData.notes || '').trim()
      });

      toast.success('Sale return voucher created successfully', TOAST_OPTIONS);
      handleCloseForm();
      fetchEntries();
      setError('');
    } catch (err) {
      setError(err.message || 'Error creating sale return voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Sale Return Count</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{entries.length}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
                <RotateCcw className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1"></div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Return Amount</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">
                  <span className="mr-1 text-[10px] font-medium text-slate-400 sm:text-base">Rs</span>
                  {totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 sm:flex">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1"></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sale returns..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                onClick={handleOpenForm}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
              >
                + Add Sale Return
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Voucher No</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Debit Account</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Credit Account</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Method</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Date</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Reference</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">{entry.voucherNumber || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.party?.name || entry.party?.partyName || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.debitAccount || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.creditAccount || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMethodBadgeClass(entry.method)}`}>
                            {entry.method || '-'}
                          </span>
                        </td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{formatDate(entry.voucherDate)}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.referenceNo || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-emerald-700">{formatCurrency(entry.amount)}</td>
                      </tr>
                    ))}
                    {!entries.length && (
                      <tr>
                        <td colSpan="8" className="border border-slate-400 px-6 py-10 text-center text-slate-500">
                          No sale returns found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4"
            onClick={handleCloseForm}
          >
            <div
              className="flex max-h-[92vh] w-full max-w-[44rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex-shrink-0 border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-1.5 text-white md:px-4 md:py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white ring-1 ring-white/30 md:h-8 md:w-8">
                      <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold md:text-xl">Sale Return Voucher</h2>
                      <p className="mt-0.5 text-[11px] text-cyan-100 md:text-xs">
                        Create sale return entries in the same popup style as stock items.
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
                        Voucher Details
                      </h3>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Party *</label>
                          <div
                            ref={partySectionRef}
                            className="relative flex-1 min-w-0"
                            onFocusCapture={() => {
                              const selectedIndex = partyOptions.findIndex(
                                (party) => String(party?._id || '') === String(formData.party || '')
                              );
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
                                      const partyName = party.name || party.partyName || 'Party';

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
                                          <span className="truncate font-medium">{partyName}</span>
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

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Voucher Date</label>
                          <input
                            type="date"
                            name="voucherDate"
                            value={formData.voucherDate}
                            onChange={handleChange}
                            className={getInlineFieldClass('indigo')}
                          />
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Amount *</label>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            className={getInlineFieldClass('indigo')}
                            placeholder="Enter return amount"
                          />
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Reference No</label>
                          <input
                            type="text"
                            name="referenceNo"
                            value={formData.referenceNo}
                            onChange={handleChange}
                            className={getInlineFieldClass('indigo')}
                            placeholder="Optional reference number"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
                        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800 md:text-lg">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white md:h-8 md:w-8 md:text-sm">2</span>
                          Return Posting
                        </h3>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          Amount: {formatCurrency(formData.amount || 0)}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Debit Account *</label>
                          <input
                            type="text"
                            name="debitAccount"
                            value={formData.debitAccount}
                            onChange={handleChange}
                            className={getInlineFieldClass('emerald')}
                            placeholder="Enter debit account"
                          />
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Credit Account *</label>
                          <input
                            type="text"
                            name="creditAccount"
                            value={formData.creditAccount}
                            onChange={handleChange}
                            className={getInlineFieldClass('emerald')}
                            placeholder="Enter credit account"
                          />
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <label className="w-32 shrink-0 text-xs font-semibold text-gray-700 md:text-sm">Method</label>
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

                        <div className="flex flex-col gap-2 md:flex-row md:items-start">
                          <label className="w-32 shrink-0 pt-2 text-xs font-semibold text-gray-700 md:text-sm">Notes</label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="4"
                            className={`${getInlineFieldClass('emerald')} resize-none py-2.5 font-medium text-slate-700`}
                            placeholder="Reason for sale return or additional note"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 md:flex-row md:px-4">
                  <div className="text-[11px] text-gray-600 md:text-xs">
                    <kbd className="rounded bg-gray-200 px-2 py-1 text-xs font-mono">Esc</kbd> to close
                    <span className="ml-3 text-sm font-semibold text-slate-700">
                      Return Total: <span className="text-emerald-700">{formatCurrency(formData.amount || 0)}</span>
                    </span>
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
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-1.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
                    >
                      {saving ? (
                        <>
                          <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Sale Return'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
