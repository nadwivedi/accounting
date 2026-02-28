import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

function UnitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
      <path d="M4 7.5V16.5L12 21l8-4.5V7.5" />
      <path d="M12 12v9" />
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

function MasterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function VoucherIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13Z" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </svg>
  );
}

function LeadgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 3.5h12v17l-2.2-1.6L13.6 21l-2.1-2.1L9.4 21 7.2 18.9 5 20.5v-17Z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h5" />
    </svg>
  );
}

function ContraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 7h12M6 17h12" />
      <path d="m9 4-3 3 3 3M15 14l3 3-3 3" />
    </svg>
  );
}

function SaleReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M20 8H7" />
      <path d="m11 4-4 4 4 4" />
      <path d="M4 16h13" />
      <path d="m13 12 4 4-4 4" />
    </svg>
  );
}

function PurchaseReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 8h13" />
      <path d="m11 4 4 4-4 4" />
      <path d="M20 16H7" />
      <path d="m13 12-4 4 4 4" />
    </svg>
  );
}

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', Icon: DashboardIcon },
  {
    name: 'Masters',
    Icon: MasterIcon,
    subItems: [
      { name: 'Group', path: '/groups', Icon: MasterIcon },
      { name: 'Leadger/Account', path: '/leadger', Icon: LeadgerIcon },
      { name: 'Stock Item', path: '/stock', Icon: ProductIcon, dividerBefore: true },
      { name: 'Stock Group', path: '/stock-groups', Icon: StockGroupIcon },
      { name: 'Unit', path: '/units', Icon: UnitIcon }
    ]
  },
  {
    name: 'Vouchers',
    Icon: VoucherIcon,
    subItems: [
      { name: 'Sale', path: '/sales', Icon: SaleIcon },
      { name: 'Purchase', path: '/purchases', Icon: PurchaseIcon },
      { name: 'Sale Return', path: '/sale-return', Icon: SaleReturnIcon },
      { name: 'Purchase Return', path: '/purchase-return', Icon: PurchaseReturnIcon },
      { name: 'Stock Adjustment', path: '/stock-adjustment', Icon: StockAdjustmentIcon },
      { name: 'Payment', path: '/payments', Icon: PaymentIcon },
      { name: 'Receipt', path: '/receipts', Icon: ReceiptIcon },
      { name: 'Contra', path: '/contra', Icon: ContraIcon }
    ]
  },
  { name: 'Reports', path: '/reports', Icon: ReportIcon },
  { name: 'Settings', path: '/settings', Icon: SettingsIcon }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    Masters: true,
    Vouchers: false
  });
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (!path) return false;
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  const isItemOrSubItemActive = (item) => {
    if (item.path && isActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isActive(sub.path));
    }
    return false;
  };

  const setExclusiveMenu = (menuName, shouldOpen = true) => {
    setExpandedMenus((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        next[key] = false;
      });
      next[menuName] = shouldOpen;
      return next;
    });
  };

  useEffect(() => {
    const mastersItem = menuItems.find((item) => item.name === 'Masters');
    const vouchersItem = menuItems.find((item) => item.name === 'Vouchers');

    const mastersActive = Boolean(mastersItem && isItemOrSubItemActive(mastersItem));
    const vouchersActive = Boolean(vouchersItem && isItemOrSubItemActive(vouchersItem));

    if (mastersActive) {
      setExpandedMenus({ Masters: true, Vouchers: false });
    } else if (vouchersActive) {
      setExpandedMenus({ Masters: false, Vouchers: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    const isTypingTarget = (target) => {
      const tagName = target?.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
    };

    const isPopupOpen = () => Boolean(document.querySelector('.fixed.inset-0.z-50'));

    const triggerNewAction = () => {
      const visibleButtons = Array.from(document.querySelectorAll('button')).filter(
        (button) => !button.disabled && button.offsetParent !== null
      );

      const patterns = [
        /^\s*\+\s*add\b/i,
        /^\s*\+\s*new\b/i,
        /^\s*new\b/i
      ];

      for (const pattern of patterns) {
        const match = visibleButtons.find((button) => pattern.test((button.textContent || '').trim()));
        if (match) {
          match.click();
          return true;
        }
      }

      return false;
    };

    const closeActivePopup = () => {
      const closeButton = document.querySelector('.fixed.inset-0.z-50 button[aria-label="Close popup"]');
      if (closeButton instanceof HTMLButtonElement) {
        closeButton.click();
        return true;
      }
      return false;
    };

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      const isAltN = event.altKey && !event.ctrlKey && !event.metaKey && key === 'n';
      const isMoveDownKey = key === 'control' && !event.altKey && !event.metaKey;
      const isMoveUpKey = key === 'shift' && !event.altKey && !event.metaKey && !event.ctrlKey;

      if (event.defaultPrevented || event.metaKey) return;

      if (key === 'escape' && isPopupOpen()) {
        event.preventDefault();
        closeActivePopup();
        return;
      }

      if (isAltN) {
        if (isPopupOpen()) return;
        if (isTypingTarget(event.target)) return;
        event.preventDefault();
        triggerNewAction();
        return;
      }

      if (event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (isPopupOpen()) return;

      const mastersMenu = menuItems.find((item) => item.name === 'Masters');
      const masterSubItems = (mastersMenu?.subItems || []).filter((subItem) => Boolean(subItem.path));
      const vouchersMenu = menuItems.find((item) => item.name === 'Vouchers');
      const voucherSubItems = (vouchersMenu?.subItems || []).filter((subItem) => Boolean(subItem.path));

      if ((isMoveDownKey || isMoveUpKey) && (masterSubItems.length > 0 || voucherSubItems.length > 0)) {
        const currentMasterIndex = masterSubItems.findIndex((subItem) => isActive(subItem.path));
        const currentVoucherIndex = voucherSubItems.findIndex((subItem) => isActive(subItem.path));

        if (currentMasterIndex !== -1 || currentVoucherIndex !== -1) {
          event.preventDefault();
          if (window.innerWidth < 768) setMobileOpen(true);

          const move = isMoveDownKey ? 1 : -1;
          if (currentMasterIndex !== -1) {
            setExpandedMenus({ Masters: true, Vouchers: false });
            const nextIndex = (currentMasterIndex + move + masterSubItems.length) % masterSubItems.length;
            navigate(masterSubItems[nextIndex].path);
          } else {
            setExpandedMenus({ Masters: false, Vouchers: true });
            const nextIndex = (currentVoucherIndex + move + voucherSubItems.length) % voucherSubItems.length;
            navigate(voucherSubItems[nextIndex].path);
          }
          return;
        }
      }

      if (event.ctrlKey) return;

      if (key === 'v') {
        event.preventDefault();
        setExpandedMenus({ Masters: false, Vouchers: true });
        if (window.innerWidth < 768) setMobileOpen(true);
        navigate('/sales');
      } else if (key === 'm') {
        event.preventDefault();
        setExpandedMenus({ Masters: true, Vouchers: false });
        if (window.innerWidth < 768) setMobileOpen(true);
        navigate('/groups');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 h-[60px] border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl md:hidden">
        <div className="relative flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-sm shadow-indigo-200">
              <span className="text-sm font-bold tracking-wider text-white">BH</span>
            </div>
            <p className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">BillHub</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="group relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-100 hover:text-slate-900"
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] max-w-[85vw] flex-col border-r border-slate-200/80 bg-slate-50/50 backdrop-blur-2xl shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] md:z-40 md:w-[17.5rem] md:bg-white md:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Inside Border Highlight */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white to-transparent opacity-50" />

        {/* Sidebar Header / Logo */}
        <div className="relative z-10 flex h-[84px] items-center justify-between px-5 pt-2">
          <Link to="/dashboard" className="group flex items-center gap-3.5" onClick={() => setMobileOpen(false)}>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 shadow-md shadow-indigo-200 transition-transform duration-300 group-hover:scale-[1.05]">
              <span className="text-[15px] font-bold tracking-widest text-white drop-shadow-sm">BH</span>
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
            </div>
            <div className="flex flex-col">
              <p className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-[17px] font-bold tracking-tight text-transparent">
                BillHub
              </p>
              <p className="text-[11px] font-bold tracking-[0.05em] text-indigo-500/80 uppercase">
                Business Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 md:hidden shadow-sm"
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Overview Menu
            </p>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const hasSubItems = Boolean(item.subItems?.length);
              const active = item.path ? isActive(item.path) : false;
              const groupActive = hasSubItems ? isItemOrSubItemActive(item) : active;
              const isExpanded = hasSubItems ? Boolean(expandedMenus[item.name]) : false;
              const Icon = item.Icon;

              return (
                <div key={item.name} className="flex flex-col">
                  {hasSubItems ? (
                    <button
                      type="button"
                      onClick={() => setExclusiveMenu(item.name, !isExpanded)}
                      className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-left outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-indigo-500 ${groupActive
                          ? 'bg-indigo-50/50 text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      {groupActive && (
                        <div className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                      )}

                      <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${groupActive
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'bg-white text-slate-400 ring-1 ring-inset ring-slate-200 group-hover:text-indigo-500 group-hover:shadow-sm'
                        }`}>
                        <div className="transition-transform duration-300 group-hover:scale-110">
                          <Icon />
                        </div>
                      </div>

                      <span className={`text-[14px] font-medium tracking-wide transition-colors duration-300 ${groupActive ? 'font-semibold text-slate-900' : 'group-hover:text-slate-900'
                        }`}>
                        {item.name === 'Vouchers' ? (
                          <>
                            <span className={`font-bold ${groupActive ? 'text-indigo-700' : 'text-blue-600'}`}>V</span>
                            ouchers
                          </>
                        ) : item.name === 'Masters' ? (
                          <>
                            <span className={`font-bold ${groupActive ? 'text-indigo-700' : 'text-blue-600'}`}>M</span>
                            asters
                          </>
                        ) : item.name}
                      </span>

                      {item.name === 'Vouchers' && (
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${groupActive
                              ? 'border-indigo-200 bg-white text-indigo-700'
                              : 'border-slate-300 bg-white text-slate-500 group-hover:border-indigo-200 group-hover:text-indigo-600'
                            }`}
                        >
                          V
                        </span>
                      )}

                      {item.name === 'Masters' && (
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${groupActive
                              ? 'border-indigo-200 bg-white text-indigo-700'
                              : 'border-slate-300 bg-white text-slate-500 group-hover:border-indigo-200 group-hover:text-indigo-600'
                            }`}
                        >
                          M
                        </span>
                      )}

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) setMobileOpen(false);
                      }}
                      className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-indigo-500 ${active
                          ? 'bg-indigo-50/50 text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
                      )}

                      <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${active
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'bg-white text-slate-400 ring-1 ring-inset ring-slate-200 group-hover:text-indigo-500 group-hover:shadow-sm'
                        }`}>
                        <div className="transition-transform duration-300 group-hover:scale-110">
                          <Icon />
                        </div>
                      </div>

                      <span className={`text-[14px] font-medium tracking-wide transition-colors duration-300 ${active ? 'font-semibold text-slate-900' : 'group-hover:text-slate-900'
                        }`}>
                        {item.name}
                      </span>
                    </Link>
                  )}

                  {hasSubItems && isExpanded && (
                    <div className="mt-1 flex flex-col gap-1 overflow-hidden pb-1 pl-[3.25rem]">
                      {item.subItems.map((subItem) => {
                        const subActive = isActive(subItem.path);
                        const SubIcon = subItem.Icon;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => {
                              if (window.innerWidth < 768) setMobileOpen(false);
                            }}
                            className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ${subItem.dividerBefore ? 'mt-2 border-t border-slate-200 pt-3' : ''} ${subActive
                                ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-100/50'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                          >
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center ${subActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                              <div className="scale-75">
                                <SubIcon />
                              </div>
                            </div>
                            <span className="text-[13px] tracking-wide">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
