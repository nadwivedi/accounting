import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSectionConfig } from '../navigation/sectionMenu';

export const homeQuickShortcuts = [
  { label: 'New Sale', hint: '', combo: 'Alt + 1', accent: 'from-emerald-500 to-teal-500', stateKey: 'homeQuickSale', imageSrc: '/button/add sales_converted.avif', imageAlt: 'Add sales' },
  { label: 'New Purchase', hint: '', combo: 'Alt + 2', accent: 'from-blue-500 to-cyan-500', stateKey: 'homeQuickPurchase', imageSrc: '/button/addpurchase_converted.avif', imageAlt: 'Add purchase' },
  { label: 'New Payment', hint: 'Money Paid', combo: 'Alt + 3', accent: 'from-amber-500 to-orange-500', stateKey: 'homeQuickPayment', imageSrc: '/button/money paid_converted.avif', imageAlt: 'Money paid' },
  { label: 'New Receipt', hint: 'Money Received', combo: 'Alt + 4', accent: 'from-fuchsia-500 to-pink-500', stateKey: 'homeQuickReceipt', imageSrc: '/button/money received_converted.avif', imageAlt: 'Money received' },
  { label: 'New Expense', hint: '', combo: 'Alt + 5', accent: 'from-emerald-500 to-lime-500', stateKey: 'homeQuickExpense', imageSrc: '/button/new expense_converted.avif', imageAlt: 'New expense' }
];

export const homeQuickShortcutMap = {
  '1': 'homeQuickSale',
  '2': 'homeQuickPurchase',
  '3': 'homeQuickPayment',
  '4': 'homeQuickReceipt',
  '5': 'homeQuickExpense'
};

const sidebarVoucherPaths = new Set([
  '/sale-return',
  '/purchase-return',
  '/sale-discount',
  '/purchase-discount',
  '/stock-adjustment'
]);

const collapsedVoucherPaths = new Set([
  '/sale-discount',
  '/purchase-discount',
  '/stock-adjustment'
]);

const sidebarVoucherButtonImages = {
  '/sale-return': {
    imageSrc: '/button/sale retun_converted.avif',
    imageAlt: 'Sale return'
  },
  '/purchase-return': {
    imageSrc: '/button/purchaseReturn_converted.avif',
    imageAlt: 'Purchase return'
  },
  '/sale-discount': {
    imageSrc: '/button/discount after sale_converted.avif',
    imageAlt: 'Discount after sale'
  },
  '/purchase-discount': {
    imageSrc: '/button/discount after purchase_converted.avif',
    imageAlt: 'Discount after purchase'
  }
};

export function openHomeQuickShortcut(navigate, currentState, stateKey) {
  navigate('/', {
    replace: true,
    state: {
      ...(currentState || {}),
      homeQuickSale: stateKey === 'homeQuickSale',
      homeQuickPurchase: stateKey === 'homeQuickPurchase',
      homeQuickSaleReturn: stateKey === 'homeQuickSaleReturn',
      homeQuickPurchaseReturn: stateKey === 'homeQuickPurchaseReturn',
      homeQuickPayment: stateKey === 'homeQuickPayment',
      homeQuickReceipt: stateKey === 'homeQuickReceipt',
      homeQuickExpense: stateKey === 'homeQuickExpense'
    }
  });
}

