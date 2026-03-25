import { Menu } from 'lucide-react';

export default function Navbar({ sections = [], activeSection = '', onSectionSelect = null, onMenuClick = null }) {
  return (
    <div className="sticky top-0 z-30 w-full border-b border-white/20 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.18)] backdrop-blur-md sm:px-6 xl:px-5 xl:py-2.5 2xl:px-6 2xl:py-3">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:max-w-[72rem]">
        <div className="relative flex items-center justify-center gap-3 sm:justify-start">
          <button
            type="button"
            onClick={() => onMenuClick?.()}
            className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 sm:h-9 sm:w-9 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9">
              <svg className="h-4 w-4 text-white sm:h-5 sm:w-5 xl:h-4 xl:w-4 2xl:h-5 2xl:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-bold tracking-[0.16em] text-slate-800 sm:text-[15px] sm:tracking-[0.18em] xl:text-[13px] 2xl:text-[15px]">BILLHUB</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:gap-1.5 2xl:gap-2">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => onSectionSelect?.(section)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:py-2 sm:text-[12px] sm:tracking-[0.14em] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:px-4 2xl:py-2 2xl:text-[12px] ${
                activeSection === section
                  ? 'bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.22)]'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
