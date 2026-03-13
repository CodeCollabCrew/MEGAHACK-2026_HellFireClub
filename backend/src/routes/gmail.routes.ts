import { Router, Request, Response } from "express";
import { fetchGmailEmails } from "../services/gmail.service";
import { Email } from "../models/email.model";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();
const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Step 1: Redirect to Google consent
router.get("/connect", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return sendError(res, "GOOGLE_CLIENT_ID not set in .env", 500);
  const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/gmail/callback`;
  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri,
    response_type: "code", access_type: "offline", prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  });
  res.redirect(url);
});

// Step 2: OAuth callback — exchange code for token, fetch emails
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  if (error || !code) return res.redirect(`${frontendUrl}/dashboard?gmail_error=access_denied`);

  try {
    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/gmail/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokens.access_token) {
      return res.redirect(`${frontendUrl}/dashboard?gmail_error=token_failed`);
    }

    // Fetch user's Gmail address to use as userId
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json() as { email?: string };
    const userId = userInfo.email;

    if (!userId) {
      return res.redirect(`${frontendUrl}/dashboard?gmail_error=no_user_email`);
    }

    // Fetch emails tagged with this userId
    const result = await fetchGmailEmails(tokens.access_token, userId, 30);
    console.log(`Gmail fetch for ${userId}: imported ${result.imported}, errors: ${result.errors.length}`);

    res.redirect(`${frontendUrl}/dashboard?gmail_success=true&imported=${result.imported}&user=${encodeURIComponent(userId)}`);
  } catch (err) {
    console.error("Gmail callback error:", err);
    res.redirect(`${frontendUrl}/dashboard?gmail_error=server_error`);
  }
});

// Get OAuth URL for frontend button
router.get("/auth-url", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return sendSuccess(res, { url: null, configured: false });
  const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/gmail/callback`;
  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri,
    response_type: "code", access_type: "offline", prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  });
  sendSuccess(res, { url, configured: true });
});

// Debug endpoint
router.get("/debug", async (_req: Request, res: Response) => {
  const count = await Email.countDocuments();
  const latest = await Email.find().sort({ receivedAt: -1 }).limit(3).select("userId subject from receivedAt isProcessed");
  sendSuccess(res, {
    emailCount: count, latest,
    config: {
      hasClientId:     !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGroqKey:      !!process.env.GROQ_API_KEY,
      backendUrl:      process.env.BACKEND_URL || "http://localhost:5000",
      frontendUrl:     process.env.FRONTEND_URL || "http://localhost:3000",
    }
  });
});

export default router;