export default function Sidebar({ mobileDrawer = false, compactDesktop = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreVoucherLinks, setShowMoreVoucherLinks] = useState(false);
  const sidebarVoucherLinks = (getSectionConfig('Vouchers')?.items || [])
    .filter((item) => sidebarVoucherPaths.has(item.path))
    .map((item) => ({
      ...item,
      ...(sidebarVoucherButtonImages[item.path] || {})
    }));
  const defaultVoucherLinks = sidebarVoucherLinks.filter((item) => !collapsedVoucherPaths.has(item.path));
  const extraVoucherLinks = sidebarVoucherLinks.filter((item) => collapsedVoucherPaths.has(item.path));

  return (
    <aside className={`relative w-full overflow-hidden rounded-[20px] border shadow-[0_24px_60px_rgba(15,23,42,0.24),0_0_42px_rgba(14,165,233,0.06)] sm:rounded-[30px] lg:sticky lg:top-22 lg:self-start lg:rounded-[24px] xl:rounded-[26px] 2xl:top-24 2xl:rounded-[30px] ${
      mobileDrawer
        ? 'border-slate-700/80 bg-[linear-gradient(165deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94),rgba(51,65,85,0.92))]'
        : 'border-slate-200/20 bg-[linear-gradient(165deg,rgba(71,85,105,0.68),rgba(100,116,139,0.62),rgba(148,163,184,0.56))]'
    }`}>
      <div className={`pointer-events-none absolute inset-0 ${
        mobileDrawer
          ? 'bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_32%)]'
          : 'bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.12),transparent_32%)]'
      }`} />
      <div className="relative z-10 flex h-full flex-col">
        <div className={`flex flex-1 flex-col gap-2 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3 2xl:gap-2.5 2xl:px-3 2xl:py-3 ${
          compactDesktop ? 'lg:gap-1.5 lg:px-2 lg:py-2 xl:gap-1.5 xl:px-2.5 xl:py-2.5' : 'lg:gap-2 lg:px-2.5 lg:py-2.5 xl:gap-1.5 xl:px-2.5 xl:py-2.5'
        }`}>
          {homeQuickShortcuts.map((shortcut) => (
            <button
              key={shortcut.combo}
              type="button"
              onClick={() => openHomeQuickShortcut(navigate, location.state, shortcut.stateKey)}
              className={shortcut.imageSrc
                ? `flex w-[70%] cursor-pointer justify-start overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 sm:block sm:w-full sm:rounded-2xl ${
                  compactDesktop ? 'lg:rounded-[16px] lg:max-w-full lg:scale-[0.98] xl:rounded-[18px] xl:max-w-[92%] xl:scale-100' : 'lg:rounded-[18px] lg:max-w-full xl:rounded-[18px] xl:max-w-[92%]'
                } 2xl:max-w-full 2xl:rounded-2xl`
                : 'cursor-pointer rounded-xl border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-2 text-left shadow-[0_14px_30px_rgba(148,163,184,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(148,163,184,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] sm:rounded-2xl sm:p-2.5'}
            >
              {shortcut.imageSrc ? (
                <img
                  src={shortcut.imageSrc}
                  alt={shortcut.imageAlt || shortcut.label}
                  className={`block h-auto w-full object-cover ${compactDesktop ? 'lg:scale-[0.95] xl:scale-[0.97]' : 'lg:scale-[0.98] xl:scale-[0.97]'} 2xl:scale-100`}
                />
              ) : (
                <div className={`flex items-center gap-2 sm:gap-3 ${compactDesktop ? 'lg:gap-2 xl:gap-2.5' : 'lg:gap-2.5 xl:gap-2.5'}`}>
                  <div className={`h-7 w-1.5 rounded-full bg-gradient-to-b sm:h-8 ${compactDesktop ? 'lg:h-6 xl:h-7' : 'lg:h-7 xl:h-7'} 2xl:h-8 ${shortcut.accent}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold leading-tight text-slate-800 text-[11px] sm:text-[12px] ${compactDesktop ? 'lg:text-[10px] xl:text-[11px]' : 'lg:text-[11px] xl:text-[11px]'} 2xl:text-[12px]`}>{shortcut.label}</p>
                    {shortcut.hint && (
                      <p className={`mt-0.5 hidden font-medium text-slate-500 sm:block text-[10px] ${compactDesktop ? 'lg:text-[8px] xl:text-[9px]' : 'lg:text-[9px] xl:text-[9px]'} 2xl:text-[10px]`}>{shortcut.hint}</p>
                    )}
                  </div>
                  <span className={`hidden rounded-full border border-sky-200 bg-sky-50 font-bold tracking-[0.14em] text-sky-700 sm:inline-flex px-2.5 py-1 text-[10px] ${
                    compactDesktop ? 'lg:px-1.5 lg:py-0.5 lg:text-[8px] xl:px-2 xl:py-0.5 xl:text-[9px]' : 'lg:px-2 lg:py-0.5 lg:text-[9px] xl:px-2 xl:py-0.5 xl:text-[9px]'
                  } 2xl:px-2.5 2xl:py-1 2xl:text-[10px]`}>
                    {shortcut.combo}
                  </span>
                </div>
              )}
            </button>
          ))}

          <div className={`mt-1 flex flex-col gap-2 pt-2 2xl:gap-2 2xl:pt-2 ${compactDesktop ? 'lg:gap-1.5 lg:pt-1.5 xl:gap-1.5 xl:pt-1.5' : 'lg:gap-2 lg:pt-2 xl:gap-1.5 xl:pt-1.5'}`}>
            {defaultVoucherLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(event) => {
                  if (item.path === '/sale-return') {
                    event.preventDefault();
                    openHomeQuickShortcut(navigate, location.state, 'homeQuickSaleReturn');
                    return;
                  }

                  if (item.path === '/purchase-return') {
                    event.preventDefault();
                    openHomeQuickShortcut(navigate, location.state, 'homeQuickPurchaseReturn');
                  }
                }}
                className={item.imageSrc
                  ? `flex w-[70%] justify-start overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 sm:block sm:w-full sm:rounded-2xl ${
                    compactDesktop ? 'lg:rounded-[16px] lg:max-w-full lg:scale-[0.98] xl:rounded-[18px] xl:max-w-[92%] xl:scale-100' : 'lg:rounded-[18px] lg:max-w-full xl:rounded-[18px] xl:max-w-[92%]'
                  } 2xl:max-w-full 2xl:rounded-2xl`
                  : `group relative flex items-center border border-white/20 bg-white/70 text-slate-700 shadow-[0_14px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm transition-colors duration-200 hover:bg-violet-50/90 sm:rounded-[24px] 2xl:gap-3 2xl:rounded-[24px] 2xl:px-5 2xl:py-2.5 2xl:text-[12px] ${
                    compactDesktop ? 'gap-3 rounded-[20px] px-5 py-2.5 text-[12px] lg:gap-2 lg:rounded-[18px] lg:px-3 lg:py-1.5 lg:text-[10px] xl:gap-2.5 xl:rounded-[20px] xl:px-4 xl:py-2 xl:text-[11px]' : 'gap-3 rounded-[20px] px-5 py-2.5 text-[12px] lg:gap-2.5 lg:rounded-[20px] lg:px-4 lg:py-2 lg:text-[11px] xl:gap-2.5 xl:rounded-[20px] xl:px-4 xl:py-2 xl:text-[11px]'
                  }`}
              >
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt={item.imageAlt || item.name}
                    className={`block h-auto w-full object-cover ${compactDesktop ? 'lg:scale-[0.95] xl:scale-[0.97]' : 'lg:scale-[0.98] xl:scale-[0.97]'} 2xl:scale-100`}
                  />
                ) : (
                  <>
                    <div className={`flex shrink-0 items-center justify-center ${compactDesktop ? 'h-10 w-10 lg:h-7 lg:w-7 xl:h-8 xl:w-8' : 'h-10 w-10 lg:h-8 lg:w-8 xl:h-8 xl:w-8'} 2xl:h-10 2xl:w-10`}>
                      <item.Icon />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 group-hover:text-slate-900">{item.name}</p>
                      {item.hint && (
                        <p className={`font-medium text-slate-400 group-hover:text-slate-500 text-[10px] ${compactDesktop ? 'lg:text-[8px] xl:text-[9px]' : 'lg:text-[9px] xl:text-[9px]'} 2xl:text-[10px]`}>
                          {item.hint}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </Link>
            ))}

            {extraVoucherLinks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowMoreVoucherLinks((current) => !current)}
                  aria-label={showMoreVoucherLinks ? 'Hide more voucher buttons' : 'Show more voucher buttons'}
                  className="group relative flex cursor-pointer items-center justify-center px-4 py-2 text-slate-700 transition-colors duration-200 hover:text-slate-900 xl:px-4 xl:py-1.5 2xl:px-5 2xl:py-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    className={`h-5 w-5 text-slate-600 transition-transform duration-200 ${showMoreVoucherLinks ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showMoreVoucherLinks && extraVoucherLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(event) => {
                      if (item.path === '/sale-return') {
                        event.preventDefault();
                        openHomeQuickShortcut(navigate, location.state, 'homeQuickSaleReturn');
                        return;
                      }

                      if (item.path === '/purchase-return') {
                        event.preventDefault();
                        openHomeQuickShortcut(navigate, location.state, 'homeQuickPurchaseReturn');
                      }
                    }}
                    className={item.imageSrc
                      ? `flex w-[70%] justify-start overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 sm:block sm:w-full sm:rounded-2xl ${
                        compactDesktop ? 'lg:rounded-[16px] lg:max-w-full lg:scale-[0.98] xl:rounded-[18px] xl:max-w-[92%] xl:scale-100' : 'lg:rounded-[18px] lg:max-w-full xl:rounded-[18px] xl:max-w-[92%]'
                      } 2xl:max-w-full 2xl:rounded-2xl`
                      : `group relative flex items-center border border-white/20 bg-white/70 text-slate-700 shadow-[0_14px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm transition-colors duration-200 hover:bg-violet-50/90 sm:rounded-[24px] 2xl:gap-3 2xl:rounded-[24px] 2xl:px-5 2xl:py-2.5 2xl:text-[12px] ${
                        compactDesktop ? 'gap-3 rounded-[20px] px-5 py-2.5 text-[12px] lg:gap-2 lg:rounded-[18px] lg:px-3 lg:py-1.5 lg:text-[10px] xl:gap-2.5 xl:rounded-[20px] xl:px-4 xl:py-2 xl:text-[11px]' : 'gap-3 rounded-[20px] px-5 py-2.5 text-[12px] lg:gap-2.5 lg:rounded-[20px] lg:px-4 lg:py-2 lg:text-[11px] xl:gap-2.5 xl:rounded-[20px] xl:px-4 xl:py-2 xl:text-[11px]'
                      }`}
                  >
                    {item.imageSrc ? (
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt || item.name}
                        className={`block h-auto w-full object-cover ${compactDesktop ? 'lg:scale-[0.95] xl:scale-[0.97]' : 'lg:scale-[0.98] xl:scale-[0.97]'} 2xl:scale-100`}
                      />
                    ) : (
                      <>
                        <div className={`flex shrink-0 items-center justify-center ${compactDesktop ? 'h-10 w-10 lg:h-7 lg:w-7 xl:h-8 xl:w-8' : 'h-10 w-10 lg:h-8 lg:w-8 xl:h-8 xl:w-8'} 2xl:h-10 2xl:w-10`}>
                          <item.Icon />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 group-hover:text-slate-900">{item.name}</p>
                          {item.hint && (
                            <p className={`font-medium text-slate-400 group-hover:text-slate-500 text-[10px] ${compactDesktop ? 'lg:text-[8px] xl:text-[9px]' : 'lg:text-[9px] xl:text-[9px]'} 2xl:text-[10px]`}>
                              {item.hint}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
