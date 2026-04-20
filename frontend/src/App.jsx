import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Masters from './pages/Masters';
import Products from './pages/Products';
import StockDetail from './pages/StockDetail';
import StockGroups from './pages/StockGroups';
import Unit from './pages/Unit';
import Banks from './pages/Banks';
import Sales from './pages/Sales/Sales';
import Purchases from './pages/Purchases/Purchases';
import Receipts from './pages/Receipts/Receipts';
import Party from './pages/Party/Party';
import PartyLedger from './pages/PartyLedger';
import PartyDetail from './pages/PartyDetail';
import Expenses from './pages/Expenses';
import ExpenseType from './pages/ExpenseType';
import Contra from './pages/Contra';
import StockAdjustment from './pages/StockAdjustment';
import SaleReturn from './pages/SaleReturn/SaleReturn';
import PurchaseReturn from './pages/PurchaseReturn/PurchaseReturn';
import SaleDiscount from './pages/SaleDiscount';
import PurchaseDiscount from './pages/PurchaseDiscount';
import ReportsHub from './pages/ReportsHub';
import ReportsDashboard from './pages/ReportsDashboard';
import StockLedger from './pages/StockLedger';
import ReportsPlaceholder from './pages/ReportsPlaceholder';
import DayBook from './pages/DayBook';
import Settings from './pages/Settings';
import ExpenseReport from './pages/ExpenseReport';
import PaymentReport from './pages/PaymentReport';
import { AddPaymentPopupLauncher } from './pages/Payments/component/AddPaymentPopup';
import ProtectedRoute from './components/ProtectedRoute';
import SectionHubPage from './components/SectionHubPage';

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const closeVoucherRouteToHub = () => {
    navigate('/', {
      replace: true
    });
  };

  const clearHomeQuickShortcutState = () => {
    const currentState = location.state || {};
    const {
      homeQuickSale,
      homeQuickPurchase,
      homeQuickSaleReturn,
      homeQuickPurchaseReturn,
      homeQuickPayment,
      homeQuickReceipt,
      homeQuickExpense,
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
              <Purchases modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Sales modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/day-book"
          element={
            <ProtectedRoute>
              <DayBook />
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
              <PartyLedger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/stock-ledger"
          element={
            <ProtectedRoute>
              <StockLedger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-report"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/purchase-report"
          element={
            <ProtectedRoute>
              <Purchases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sale-return-report"
          element={
            <ProtectedRoute>
              <SaleReturn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/purchase-return-report"
          element={
            <ProtectedRoute>
              <PurchaseReturn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/stock-adjustment-report"
          element={
            <ProtectedRoute>
              <StockAdjustment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/payment-report"
          element={
            <ProtectedRoute>
              <PaymentReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/receipt-report"
          element={
            <ProtectedRoute>
              <Receipts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/expense-report"
          element={
            <ProtectedRoute>
              <ExpenseReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/profit-loss-report"
          element={
            <ProtectedRoute>
              <ReportsPlaceholder
                title="Profit And Loss Report"
                description="Profit and loss statement will be shown here after the report is implemented."
              />
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
          path="/receipts"
          element={
            <ProtectedRoute>
              <Receipts modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expense-types"
          element={
            <ProtectedRoute>
              <ExpenseType />
            </ProtectedRoute>
          }
        />

        <Route path="/expense-groups" element={<Navigate to="/expense-types" replace />} />

        <Route
          path="/party-ledger"
          element={
            <ProtectedRoute>
              <PartyLedger />
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
          path="/party/:id"
          element={
            <ProtectedRoute>
              <PartyDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leadger"
          element={
            <ProtectedRoute>
              <Navigate to="/party-ledger" replace />
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
              <StockAdjustment modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sale-return"
          element={
            <ProtectedRoute>
              <SaleReturn modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sale-discount"
          element={
            <ProtectedRoute>
              <SaleDiscount modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-return"
          element={
            <ProtectedRoute>
              <PurchaseReturn modalOnly onModalFinish={closeVoucherRouteToHub} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-discount"
          element={
            <ProtectedRoute>
              <PurchaseDiscount modalOnly onModalFinish={closeVoucherRouteToHub} />
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

      {location.pathname === '/' && location.state?.homeQuickSaleReturn && (
        <ProtectedRoute>
          <SaleReturn modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickPurchaseReturn && (
        <ProtectedRoute>
          <PurchaseReturn modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickPayment && (
        <ProtectedRoute>
          <AddPaymentPopupLauncher onFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickReceipt && (
        <ProtectedRoute>
          <Receipts modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      {location.pathname === '/' && location.state?.homeQuickExpense && (
        <ProtectedRoute>
          <Expenses modalOnly onModalFinish={clearHomeQuickShortcutState} />
        </ProtectedRoute>
      )}

      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover />
    </>
  );
}

export default App;
