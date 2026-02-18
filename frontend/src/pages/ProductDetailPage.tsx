import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data);
      } catch (err: unknown) {
        setError(axios.isAxiosError(err) ? err.response?.data?.message : 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionError('');
    try {
      setAddingToCart(true);
      await addToCart(product!.id, quantity);
      setAddedMsg('Added to cart!');
      setTimeout(() => setAddedMsg(''), 2000);
    } catch (err: unknown) {
      setActionError(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to add to cart');
      setTimeout(() => setActionError(''), 5000);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="max-w-4xl mx-auto py-10 px-4"><div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div></div>;
  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition cursor-pointer">
        <ArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden grid md:grid-cols-2 gap-0">
        {/* Image */}
        <div className="bg-gray-100 flex items-center justify-center p-8">
          <img
            src={product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={product.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>

        {/* Details */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description || 'No description available.'}</p>
            <div className="text-4xl font-bold text-green-600 mb-4">₹{Number(product.price).toFixed(2)}</div>
            <span className={`inline-block text-sm px-3 py-1 rounded-full mb-6 ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
            </span>
          </div>

          {product.stock > 0 && (
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-gray-700 font-medium">Qty:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  {[...Array(Math.min(product.stock, 10)).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>{x + 1}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>

              {addedMsg && (
                <div className="mt-3 text-center text-green-600 font-medium">{addedMsg}</div>
              )}

              {actionError && (
                <div className="mt-3 text-center text-red-600 font-medium">{actionError}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
