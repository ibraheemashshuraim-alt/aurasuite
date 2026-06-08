# AuraSuite - High-Performance Multi-Purpose SaaS Management & Communication System

AuraSuite is a high-performance, ultra-fast, and multi-purpose SaaS Management & Communication System. Built using Go for a blazing-fast, low-memory backend and Next.js for a premium, glassmorphic dark-themed user interface, the system supports multi-tenancy and is designed for Software Houses, Academies, and Factories.

---

## 🌟 Key Features

1. **Multi-Tenancy & Mode Switches**:
   - **Software House Mode**: Standard Kanban project board, worker onboarding, client portals, and AI budgets.
   - **Academy Mode**: Automatically re-aligns UI terminology and backend logic where workers become **Teachers** and clients become **Students**. Adds modules for Assignment creation and Student submissions.
   - **Factory Mode**: Switches to raw material inventory tracking, production assembly lines, and worker attendance shifts.

2. **Advanced HD Video Meetings**:
   - Real-time video/audio room powered by the **Agora.io SDK**.
   - Strict host permissions (Mute All, lock/unlock chat, kick participant out of meeting, mute/unmute individual participants).
   - Real-time chat box component.

3. **AI Engine Integration**:
   - **Smart Allocation**: Automatically profiles new workers/students based on their skills and bio into Tier Categories (A, B, C) and domains (e.g. Front-end Developer, Back-end Developer, Teacher).
   - **Budget Estimator**: Calculates optimal payout suggestions for tasks using $f(Complexity, Hours)$ with standard base rates and provides instant Admin overrides.

4. **Realtime Supabase Integration**:
   - Instant data sync and subscriptions for users, tasks, and meetings.

---

## 📁 Folder Structure

```
AuraSuite/
├── db/
│   └── schema.sql          # Database Schema SQL for Supabase PostgreSQL
├── backend/                # Go (Golang) REST API Server
│   ├── cmd/api/main.go     # API Gateway Entrypoint
│   ├── internal/
│   │   ├── config/         # Dotenv configurations loader
│   │   ├── db/             # Supabase / PostgreSQL driver integration
│   │   ├── middleware/     # JWT Auth & Multi-Tenancy tenant injection
│   │   ├── models/         # Database models (Go Structs)
│   │   ├── handlers/       # Onboarding, AI, Agora and meeting handlers
│   │   └── services/       # AI Completion API and Agora token builders
│   ├── .env                # Server configurations file
│   └── go.mod              # Backend Go dependencies module
└── frontend/               # Next.js App Router Web Interface
    ├── app/
    │   ├── page.js         # Interactive Premium Glassmorphic Dashboard
    │   ├── layout.js       # Base Root HTML layout
    │   └── globals.css     # Global styles & Luxury glassmorphic tokens
    ├── lib/
    │   └── supabase.js     # Supabase client config & mock DB fallbacks
    └── package.json        # Frontend Javascript dependencies
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1. Create a project on [Supabase](https://supabase.com/).
2. Navigate to the SQL Editor in your Supabase dashboard.
3. Copy the contents of [`db/schema.sql`](file:///c:/Users/abdullah/OneDrive/Desktop/AuraSuite/db/schema.sql) and execute the query to create all tables.
4. Enable the **Supabase Realtime API** for `tasks`, `meetings`, and `profiles` tables in the Supabase Dashboard under *Database -> Replication*.

### 2. Backend Setup (Golang)
To run the Go API server, ensure you have Go (1.20+) installed on your machine.
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up environment variables inside `.env`:
   - Fill in your `DATABASE_URL` (obtained from Supabase Connection strings).
   - Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
   - Setup your `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`.
   - Configure `AI_ENGINE` (`openai` or `claude`) and add your `AI_API_KEY`.
3. Install Go dependencies and run:
   ```bash
   go run cmd/api/main.go
   ```
   *Note: If Go is not yet installed on your local system, you can inspect the Go API code. The frontend has a built-in isolated sandbox mock DB that lets you run all features instantly without the backend running.*

### 3. Frontend Setup (Next.js)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser. You can select different portal roles (Admin, Staff, Client) and toggles (Software House, Academy, Factory) to experience the full operational logic of AuraSuite!
