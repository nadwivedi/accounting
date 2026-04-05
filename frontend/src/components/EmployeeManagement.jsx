import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { toast } from 'react-toastify';
import { Shield, Plus, Edit2, Trash2, Key, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    historyLimitDays: 7,
    permissions: { view: true, add: false, edit: false },
    isActive: true
  });

  const fetchEmployees = async () => {
    if (user?.role === 'employee') return; // Employees can't fetch this list
    setLoading(true);
    try {
      const response = await apiClient.get('/employees');
      setEmployees(response.data || []);
    } catch (e) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      password: '',
      historyLimitDays: 7,
      permissions: { view: true, add: false, edit: false },
      isActive: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (emp) => {
    setFormData({
      name: emp.name,
      mobile: emp.mobile,
      password: '', // blank password when editing
      historyLimitDays: emp.historyLimitDays,
      permissions: emp.permissions || { view: true, add: false, edit: false },
      isActive: emp.isActive
    });
    setEditingId(emp._id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      try {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty pass
        
        await apiClient.put(`/employees/${editingId}`, payload);
        toast.success("Employee updated!");
        fetchEmployees();
        resetForm();
      } catch (e) { toast.error(e?.message || "Update failed"); }
    } else {
      if (!formData.password) { toast.error('Password required for new employee'); return;}
      try {
        await apiClient.post('/employees', formData);
        toast.success("Employee added!");
        fetchEmployees();
        resetForm();
      } catch (e) { toast.error(e?.message || "Failed to add"); }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await apiClient.delete(`/employees/${id}`);
      toast.success("Employee removed");
      fetchEmployees();
    } catch (e) { toast.error(e?.message || "Failed to delete"); }
  };

  if (user?.role === 'employee') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Shield className="w-5 h-5 text-indigo-500" /> Your Access Profile
        </h3>
        <p className="text-sm text-slate-600 mb-4">You are logged in as a staff member. Below are your granted permissions.</p>
        
        <div className="space-y-4 max-w-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500 font-medium">History View</span>
            <span className="text-sm font-semibold text-slate-800">
              {user.historyLimitDays === 'all' ? 'Unlimited' : `Last ${user.historyLimitDays} Days`}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
             <span className="text-sm text-slate-500 font-medium">Add Records</span>
             {user.permissions?.add ? <Check className="w-4 h-4 text-green-500"/> : <X className="w-4 h-4 text-red-500"/>}
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
             <span className="text-sm text-slate-500 font-medium">Edit Records</span>
             {user.permissions?.edit ? <Check className="w-4 h-4 text-green-500"/> : <X className="w-4 h-4 text-red-500"/>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative w-full mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Shield className="w-5 h-5 text-indigo-500" /> Staff Access Controls
          </h3>
          <p className="text-xs text-slate-500 mt-1">Manage up to 5 employee logins, permissions, and history limits.</p>
        </div>
        {!isAdding && employees.length < 5 && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition">
            <Plus className="w-4 h-4"/> Add Staff
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-xl mb-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Name</label>
              <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Login ID</label>
              <input type="text" value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} required className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{editingId ? "Reset Password (Optional)" : "Password"}</label>
              <input type="text" placeholder="Min 6 chars" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Visible History Limit</label>
              <select value={formData.historyLimitDays} onChange={e=>setFormData({...formData, historyLimitDays: e.target.value === 'all' ? 'all' : Number(e.target.value)})} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value={7}>Last 7 Days (Default)</option>
                <option value={28}>Last 28 Days</option>
                <option value={90}>Last 3 Months</option>
                <option value={365}>Last 1 Year</option>
                <option value="all">Unlimited (All Data)</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-700 block mb-2">Access Rights</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg">
                <input type="checkbox" checked={formData.permissions.view} readOnly disabled className="w-4 h-4 accent-indigo-500" /> Read Only (Default)
              </label>
              <label className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input type="checkbox" checked={formData.permissions.add} onChange={e=>setFormData({...formData, permissions: {...formData.permissions, add: e.target.checked}})} className="w-4 h-4 accent-indigo-500" /> Create / Add
              </label>
              <label className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input type="checkbox" checked={formData.permissions.edit} onChange={e=>setFormData({...formData, permissions: {...formData.permissions, edit: e.target.checked}})} className="w-4 h-4 accent-indigo-500" /> Edit / Update
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition">{editingId ? 'Update Employee' : 'Save Employee'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading staff members...</div>
      ) : employees.length === 0 && !isAdding ? (
        <div className="text-center py-8 mt-2 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">No employees added yet.</div>
      ) : (
        <div className="space-y-3">
          {employees.map(emp => (
            <div key={emp._id} className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-xl border transition-all ${!emp.isActive ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">{emp.name}</h4>
                  {!emp.isActive && <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">REVOKED</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{emp.mobile}</span>
                  <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                    {emp.historyLimitDays === 'all' ? 'Unlimited View' : `${emp.historyLimitDays}d View`}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${emp.permissions?.view ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>VIEW</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${emp.permissions?.add ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>ADD</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${emp.permissions?.edit ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>EDIT</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                 <button onClick={() => {
                   const confirmRevoke = window.confirm(emp.isActive ? "Revoke access for this employee?" : "Restore access?");
                   if(confirmRevoke) {
                     apiClient.put(`/employees/${emp._id}`, { isActive: !emp.isActive }).then(fetchEmployees).catch(e => toast.error(e?.message));
                   }
                 }} className={`px-3 py-1.5 rounded-lg transition text-xs font-semibold ${emp.isActive ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}>
                   {emp.isActive ? 'Revoke' : 'Restore'}
                 </button>
                 <button onClick={() => handleEdit(emp)} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition" title="Edit Rights">
                   <Edit2 className="w-4 h-4"/>
                 </button>
                 <button onClick={() => handleDelete(emp._id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition" title="Delete">
                   <Trash2 className="w-4 h-4"/>
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
