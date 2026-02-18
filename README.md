# Books Cart - Full-Stack E-Commerce Application

A complete full-stack e-commerce website built with **React**, **Node.js + Express**, and **MySQL**.

---

## 🏗️ Architecture

```
Books Cart/
├── backend/                # Node.js + Express REST API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers (MVC)
│   ├── middlewares/        # Auth & error handling middleware
│   ├── routes/             # API route definitions
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── schema.sql          # MySQL database schema
│   └── seed.js             # Sample data seeder
│
├── frontend/               # React (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth, Cart)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service (Axios)
│   │   ├── App.tsx         # Main app with routing
│   │   └── main.tsx        # Entry point
│   └── .env                # Environment variables
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm**

### 1. Setup Database

```sql
-- Open MySQL CLI or a GUI tool and run:
SOURCE backend/schema.sql;
```

Or manually:
```bash
mysql -u root -p < backend/schema.sql
```

### 2. Configure Backend

Edit `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=books_cart
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### 3. Start Backend

```bash
cd backend
npm install
node seed.js        # Optional: seed sample data
npm run dev         # Start with nodemon
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:5173
```

---

## 🔑 Test Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@bookscart.com    | admin123  |
| User  | john@example.com       | user123   |

> The **first user** to register automatically becomes an admin.

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint           | Description        | Auth Required |
|--------|--------------------|--------------------|---------------|
| POST   | `/users/register`  | Register new user  | No            |
| POST   | `/users/login`     | Login user         | No            |
| GET    | `/users/profile`   | Get user profile   | Yes           |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Products

| Method | Endpoint          | Description        | Auth Required |
|--------|-------------------|--------------------|---------------|
| GET    | `/products`       | Get all products   | No            |
| GET    | `/products/:id`   | Get single product | No            |
| POST   | `/products`       | Create product     | Admin         |
| PUT    | `/products/:id`   | Update product     | Admin         |
| DELETE | `/products/:id`   | Delete product     | Admin         |

**Create Product Request:**
```json
{
  "name": "The Great Gatsby",
  "description": "A classic novel...",
  "price": 12.99,
  "stock": 50,
  "image_url": "https://example.com/image.jpg"
}
```

### Cart

| Method | Endpoint      | Description         | Auth Required |
|--------|---------------|---------------------|---------------|
| GET    | `/cart`       | Get cart items      | Yes           |
| POST   | `/cart`       | Add item to cart    | Yes           |
| PUT    | `/cart/:id`   | Update quantity     | Yes           |
| DELETE | `/cart/:id`   | Remove from cart    | Yes           |

**Add to Cart Request:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

### Orders

| Method | Endpoint            | Description          | Auth Required |
|--------|---------------------|----------------------|---------------|
| POST   | `/orders`           | Place order          | Yes           |
| GET    | `/orders/myorders`  | Get user's orders    | Yes           |
| GET    | `/orders/:id`       | Get order details    | Yes           |
| GET    | `/orders`           | Get all orders       | Admin         |
| PUT    | `/orders/:id`       | Update order status  | Admin         |

**Place Order Request:**
```json
{
  "orderItems": [
    { "product_id": 1, "quantity": 2, "price": 12.99 },
    { "product_id": 3, "quantity": 1, "price": 11.99 }
  ],
  "totalAmount": 37.97
}
```

---

## 🔒 Security Features

- **JWT Authentication** with Bearer tokens
- **bcrypt** password hashing (salt rounds: 10)
- **Helmet** for HTTP security headers
- **CORS** enabled for frontend-backend communication
- **Role-based authorization** (user / admin)
- **Input validation** on all endpoints
- **SQL injection prevention** via parameterized queries

---

## 📦 Features

### User Features
- Browse products with search
- View product details
- Add/remove items from cart
- Adjust cart quantities
- Checkout with shipping address (COD)
- View order history with status tracking

### Admin Features
- Add, edit, delete products
- View all orders from all users
- Update order status (pending → shipped → delivered)

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS |
| Backend    | Node.js, Express.js                 |
| Database   | MySQL 8                             |
| Auth       | JWT, bcryptjs                       |
| HTTP       | Axios                               |
| Icons      | Lucide React                        |

---

## 🏭 Production Build

### Frontend
```bash
cd frontend
npm run build    # Output in dist/
```

### Backend
```bash
cd backend
NODE_ENV=production node server.js
```

---

## 🎓 Interview Explanation

### Architecture
This project follows a **3-tier architecture**: Frontend (React SPA) → Backend (Express REST API) → Database (MySQL). The backend uses **MVC pattern** with controllers handling business logic, routes defining endpoints, and middlewares for authentication and error handling.

### Authentication Flow
1. User registers/logs in → server returns JWT token
2. Token stored in localStorage on the client
3. Axios interceptor attaches token to every request via `Authorization: Bearer <token>` header
4. Server middleware verifies token and attaches user to request object
5. Role-based middleware checks `user.role` for admin-only routes

### State Management
- **AuthContext**: Manages user authentication state globally
- **CartContext**: Manages cart state with real-time sync to backend
- Both use React Context API for simplicity and performance

### Database Design
- Normalized schema with proper foreign key constraints
- `ON DELETE CASCADE` for automatic cleanup
- Transaction support for order placement (atomic operation)
- Unique constraint on `cart(user_id, product_id)` to prevent duplicates
