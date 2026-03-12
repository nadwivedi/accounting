import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSectionConfig } from '../navigation/sectionMenu';

export default function SectionHubPage({ sectionName }) {
  const navigate = useNavigate();
  const config = getSectionConfig(sectionName);
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => config?.items || [], [config]);

  useEffect(() => {
    setActiveIndex(0);
  }, [sectionName]);

  useEffect(() => {
    if (!config) return undefined;

    const isTypingTarget = (target) => {
      const tagName = target?.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
    };

    const isPopupOpen = () => Boolean(document.querySelector('.fixed.inset-0.z-50'));

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || isPopupOpen()) return;

      const key = event.key?.toLowerCase();
      if (key === 'arrowdown' || key === 'arrowright') {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        return;
      }

      if (key === 'arrowup' || key === 'arrowleft') {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        return;
      }

      if (key === 'enter') {
        event.preventDefault();
        const activeItem = items[activeIndex];
        if (activeItem?.path) {
          navigate(activeItem.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, config, items, navigate]);

  if (!config) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.16),transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_48%,#020617_100%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className={`overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-br ${config.theme.soft} shadow-[0_28px_80px_rgba(15,23,42,0.28)]`}>
          <div className="border-b border-slate-200/80 bg-white/80 px-5 py-5 backdrop-blur-sm md:px-8 md:py-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.theme.icon} shadow-sm`}>
                  <config.Icon />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Section Page</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{config.name}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-600">{config.description}</p>
                </div>
              </div>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back To Home
              </Link>
            </div>
          </div>

          <div className="px-5 py-5 md:px-8 md:py-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => {
                const isActive = index === activeIndex;
                const ItemIcon = item.Icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`group relative overflow-hidden rounded-3xl border bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition duration-200 ${
                      isActive
                        ? 'border-slate-900/20 ring-2 ring-slate-900/10'
                        : 'border-white/70 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_22px_48px_rgba(15,23,42,0.12)]'
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${config.theme.accent}`}></div>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.theme.icon}`}>
                        <ItemIcon />
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h2 className="text-lg font-bold text-slate-900">{item.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">Open {item.name.toLowerCase()} page</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
