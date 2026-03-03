import { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

const getInitialForm = () => ({
  group: '',
  name: '',
  mobile: '',
  email: '',
  address: '',
  state: '',
  pincode: '',
  notes: ''
});
const TOAST_OPTIONS = { autoClose: 1200 };

export default function Leadger() {
  const [leadgers, setLeadgers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [groupQuery, setGroupQuery] = useState('');
  const [groupListIndex, setGroupListIndex] = useState(-1);
  const [isGroupSectionActive, setIsGroupSectionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const mobileInputRef = useRef(null);
  const groupSectionRef = useRef(null);
  const getInlineFieldClass = (tone = 'indigo') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

    return `flex-1 min-w-0 px-3 py-2 border border-transparent rounded-lg bg-transparent text-sm text-gray-900 transition-all focus:outline-none focus:bg-white placeholder:text-transparent focus:placeholder:text-gray-400 ${focusTone}`;
  };

  const getInlineTextareaClass = (tone = 'emerald') => {
    const focusTone = tone === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
      : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

    return `flex-1 min-w-0 px-3 py-2 border border-transparent rounded-lg bg-transparent text-sm text-gray-900 transition-all resize-none focus:outline-none focus:bg-white placeholder:text-transparent focus:placeholder:text-gray-400 ${focusTone}`;
  };

  useEffect(() => {
    fetchLeadgers();
  }, [search]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchLeadgers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/leadgers', { params: { search } });
      setLeadgers(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching leadger vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await apiClient.get('/groups');
      setGroups((response.data || []).filter((group) => group.isActive));
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const normalized = String(value || '').replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    if (name === 'pincode') {
      const normalized = String(value || '').replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    const defaultGroup = groups[0] || null;
    setFormData({
      ...getInitialForm(),
      group: defaultGroup?._id || ''
    });
    setEditingId(null);
    setGroupQuery('');
    setGroupListIndex(defaultGroup ? 0 : -1);
    setIsGroupSectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(getInitialForm());
    setGroupQuery('');
    setGroupListIndex(-1);
    setIsGroupSectionActive(false);
  };

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const getMatchingGroups = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return groups;

    const startsWith = groups.filter((group) => normalizeText(group.name).startsWith(normalized));
    const includes = groups.filter((group) => (
      !normalizeText(group.name).startsWith(normalized)
      && normalizeText(group.name).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const findExactGroup = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return groups.find((group) => normalizeText(group.name) === normalized) || null;
  };

  const findBestGroupMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;

    return groups.find((group) => normalizeText(group.name).startsWith(normalized))
      || groups.find((group) => normalizeText(group.name).includes(normalized))
      || null;
  };

  const filteredGroups = useMemo(() => getMatchingGroups(groupQuery), [groups, groupQuery]);

  useEffect(() => {
    if (filteredGroups.length === 0) {
      setGroupListIndex(-1);
      return;
    }

    setGroupListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredGroups.length) return filteredGroups.length - 1;
      return prev;
    });
  }, [filteredGroups]);

  useEffect(() => {
    if (!showForm) return;
    if (formData.group) return;
    if (groups.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      group: groups[0]._id
    }));
    setGroupListIndex(0);
  }, [showForm, groups, formData.group]);

  const selectGroup = (group, focusNotes = true) => {
    if (!group) return;
    setGroupQuery(group.name);
    setFormData((prev) => ({
      ...prev,
      group: group._id
    }));

    const selectedIndex = filteredGroups.findIndex((item) => String(item._id) === String(group._id));
    setGroupListIndex(selectedIndex >= 0 ? selectedIndex : 0);

    if (focusNotes && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  };

  const handleGroupInputChange = (e) => {
    const value = e.target.value;
    setGroupQuery(value);

    const exactGroup = findExactGroup(value);
    if (exactGroup) {
      setFormData((prev) => ({
        ...prev,
        group: exactGroup._id
      }));
      const exactIndex = getMatchingGroups(value).findIndex((group) => String(group._id) === String(exactGroup._id));
      setGroupListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matchingGroups = getMatchingGroups(value);
    const defaultGroup = matchingGroups[0] || null;
    setFormData((prev) => ({
      ...prev,
      group: defaultGroup?._id || ''
    }));
    setGroupListIndex(defaultGroup ? 0 : -1);
  };

  const handleGroupInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredGroups.length === 0) return;
      setGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredGroups.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredGroups.length === 0) return;
      setGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeGroup = groupListIndex >= 0 ? filteredGroups[groupListIndex] : null;
      const matchedGroup = activeGroup || findExactGroup(groupQuery) || findBestGroupMatch(groupQuery);
      if (matchedGroup) {
        selectGroup(matchedGroup, true);
        return;
      }

      if (mobileInputRef.current) {
        mobileInputRef.current.focus();
      }
      return;
    }
  };

  const resolveGroupNameById = (groupId) => {
    const resolvedId = typeof groupId === 'object' ? groupId?._id : groupId;
    if (!resolvedId) return '';
    const matching = groups.find((group) => String(group._id) === String(resolvedId));
    return matching?.name || '';
  };

  const handleEdit = (leadger) => {
    const normalizedGroupId = typeof leadger.group === 'object'
      ? leadger.group?._id || ''
      : (leadger.group || '');
    const resolvedGroupName = leadger.group?.name || resolveGroupNameById(normalizedGroupId) || '';
    const matchedIndex = resolvedGroupName
      ? getMatchingGroups(resolvedGroupName).findIndex((group) => String(group._id) === String(normalizedGroupId))
      : -1;

    setEditingId(leadger._id);
    setFormData({
      group: normalizedGroupId,
      name: String(leadger.name || ''),
      mobile: String(leadger.mobile || '').replace(/\D/g, '').slice(0, 10),
      email: String(leadger.email || ''),
      address: String(leadger.address || ''),
      state: String(leadger.state || ''),
      pincode: String(leadger.pincode || '').replace(/\D/g, '').slice(0, 6),
      notes: String(leadger.notes || '')
    });
    setGroupQuery(resolvedGroupName);
    setGroupListIndex(matchedIndex >= 0 ? matchedIndex : 0);
    setIsGroupSectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !String(formData.name).trim()) {
      setError('Leadger name is required');
      return;
    }
    const matchedGroup = findExactGroup(groupQuery) || findBestGroupMatch(groupQuery);
    const selectedGroupId = formData.group || matchedGroup?._id || '';
    if (!selectedGroupId) {
      setError('Group is required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        group: selectedGroupId,
        name: String(formData.name || '').trim(),
        mobile: String(formData.mobile || '').trim(),
        email: String(formData.email || '').trim(),
        address: String(formData.address || '').trim(),
        state: String(formData.state || '').trim(),
        pincode: String(formData.pincode || '').trim(),
        notes: formData.notes
      };

      if (editingId) {
        await apiClient.put(`/leadgers/${editingId}`, payload);
      } else {
        await apiClient.post('/leadgers', payload);
      }

      handleCloseForm();
      fetchLeadgers();
      setError('');
      toast.success(
        editingId ? 'Leadger updated successfully' : 'Leadger created successfully',
        TOAST_OPTIONS
      );
    } catch (err) {
      setError(err.message || (editingId ? 'Error updating leadger voucher' : 'Error creating leadger voucher'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-[#f8f6f1] min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Leadger/Account Voucher Count</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{leadgers.length}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search leadger vouchers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleOpenForm}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Leadger/Account Voucher
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-stretch justify-start p-0" onClick={handleCloseForm}>
          <div
            className="bg-white h-full w-full md:w-[75vw] overflow-hidden flex flex-col shadow-2xl rounded-none md:rounded-r-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 md:p-3 text-white flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-white/15 flex items-center justify-center text-white">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold">{editingId ? 'Edit Ledger Account' : 'Add New Ledger Account'}</h2>
                    <p className="text-blue-100 text-xs md:text-sm mt-1">Create or update account details in a clean accounting format.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 md:p-2 transition"
                  aria-label="Close popup"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form
              id="ledger-form"
              onSubmit={handleSubmit}
              onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-3 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.2fr)] gap-3 md:gap-6 items-stretch">
                  <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-220px)] bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-3 md:p-6">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                      <span className="bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</span>
                      Ledger Details
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-name-input" className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                          Ledger Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="ledger-name-input"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={getInlineFieldClass('indigo')}
                          placeholder="Enter ledger name"
                          autoFocus
                          required
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-group-input" className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                          Under Group <span className="text-red-500">*</span>
                        </label>
                        <div
                          ref={groupSectionRef}
                          className="relative flex-1 min-w-0"
                          onFocusCapture={() => setIsGroupSectionActive(true)}
                          onBlurCapture={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              groupSectionRef.current
                              && nextFocused instanceof Node
                              && groupSectionRef.current.contains(nextFocused)
                            ) {
                              return;
                            }
                            setIsGroupSectionActive(false);
                          }}
                        >
                          <input
                            id="ledger-group-input"
                          type="text"
                          value={groupQuery}
                          onChange={handleGroupInputChange}
                          onKeyDown={handleGroupInputKeyDown}
                          className={getInlineFieldClass('indigo')}
                          placeholder="Select or type group..."
                        />

                          {isGroupSectionActive && (
                            <div className="absolute left-0 top-full mt-1 w-full z-50">
                              <div className="rounded-lg border border-indigo-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-56">
                                <div className="px-3 py-1.5 text-xs font-semibold uppercase text-indigo-700 bg-indigo-50 border-b border-indigo-100">
                                  Select Group
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                  {filteredGroups.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500">No matching groups found</div>
                                  ) : (
                                    filteredGroups.map((group, index) => {
                                      const isActive = index === groupListIndex;
                                      const isSelected = String(formData.group || '') === String(group._id);
                                      return (
                                        <button
                                          key={group._id}
                                          type="button"
                                          onMouseDown={(event) => event.preventDefault()}
                                          onClick={() => selectGroup(group, true)}
                                          className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 transition ${
                                            isActive
                                              ? 'bg-indigo-100 border-l-4 border-l-indigo-600 text-indigo-800'
                                              : isSelected
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'hover:bg-indigo-50 text-gray-700'
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
                    </div>
                  </div>

                  <div className="hidden lg:block h-full w-px bg-slate-300" aria-hidden="true"></div>

                  <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-220px)] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-3 md:p-6">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                      <span className="bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</span>
                      Contact Details
                    </h3>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-mobile-input" className="w-40 shrink-0 mb-0 inline-flex items-baseline gap-1 text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <span>Mobile Number</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-500">(Optional)</span>
                        </label>
                        <input
                          id="ledger-mobile-input"
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          ref={mobileInputRef}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          className={getInlineFieldClass('emerald')}
                          placeholder="10-digit mobile number"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-email-input" className="w-40 shrink-0 mb-0 inline-flex items-baseline gap-1 text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <span>Email Address</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-500">(Optional)</span>
                        </label>
                        <input
                          id="ledger-email-input"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={getInlineFieldClass('emerald')}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-state-input" className="w-40 shrink-0 mb-0 inline-flex items-baseline gap-1 text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <span>State</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-500">(Optional)</span>
                        </label>
                        <input
                          id="ledger-state-input"
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={getInlineFieldClass('emerald')}
                          placeholder="Enter state"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-pincode-input" className="w-40 shrink-0 mb-0 inline-flex items-baseline gap-1 text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <span>Pincode</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-500">(Optional)</span>
                        </label>
                        <input
                          id="ledger-pincode-input"
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          className={getInlineFieldClass('emerald')}
                          placeholder="6-digit pincode"
                        />
                      </div>

                      <div className="flex items-start gap-3">
                        <label htmlFor="ledger-address-input" className="w-40 shrink-0 mt-2 mb-0 inline-flex items-baseline gap-1 text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <span>Address</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-500">(Optional)</span>
                        </label>
                        <textarea
                          id="ledger-address-input"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className={getInlineTextareaClass('emerald')}
                          placeholder="Enter full address"
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label htmlFor="ledger-notes-input" className="w-40 shrink-0 mb-0 inline-flex items-baseline gap-1 text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <span>Remarks / Notes</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-500">(Optional)</span>
                        </label>
                        <input
                          id="ledger-notes-input"
                          type="text"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          className={getInlineFieldClass('emerald')}
                          placeholder="Optional remarks"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0">
                <div className="text-xs md:text-sm text-gray-600">
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close
                </div>

                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="ledger-form"
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
                        {editingId ? 'Update Ledger' : 'Save Ledger'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Leadger Name</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Group</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Notes</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leadgers.map((item) => (
                <tr key={item._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-700">{item.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{item.group?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{item.notes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && leadgers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
                    No leadger vouchers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

