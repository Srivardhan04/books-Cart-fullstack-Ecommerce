import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/api';
import Spinner from '../components/Spinner';
import { Plus, Edit, Trash2, PackageOpen, ClipboardList } from 'lucide-react';

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
  user_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', image_url: '', stock: '' });

  // Fetch products or orders based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (tab === 'products') {
          const { data } = await API.get('/products');
          setProducts(data);
        } else {
          const { data } = await API.get('/orders');
          setOrders(data);
        }
      } catch (err: unknown) {
        setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  const resetForm = () => {
    setForm({ name: '', price: '', description: '', image_url: '', stock: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

      // Refresh products
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
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to delete product');
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await API.put(`/orders/${orderId}`, { status });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition cursor-pointer ${
            tab === 'products' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <PackageOpen className="w-5 h-5" />
          <span>Products</span>
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition cursor-pointer ${
            tab === 'orders' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>Orders</span>
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <Spinner />
      ) : tab === 'products' ? (
        <div>
          {/* Add Product Button */}
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition mb-6 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>

          {/* Product Form Modal */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-yellow-400">
              <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSubmitProduct} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none resize-none" />
                </div>
                <div className="md:col-span-2 flex space-x-3">
                  <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg transition cursor-pointer">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button type="button" onClick={resetForm} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-8 rounded-lg transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={product.image_url || 'https://via.placeholder.com/40x40?text=N'} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                          <span className="font-medium text-gray-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-green-600 font-bold">₹{Number(product.price).toFixed(2)}</td>
                      <td className="px-6 py-4">{product.stock}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 transition cursor-pointer">
                          <Edit className="w-5 h-5 inline" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition cursor-pointer">
                          <Trash2 className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-gray-800">#{order.id}</td>
                    <td className="px-6 py-4 text-gray-700">{order.user_name}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">₹{Number(order.total_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
