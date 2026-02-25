import { useState, useEffect } from 'react';
import apiClient from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockGroups: 0,
    totalParties: 0,
    totalSales: 0,
    totalPurchases: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const [products, stockGroups, parties, sales, purchases] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/stock-groups'),
        apiClient.get('/parties'),
        apiClient.get('/sales'),
        apiClient.get('/purchases')
      ]);

      setStats({
        totalProducts: products.count || 0,
        totalStockGroups: stockGroups.count || 0,
        totalParties: parties.count || 0,
        totalSales: sales.count || 0,
        totalPurchases: purchases.count || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-3 md:p-6 border-l-4 border-${color}-500`}>
      <div>
        <p className="text-gray-600 text-xs md:text-sm font-medium">{label}</p>
        <p className="text-xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Overview of your inventory and billing</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Loading dashboard...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatCard label="Stock Item" value={stats.totalProducts} color="blue" />
          <StatCard label="Stock Group" value={stats.totalStockGroups} color="green" />
          <StatCard label="Parties" value={stats.totalParties} color="purple" />
          <StatCard label="Sales" value={stats.totalSales} color="yellow" />
          <StatCard label="Purchases" value={stats.totalPurchases} color="red" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/stock"
              className="block px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
            >
              Add Stock Item
            </a>
            <a
              href="/stock-groups"
              className="block px-3 md:px-4 py-2 text-sm md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center"
            >
              Add Stock Group
            </a>
            <a
              href="/parties"
              className="block px-3 md:px-4 py-2 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center"
            >
              Add Party
            </a>
            <a
              href="/sales"
              className="block px-3 md:px-4 py-2 text-sm md:text-base bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-center"
            >
              New Sale
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">Features</h3>
          <ul className="space-y-2 text-sm md:text-base text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-600">*</span> Stock Item Management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">*</span> Inventory Tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">*</span> Sales & Purchase
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">*</span> Payment Management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">*</span> Party Management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">*</span> Reports & Analytics
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

