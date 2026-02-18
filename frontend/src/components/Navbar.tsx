import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread notifications when admin is logged in
  useEffect(() => {
    if (!isAdmin) return;
    const fetchCount = async () => {
      try {
        const { data } = await API.get('/admin/stats');
        setUnreadCount(data.unreadNotifications || 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // every 30s
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-yellow-400 hover:text-yellow-300 transition">
            <Package className="w-7 h-7" />
            <span>Books Cart</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart (hidden for admin) */}
                {!isAdmin && (
                  <Link to="/cart" className="relative flex items-center space-x-1 hover:text-yellow-400 transition px-3 py-2 rounded-md text-sm font-medium">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:inline">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Orders (for customers) */}
                {!isAdmin && (
                  <Link to="/orders" className="flex items-center space-x-1 hover:text-yellow-400 transition px-3 py-2 rounded-md text-sm font-medium">
                    <Package className="w-5 h-5" />
                    <span className="hidden sm:inline">Orders</span>
                  </Link>
                )}

                {/* Admin Portal */}
                {isAdmin && (
                  <Link to="/admin" className="relative flex items-center space-x-1 hover:text-yellow-400 transition px-3 py-2 rounded-md text-sm font-medium">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="hidden sm:inline">Admin Portal</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User info */}
                <span className="text-sm text-gray-300 hidden md:inline">
                  Hi, {user.name}
                </span>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center space-x-1 hover:text-yellow-400 transition px-3 py-2 rounded-md text-sm font-medium">
                  <User className="w-5 h-5" />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition px-4 py-2 rounded-md text-sm font-bold">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
