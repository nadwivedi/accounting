import { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddLeadgerPopup from './component/AddLeadgerPopup';

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
const toTitleCase = (value) => String(value || '')
  .toLowerCase()
  .replace(/\b[a-z]/g, (char) => char.toUpperCase());

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
    if (name === 'name') {
      setFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
      return;
    }
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
    setGroupListIndex(-1);
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
  const groupOptions = useMemo(
    () => (isGroupSectionActive ? groups : filteredGroups),
    [isGroupSectionActive, groups, filteredGroups]
  );

  useEffect(() => {
    if (groupOptions.length === 0) {
      setGroupListIndex(-1);
      return;
    }

    setGroupListIndex((prev) => {
      if (prev < 0) return isGroupSectionActive ? 0 : -1;
      if (prev >= groupOptions.length) return groupOptions.length - 1;
      return prev;
    });
  }, [groupOptions, isGroupSectionActive]);

  useEffect(() => {
    if (!showForm) return;
    if (formData.group) return;
    if (groups.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      group: groups[0]._id
    }));
    setGroupListIndex(-1);
  }, [showForm, groups, formData.group]);

  const selectGroup = (group, focusNotes = true) => {
    if (!group) return;
    setGroupQuery(group.name);
    setFormData((prev) => ({
      ...prev,
      group: group._id
    }));

    const selectedIndex = groups.findIndex((item) => String(item._id) === String(group._id));
    setGroupListIndex(selectedIndex >= 0 ? selectedIndex : -1);

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
      setGroupListIndex(groups.length > 0 ? 0 : -1);
      return;
    }

    const matchingGroups = getMatchingGroups(value);
    const defaultGroup = matchingGroups[0] || null;
    setFormData((prev) => ({
      ...prev,
      group: defaultGroup?._id || ''
    }));
    setGroupListIndex(groups.length > 0 ? 0 : -1);
  };

  const handleGroupInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (groupOptions.length === 0) return;
      setGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, groupOptions.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (groupOptions.length === 0) return;
      setGroupListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeGroup = groupListIndex >= 0 ? groupOptions[groupListIndex] : null;
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
    setGroupListIndex(-1);
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

      <AddLeadgerPopup
        showForm={showForm}
        editingId={editingId}
        loading={loading}
        formData={formData}
        groupQuery={groupQuery}
        groupListIndex={groupListIndex}
        isGroupSectionActive={isGroupSectionActive}
        groupOptions={groupOptions}
        groupSectionRef={groupSectionRef}
        mobileInputRef={mobileInputRef}
        handleCloseForm={handleCloseForm}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        handleGroupInputChange={handleGroupInputChange}
        handleGroupInputKeyDown={handleGroupInputKeyDown}
        setIsGroupSectionActive={setIsGroupSectionActive}
        setGroupListIndex={setGroupListIndex}
        selectGroup={selectGroup}
      />

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

