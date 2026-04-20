import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { name: 'Party Ledger', path: '/party-ledger', colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', activeClass: 'border-emerald-300 bg-emerald-100 text-emerald-800' },
  { name: 'Stock Ledger', path: '/reports/stock-ledger', colorClass: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100', activeClass: 'border-sky-300 bg-sky-100 text-sky-800' },
  { name: 'Sales Report', path: '/reports/sales-report', colorClass: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100', activeClass: 'border-violet-300 bg-violet-100 text-violet-800' },
  { name: 'Purchase Report', path: '/reports/purchase-report', colorClass: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100', activeClass: 'border-amber-300 bg-amber-100 text-amber-800' },
  { name: 'Payment Report', path: '/reports/payment-report', colorClass: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100', activeClass: 'border-rose-300 bg-rose-100 text-rose-800' },
  { name: 'Money Received', path: '/reports/receipt-report', colorClass: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100', activeClass: 'border-cyan-300 bg-cyan-100 text-cyan-800' },
  { name: 'Expense Report', path: '/reports/expense-report', colorClass: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100', activeClass: 'border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800' },
  { name: 'Day Book', path: '/day-book', colorClass: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100', activeClass: 'border-amber-300 bg-amber-100 text-amber-800' }
];

export default function Navbar({ sections = [], activeSection = '', onSectionSelect = null, onMenuClick = null }) {
  const location = useLocation();
  return (
    <div className="sticky top-0 z-30 w-full border-b border-white/20 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.18)] backdrop-blur-md sm:px-6 xl:px-5 xl:py-2.5 2xl:px-6 2xl:py-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex items-center justify-center gap-3 sm:justify-start">
          <button
            type="button"
            onClick={() => onMenuClick?.()}
            className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 pl-10 lg:pl-0 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-[65vw] lg:max-w-[70vw]">
            {NAV_LINKS.map(link => {
              const isActive = location.pathname.startsWith(link.path) && location.pathname !== '/';
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition sm:text-xs ${
                    isActive ? link.activeClass : link.colorClass
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:gap-1.5 2xl:gap-2">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => onSectionSelect?.(section)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:py-2 sm:text-[12px] sm:tracking-[0.14em] xl:px-3 xl:py-1.5 xl:text-[11px] 2xl:px-4 2xl:py-2 2xl:text-[12px] ${activeSection === section
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
