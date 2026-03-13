import { Router, Request, Response } from "express";
import { fetchGmailEmails } from "../services/gmail.service";
import { Email } from "../models/email.model";
import { SentMail } from "../models/sentmail.model";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();
const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ── OAuth scopes — now includes gmail.send ────────────────────────────────────
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getRedirectUri() {
  return `${process.env.BACKEND_URL || "http://localhost:5000"}/api/gmail/callback`;
}

// Step 1: Redirect to Google consent
router.get("/connect", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return sendError(res, "GOOGLE_CLIENT_ID not set in .env", 500);
  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId, redirect_uri: getRedirectUri(),
    response_type: "code", access_type: "offline", prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

// Step 2: OAuth callback
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  if (error || !code) return res.redirect(`${frontendUrl}/dashboard?gmail_error=access_denied`);

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: getRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
    };

    if (!tokens.access_token) {
      return res.redirect(`${frontendUrl}/dashboard?gmail_error=token_failed`);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json() as { email?: string };
    const userId = userInfo.email;
    if (!userId) return res.redirect(`${frontendUrl}/dashboard?gmail_error=no_user_email`);

    // Store tokens in DB on the user's emails for future send operations
    // We store access_token temporarily in a simple way — attach to email docs
    await Email.updateMany({ userId }, { $set: { accessToken: tokens.access_token } });

    const result = await fetchGmailEmails(tokens.access_token, userId, 30);
    console.log(`Gmail fetch for ${userId}: imported ${result.imported}, errors: ${result.errors.length}`);

    res.redirect(`${frontendUrl}/dashboard?gmail_success=true&imported=${result.imported}&user=${encodeURIComponent(userId)}`);
  } catch (err) {
    console.error("Gmail callback error:", err);
    res.redirect(`${frontendUrl}/dashboard?gmail_error=server_error`);
  }
});

// Get OAuth URL
router.get("/auth-url", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return sendSuccess(res, { url: null, configured: false });
  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId, redirect_uri: getRedirectUri(),
    response_type: "code", access_type: "offline", prompt: "consent",
    scope: SCOPES,
  });
  sendSuccess(res, { url, configured: true });
});

// ── AI draft follow-up ────────────────────────────────────────────────────────
router.post("/draft-followup", async (req: Request, res: Response) => {
  try {
    const { emailId, userId } = req.body;
    if (!emailId || !userId) return sendError(res, "emailId and userId required", 400);

    const email = await Email.findOne({ emailId, userId });
    if (!email) return sendError(res, "Email not found", 404);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: `You are a professional email assistant. Write a concise, polite follow-up reply.
Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "subject": "Re: <original subject>",
  "body": "<email body with \\n for line breaks>",
  "to": "<sender email>"
}`,
          },
          {
            role: "user",
            content: `Original email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body?.substring(0, 1000)}

The sender is waiting for a reply. Write a professional follow-up from ${userId}.
Sign off with "Best regards,\\n${userId.split("@")[0]}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const groqData = await groqRes.json() as any;
    const raw = groqData.choices?.[0]?.message?.content || "{}";

    let draft;
    try {
      draft = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      draft = {
        subject: `Re: ${email.subject}`,
        body: `Hi,\n\nFollowing up on your email regarding "${email.subject}".\n\nPlease let me know if you need anything.\n\nBest regards,\n${userId.split("@")[0]}`,
        to: email.from,
      };
    }

    sendSuccess(res, { draft, emailId, originalSubject: email.subject });
  } catch (err) {
    console.error("Draft error:", err);
    sendError(res, "Failed to generate draft");
  }
});

// ── Send follow-up via Gmail API ──────────────────────────────────────────────
router.post("/send-followup", async (req: Request, res: Response) => {
  try {
    const { userId, emailId, to, subject, body } = req.body;
    if (!userId || !emailId || !to || !subject || !body) {
      return sendError(res, "Missing required fields", 400);
    }

    // Get access token stored during OAuth
    const emailDoc = await Email.findOne({ userId }).sort({ receivedAt: -1 }).select("accessToken");
    if (!emailDoc || !(emailDoc as any).accessToken) {
      return sendError(res, "No Gmail access token found. Please reconnect Gmail.", 401);
    }

    const accessToken = (emailDoc as any).accessToken;

    // Build RFC 2822 email
    const rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      body,
    ].join("\r\n");

    const encoded = Buffer.from(rawEmail).toString("base64url");

    const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    });

    const gmailData = await gmailRes.json() as any;

    if (!gmailRes.ok) {
      console.error("Gmail send error:", gmailData);
      return sendError(res, gmailData.error?.message || "Failed to send email", 500);
    }

    // Save to SentMail collection
    const sent = await SentMail.create({
      userId, to, subject, body,
      emailId, threadId: gmailData.threadId,
    });

    sendSuccess(res, { sent, gmailId: gmailData.id });
  } catch (err) {
    console.error("Send error:", err);
    sendError(res, "Failed to send email");
  }
});

// ── Get sent mails ────────────────────────────────────────────────────────────
router.get("/sent", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return sendError(res, "userId required", 400);
    const mails = await SentMail.find({ userId }).sort({ sentAt: -1 });
    sendSuccess(res, mails);
  } catch {
    sendError(res, "Failed to fetch sent mails");
  }
});

// Debug
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