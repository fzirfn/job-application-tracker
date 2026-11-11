# Job Application Tracker

A single-user web application to record every job application, track stages with an audit pipeline, and stay on top of follow-ups and interviews.

## Tech Stack & Architecture

- **Frontend:** React 19 (Vite, TypeScript, Tailwind CSS, Lucide icons, Design-Taste Achromatic Ledger)
- **Backend:** Laravel 11 REST API (Sanctum token-based authentication)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (job screenshots and document attachments)
- **AI Company Auto-Fill:** Google Gemini API (called strictly from Laravel backend; never exposed to browser)
- **Security Boundary:** React speaks **only** to the Laravel API. Laravel is the sole service that reads and writes Supabase and calls AI services. All private keys (Supabase service key, AI API key) stay in Laravel's `.env` and are never exposed to the client.
- **Malaysia Defaults:**
  - Timezone: `Asia/Kuala_Lumpur` (UTC+08:00)
  - Date format: `DD/MM/YYYY`
  - Currency: `MYR`
  - Pre-listed sources: JobStreet, LinkedIn, Hiredly, Indeed, Company Site, Referral, Other
  - Default location: Kuala Lumpur

---

## Getting Started

### Prerequisites

- PHP 8.2+ with `pdo_pgsql`, `pgsql`, and `openssl` extensions enabled
- Composer 2+
- Node.js 18+ and npm

---

### 1. Backend Setup (Laravel)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   composer install
   ```

3. Configure your environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Configure your Supabase Postgres database in `.env`:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com # Or your Supabase host
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.YOUR_PROJECT_REF
   DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
   DB_SSLMODE=require

   # Supabase Storage & AI settings
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
   SUPABASE_STORAGE_BUCKET=job-tracker-files
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY

   APP_TIMEZONE=Asia/Kuala_Lumpur
   ```
   *(Note: For local offline development or testing without a remote database, you can also use `DB_CONNECTION=sqlite` with a local SQLite file).*

5. Run migrations and seed the initial single user, default settings, and sample Malaysian applications:
   ```bash
   php artisan migrate:fresh --seed
   ```

6. Start the Laravel development server:
   ```bash
   php artisan serve --port=8000
   ```

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment (optional, proxy to `http://localhost:8000` is pre-configured):
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`. Requests to `/api/*` are automatically proxied to the Laravel backend at `http://127.0.0.1:8000`.

---

## Seeded Login Credentials

| Field | Value |
|---|---|
| **Email** | `user@jobtracker.local` |
| **Password** | `password123` |

*(A quick-fill button is also provided on the sign-in screen for fast testing).*

---

## Database Schema (Postgres)

- `users`: Single-user auth credentials
- `personal_access_tokens`: Laravel Sanctum API tokens
- `companies`: Company profiles (name, website, industry, size, location, logo_url)
- `applications`: Job applications (company_id, title, url, source, date_applied, location, description, status, follow-up date, notes)
- `status_history`: Complete stage audit trail (application_id, from_status, to_status, changed_at)
- `interviews`: Scheduled interviews (type, datetime, interviewer, link/location, prep/result notes)
- `contacts`: Recruiter & hiring manager contacts
- `documents`: Uploaded CVs and cover letters
- `app_settings`: Configurable settings (reminder threshold in days, source list, default location)

---

## API Routes

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health check & DB connection status | No |
| `POST` | `/api/auth/login` | Email & password login, returns Bearer token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user details | Yes (Bearer) |
| `POST` | `/api/auth/logout` | Revoke current session token | Yes (Bearer) |
| `GET` | `/api/dashboard/summary` | Status counts, activity this week, upcoming interviews & stale alerts | Yes (Bearer) |
| `POST` | `/api/companies/lookup` | Look up company details (DB first, then AI suggestion) | Yes (Bearer) |
| `GET` | `/api/applications` | List applications with search, status/source filters, date ranges, and sorting | Yes (Bearer) |
| `POST` | `/api/applications` | Create a new job application and auto-log initial status | Yes (Bearer) |
| `GET` | `/api/applications/{id}` | Get application with company, history, interviews, contacts, documents | Yes (Bearer) |
| `PUT` | `/api/applications/{id}` | Update application details & log status if changed | Yes (Bearer) |
| `PATCH` | `/api/applications/{id}/status` | Direct stage transition with automatic history audit row | Yes (Bearer) |
| `DELETE` | `/api/applications/{id}` | Delete job application | Yes (Bearer) |
| `POST` | `/api/applications/upload-screenshot` | Upload posting screenshot to Supabase Storage | Yes (Bearer) |
| `POST` | `/api/applications/{id}/interviews` | Schedule an interview | Yes (Bearer) |
| `PUT` | `/api/interviews/{id}` | Update interview details | Yes (Bearer) |
| `DELETE` | `/api/interviews/{id}` | Delete an interview | Yes (Bearer) |
| `POST` | `/api/applications/{id}/contacts` | Add a recruiter or hiring manager contact | Yes (Bearer) |
| `PUT` | `/api/contacts/{id}` | Update a contact | Yes (Bearer) |
| `DELETE` | `/api/contacts/{id}` | Delete a contact | Yes (Bearer) |
| `POST` | `/api/applications/{id}/documents` | Upload a CV or Cover Letter to Supabase Storage | Yes (Bearer) |
| `DELETE` | `/api/documents/{id}` | Delete a document | Yes (Bearer) |
| `GET` | `/api/companies` | List companies for search suggestions and filters | Yes (Bearer) |
| `GET` | `/api/settings` | Get reminder threshold, sources, and default location | Yes (Bearer) |
| `PUT` | `/api/settings` | Update reminder threshold, sources, and default location | Yes (Bearer) |

---

## Build Plan Status

- [x] **Phase 1: Foundation** — Laravel 11, React 19, Supabase schema migrations, single-user auth with Sanctum, Achromatic Ledger UI foundation.
- [x] **Phase 2: Core Tracking** — Application form and list, status pipeline with audit history, search/filters, screenshot upload.
- [x] **Phase 3: Detail, Follow-up & Interviews** — Application detail page with tabs (overview, interviews, contacts, documents, history), reminders & stale alerts, interview tracking, contacts, documents, Kanban board, and full dashboard.
- [x] **Phase 4: Company Auto-fill & Polish** — AI lookup endpoint (DB match first, AI suggestion fallback), editable suggestions, global error boundary, validation, and Malaysia locale checks.
