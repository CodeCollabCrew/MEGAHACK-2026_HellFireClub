# Gmail Setup Guide

## Step 1 — Get Google OAuth Credentials (5 min)

1. Go to https://console.cloud.google.com
2. Create new project → name it "Axon"
3. Left menu → **APIs & Services** → **Enable APIs**
   → Search "Gmail API" → Enable it
4. Left menu → **APIs & Services** → **Credentials**
5. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Under "Authorized redirect URIs" add:
   ```
   http://localhost:5000/api/gmail/callback
   ```
8. Click Create → copy **Client ID** and **Client Secret**

## Step 2 — Add to .env

Open `backend/.env` and set:
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

## Step 3 — OAuth Consent Screen

1. Left menu → **OAuth consent screen**
2. User type: **External** → Create
3. App name: "Axon", add your email
4. Scopes: add `gmail.readonly`
5. Test users: **add your own Gmail address**
6. Save

## Step 4 — Connect in App

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:3000
4. Sidebar → **Connect Gmail** button
5. Sign in with your Google account
6. Emails will be imported automatically!

## Debug

Visit http://localhost:5000/api/gmail/debug to check:
- How many emails are in the database
- Whether your credentials are set correctly

## Why emails might not show

- GOOGLE_CLIENT_ID not set → sidebar shows yellow warning
- OAuth consent screen not configured → Google blocks the login
- Test users not added → Google blocks the login  
- BACKEND_URL wrong → callback fails silentlY
