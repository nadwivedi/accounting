import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HomeExpenseReportPanel from '../components/HomeExpenseReportPanel';

export default function ExpenseReport() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key?.toLowerCase() === 'escape') {
        const popup = document.querySelector('.fixed.inset-0.z-50');
        if (popup) return;
        event.preventDefault();
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.16),transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_48%,#020617_100%)] px-4 py-6 xl:px-4 xl:py-5 2xl:px-4 2xl:py-6">
      <div className="mx-auto max-w-7xl xl:max-w-[72rem] 2xl:max-w-7xl">
        <div className="overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-50 shadow-[0_28px_80px_rgba(15,23,42,0.28)] xl:rounded-[28px] 2xl:rounded-[32px]">
          <div className="border-b border-slate-200/80 bg-white/80 px-5 py-5 backdrop-blur-sm md:px-8 md:py-7 xl:px-6 xl:py-5 2xl:px-8 2xl:py-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Reports Page</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl xl:text-[1.7rem] 2xl:text-3xl">Expense Report</h1>
                <p className="mt-1 text-sm font-medium text-slate-600 xl:text-[13px] 2xl:text-sm">Review recent expense entries without opening the add expense form.</p>
              </div>

              <Link
                to="/reports"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 xl:px-3.5 xl:py-1.5 xl:text-[13px] 2xl:px-4 2xl:py-2 2xl:text-sm"
              >
                Back To Reports
              </Link>
            </div>
          </div>

          <div className="px-5 py-5 md:px-8 md:py-8 xl:px-6 xl:py-6 2xl:px-8 2xl:py-8">
            <HomeExpenseReportPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
