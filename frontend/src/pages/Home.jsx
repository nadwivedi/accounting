import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      />
      <div className="px-4 py-4 sm:py-5">
        <div className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-6xl items-start justify-center">
          <div className="flex w-full justify-center">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
