# 🧠 Smart AI Workspace Platform

> AI-powered productivity platform that converts emails into structured workflows, extracts tasks automatically, and sends follow-ups—straight from your Gmail inbox.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Auth** | Email/password, Google OAuth, Guest login |
| **Gmail Sync** | Connect Gmail → Inbox emails imported to dashboard |
| **AI Task Extraction** | GROQ AI analyzes emails, extracts tasks with priority & deadline |
| **Pipeline Kanban** | Drag-and-drop tasks across stages (To Do → Done) |
| **AI Follow-up** | Generate & send reply drafts via Gmail API |
| **Excel Analysis** | Upload or attach from email → AI insights, charts, recommendations |
| **Insights** | Priority charts, weekly trends, email stats |
| **Admin Panel** | User management, workspaces, activity logs |

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Express.js, TypeScript, Node.js |
| Database | MongoDB Atlas |
| AI | Groq API (Llama 3.x) — free tier supported |
| Auth | JWT, bcrypt, Google OAuth 2.0 |
| Deploy | **Vercel** (frontend), **Render** (backend) |

---

## 📁 Project Structure

```
workplace/
├── frontend/                    # Next.js 14 → Vercel
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Landing
│       │   ├── login/page.tsx       # Auth (email/Google/Guest)
│       │   ├── dashboard/page.tsx   # Main dashboard
│       │   └── admin/               # Admin panel
│       ├── components/
│       │   ├── ui/                  # ChartTooltip, Spinner, etc.
│       │   ├── dashboard/           # Sidebar, Header, GmailConnect
│       │   ├── email/               # EmailList, EmailViewer, FollowUpModal
│       │   ├── pipeline/            # KanbanBoard
│       │   ├── insights/            # Charts, Stats
│       │   └── excel/               # ExcelAnalysisPanel
│       ├── hooks/                   # useTasks, useEmails, usePipeline
│       ├── lib/                     # api.ts, utils
│       └── context/                 # ThemeContext
│
├── backend/                     # Express.js → Render
│   └── src/
│       ├── index.ts                 # Entry, CORS, rate limit
│       ├── config/database.ts       # MongoDB
│       ├── models/                  # User, Task, Email, ExcelAnalysis
│       ├── routes/                  # auth, tasks, emails, gmail, excel, admin
│       ├── services/                # ai.service, gmail.service, excel.service
│       ├── middleware/              # auth, error handler
│       └── utils/                   # url, response, logger
│
└── package.json                 # Root scripts (dev, install:all)
```

---

## 🚀 Local Development

### 1. Clone & Install

```bash
git clone <your-repo>
cd workplace
npm run install:all
```

### 2. Backend Environment

```bash
cd backend
cp .env.example .env
# Fill values (see Environment Variables below)
```

### 3. Frontend Environment

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run Both

```bash
# From workplace root
npm run dev
```

- **Frontend:** http://localhost:3000  
- **Backend:** http://localhost:5000  

---

## 🔑 Environment Variables

### Backend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `GROQ_API_KEY` | Groq API key (Llama) | Get from [console.groq.com](https://console.groq.com) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Same as above |
| `BACKEND_URL` | Backend base URL | `http://localhost:5000` (local) or `https://xxx.onrender.com` (prod) |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:3000` (local) or `https://xxx.vercel.app` (prod) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Random string |

**Local example:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true
GROQ_API_KEY=gsk_xxxxx
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-random-32-char-string
```

### Frontend (`.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (no trailing slash) | `http://localhost:5000` |

---

## 🔐 Google OAuth Setup (Gmail & Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add **Authorized redirect URIs**:

   | Environment | URIs to add |
   |-------------|-------------|
   | **Local** | `http://localhost:5000/api/auth/google/callback`<br>`http://localhost:5000/api/gmail/callback` |
   | **Production** | `https://YOUR-RENDER-URL.onrender.com/api/auth/google/callback`<br>`https://YOUR-RENDER-URL.onrender.com/api/gmail/callback` |

4. Enable APIs: **Gmail API** and **Google+** (for userinfo)

> **Important:** `FRONTEND_URL` must include `https://` in production (e.g. `https://yourapp.vercel.app`), otherwise redirects will fail.

---

## ☁️ Deployment

### MongoDB Atlas

