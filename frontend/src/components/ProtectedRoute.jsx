import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const homeNavigationEntries = [
  { section: 'Masters', path: '/party' },
  { section: 'Masters', path: '/stock' },
  { section: 'Masters', path: '/stock-groups' },
  { section: 'Masters', path: '/units' },
  { section: 'Vouchers', path: '/sales' },
  { section: 'Vouchers', path: '/purchases' },
  { section: 'Vouchers', path: '/sale-return' },
  { section: 'Vouchers', path: '/purchase-return' },
  { section: 'Vouchers', path: '/stock-adjustment' },
  { section: 'Vouchers', path: '/payments' },
  { section: 'Vouchers', path: '/receipts' },
  { section: 'Expense', path: '/expenses' },
  { section: 'Expense', path: '/expense-groups' },
  { section: 'Reports', path: '/reports' },
  { section: 'Reports', path: '/settings' }
];

const homeNavigationAliases = {
  '/leadger': { section: 'Masters', path: '/party' },
  '/products': { section: 'Masters', path: '/stock' },
  '/stock-adjustments': { section: 'Vouchers', path: '/stock-adjustment' }
};

const getHomeNavigationState = (pathname) => {
  if (!pathname) return null;

  const aliasMatch = homeNavigationAliases[pathname];
  if (aliasMatch) return aliasMatch;

  return homeNavigationEntries.find(
    (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`)
  ) || null;
};

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !isAuthenticated || location.pathname === '/') return;

    const isPopupOpen = () => Boolean(document.querySelector('.fixed.inset-0.z-50'));

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
      if (key !== 'escape' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isPopupOpen()) {
        event.preventDefault();
        closeActivePopup();
        return;
      }

      const homeNavigationState = getHomeNavigationState(location.pathname);

      event.preventDefault();
      navigate('/', {
        replace: true,
        state: homeNavigationState
          ? {
              homeSection: homeNavigationState.section,
              homePath: homeNavigationState.path
            }
          : undefined
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    children
  );
}
