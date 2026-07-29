# EcoTrack 🌍

**EcoTrack** is an AI-powered Carbon Footprint Calculator and Eco Recommendation System. It helps users track their daily emissions, generates personalized sustainability recommendations using Groq AI, and provides detailed analytics to encourage a greener lifestyle.

## 🚀 Features

- **Secure Authentication**: Powered by Supabase (Login, Register, Forgot Password, Role-Based Access Control).
- **Carbon Footprint Calculator**: Accurately calculates emissions based on Transport, Energy, Diet, and Shopping habits.
- **AI Eco Recommendations**: Leverages Groq API to analyze user emissions and provide actionable, personalized advice to reduce their footprint.
- **Analytics Dashboard**: Interactive charts (Chart.js) to visualize carbon emissions over time.
- **History & Profiling**: Track past calculations, update profile pictures (stored in Supabase Storage buckets), and monitor progress.
- **Feedback System**: Report bugs, suggest features, and track support ticket statuses with image attachments.
- **Admin Panel**: A centralized, secure dashboard for administrators to manage users, monitor platform metrics, moderate feedback, and export CSV/PDF reports.

## 🛠️ Architecture & Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Bootstrap 5
- Chart.js (Data Visualization)

**Backend:**
- Python 3.10
- Flask (Application Factory & Blueprints architecture)
- `fpdf2` (PDF Generation)
- `groq` (Groq API SDK)

**Database & Auth:**
- Supabase PostgreSQL
- Supabase Auth (JWT session management)
- Supabase Storage (Profile & Feedback image buckets)
- Row Level Security (RLS) enforced across all tables.

---

## 💻 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ecotrack.git
cd ecotrack
```

### 2. Create a Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Variables
Copy the `.env.example` file to a new file called `.env` and fill in your credentials:
```bash
cp .env.example .env
```
Ensure you provide:
- `SECRET_KEY`: A random string for Flask sessions.
- `SUPABASE_URL` & `SUPABASE_KEY`: From your Supabase project settings.
- `SUPABASE_SERVICE_ROLE_KEY`: Required for the Admin Panel to bypass RLS.
- `GROQ_API_KEY`: From Groq Developer Console.

### 5. Database Setup (Supabase)
Navigate to your Supabase SQL Editor and execute the complete SQL script found in `schema.sql`. This will:
- Create the `users`, `carbon_calculations`, `ai_recommendations`, and `feedback` tables.
- Set up the necessary triggers to sync Supabase Auth users to the public `users` table.
- Configure all Row Level Security (RLS) policies.
- Create the storage buckets (`profile-images` and `feedback-images`).

*Note: To access the Admin Panel, you must manually edit your user record in the Supabase Table Editor and set your `role` to `'admin'`.*

### 6. Run the Application
```bash
python run.py
```
The application will be available at `http://localhost:5000`.

---

## 🚢 Production Deployment

EcoTrack is configured for easy deployment on modern cloud platforms.

### Option A: Docker (Azure App Service / AWS / VPS)
A `Dockerfile` and `docker-compose.yml` are included.
```bash
docker-compose up --build -d
```
Ensure your `.env` file is present in the same directory.

### Option B: Render / Railway / Heroku
The repository contains a `Procfile` and `runtime.txt` tailored for PaaS providers.
1. Connect your GitHub repository to the platform.
2. The build command is automatically handled (usually `pip install -r requirements.txt`).
3. The start command is defined in the `Procfile`: `gunicorn run:app --log-file -`
4. Ensure you set all the Environment Variables directly in the hosting platform's dashboard.
5. Set `FLASK_ENV=production` in the environment variables.

---

## 🔒 Security & Optimization
- **Secure Headers**: The Flask backend forces `X-Content-Type-Options`, `X-Frame-Options`, and `X-XSS-Protection`.
- **Row Level Security**: Users can only interact with their own data.
- **RBAC**: Admin routes are strictly protected by a custom decorator validating against the database.
- **Logging**: Production deployments automatically generate rotating logs in the `/logs` directory.
- **Rate Limiting / File Validation**: Handled strictly via backend validation and Supabase Storage limits.

---

## 🗄️ Backup & Restore Procedure

### Database Backup
Use the Supabase CLI or Dashboard to export your PostgreSQL database:
```bash
supabase db dump -f backup.sql
```
### Database Restore
Restore using psql:
```bash
psql -h <SUPABASE_DB_HOST> -p 5432 -d postgres -U postgres -f backup.sql
```

## 🧪 Testing Guide
To verify the application:
1. **User Flow**: Register a new account, upload a profile picture, run a carbon calculation, and verify the AI recommendations appear.
2. **Admin Flow**: Change your role to admin in Supabase. Navigate to `/admin/dashboard`, try activating/deactivating a user, deleting a calculation, and downloading a PDF report.
3. **Security**: Attempt to visit `/admin/dashboard` logged out, or logged in as a normal user. You should receive a 403 Forbidden error.
