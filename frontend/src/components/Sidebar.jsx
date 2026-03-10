import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function AssetIcon({ src, alt = '' }) {
  return <img src={src} alt={alt} className="h-9 w-9 object-contain" />;
}

function ProductIcon() {
  return <AssetIcon src="/stock item_converted.avif" />;
}

function StockGroupIcon() {
  return <AssetIcon src="/stock group_converted.avif" />;
}

function StockAdjustmentIcon() {
  return <AssetIcon src="/sales_converted (1).avif" />;
}

function UnitIcon() {
  return <AssetIcon src="/units_converted.avif" />;
}

function PartyIcon() {
  return <AssetIcon src="/party_converted.avif" />;
}

function PurchaseIcon() {
  return <AssetIcon src="/purchase_converted.avif" />;
}

function SaleIcon() {
  return <AssetIcon src="/sales_converted.avif" />;
}

function PaymentIcon() {
  return <AssetIcon src="/payment_converted.avif" />;
}

function ReceiptIcon() {
  return <AssetIcon src="/reciept_converted.avif" />;
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M15 4v4h4" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function ExpenseGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
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

function SaleReturnIcon() {
  return <AssetIcon src="/sales return_converted.avif" />;
}

function PurchaseReturnIcon() {
  return <AssetIcon src="/purchase return_converted.avif" />;
}

const menuItems = [
  {
    name: 'Masters',
    Icon: MasterIcon,
    subItems: [
      { name: 'Manage Party', path: '/party', Icon: PartyIcon },
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
      { name: 'Receipt', path: '/receipts', Icon: ReceiptIcon }
    ]
  },
  {
    name: 'Expense',
    Icon: VoucherIcon,
    subItems: [
      { name: 'Expense', path: '/expenses', Icon: ExpenseIcon },
      { name: 'Expense Group', path: '/expense-groups', Icon: ExpenseGroupIcon }
    ]
  },
  { name: 'Reports', path: '/reports', Icon: ReportIcon },
  { name: 'Settings', path: '/settings', Icon: SettingsIcon }
];

const sectionStyles = {
  Masters: {
    headerClass: 'border-cyan-200/70 bg-cyan-50/95',
    accentTextClass: 'text-[28px] leading-none text-cyan-700',
    accentDotClass: 'h-2.5 w-2.5 rounded-full bg-cyan-500',
    label: 'MASTER',
    activeClass: 'bg-[linear-gradient(90deg,rgba(207,250,254,0.96),rgba(236,254,255,0.94))] text-slate-800',
    hoverClass: 'text-slate-700 hover:bg-cyan-50/90',
    barClass: 'bg-cyan-500'
  },
  Vouchers: {
    headerClass: 'border-amber-200/70 bg-amber-50/95',
    accentTextClass: 'text-[28px] leading-none text-amber-700',
    accentDotClass: 'h-2.5 w-2.5 rounded-full bg-amber-500',
    label: 'VOUCHERS',
    activeClass: 'bg-[linear-gradient(90deg,rgba(254,243,199,0.96),rgba(255,251,235,0.94))] text-slate-800',
    hoverClass: 'text-slate-700 hover:bg-amber-50/90',
    barClass: 'bg-amber-500'
  },
  Expense: {
    headerClass: 'border-emerald-200/70 bg-emerald-50/95',
    accentTextClass: 'text-[28px] leading-none text-emerald-700',
    accentDotClass: 'h-2.5 w-2.5 rounded-full bg-emerald-500',
    label: 'EXPENSE',
    activeClass: 'bg-[linear-gradient(90deg,rgba(209,250,229,0.96),rgba(236,253,245,0.94))] text-slate-800',
    hoverClass: 'text-slate-700 hover:bg-emerald-50/90',
    barClass: 'bg-emerald-500'
  }
};

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
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
      const isMoveDownKey = key === 'arrowdown' && !event.altKey && !event.metaKey;
      const isMoveUpKey = key === 'arrowup' && !event.altKey && !event.metaKey;

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

      const sectionSubItems = menuItems
        .filter((item) => item.subItems?.length)
        .map((item) => (item.subItems || []).filter((subItem) => Boolean(subItem.path)));

      if ((isMoveDownKey || isMoveUpKey) && sectionSubItems.some((items) => items.length > 0)) {
        const activeSectionItems = sectionSubItems.find((items) => items.some((subItem) => isActive(subItem.path)));

        if (activeSectionItems?.length) {
          event.preventDefault();
          if (window.innerWidth < 768) setMobileOpen(true);

          const move = isMoveDownKey ? 1 : -1;
          const currentIndex = activeSectionItems.findIndex((subItem) => isActive(subItem.path));
          const nextIndex = (currentIndex + move + activeSectionItems.length) % activeSectionItems.length;
          navigate(activeSectionItems[nextIndex].path);
          return;
        }
      }

      if (event.ctrlKey) return;

      if (key === 'v') {
        event.preventDefault();
        if (window.innerWidth < 768) setMobileOpen(true);
        navigate('/sales');
      } else if (key === 'e') {
        event.preventDefault();
        if (window.innerWidth < 768) setMobileOpen(true);
        navigate('/expenses');
      } else if (key === 'm') {
        event.preventDefault();
        if (window.innerWidth < 768) setMobileOpen(true);
        navigate('/party');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 h-[60px] border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#f9fafb_55%,#e0f2fe_100%)] px-4 shadow-[0_14px_34px_rgba(148,163,184,0.18)] md:hidden">
        <div className="relative flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-slate-800">BILLHUB</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Business Console</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/80 text-slate-700 transition hover:bg-white"
            aria-label="Open navigation menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[3px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[13.25rem] max-w-[82vw] flex-col overflow-hidden border-r border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f9fafb_34%,#eff6ff_72%,#e0f2fe_100%)] shadow-[0_28px_60px_rgba(148,163,184,0.22)] transition-transform duration-300 md:z-40 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Inside Border Highlight */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(251,191,36,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.35),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-slate-300/80 to-transparent" />

        {/* Sidebar Header / Logo */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <Link to="/stock" className="group flex items-center gap-3.5" onClick={() => setMobileOpen(false)}>
            <div className="flex flex-col">
              <p className="text-[15px] font-bold tracking-[0.18em] text-slate-800">
                BILLHUB
              </p>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500">
                Business Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white/80 text-slate-700 transition hover:bg-white md:hidden"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-scrollbar relative z-10 flex-1 overflow-y-auto pb-8">
          <nav className="flex flex-col">
            {menuItems.filter((item) => item.subItems?.length).map((item, index) => {
              const sectionStyle = sectionStyles[item.name] || sectionStyles.Masters;

              return (
                <div key={item.name} className="flex flex-col">
                  <div className={`flex items-center gap-3 border-y px-5 py-3 text-slate-700 ${sectionStyle.headerClass} ${index > 0 ? 'mt-3' : ''}`}>
                    <span className={`inline-flex ${index === 0 ? sectionStyle.accentTextClass : sectionStyle.accentDotClass}`}>
                      {index === 0 ? '+' : ''}
                    </span>
                    <span className="text-[12px] font-bold tracking-[0.16em]">
                      {sectionStyle.label}
                    </span>
                  </div>

                  <div className="border-b border-slate-200/90">
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
                          className={`group relative flex items-center gap-3 border-b border-slate-200/90 px-5 py-2.5 text-[12px] transition-colors duration-200 last:border-b-0 ${
                            subActive ? sectionStyle.activeClass : sectionStyle.hoverClass
                          }`}
                        >
                          {subActive && (
                            <div className={`absolute inset-y-0 left-0 w-1 ${sectionStyle.barClass}`} />
                          )}

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <SubIcon />
                          </div>

                          <span className={`${subActive ? 'font-semibold text-slate-800' : 'font-medium text-slate-700 group-hover:text-slate-900'}`}>
                            {item.name === 'Vouchers' && subItem.name === 'Sale' ? 'Sales' :
                              item.name === 'Vouchers' && subItem.name === 'Purchase' ? 'Purchase' :
                                subItem.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-3 flex items-center gap-3 border-y border-slate-200 bg-slate-50/90 px-5 py-3 text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              <span className="text-[12px] font-bold tracking-[0.16em]">MORE</span>
            </div>

            {menuItems.filter((item) => !item.subItems?.length).map((item) => {
              const active = isActive(item.path);
              const Icon = item.Icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) setMobileOpen(false);
                  }}
                  className={`group relative flex items-center gap-3 border-b border-slate-200/90 px-5 py-2.5 text-[12px] transition-colors duration-200 ${
                    active
                      ? 'bg-[linear-gradient(90deg,rgba(224,242,254,0.98),rgba(248,250,252,0.94))] text-slate-800'
                      : 'text-slate-700 hover:bg-cyan-50/90'
                  }`}
                >
                  {active && <div className="absolute inset-y-0 left-0 w-1 bg-cyan-500" />}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-700">
                    <Icon />
                  </div>

                  <span className={`${active ? 'font-semibold text-slate-800' : 'font-medium text-slate-700 group-hover:text-slate-900'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
