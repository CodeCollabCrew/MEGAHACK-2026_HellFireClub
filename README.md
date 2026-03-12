# 🧠 Smart AI Workspace Platform

> AI-powered productivity platform that converts emails into structured workflows automatically.

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Node.js |
| Database | MongoDB Atlas (free tier) |
| AI | Anthropic Claude API |
| Frontend Deploy | **Vercel** |
| Backend Deploy | **Render** |

---

## 📁 Project Structure

```
smart-workspace/
├── frontend/                  # Next.js 14 → deploys to Vercel
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Landing / redirect
│       │   ├── dashboard/page.tsx # Main dashboard
│       │   └── api/               # Next.js API proxy routes
│       ├── components/
│       │   ├── ui/                # Reusable primitives (Button, Card, Badge)
│       │   ├── dashboard/         # Sidebar, Header, StatsBar
│       │   ├── email/             # EmailList, EmailViewer, ExtractionPanel
│       │   ├── pipeline/          # KanbanBoard, TaskCard, StageColumn
│       │   └── insights/          # Charts, Analytics
│       ├── hooks/                 # useTasks, useEmails, usePipeline
│       ├── lib/                   # api.ts (axios client), utils.ts
│       └── types/                 # index.ts (all TypeScript interfaces)
│
└── backend/                   # Express.js → deploys to Render
    └── src/
        ├── index.ts               # Entry point
        ├── config/database.ts     # MongoDB connection
        ├── models/                # Task, Email Mongoose models
        ├── controllers/           # Business logic
        ├── routes/                # API route definitions
        ├── services/              # AI extraction, Gmail, follow-up cron
        ├── middleware/            # Auth, error handler, rate limiter
        └── utils/                 # Date helpers, response formatter
```

---

## 🚀 Local Development

### 1. Clone & Install
```bash
git clone <your-repo>
cd smart-workspace
npm run install:all
```

### 2. Backend Environment
```bash
cd backend
cp .env.example .env
# Fill in your values (see below)
```

### 3. Frontend Environment
```bash
cd frontend
cp .env.example .env.local
# Fill in your values (see below)
```

### 4. Run Both
```bash
# From root
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

---

## ☁️ Deployment Guide

### Step 1 — MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free account
2. Create a **free M0 cluster**
3. Create a database user (username + password)
4. Get your connection string: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/smart-workspace`
5. Whitelist IP: `0.0.0.0/0` (allow all — needed for Render)

### Step 2 — Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account → API Keys → Create new key
3. Copy the key (starts with `sk-ant-...`)

### Step 3 — Deploy Backend to Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your atlas connection string>
   ANTHROPIC_API_KEY=<your anthropic key>
   JWT_SECRET=<any random 32+ char string>
   FRONTEND_URL=https://<your-vercel-url>.vercel.app
   ```
6. Deploy → Copy your Render URL (e.g. `https://smart-workspace-api.onrender.com`)

### Step 4 — Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://<your-render-url>.onrender.com/api
   ```
5. Deploy → Your app is live! 🎉

---

## 🔑 Environment Variables Reference

### Backend `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-workspace
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-super-secret-key-min-32-chars
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🏆 Hackathon Demo Flow
1. Open dashboard → Show unified view
2. Click "Process Emails" → Watch AI extract tasks live
3. Drag task through pipeline stages
4. Show insights panel → productivity analytics
5. Trigger follow-up detection

**Total wow factor: 10/10 if the AI extraction demo works perfectly.**
