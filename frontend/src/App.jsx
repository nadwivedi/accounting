import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Masters from './pages/Masters';
import Vouchers from './pages/Vouchers';
import Products from './pages/Products';
import StockDetail from './pages/StockDetail';
import StockGroups from './pages/StockGroups';
import Unit from './pages/Unit';
import Banks from './pages/Banks';
import Sales from './pages/Sales/Sales';
import Purchases from './pages/Purchases/Purchases';
import Payments from './pages/Payments/Payments';
import Receipts from './pages/Receipts/Receipts';
import Party from './pages/Party/Party';
import Expenses from './pages/Expenses';
import ExpenseGroups from './pages/ExpenseGroups';
import ExpenseHub from './pages/ExpenseHub';
import Contra from './pages/Contra';
import StockAdjustment from './pages/StockAdjustment';
import SaleReturn from './pages/SaleReturn/SaleReturn';
import PurchaseReturn from './pages/PurchaseReturn/PurchaseReturn';
import ReportsHub from './pages/ReportsHub';
import ReportsDashboard from './pages/ReportsDashboard';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import SectionHubPage from './components/SectionHubPage';

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const clearHomeQuickShortcutState = () => {
    const currentState = location.state || {};
    const {
      homeQuickSale,
      homeQuickPurchase,
      homeQuickPayment,
      homeQuickReceipt,
      backgroundLocation,
      ...restState
    } = currentState;

    navigate('/', {
      replace: true,
      state: Object.keys(restState).length > 0 ? restState : undefined
    });
  };

  return (
    <>
      <Routes location={location}>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />

        {/* Legacy dashboard route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/masters"
          element={
            <ProtectedRoute>
              <Masters />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vouchers"
          element={
            <ProtectedRoute>
              <Vouchers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expense-hub"
          element={
            <ProtectedRoute>
              <ExpenseHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-groups"
          element={
            <ProtectedRoute>
              <StockGroups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/units"
          element={
            <ProtectedRoute>
              <Unit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/banks"
          element={
            <ProtectedRoute>
              <Banks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route path="/stock-adjustments" element={<Navigate to="/stock-adjustment" replace />} />

        <Route
          path="/stock/:id"
          element={
            <ProtectedRoute>
              <StockDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/products" element={<Navigate to="/stock" replace />} />

        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <Purchases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/party-ledger"
          element={
            <ProtectedRoute>
              <ReportsDashboard initialReport="partyLedger" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/stock-ledger"
          element={
            <ProtectedRoute>
              <ReportsDashboard initialReport="stockLedger" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-report"
          element={
            <ProtectedRoute>
              <ReportsDashboard initialReport="saleReport" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/purchase-report"
          element={
            <ProtectedRoute>
              <ReportsDashboard initialReport="purchaseReport" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports-hub"
          element={
            <ProtectedRoute>
              <Navigate to="/reports" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <Receipts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expense-groups"
          element={
            <ProtectedRoute>
              <ExpenseGroups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/party"
          element={
            <ProtectedRoute>
              <Party />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leadger"
          element={
            <ProtectedRoute>
              <Navigate to="/party" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contra"
          element={
            <ProtectedRoute>
              <Contra />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-adjustment"
          element={
            <ProtectedRoute>
              <StockAdjustment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sale-return"
          element={
            <ProtectedRoute>
              <SaleReturn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-return"
          element={
            <ProtectedRoute>
              <PurchaseReturn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Redirect to stock */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {location.pathname === '/' && location.state?.homeQuickSale && (
        <ProtectedRoute>
          <Sales modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickPurchase && (
        <ProtectedRoute>
          <Purchases modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickPayment && (
        <ProtectedRoute>
          <Payments modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickReceipt && (
        <ProtectedRoute>
          <Receipts modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover />
    </>
  );
}

export default App;