1. [mongodb.com/atlas](https://mongodb.com/atlas) → Create free M0 cluster  
2. Database Access → Add user (username + password)  
3. Network Access → Allow `0.0.0.0/0` (Render needs this)  
4. Connect → Get connection string  

### Backend (Render)

1. [render.com](https://render.com) → New → **Web Service**  
2. Connect GitHub repo  
3. **Settings:**
   - **Root Directory:** `workplace/backend` (or `backend` if repo root is `workplace`)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance:** Free
4. **Environment Variables:** Add all backend env vars (see above), with:
   - `BACKEND_URL` = your Render URL (e.g. `https://yourapp.onrender.com`)
   - `FRONTEND_URL` = your Vercel URL with `https://` (e.g. `https://yourapp.vercel.app`)
5. Deploy → Copy Render URL  

### Frontend (Vercel)

1. [vercel.com](https://vercel.com) → New Project → Import repo  
2. **Settings:**
   - **Root Directory:** `workplace/frontend` (or `frontend`)
   - Framework: Next.js (auto)
3. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://your-render-url.onrender.com`
4. Deploy  

---

## 📡 Application Flow

### 1. Login

- **Email/Password** → `POST /api/auth/login` → JWT saved  
- **Google** → Redirect to backend `/api/auth/google` → Google OAuth → Callback → JWT → Redirect to `/dashboard?token=...`  
- **Guest** → `POST /api/auth/guest` → JWT saved  

### 2. Gmail Connect

- User clicks **Connect Gmail** in sidebar  
- `GET /api/gmail/auth-url` → User redirected to Google consent  
- Callback: `POST /api/gmail/callback` → Access token stored in `Email` collection  
- Emails fetched from Gmail Inbox → Saved to MongoDB  

### 3. Email Processing

- `GET /api/emails` → List emails for user  
- **Process** → `POST /api/emails/:id/process` → Groq extracts tasks → Saved  

### 4. Follow-up Send

- User opens **Follow up** modal → AI draft via `POST /api/gmail/draft-followup`  
- User edits & clicks **Send** → `POST /api/gmail/send-followup` → Gmail API sends email  

> **Email send requires Gmail Connect first.** Without `accessToken` in DB, send will fail with "No Gmail access token."

### 5. Excel Analysis

- Upload file or choose from Gmail attachment  
- `POST /api/excel/analyze` → Groq analyzes → Summary, insights, charts  

---

## 🛠 API Overview

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register |
| `/api/auth/login` | POST | No | Login |
| `/api/auth/guest` | POST | No | Guest login |
| `/api/auth/google` | GET | No | Start Google OAuth |
| `/api/auth/me` | GET | Yes | Current user |
| `/api/gmail/connect` | GET | No | Start Gmail OAuth |
| `/api/gmail/auth-url` | GET | No | Get Gmail OAuth URL |
| `/api/gmail/sent` | GET | Yes | Sent emails list |
| `/api/gmail/draft-followup` | POST | Yes | AI draft follow-up |
| `/api/gmail/send-followup` | POST | Yes | Send follow-up |
| `/api/emails` | GET | Yes | List emails |
| `/api/emails/:id/process` | POST | Yes | Process email (AI extraction) |
| `/api/tasks` | CRUD | Yes | Tasks |
| `/api/pipeline` | GET | Yes | Pipeline stages |
| `/api/excel/analyze` | POST | Yes | Analyze Excel file |
| `/api/excel/history` | GET | Yes | Saved analyses |

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| **401 on API** | Ensure `Authorization: Bearer <token>` header; re-login if token expired |
| **redirect_uri_mismatch** | Add exact callback URL to Google Console (see OAuth Setup) |
| **Email send fails** | Connect Gmail first via sidebar; ensure callback URL includes `https://` for prod |
| **Groq 429** | Rate limit hit; wait 1–2 min or upgrade Groq plan |
| **429 from backend** | API rate limit; increased in `index.ts` (1000/hr for `/api/*`) |
| **framer-motion not found** | Run `npm install` in `frontend/` |
| **Render build fails** | Ensure `tsconfig.json` excludes `src/admin_backend`; use `npm install --include=dev` in build |

---

## 📜 Scripts

```bash
# Root (workplace)
npm run install:all   # Install all deps
npm run dev           # Run frontend + backend
npm run build:frontend
npm run build:backend

# Frontend
npm run dev
npm run build
npm run start

# Backend
npm run dev
npm run build
npm start
```

---

## 📄 License

MIT
