# EcoTrack 🌍
### AI-Based Carbon Footprint Calculator and Eco Recommendation System
**Final Year Computer Science Engineering Project**

EcoTrack is a modern, full-stack environmental sustainability platform. It empowers individuals and organizations to calculate their exact greenhouse gas (GHG) emissions across 7 everyday categories using IPCC/EPA/DEFRA emission factors, receive personalized AI-powered reduction recommendations via Groq AI, track trends over time with interactive analytics, and securely manage their eco journey with Supabase.

---

## 🏗️ Architecture & Technology Stack

The project follows a strictly separated frontend and backend architecture:

```
                  ┌────────────────────────────────────────┐
                  │    React + Vite Client Application     │
                  │   (Bootstrap 5, Chart.js, React Router)│
                  └───────────────┬────────────────────────┘
                                  │
                   HTTPS / JSON   │ Bearer JWT / Public API
                                  ▼
                  ┌────────────────────────────────────────┐
                  │     Node.js + Express.js REST API      │
                  │      (Deterministic Calc Engine)       │
                  └───────────┬──────────────┬─────────────┘
                              │              │
                              ▼              ▼
                    ┌──────────────────┐   ┌───────────────────┐
                    │  Supabase Cloud  │   │      Groq AI      │
                    │  - Auth (JWT)    │   │  - AI Eco-Coach   │
                    │  - PostgreSQL    │   │  - Model:         │
                    │  - Storage       │   │    gpt-oss-120b   │
                    │  - RLS Policies  │   │  - Recommendations│
                    └──────────────────┘   └───────────────────┘
```

### Frontend (`frontend/`)
- **Framework**: React 18+ with Vite
- **Routing**: React Router DOM (Declarative client-side routing, protected routes, admin guards)
- **Styling**: Bootstrap 5, Bootstrap Icons, custom glassmorphism & responsive CSS variables
- **Visualizations**: Chart.js & react-chartjs-2
- **Authentication**: Supabase JS Client (`@supabase/supabase-js`)
- **API Client**: Centralized fetch wrapper with automatic JWT Bearer token injection

### Backend (`backend/`)
- **Runtime**: Node.js (>= 18)
- **Framework**: Express.js REST API (`/api/v1` and `/api` versioned endpoints)
- **Calculation Engine**: 100% deterministic JavaScript implementation of IPCC, EPA, DEFRA emission factors
- **AI Integration**: Official Groq SDK (`groq-sdk`) calling high-speed models (`openai/gpt-oss-120b`)
- **Security**: Helmet, CORS, rate limiting (`express-rate-limit`), Bearer JWT verification, input sanitization
- **File Handling & Exports**: Multer (in-memory streaming), PDFKit, csv-stringify

### External Cloud Services
- **Supabase Auth**: Secure JWT-based registration, email verification, session refresh
- **Supabase PostgreSQL**: Relational schema with Row Level Security (RLS) policies
- **Supabase Storage**: Buckets for user avatars (`profile-images`) and feedback screenshots (`feedback-images`)
- **Groq AI**: Server-side natural language recommendation generator and interactive eco-assistant

---

## 📦 Directory Structure

```
ECOTRACK/
├── backend/                         # Express.js REST API
│   ├── src/
│   │   ├── config/                  # Environment, Supabase, Groq configuration
│   │   │   ├── env.js
│   │   │   ├── groq.js
│   │   │   └── supabase.js
│   │   ├── controllers/             # Request handlers for all 12 modules
│   │   │   ├── adminController.js
│   │   │   ├── aiController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── authController.js
│   │   │   ├── calculatorController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── feedbackController.js
│   │   │   ├── healthController.js
│   │   │   ├── historyController.js
│   │   │   └── profileController.js
│   │   ├── middleware/              # Auth, admin, upload, and error handling
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── upload.js
│   │   ├── routes/                  # Express API route declarations
│   │   │   └── index.js
│   │   ├── services/                # Business logic & calculation engine
│   │   │   ├── calculatorService.js
│   │   │   ├── emissionFactorService.js
│   │   │   ├── exportService.js
│   │   │   └── groqService.js
│   │   └── server.js                # Server entrypoint
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── test_suite.js                # Automated backend verification test
│
├── frontend/                        # React + Vite application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Images and icons
│   │   ├── components/              # Shared UI components
│   │   │   ├── common/              # LoadingSpinner, alerts, badges
│   │   │   └── layout/              # Header, Footer, Layout, ProtectedRoute, AdminRoute
│   │   ├── context/                 # AuthContext (Supabase auth state & profile)
│   │   ├── pages/                   # Application views
│   │   │   ├── admin/               # Admin dashboard, user management, calculations, feedback
│   │   │   ├── analytics/           # Sector breakdown, interactive charts
│   │   │   ├── auth/                # Login, Signup, ForgotPassword, ResetPassword
│   │   │   ├── calculator/          # 7-category footprint calculator
│   │   │   ├── dashboard/           # User summary, Eco Score, quick actions
│   │   │   ├── feedback/            # Bug/feature reports with screenshot uploads
│   │   │   ├── history/             # Audit logs, CSV/PDF export, batch delete
│   │   │   ├── profile/             # Profile details, avatar upload, password update
│   │   │   ├── recommendations/     # Groq AI advice, interactive eco coach, challenges
│   │   │   ├── LandingPage.jsx      # Public product landing page
│   │   │   └── NotFound.jsx         # 404 page
│   │   ├── services/                # API client and Supabase client
│   │   │   ├── api.js
│   │   │   └── supabase.js
│   │   ├── App.css
│   │   ├── App.jsx                  # Main router setup
│   │   ├── index.css                # Global theme & typography
│   │   └── main.jsx                 # Vite React DOM entrypoint
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   └── vite.config.js               # Vite config with /api proxy to backend
│
├── supabase_schema.sql              # Supabase PostgreSQL schema, RLS policies & triggers
├── .gitignore                       # Repository-wide gitignore
└── README.md                        # Project documentation
```

