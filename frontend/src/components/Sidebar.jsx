import { useLocation, useNavigate } from 'react-router-dom';

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

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="relative min-w-0 flex-1 basis-[46%] overflow-hidden rounded-[20px] border border-slate-200/20 bg-[linear-gradient(165deg,rgba(71,85,105,0.68),rgba(100,116,139,0.62),rgba(148,163,184,0.56))] shadow-[0_24px_60px_rgba(15,23,42,0.24),0_0_42px_rgba(14,165,233,0.06)] sm:max-w-[19rem] sm:rounded-[30px] lg:max-w-[14.75rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.12),transparent_32%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-1 flex-col gap-2 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3">
          {homeQuickShortcuts.map((shortcut) => (
            <button
              key={shortcut.combo}
              type="button"
              onClick={() => openHomeQuickShortcut(navigate, location.state, shortcut.stateKey)}
              className={shortcut.imageSrc
                ? 'cursor-pointer overflow-hidden rounded-xl text-left transition hover:-translate-y-0.5 sm:rounded-2xl'
                : 'cursor-pointer rounded-xl border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-2 text-left shadow-[0_14px_30px_rgba(148,163,184,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(148,163,184,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] sm:rounded-2xl sm:p-2.5'}
            >
              {shortcut.imageSrc ? (
                <img
                  src={shortcut.imageSrc}
                  alt={shortcut.imageAlt || shortcut.label}
                  className="block h-auto w-full object-cover"
                />
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`h-7 w-1.5 rounded-full bg-gradient-to-b sm:h-8 ${shortcut.accent}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold leading-tight text-slate-800 sm:text-[12px]">{shortcut.label}</p>
                    {shortcut.hint && (
                      <p className="mt-0.5 hidden text-[10px] font-medium text-slate-500 sm:block">{shortcut.hint}</p>
                    )}
                  </div>
                  <span className="hidden rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-sky-700 sm:inline-flex">
                    {shortcut.combo}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
