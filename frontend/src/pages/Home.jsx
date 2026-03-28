import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeDayBookPanel from '../components/HomeDayBookPanel';
import Navbar from '../components/Navbar';
import Sidebar, { homeQuickShortcutMap, openHomeQuickShortcut } from '../components/Sidebar';

const HOME_SECTION_ORDER = ['Masters', 'Expense', 'Reports'];

const activateHomeSection = (sectionName, navigate, setExpandedSection) => {
  setExpandedSection(sectionName);

  if (sectionName === 'Masters') {
    navigate('/masters');
    return;
  }

  if (sectionName === 'Expense') {
    navigate('/expense-hub');
    return;
  }

  if (sectionName === 'Reports') {
    navigate('/reports');
  }
};

export default function Home() {
  const [expandedSection, setExpandedSection] = useState('Masters');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== '/') return;
    const requestedSection = location.state?.homeSection;
    if (requestedSection && HOME_SECTION_ORDER.includes(requestedSection)) {
      setExpandedSection(requestedSection);
    }
  }, [location.pathname, location.state]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, location.state]);

  useEffect(() => {
    const isTypingTarget = (target) => {
      const tagName = target?.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
    };

    const isPopupOpen = () => Boolean(document.querySelector('.fixed.inset-0.z-50'));

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      const isMoveDownKey = key === 'arrowdown' && !event.altKey && !event.metaKey;
      const isMoveUpKey = key === 'arrowup' && !event.altKey && !event.metaKey;

      if (event.defaultPrevented || event.metaKey) return;

      if (event.altKey && homeQuickShortcutMap[key]) {
        if (isTypingTarget(event.target) || isPopupOpen()) return;
        event.preventDefault();
        openHomeQuickShortcut(navigate, location.state, homeQuickShortcutMap[key]);
        return;
      }

      if (!isMoveDownKey && !isMoveUpKey && key !== 'enter') return;
      if (isTypingTarget(event.target) || isPopupOpen()) return;

      if (isMoveDownKey || isMoveUpKey) {
        event.preventDefault();
        const currentIndex = HOME_SECTION_ORDER.indexOf(expandedSection);
        const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
        const move = isMoveDownKey ? 1 : -1;
        const nextSection = HOME_SECTION_ORDER[(safeCurrentIndex + move + HOME_SECTION_ORDER.length) % HOME_SECTION_ORDER.length];
        setExpandedSection(nextSection);
        return;
      }

      event.preventDefault();
      activateHomeSection(expandedSection, navigate, setExpandedSection);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedSection, location.state, navigate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#020617]">
      <Navbar
        sections={HOME_SECTION_ORDER}
        activeSection={expandedSection}
        onSectionSelect={(sectionName) => activateHomeSection(sectionName, navigate, setExpandedSection)}
        onMenuClick={() => setIsMobileSidebarOpen(true)}
      />
      <div className="px-2 py-4 sm:px-4 sm:py-5 lg:px-5 xl:px-4 xl:py-4 2xl:px-5 2xl:py-5">
        <div className="grid min-h-[calc(100vh-5.5rem)] grid-cols-1 gap-4 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-3 lg:items-start xl:grid-cols-[15.25rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(0,1fr)] 2xl:gap-4">
          <div className="hidden lg:block">
            <Sidebar compactDesktop />
          </div>
          <div className="min-w-0 lg:pl-0.5 2xl:pl-1">
            <HomeDayBookPanel />
          </div>
        </div>
      </div>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />

          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[22rem] p-3">
            <div className="relative h-full overflow-hidden rounded-[28px]">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/85 text-slate-700 shadow-sm transition hover:bg-white"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar mobileDrawer />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