---

## 🌟 The 12 Preserved Core Modules

1. **Project Initialization & Layout**: Clean responsive layout enforcing full-height flex-column structure so the footer naturally sits at the base.
2. **Landing Page**: Public hero section, feature showcases, IPCC methodology explanations, and calls to action.
3. **Supabase Authentication**: User registration, login, logout, password recovery, session persistence, and profile creation.
4. **User Dashboard**: High-level emission overview, 0-100 normalized Eco Score, category breakdown, and recent records.
5. **Carbon Footprint Calculator**: 7 categories (Transportation, Electricity, Water, Food/Diet, Waste, Shopping, Travel) computed deterministically.
6. **Groq AI Recommendations**: AI-generated action plan, weekly challenges, monthly goals, potential carbon reductions, and interactive eco-coach.
7. **Analytics Dashboard**: Multi-period historical trends (1m, 3m, 6m, 1y, All), category averages, and interactive Chart.js visualizations.
8. **Calculation History & Exports**: Full history list, single/batch deletion, wipe-all option, CSV export, and formatted PDF report download.
9. **User Profile & Image Upload**: User information update, diet and transit preferences, profile picture upload to Supabase Storage, and password changes.
10. **Feedback & Screenshot Upload**: Bug and feature submission form with rating and screenshot uploads stored in Supabase Storage.
11. **Admin Panel**: Role-protected management console (user roles, account activation, calculation log inspection, feedback moderation, platform-wide analytics export).
12. **Testing & Verification**: Automated backend test suite and production build verification.

---

## ⚙️ Environment Configuration

### Backend Environment (`backend/.env`)

