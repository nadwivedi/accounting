import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockDetail from './pages/StockDetail';
import StockAdjustments from './pages/StockAdjustments';
import StockGroups from './pages/StockGroups';
import Group from './pages/Group';
import GroupDetail from './pages/GroupDetail';
import Unit from './pages/Unit';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Payments from './pages/Payments';
import Receipts from './pages/Receipts';
import Leadger from './pages/Leadger';
import Contra from './pages/Contra';
import StockAdjustment from './pages/StockAdjustment';
import SaleReturn from './pages/SaleReturn';
import PurchaseReturn from './pages/PurchaseReturn';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          path="/groups"
          element={
            <ProtectedRoute>
              <Group />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <GroupDetail />
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
          path="/stock"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-adjustments"
          element={
            <ProtectedRoute>
              <StockAdjustments />
            </ProtectedRoute>
          }
        />

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
              <Reports />
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
          path="/leadger"
          element={
            <ProtectedRoute>
              <Leadger />
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

        {/* Redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>

      <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnHover />
    </>
  );
}

export default App;
