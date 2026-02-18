import React from 'react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, name, price, image_url, stock }) => {
  return (
    <Link to={`/product/${id}`} className="block">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{name}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-bold text-green-600">₹{Number(price).toFixed(2)}</span>
            <span className={`text-sm px-2 py-1 rounded-full ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
