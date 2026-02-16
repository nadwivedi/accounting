import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-1">Manage account actions</p>
      </div>

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">User Account</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p><span className="font-medium text-slate-700">Name:</span> {user?.firstName} {user?.lastName}</p>
          <p><span className="font-medium text-slate-700">Email:</span> {user?.email || '-'}</p>
          <p><span className="font-medium text-slate-700">Phone:</span> {user?.phone || '-'}</p>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
