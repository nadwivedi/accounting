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
  }
};

export function openHomeQuickShortcut(navigate, currentState, stateKey) {
  navigate('/', {
    replace: true,
    state: {
      ...(currentState || {}),
      homeQuickSale: stateKey === 'homeQuickSale',
      homeQuickPurchase: stateKey === 'homeQuickPurchase',
      homeQuickPayment: stateKey === 'homeQuickPayment',
      homeQuickReceipt: stateKey === 'homeQuickReceipt',
      homeQuickExpense: stateKey === 'homeQuickExpense'
    }
  });
}

export default function Sidebar({ mobileDrawer = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarVoucherLinks = (getSectionConfig('Vouchers')?.items || [])
    .filter((item) => sidebarVoucherPaths.has(item.path))
    .map((item) => ({
      ...item,
      ...(sidebarVoucherButtonImages[item.path] || {})
    }));

  return (
    <aside className={`relative w-full overflow-hidden rounded-[20px] border shadow-[0_24px_60px_rgba(15,23,42,0.24),0_0_42px_rgba(14,165,233,0.06)] sm:rounded-[30px] xl:sticky xl:top-22 xl:self-start xl:rounded-[26px] 2xl:top-24 2xl:rounded-[30px] ${
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
        <div className="flex flex-1 flex-col gap-2 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3 xl:gap-1.5 xl:px-2.5 xl:py-2.5 2xl:gap-2.5 2xl:px-3 2xl:py-3">
          {homeQuickShortcuts.map((shortcut) => (
            <button
              key={shortcut.combo}
              type="button"
              onClick={() => openHomeQuickShortcut(navigate, location.state, shortcut.stateKey)}
              className={shortcut.imageSrc
                ? 'flex w-[70%] cursor-pointer justify-start overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 sm:block sm:w-full sm:rounded-2xl xl:rounded-[18px] xl:max-w-[92%] 2xl:max-w-full 2xl:rounded-2xl'
                : 'cursor-pointer rounded-xl border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-2 text-left shadow-[0_14px_30px_rgba(148,163,184,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(148,163,184,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] sm:rounded-2xl sm:p-2.5'}
            >
              {shortcut.imageSrc ? (
                <img
                  src={shortcut.imageSrc}
                  alt={shortcut.imageAlt || shortcut.label}
                  className="block h-auto w-full object-cover xl:scale-[0.97] 2xl:scale-100"
                />
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 xl:gap-2.5">
                  <div className={`h-7 w-1.5 rounded-full bg-gradient-to-b sm:h-8 xl:h-7 2xl:h-8 ${shortcut.accent}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold leading-tight text-slate-800 sm:text-[12px] xl:text-[11px] 2xl:text-[12px]">{shortcut.label}</p>
                    {shortcut.hint && (
                      <p className="mt-0.5 hidden text-[10px] font-medium text-slate-500 sm:block xl:text-[9px] 2xl:text-[10px]">{shortcut.hint}</p>
                    )}
                  </div>
                  <span className="hidden rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-sky-700 sm:inline-flex xl:px-2 xl:py-0.5 xl:text-[9px] 2xl:px-2.5 2xl:py-1 2xl:text-[10px]">
                    {shortcut.combo}
                  </span>
                </div>
              )}
            </button>
          ))}

          <div className="mt-1 flex flex-col gap-2 pt-2 xl:gap-1.5 xl:pt-1.5 2xl:gap-2 2xl:pt-2">
            {sidebarVoucherLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={item.imageSrc
                  ? 'flex w-[70%] justify-start overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 sm:block sm:w-full sm:rounded-2xl xl:rounded-[18px] xl:max-w-[92%] 2xl:max-w-full 2xl:rounded-2xl'
                  : 'group relative flex items-center gap-3 rounded-[20px] border border-white/20 bg-white/70 px-5 py-2.5 text-[12px] text-slate-700 shadow-[0_14px_30px_rgba(148,163,184,0.12)] backdrop-blur-sm transition-colors duration-200 hover:bg-violet-50/90 sm:rounded-[24px] xl:gap-2.5 xl:rounded-[20px] xl:px-4 xl:py-2 xl:text-[11px] 2xl:gap-3 2xl:rounded-[24px] 2xl:px-5 2xl:py-2.5 2xl:text-[12px]'}
              >
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt={item.imageAlt || item.name}
                    className="block h-auto w-full object-cover xl:scale-[0.97] 2xl:scale-100"
                  />
                ) : (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center xl:h-8 xl:w-8 2xl:h-10 2xl:w-10">
                      <item.Icon />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 group-hover:text-slate-900">{item.name}</p>
                      {item.hint && (
                        <p className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 xl:text-[9px] 2xl:text-[10px]">
                          {item.hint}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
