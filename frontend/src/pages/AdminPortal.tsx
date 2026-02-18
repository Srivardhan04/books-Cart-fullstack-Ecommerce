import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/api';
import Spinner from '../components/Spinner';
import {
  BarChart3,
  ShoppingBag,
  Users,
  DollarSign,
  IndianRupee,
  Bell,
  ClipboardList,
  PackageOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCheck,
  Clock,
  Truck,
  XCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────
interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  unreadNotifications: number;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  order_id: number | null;
  is_read: boolean;
  created_at: string;
  total_amount: number | null;
  order_status: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface OrderDetail extends Order {
  items: { id: number; name: string; quantity: number; price: number; image_url: string }[];
}

interface Customer {
  id: number;
  name: string;
  email: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

type Tab = 'dashboard' | 'orders' | 'products' | 'customers' | 'notifications';

// ── Status badge helper ────────────────────────────
const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
  shipped: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ status }: { status: string }) => {
  const c = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ══════════════════════════════════════════════════════
// ADMIN PORTAL
// ══════════════════════════════════════════════════════
const AdminPortal: React.FC = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', image_url: '', stock: '' });

  // ── Fetch data based on tab ──
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (tab === 'dashboard') {
          const [statsRes, notifRes] = await Promise.all([
            API.get('/admin/stats'),
            API.get('/admin/notifications'),
          ]);
          setStats(statsRes.data);
          setNotifications(notifRes.data);
        } else if (tab === 'orders') {
          const { data } = await API.get('/admin/orders');
          setOrders(data);
        } else if (tab === 'products') {
          const { data } = await API.get('/products');
          setProducts(data);
        } else if (tab === 'customers') {
          const { data } = await API.get('/admin/customers');
          setCustomers(data);
        } else if (tab === 'notifications') {
          const { data } = await API.get('/admin/notifications');
          setNotifications(data);
        }
      } catch (err: unknown) {
        setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  // ── Order detail view ──
  const viewOrder = async (orderId: number) => {
    try {
      const { data } = await API.get(`/admin/orders/${orderId}`);
      setSelectedOrder(data);
    } catch {
      setError('Failed to load order details');
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await API.put(`/orders/${orderId}`, { status });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update status');
    }
  };

  // ── Notifications ──
  const markRead = async (id: number) => {
    await API.put(`/admin/notifications/${id}/read`);
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    if (stats) setStats({ ...stats, unreadNotifications: Math.max(0, stats.unreadNotifications - 1) });
  };

  const markAllRead = async () => {
    await API.put('/admin/notifications/read-all');
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    if (stats) setStats({ ...stats, unreadNotifications: 0 });
  };

  // ── Product CRUD ──
  const resetForm = () => {
    setForm({ name: '', price: '', description: '', image_url: '', stock: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        description: form.description,
        image_url: form.image_url,
        stock: parseInt(form.stock),
      };
      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}`, payload);
      } else {
        await API.post('/products', payload);
      }
      const { data } = await API.get('/products');
      setProducts(data);
      resetForm();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description || '',
      image_url: product.image_url || '',
      stock: String(product.stock),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to delete');
    }
  };

  // ── Sidebar nav items ──
  const navItems: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'orders', label: 'Orders', icon: <ClipboardList className="w-5 h-5" /> },
    { key: 'products', label: 'Products', icon: <PackageOpen className="w-5 h-5" /> },
    { key: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: stats?.unreadNotifications || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="w-64 bg-gray-900 min-h-screen sticky top-16 hidden lg:block">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-bold text-lg tracking-tight">Admin Portal</h2>
            <p className="text-gray-500 text-xs mt-0.5">Manage your store</p>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setTab(item.key); setSelectedOrder(null); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  tab === item.key
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    tab === item.key ? 'bg-gray-900 text-yellow-400' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Mobile nav ── */}
        <div className="lg:hidden w-full bg-white border-b sticky top-16 z-40 overflow-x-auto">
          <div className="flex p-2 gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setTab(item.key); setSelectedOrder(null); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  tab === item.key ? 'bg-yellow-400 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold cursor-pointer">&times;</button>
            </div>
          )}

          {loading ? (
            <Spinner />
          ) : (
            <>
              {/* ═══════ DASHBOARD ═══════ */}
              {tab === 'dashboard' && stats && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={<IndianRupee />} label="Revenue" value={`₹${Number(stats.totalRevenue).toFixed(2)}`} color="emerald" />
                    <StatCard icon={<ShoppingBag />} label="Total Orders" value={stats.totalOrders} color="blue" />
                    <StatCard icon={<Clock />} label="Pending" value={stats.pendingOrders} color="amber" />
                    <StatCard icon={<Users />} label="Customers" value={stats.totalUsers} color="violet" />
                  </div>

                  {/* Recent Notifications */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Recent Notifications
                      </h2>
                      <button
                        onClick={() => setTab('notifications')}
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`px-5 py-3 flex items-start gap-3 ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                          </div>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ ORDERS ═══════ */}
              {tab === 'orders' && !selectedOrder && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Order</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Customer</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Amount</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                            <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition">
                              <td className="px-5 py-3 font-semibold text-gray-900">#{order.id}</td>
                              <td className="px-5 py-3">
                                <div className="text-gray-800">{order.customer_name}</div>
                                <div className="text-xs text-gray-400">{order.customer_email}</div>
                              </td>
                              <td className="px-5 py-3 font-semibold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</td>
                              <td className="px-5 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                              <td className="px-5 py-3">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => viewOrder(order.id)}
                                  className="text-blue-600 hover:text-blue-800 transition cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-4.5 h-4.5 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {orders.length === 0 && (
                        <p className="text-center text-gray-400 py-12">No orders yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ ORDER DETAIL ═══════ */}
              {tab === 'orders' && selectedOrder && (
                <div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Orders
                  </button>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.id}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                          Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <StatusBadge status={selectedOrder.status} />
                    </div>

                    {/* Customer & Shipping info */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Customer</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Shipping Address</p>
                        <p className="text-sm text-gray-900 leading-snug">
                          {selectedOrder.shipping_address}<br />
                          {selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip_code}<br />
                          {selectedOrder.country}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment</p>
                        <p className="font-semibold text-gray-900">Cash on Delivery</p>
                        <p className="text-sm text-gray-500">Total: ₹{Number(selectedOrder.total_amount).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Status update */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-sm font-medium text-gray-600">Update Status:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Items table */}
                    <h3 className="font-semibold text-gray-900 mb-3">Items ({selectedOrder.items.length})</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600">Qty</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Price</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 font-medium text-gray-800">{item.name || 'Deleted product'}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-600">₹{Number(item.price).toFixed(2)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">Total</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">₹{Number(selectedOrder.total_amount).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ PRODUCTS ═══════ */}
              {tab === 'products' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <button
                      onClick={() => { resetForm(); setShowForm(true); }}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  {/* Product Form */}
                  {showForm && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                      <h2 className="text-lg font-bold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                      <form onSubmit={handleSubmitProduct} className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
                          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price (₹)</label>
                          <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Stock</label>
                          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Image URL</label>
                          <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none resize-none" />
                        </div>
                        <div className="sm:col-span-2 flex gap-3">
                          <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer">
                            {editingProduct ? 'Update' : 'Add Product'}
                          </button>
                          <button type="button" onClick={resetForm} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 px-6 rounded-lg text-sm transition cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Products Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Product</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Price</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Stock</th>
                            <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition">
                              <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                              <td className="px-5 py-3 text-emerald-600 font-semibold">₹{Number(p.price).toFixed(2)}</td>
                              <td className="px-5 py-3">
                                <span className={`text-sm font-medium ${Number(p.stock) <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {p.stock} {Number(p.stock) <= 5 ? '(Low)' : ''}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right space-x-3">
                                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="w-4 h-4 inline" /></button>
                                <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="w-4 h-4 inline" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ CUSTOMERS ═══════ */}
              {tab === 'customers' && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Customer</th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
                            <th className="px-5 py-3 text-center font-semibold text-gray-600">Orders</th>
                            <th className="px-5 py-3 text-right font-semibold text-gray-600">Total Spent</th>
                            <th className="px-5 py-3 text-right font-semibold text-gray-600">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customers.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50/50 transition">
                              <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                              <td className="px-5 py-3 text-gray-500">{c.email}</td>
                              <td className="px-5 py-3 text-center font-semibold text-gray-700">{Number(c.total_orders)}</td>
                              <td className="px-5 py-3 text-right font-semibold text-emerald-600">₹{Number(c.total_spent).toFixed(2)}</td>
                              <td className="px-5 py-3 text-right text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {customers.length === 0 && (
                        <p className="text-center text-gray-400 py-12">No customers yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ NOTIFICATIONS ═══════ */}
              {tab === 'notifications' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    {notifications.some((n) => !n.is_read) && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition ${
                          !n.is_read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          n.type === 'new_order' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                            {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {n.order_id && (
                              <button
                                onClick={() => { setTab('orders'); viewOrder(n.order_id!); }}
                                className="text-xs text-blue-600 hover:underline cursor-pointer"
                              >
                                View Order #{n.order_id}
                              </button>
                            )}
                            {!n.is_read && (
                              <button
                                onClick={() => markRead(n.id)}
                                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                        {n.total_amount && (
                          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">₹{Number(n.total_amount).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center py-16">
                        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No notifications</p>
                        <p className="text-gray-300 text-sm">You'll be notified when orders come in</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// ── Stat Card Component ──
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color] || colors.blue}`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
};

export default AdminPortal;