Create `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5173

# Supabase Cloud (Project: nzlkggnobpbdrivmqmhj)
SUPABASE_URL=https://nzlkggnobpbdrivmqmhj.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Groq AI
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

### Frontend Environment (`frontend/.env`)

Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://nzlkggnobpbdrivmqmhj.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=
```
*(Leaving `VITE_API_BASE_URL` empty allows Vite's dev server to automatically proxy `/api` requests to `http://127.0.0.1:5000` without CORS).*

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 2. Install & Run the Backend
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Run automated tests to verify configuration and formulas
node test_suite.js

# Start the development server (auto-reloads on file changes)
npm run dev
```
*Backend will start on `http://localhost:5000`.*

### 3. Install & Run the Frontend
Open a separate terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*Frontend will be accessible at `http://localhost:5173`.*

---

## 📡 API Endpoint Reference

All endpoints are available under both `/api/v1` and `/api`:

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` | No | System health and uptime probe |
| `POST` | `/api/v1/auth/signup` | No | Register a new user |
| `GET` | `/api/v1/auth/me` | Bearer Token | Get current user and profile |
| `POST` | `/api/v1/auth/forgot-password`| No | Request password reset |
| `GET` | `/api/v1/dashboard/summary` | Bearer Token | User dashboard totals, Eco Score, breakdown |
| `GET` | `/api/v1/calculator/factors` | No | Retrieve IPCC/EPA/DEFRA emission factor table |
| `POST` | `/api/v1/calculator/calculate` | Bearer Token | Compute and save 7-category carbon calculation |
| `GET` | `/api/v1/calculator/latest` | Bearer Token | Get the user's latest calculation |
| `GET` | `/api/v1/calculator/:id` | Bearer Token | Get specific calculation details |
| `GET` | `/api/v1/ai/recommendations` | Bearer Token | Get AI recommendation list and structured cards |
| `POST` | `/api/v1/ai/recommendations/generate` | Bearer Token | Generate new recommendations via Groq AI |
| `POST` | `/api/v1/ai/generate` | Bearer Token | Interactive query with Groq AI Eco-Coach |
| `GET` | `/api/v1/analytics` | Bearer Token | Historical trends and category averages |
| `GET` | `/api/v1/history` | Bearer Token | List calculation records |
| `GET` | `/api/v1/history/export/csv` | Bearer Token | Download calculation history as CSV |
| `GET` | `/api/v1/history/export/pdf` | Bearer Token | Download calculation history as formatted PDF |
| `DELETE` | `/api/v1/history/:id` | Bearer Token | Delete calculation record |
| `POST` | `/api/v1/history/batch-delete`| Bearer Token | Delete multiple records by ID array |
| `POST` | `/api/v1/history/delete-all` | Bearer Token | Wipe all user calculations |
| `GET` | `/api/v1/profile` | Bearer Token | Get user profile and preferences |
| `PUT` | `/api/v1/profile` | Bearer Token | Update user preferences |
| `POST` | `/api/v1/profile/avatar` | Bearer Token | Upload profile picture to Supabase Storage |
| `DELETE`| `/api/v1/profile/avatar` | Bearer Token | Remove profile picture |
| `POST` | `/api/v1/profile/change-password` | Bearer Token | Change user password |
| `POST` | `/api/v1/feedback` | Bearer Token | Submit feedback with optional screenshot |
| `GET` | `/api/v1/feedback/my` | Bearer Token | View submitted feedback tickets |
| `GET` | `/api/v1/admin/stats` | Admin Token | View platform-wide statistics |
| `GET` | `/api/v1/admin/users` | Admin Token | List and search all users |
| `PUT` | `/api/v1/admin/users/:id/role`| Admin Token | Change user role (`user` or `admin`) |
| `PUT` | `/api/v1/admin/users/:id/status`| Admin Token | Activate or suspend user account |
| `GET` | `/api/v1/admin/calculations` | Admin Token | Paginated platform calculations |
| `GET` | `/api/v1/admin/feedback` | Admin Token | Moderate and view user feedback |
| `PUT` | `/api/v1/admin/feedback/:id/status` | Admin Token | Update feedback status (`pending`, `reviewed`, `resolved`) |
| `GET` | `/api/v1/admin/export/analytics` | Admin Token | Export platform metrics as CSV |

---

## 🧮 Emission Factor Methodology

Emissions are calculated deterministically in `backend/src/services/calculatorService.js` using international scientific benchmarks:

| Category | Input Unit | Emission Factor | Reference Standard |
|---|---|---|---|
| **Transportation (Car)** | km | 0.192 kg CO₂e / km | EPA Passenger Vehicle Average |
| **Transportation (Bus)** | km | 0.089 kg CO₂e / km | DEFRA Public Transit Standard |
| **Transportation (EV)** | km | 0.053 kg CO₂e / km | Average Grid Mix EV Charging |
| **Electricity** | kWh | 0.475 kg CO₂e / kWh | US/Global Grid Average |
| **Water** | Litres | 0.000375 kg CO₂e / L | Municipal Water Supply Standard |
| **Food (Dietary Baseline)** | Monthly | Vegan: 1.5, Veg: 2.0, Meat: 3.3 kg/day | IPCC Dietary GHG Benchmark |
| **Waste (Landfill)** | kg | 0.45 kg CO₂e / kg | Municipal Solid Waste Landfill |
| **Shopping (Clothing)** | Items | 10.0 kg CO₂e / item | Textile Lifecycle Analysis |
| **Shopping (Electronics)**| Items | 50.0 kg CO₂e / item | Consumer Electronics Embodied Carbon |
| **Travel (Flight)** | Flights | 150 kg (Domestic) / 450 kg (International) | ICAO Aviation Calculator |

### Eco Score Formula
$$\text{Eco Score} = \max\left(0, \min\left(100, 100 - \left(\frac{\text{Total Emissions}}{2000}\right) \times 100\right)\right)$$
- **80 – 100**: Eco Champion
- **60 – 79**: Eco Conscious
- **40 – 59**: Needs Improvement
- **0 – 39**: High Carbon Impact

---

## 🛡️ Security & Best Practices

- **Zero Secret Leakage**: The Supabase service-role key and Groq API key are stored strictly in the backend `.env` and are never bundled or exposed to the client.
- **Row Level Security (RLS)**: PostgreSQL tables enforce database-level policies ensuring users can only read and write their own data.
- **Role-Based Access Control (RBAC)**: All admin routes are guarded both client-side via React Route wrappers and server-side via `requireAdmin` middleware.
- **Rate Limiting & Helmet**: Prevents denial of service and enforces modern HTTP security headers.
- **Deterministic Math**: Groq AI is strictly used for actionable advice and insights—emissions calculations are computed solely by deterministic application code.

---

## 🧪 Verification & Production Build

### Running Backend Tests
```bash
cd backend
node test_suite.js
```
Expected result: **15 / 15 assertions passed (100%)**.

### Building the Frontend for Production
```bash
cd frontend
npm run build
```
Creates an optimized, minified bundle in `frontend/dist/`.

---

## 📄 License
This project is developed for educational and academic evaluation as a Final Year Computer Science Engineering capstone project.
