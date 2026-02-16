import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1.2" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 3 4.5 6.8v10.4L12 21l7.5-3.8V6.8L12 3Z" />
      <path d="M4.5 6.8 12 10.7l7.5-3.9M12 10.7V21" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
    </svg>
  );
}

function PartyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M3.5 19c.6-2.6 2.7-4 4.5-4s3.9 1.4 4.5 4M12.5 19c.4-1.9 1.8-3.1 3.5-3.1 1.6 0 2.9 1.2 3.5 3.1" />
    </svg>
  );
}

function PurchaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3.5 5h2l2.3 10.2A2 2 0 0 0 9.8 17h7.9a2 2 0 0 0 2-1.6L21 8H7.1" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M13 5h6M16 2v6" />
    </svg>
  );
}

function SaleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3.5" y="4" width="17" height="16.5" rx="2" />
      <path d="M7.5 9h9M7.5 13h9M7.5 17h5" />
      <path d="M16 2.5v3M8 2.5v3" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M7 12h11M13 8l5 4-5 4" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 3.5h12v17l-2.2-1.6L13.6 21l-2.1-2.1L9.4 21 7.2 18.9 5 20.5v-17Z" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5H13" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 20V4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5V20" />
      <path d="M7.5 16.5 11 13l2.2 2.2 3.3-3.7" />
      <path d="M7.5 8.5h9" />
    </svg>
  );
}

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', Icon: DashboardIcon },
  { name: 'Products', path: '/products', Icon: ProductIcon },
  { name: 'Categories', path: '/categories', Icon: CategoryIcon },
  { name: 'Parties', path: '/parties', Icon: PartyIcon },
  { name: 'Purchase', path: '/purchases', Icon: PurchaseIcon },
  { name: 'Sale', path: '/sales', Icon: SaleIcon },
  { name: 'Payment', path: '/payments', Icon: PaymentIcon },
  { name: 'Receipt', path: '/receipts', Icon: ReceiptIcon },
  { name: 'Reports', path: '/reports', Icon: ReportIcon }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <div className="relative flex h-full items-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                BH
              </span>
              <p className="text-base font-semibold tracking-wide text-slate-900">BillHub</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700"
            aria-label="Open navigation menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-r border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-2xl shadow-slate-950/40 transition-transform duration-300 md:z-40 md:w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-3">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden" onClick={() => setMobileOpen(false)}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-900/40">
              BH
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-wide text-white">BillHub</p>
              <p className="text-xs text-slate-400">Business Console</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 transition hover:border-slate-500 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Navigation
          </p>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.Icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition ${
                    active
                      ? 'bg-gradient-to-r from-blue-600/90 to-cyan-500/80 text-white shadow-lg shadow-blue-950/40'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  {active && <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-white/90" />}
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    active
                      ? 'border-white/25 bg-white/10'
                      : 'border-slate-700 bg-slate-800/90 text-slate-200 group-hover:border-slate-500'
                  }`}>
                    <Icon />
                  </span>
                  <span className="truncate text-sm font-medium tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>
    </>
  );
}
