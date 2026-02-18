import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  description: string;
}

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products');
        setProducts(data);
      } catch (err: unknown) {
        setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl p-8 mb-10">
        <h1 className="text-4xl font-bold mb-2">Welcome to Books Cart</h1>
        <p className="text-gray-300 text-lg mb-6">Discover amazing products at great prices.</p>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-3 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-10">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
