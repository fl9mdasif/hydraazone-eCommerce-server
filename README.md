# 🌿 Sultan Bazar (সূলতান বাজার) - E-Commerce Platform

**Sultan Bazar** is a full-featured, high-performance E-Commerce platform built for selling 100% natural spices, oils, and cooking essentials. Designed with a robust architecture and a beautiful modern user interface, the platform offers a seamless shopping experience for customers and powerful management tools for administrators.

---

## ✨ Key Features

### 🛒 Core E-Commerce Flow
- **Product Management**: Support for product tags, categories, descriptions, price management (regular vs. discount prices), and variant tracking.
- **Shopping Cart**: Real-time cart management synchronized with backend APIs.
- **Checkout System**: Integrated billing/shipping address forms and payment method processing (e.g., Cash on Delivery).

---

### 👥 Multi-Role Dashboards

The application employs a strict **Role-Based Access Control (RBAC)** system with three distinct roles and interfaces: **Customer**, **Admin**, and **Superadmin**.

---

#### 🔐 Role-Based Authentication & Authorization

Access to routes, UI elements, and API endpoints is strictly governed by user roles:

| Feature / Action               | Customer | Admin | Superadmin |
|-------------------------------|----------|-------|------------|
| Browse & view products        | ✅        | ✅     | ✅          |
| Place orders                  | ✅        | ❌     | ❌          |
| Track own orders              | ✅        | ❌     | ❌          |
| Update profile & address      | ✅        | ✅     | ✅          |
| Manage products & categories  | ❌        | ✅     | ✅          |
| Manage all orders             | ❌        | ✅     | ✅          |
| Manage users                  | ❌        | ✅     | ✅          |
| Manage admins & global config | ❌        | ❌     | ✅          |

- **JWT-based authentication** with role-embedded tokens
- **Protected routes** on both frontend (Next.js middleware) and backend (Express middleware)
- Non-authenticated users can browse products freely but are redirected to `/login` on any purchase action
- After login/signup, users are returned to their original destination via `location.state.from`

---

#### 1. 👤 User Dashboard (Customer)

