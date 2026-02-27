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

function StockGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
    </svg>
  );
}

function StockAdjustmentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 3v18M3 12h18" />
      <path d="M7 7h10v10H7z" />
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.2 12a7.2 7.2 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-2.1-1.2l-.4-2.6h-4l-.4 2.6a7.5 7.5 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5a7.2 7.2 0 0 0 0 2.4l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 0 0 2.1 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2.1-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />
    </svg>
  );
}

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', Icon: DashboardIcon },
  { name: 'Stock Item', path: '/stock', Icon: ProductIcon },
  { name: 'Stock Group', path: '/stock-groups', Icon: StockGroupIcon },
  { name: 'Stock Adjustment', path: '/stock-adjustments', Icon: StockAdjustmentIcon },
  { name: 'Parties', path: '/parties', Icon: PartyIcon },
  { name: 'Purchase', path: '/purchases', Icon: PurchaseIcon },
  { name: 'Sale', path: '/sales', Icon: SaleIcon },
  { name: 'Payment', path: '/payments', Icon: PaymentIcon },
  { name: 'Receipt', path: '/receipts', Icon: ReceiptIcon },
  { name: 'Reports', path: '/reports', Icon: ReportIcon },
  { name: 'Settings', path: '/settings', Icon: SettingsIcon }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 h-[60px] border-b border-white/5 bg-[#0A0D14]/80 px-4 backdrop-blur-xl md:hidden">
        <div className="relative flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <span className="text-sm font-bold tracking-wider text-white">BH</span>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
            </div>
            <p className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">BillHub</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="group relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Open navigation menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 transition-transform group-hover:scale-110">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] max-w-[85vw] flex-col border-r border-white/5 bg-[#0A0D14] shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] md:z-40 md:w-[17.5rem] ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Decorative ambient background glows */}
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-[80px]" />

        {/* Inside Border Highlight */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />

        {/* Sidebar Header / Logo */}
        <div className="relative z-10 flex h-[84px] items-center justify-between px-5 pt-2">
          <Link to="/dashboard" className="group flex items-center gap-3.5" onClick={() => setMobileOpen(false)}>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform duration-300 group-hover:scale-[1.05] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
              <span className="text-[15px] font-bold tracking-widest text-white drop-shadow-md">BH</span>
              <div className="absolute inset-0 rounded-xl bg-white/[0.08] mix-blend-overlay"></div>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
            </div>
            <div className="flex flex-col">
              <p className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-[17px] font-bold tracking-tight text-transparent">
                BillHub
              </p>
              <p className="text-[11px] font-medium tracking-[0.05em] text-indigo-400/80 uppercase">
                Business Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="relative z-10 mt-4 flex-1 overflow-y-auto px-4 pb-8 scrollbar-hide">
          <div className="mb-4 ml-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/70">
              Overview Menu
            </p>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.Icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-indigo-500 ${active
                      ? 'bg-gradient-to-r from-indigo-500/15 to-transparent text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                >
                  {/* Active Indicator Line */}
                  {active && (
                    <div className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                  )}

                  {/* Icon Container */}
                  <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${active
                      ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white'
                      : 'bg-[#131824] text-slate-400 ring-1 ring-inset ring-white/5 group-hover:bg-[#1A2030] group-hover:text-indigo-300'
                    }`}>
                    {/* Subtle inner glowing stroke on active */}
                    {active && <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20"></div>}
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      <Icon />
                    </div>
                  </div>

                  {/* Item Label text */}
                  <span className={`text-[14px] font-medium tracking-wide transition-colors duration-300 ${active ? 'font-semibold text-white' : 'group-hover:text-white'
                    }`}>
                    {item.name}
                  </span>

                  {/* Hover background slide-in effect */}
                  {!active && (
                    <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
