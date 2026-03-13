import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function ReportsPlaceholder({ title, description }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.12),transparent_20%),linear-gradient(180deg,#0f172a_0%,#111827_48%,#020617_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/15 bg-white/10 shadow-[0_36px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="border-b border-white/10 bg-white/10 px-6 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-white">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-300">{description}</p>
          </div>

          <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.97)_100%)] px-6 py-8 text-center">
            <p className="text-base font-semibold text-slate-800">This report page is not built yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              The option is now available in Reports, and the detailed report screen can be added next.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/reports"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back To Reports
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
