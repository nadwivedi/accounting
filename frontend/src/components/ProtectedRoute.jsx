import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const homeNavigationEntries = [
  { section: 'Masters', path: '/party' },
  { section: 'Masters', path: '/stock' },
  { section: 'Masters', path: '/stock-groups' },
  { section: 'Masters', path: '/units' },
  { section: 'Masters', path: '/banks' },
  { section: 'Masters', path: '/expense-types' },
  { section: 'Reports', path: '/party-ledger' },
  { section: 'Reports', path: '/reports' },
  { section: 'Reports', path: '/settings' }
];

const homeNavigationAliases = {
  '/leadger': { section: 'Reports', path: '/party-ledger' },
  '/reports/party-ledger': { section: 'Reports', path: '/party-ledger' },
  '/products': { section: 'Masters', path: '/stock' },
  '/stock-adjustments': { section: 'Masters', path: '/party' }
};

const voucherShortcutRoutes = {
  '1': { path: '/sales', openShortcut: 'sale' },
  '2': { path: '/purchases', openShortcut: 'purchase' },
  '3': { path: '/', openShortcut: 'payment' },
  '4': { path: '/receipts', openShortcut: 'receipt' }
};

const sectionHubPaths = {
  Masters: '/masters',
  Reports: '/reports'
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
    if (loading || !isAuthenticated) return;

    const isPopupOpen = () => Boolean(document.querySelector('.fixed.inset-0.z-50'));
    const isTypingTarget = (target) => {
      const tagName = target?.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
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
      if (key === 'escape') {
        const popup = document.querySelector('.fixed.inset-0.z-50');
        if (popup) return; // let popup handle it
        event.preventDefault();
        
        if (typeof showForm !== 'undefined' && showForm) {
          handleCloseForm();
        } else if (typeof modalOnly !== 'undefined' && modalOnly && typeof onModalFinish === 'function') {
          onModalFinish();
        } else if (typeof navigate !== 'undefined') {
          navigate('/');
        } else {
          window.location.href = '/';
        }
        return;
      }

      const shortcutTarget = voucherShortcutRoutes[key];

      if (shortcutTarget && event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.defaultPrevented || isTypingTarget(event.target) || isPopupOpen()) return;

        event.preventDefault();
        if (location.pathname === '/') {
          navigate('/', {
            replace: true,
            state: {
              ...(location.state || {}),
              homeQuickSale: key === '1',
              homeQuickPurchase: key === '2',
              homeQuickPayment: key === '3',
              homeQuickReceipt: key === '4'
            }
          });
          return;
        }

        if (shortcutTarget.openShortcut === 'payment') {
          navigate('/', {
            replace: true,
            state: {
              ...(location.state || {}),
              homeQuickSale: false,
              homeQuickPurchase: false,
              homeQuickPayment: true,
              homeQuickReceipt: false,
              homeQuickExpense: false
            }
          });
          return;
        }

        navigate(shortcutTarget.path, {
          state: { openShortcut: shortcutTarget.openShortcut }
        });
        return;
      }

      if (key !== 'escape' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isPopupOpen()) {
        event.preventDefault();
        closeActivePopup();
        return;
      }

      if (location.pathname === '/') {
        return;
      }

      if (location.pathname.startsWith('/stock/') && location.pathname !== '/stock') {
        event.preventDefault();
        navigate('/', { replace: true });
        return;
      }

      const homeNavigationState = getHomeNavigationState(location.pathname);
      const sectionHubPath = homeNavigationState ? sectionHubPaths[homeNavigationState.section] : null;

      event.preventDefault();
      if (sectionHubPath && location.pathname !== sectionHubPath) {
        navigate(sectionHubPath, {
          replace: true,
          state: {
            activePath: homeNavigationState.path
          }
        });
        return;
      }

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
  }, [isAuthenticated, loading, location.pathname, location.state, navigate]);

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
