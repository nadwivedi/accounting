import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Products', path: '/products', icon: '📦' },
    { name: 'Categories', path: '/categories', icon: '🏷️' },
    { name: 'Parties', path: '/parties', icon: '👥' },
    { name: 'Purchase', path: '/purchases', icon: '🛒' },
    { name: 'Sale', path: '/sales', icon: '💳' },
    { name: 'Payments', path: '/payments', icon: '💰' },
    { name: 'Reports', path: '/reports', icon: '📈' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white h-screen fixed transition-all duration-300 overflow-y-auto`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isOpen && <h1 className="text-2xl font-bold">BillHub</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-800 rounded-lg"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="mt-8 space-y-2 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
            title={!isOpen ? item.name : ''}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span className="font-medium">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
