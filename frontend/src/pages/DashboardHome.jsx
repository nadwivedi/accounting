import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SECTION_ORDER, getSectionConfig } from '../navigation/sectionMenu';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = SECTION_ORDER.map((sectionName) => getSectionConfig(sectionName)).filter(Boolean);

  useEffect(() => {
    const isTypingTarget = (target) => {
      const tagName = target?.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
    };

    const isPopupOpen = () => Boolean(document.querySelector('.fixed.inset-0.z-50'));

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || isPopupOpen()) return;

      const key = event.key?.toLowerCase();

      if (key === 'arrowright' || key === 'arrowdown') {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % sections.length);
        return;
      }

      if (key === 'arrowleft' || key === 'arrowup') {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + sections.length) % sections.length);
        return;
      }

      if (key === 'enter') {
        event.preventDefault();
        const activeSection = sections[activeIndex];
        if (activeSection?.hubPath) {
          navigate(activeSection.hubPath);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, navigate, sections]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_20%),radial-gradient(circle_at_85%_15%,rgba(244,114,182,0.16),transparent_18%),linear-gradient(180deg,#0f172a_0%,#111827_52%,#020617_100%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[36px] border border-white/15 bg-white/10 shadow-[0_36px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="border-b border-white/10 bg-white/10 px-6 py-6 md:px-10 md:py-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-300">BillHub Console</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Choose Your Section</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-slate-300 md:text-base">
              Masters, vouchers, expenses, and reports now open on separate section pages.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 md:p-8">
            {sections.map((section, index) => {
              const isActive = activeIndex === index;

              return (
                <Link
                  key={section.name}
                  to={section.hubPath}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`group relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br ${section.theme.card} p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] transition duration-200 ${
                    isActive ? 'ring-4 ring-white/20' : 'hover:-translate-y-0.5 hover:ring-2 hover:ring-white/15'
                  }`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 shadow-inner shadow-white/10">
                        <section.Icon />
                      </div>
                      <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/85">
                        {section.items.length} items
                      </span>
                    </div>

                    <h2 className="mt-8 text-2xl font-black tracking-tight">{section.name}</h2>
                    <p className="mt-2 max-w-sm text-sm font-medium text-white/85">{section.description}</p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {section.items.slice(0, 3).map((item) => (
                        <span
                          key={item.path}
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
