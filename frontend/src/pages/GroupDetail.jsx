import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../utils/api';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const getGroupTypeLabel = (groupName) => {
  const normalized = String(groupName || '').toLowerCase();
  if (normalized.includes('customer')) return 'Customer';
  if (normalized.includes('supplier')) return 'Supplier';
  return 'Leadger';
};

export default function GroupDetail() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [leadgers, setLeadgers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const groupTypeLabel = useMemo(() => getGroupTypeLabel(group?.name), [group?.name]);

  const fetchGroupDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [groupResponse, leadgersResponse] = await Promise.all([
        apiClient.get(`/groups/${id}`),
        apiClient.get('/leadgers', {
          params: {
            group: id,
            search: search || undefined
          }
        })
      ]);

      setGroup(groupResponse.data || null);
      setLeadgers(leadgersResponse.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching group details');
      setGroup(null);
      setLeadgers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetail();
  }, [id, search]);

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-4">
        <Link to="/groups" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          Back to Groups
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {group?.name || 'Group Detail'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {groupTypeLabel} accounts under selected group
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500">Group</p>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{group?.name || '-'}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-blue-700">Total {groupTypeLabel}</p>
          <p className="text-xl md:text-2xl font-bold text-blue-900 mt-1">{leadgers.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500">Status</p>
          <p className="text-xl md:text-2xl font-bold mt-1">
            {group?.isActive ? (
              <span className="text-green-700">Active</span>
            ) : (
              <span className="text-red-700">Inactive</span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder={`Search ${groupTypeLabel.toLowerCase()} by name or notes...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : leadgers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No {groupTypeLabel.toLowerCase()} found in this group.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Group</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Notes</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {leadgers.map((leadger) => (
                <tr key={leadger._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{leadger.name || '-'}</td>
                  <td className="px-6 py-3 text-gray-600">{leadger.group?.name || group?.name || '-'}</td>
                  <td className="px-6 py-3 text-gray-600">{leadger.notes || '-'}</td>
                  <td className="px-6 py-3 text-gray-600">{formatDate(leadger.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
