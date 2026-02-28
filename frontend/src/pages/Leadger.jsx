import { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

const getInitialForm = () => ({
  group: '',
  name: '',
  notes: ''
});

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
  const notesInputRef = useRef(null);
  const groupSectionRef = useRef(null);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    const defaultGroup = groups[0] || null;
    setFormData({
      ...getInitialForm(),
      group: defaultGroup?._id || ''
    });
    setGroupQuery('');
    setGroupListIndex(defaultGroup ? 0 : -1);
    setIsGroupSectionActive(false);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
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

    if (focusNotes && notesInputRef.current) {
      notesInputRef.current.focus();
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

      if (notesInputRef.current) {
        notesInputRef.current.focus();
      }
      return;
    }
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
      await apiClient.post('/leadgers', {
        group: selectedGroupId,
        name: String(formData.name || '').trim(),
        notes: formData.notes
      });

      handleCloseForm();
      fetchLeadgers();
      setError('');
    } catch (err) {
      setError(err.message || 'Error creating leadger voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-slate-50 min-h-screen">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
          <div className="w-full md:w-[30%] max-h-[90vh] overflow-y-auto md:overflow-visible rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-600 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-100">Leadger/Account Voucher</h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="h-9 w-9 rounded-full border border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-300 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)} className="grid grid-cols-1 gap-4 p-6">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Leadger Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Enter leadger name"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Group *</label>
                <div
                  ref={groupSectionRef}
                  className="relative"
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
                    type="text"
                    value={groupQuery}
                    onChange={handleGroupInputChange}
                    onKeyDown={handleGroupInputKeyDown}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Type group, use Up/Down, press Enter"
                  />

                  {isGroupSectionActive && (
                    <div className="mt-2 md:mt-0 md:fixed md:right-4 md:top-20 md:bottom-6 w-full md:w-80 z-30">
                      <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 via-sky-50 to-white shadow-xl overflow-hidden md:h-full md:flex md:flex-col">
                        <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-white border-b border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600">
                          Group List
                        </div>
                        <div className="max-h-60 md:max-h-none md:flex-1 overflow-y-auto bg-white/80">
                          {filteredGroups.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500">No matching groups</div>
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
                                  className={`w-full text-left px-3 py-2 text-sm border-b border-slate-100 last:border-b-0 transition-colors ${
                                    isActive
                                      ? 'bg-blue-100 text-blue-800 font-semibold'
                                      : isSelected
                                        ? 'bg-emerald-100 text-emerald-800 font-medium'
                                        : 'hover:bg-indigo-50 text-slate-700'
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
                <label className="block text-sm text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  ref={notesInputRef}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Optional note"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Leadger/Account Voucher'}
                </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leadgers.map((item) => (
                <tr key={item._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-700">{item.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{item.group?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{item.notes || '-'}</td>
                </tr>
              ))}
              {!loading && leadgers.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
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