![User Orders System](https://i.ibb.co.com/LXH5kxz4/order-user.png)

**Order Management**
- **At-a-glance Stats**: Quick view of Total Orders, Pending, Processing, Shipped, Delivered, and Cancelled orders.
- **Quick Cancellations**: Cancel orders directly from the dashboard before they are processed.

**🚚 Live Order Status Tracking**
- A dynamic, visual progress bar (`Placed → Confirmed → Processing → Shipped → Delivered`) that updates in real-time via RTK Query polling (5-second intervals).
- Each status change is timestamped and logged — customers can see the full journey of their order.
- Status history is preserved so customers know exactly when their order was confirmed, dispatched, or delivered.

**📧 Email Notifications (Customer)**
- **Order Confirmation**: Automatic email sent immediately after a successful order is placed, including order number, itemized list, total amount, and estimated delivery.
- **Shipping Notification**: Email alert sent when an admin marks the order as **Shipped**, including courier details and tracking reference if available.
- **Delivery Confirmation**: Email sent when order status is updated to **Delivered**.

**⭐ Product Reviews**
- Customers can leave reviews only for products from **Delivered** orders (enforced server-side).
- Reviews are submitted from the dedicated "To Review" tab in the dashboard.
- Each review updates the product's aggregated `rating` and `reviewCount` automatically.

**👤 Account Settings**
- **Update Profile**: Edit full name, phone number, and profile picture.
- **Update Password**: Secure password change with current password verification before accepting a new one.
- **Manage Shipping Addresses**: Add, edit, or remove saved shipping addresses. Set a default address that auto-fills at checkout — no more retyping on every order.

**🔍 Advanced Product Filtering**
- Filter products by **category**, **price range**, **brand**, **rating**, and **availability**.
- Sort results by **newest**, **price low to high**, **price high to low**, and **top rated**.
- Persistent filter state in URL query params — shareable and browser back-button friendly.
- Text search powered by MongoDB text index across product name, description, and tags.

---

#### 2. 🛠️ Admin Dashboard

![Admin Dashboard](https://i.ibb.co.com/N6mNvpZv/admin-dashboard.png)

**📊 Analytics Hub**
- Dual-Axis **Sales Composed Chart** (Revenue Area + Order Volume Line graph) tracking trends over time.
- **Order Status Pie Chart** visually breaking down the lifecycle distribution of current orders.
- **Financial Metrics**: Real-time revenue calculation aggregating successfully delivered orders.

**📧 Email Notifications (Admin)**
- **New Order Alert**: Admin receives an instant email notification every time a customer places a new order, including customer name, ordered items, total value, and shipping address.
- Notifications are sent via a queued email service to avoid blocking the order creation response.

**📦 Product Management**
- Full **CRUD** for products: create, edit, archive, and delete.
- **Variant Management**: Add, update, or remove variants (e.g., 250ml, 500ml, 1L) per product including individual pricing, stock levels, SKUs, and images.
- **Stock Control**: Update stock quantities per variant. Products with zero stock are automatically flagged as unavailable.
- **Category Assignment**: Assign or reassign products to categories with support for nested category trees.
- **SEO Fields**: Manage `metaTitle` and `metaDescription` per product for search engine optimization.

**🗂️ Order Management**
- View and manage all orders with pagination and status-based filtering.
- Update order status through the full lifecycle: `Pending → Confirmed → Processing → Shipped → Delivered`.
- Cancel orders with a mandatory reason — stock is automatically restored on cancellation.
- Every status change is logged to the order's `statusHistory` array with a timestamp.

**👥 User Management**
- View all registered customers with their order history and account details.
- Search and filter users by name, email, or registration date.
- View per-user order summaries directly from the CRM interface.

**⚙️ Admin Settings**
- Update administrator profile details (name, email, profile image).
- Manage core store configurations (store name, contact info, free shipping threshold, etc.).

**🔲 Sidebar Navigation**
- Centralized, sticky navigation drawer (mobile-friendly) linking to:
  - **Dashboard** — High-level overview & analytics
  - **Categories & Products** — Inventory control and tag grouping
  - **Orders** — Full transaction lifecycle management and fulfillment
  - **Users** — CRM interface to view all registered customers and their history
  - **Settings** — Store and profile configurations

---

#### 3. 🔑 Superadmin Dashboard

- Features all privileges of the standard Admin, plus:
- Enhanced system-level control and global settings management.
- Ability to create, manage, and revoke Admin accounts.
- Oversight of all administrators and their activity logs.

---

## 🏗️ System Highlights & Engineering Decisions

1. **Hydration & Reliability**: Next.js hydration boundaries are strictly managed using `suppressHydrationWarning` at the root, preventing third-party browser extensions from crashing the initial DOM render state.
2. **Real-time UX Strategy**: Instead of heavyweight WebSockets for order tracking, the app utilizes RTK Query's built-in `pollingInterval` on targeted views (like the User's Active Orders). This provides the illusion of real-time updates when an Admin changes a status, without sacrificing server resources.
3. **Email Notification Queue**: Order confirmation and shipping emails are dispatched via an async queue (Nodemailer + async job), ensuring the API response is never blocked by email delivery latency.
4. **Advanced Filtering Architecture**: Filters are composed dynamically into MongoDB queries server-side. URL query params drive filter state on the frontend, making filtered views shareable and SEO-friendly.
5. **Component Reusability**: Complex layouts like `OrdersList` handle their own internal data-tabbing logic cleanly while utilizing highly specific UI sub-components (like `OrderStatusTracker`).
6. **Optimized Typing**: Complex external library dependencies (like Recharts formatting callbacks) are effectively typed to prevent production-build crashes while retaining strict TS compiler rules elsewhere.
7. **Stock Integrity**: Stock deduction happens atomically at order placement using MongoDB's `$inc` operator. Cancellations trigger automatic stock restoration, keeping inventory always accurate.

---

## 🚀 Tech Stack

### Frontend Architecture
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) — Server-Side Rendering (SSR) & Static Site Generation (SSG) for optimal SEO and performance.
- **State Management**: [Redux Toolkit (RTK) & RTK Query](https://redux-toolkit.js.org/) — Efficient client state management and real-time backend data fetching with built-in caching and polling mechanisms.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) — Utility-first styling with accessible, highly customizable UI components.
- **Data Visualization**: [Recharts](https://recharts.org/) — Dynamic, responsive SVGs for sales and order analytics.
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend Architecture
- **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Language**: TypeScript — End-to-end type safety across the entire stack.
- **Authentication**: JWT (JSON Web Tokens) with role-based routing (Customer, Admin, Superadmin).
- **Email Service**: [Nodemailer](https://nodemailer.com/) — Transactional emails for order confirmations and shipping notifications.

---

## 🏃‍♂️ Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB instance running locally or via MongoDB Atlas
- Git
- SMTP credentials for email notifications (Gmail App Password or any SMTP provider)

### 1. Backend Setup (`/sultan-bazar-server`)
```bash
cd sultan-bazar-server
npm install

# Create a .env file and configure the following:
# PORT=5000
# DATABASE_URL=mongodb_uri_here
# JWT_SECRET=your_jwt_secret
# JWT_EXPIRES_IN=7d
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# ADMIN_EMAIL=admin@sultanbazar.com
# CLIENT_URL=http://localhost:3000

npm run dev
```

### 2. Frontend Setup (`/sultan-bazar-client`)
```bash
cd sultan-bazar-client
npm install

# Create a .env file pointing to the backend API
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

npm run dev
```

The client will be available at `http://localhost:3000` and the server at `http://localhost:5000`.

---

*Built with ❤️ for a seamless, natural shopping experience.*