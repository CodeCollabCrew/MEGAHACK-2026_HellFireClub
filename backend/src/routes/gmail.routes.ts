import { Router, Request, Response } from "express";
import { fetchGmailEmails } from "../services/gmail.service";
import { Email } from "../models/email.model";
import { SentMail } from "../models/sentmail.model";
import { User } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/response";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getRedirectUri() {
  return `${process.env.BACKEND_URL || "http://localhost:5000"}/api/gmail/callback`;
}

// Step 1: Redirect to Google consent
router.get("/connect", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const role = req.query.role as string || "user";
  if (!clientId) return sendError(res, "GOOGLE_CLIENT_ID not set in .env", 500);

  const state = JSON.stringify({ role });
  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId, redirect_uri: getRedirectUri(),
    response_type: "code", access_type: "offline", prompt: "consent",
    scope: SCOPES,
    state: state
  });
  res.redirect(url);
});

// Step 2: OAuth callback — ✅ FIXED userId
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  let role = "user";
  if (state) {
    try {
      const parsed = JSON.parse(state as string);
      role = parsed.role || "user";
    } catch {}
  }

  const redirectBase = role === "admin" ? `${frontendUrl}/admin` : `${frontendUrl}/dashboard`;

  if (error || !code) return res.redirect(`${redirectBase}?gmail_error=access_denied`);

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

    // Google se email address lo
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json() as { email?: string };
    if (!userInfo.email) return res.redirect(`${frontendUrl}/dashboard?gmail_error=no_user_email`);

    // ✅ Email se MongoDB userId dhundho
    const dbUser = await User.findOne({ email: userInfo.email.toLowerCase() });
    if (!dbUser) return res.redirect(`${frontendUrl}/dashboard?gmail_error=user_not_found`);

    const userId = dbUser._id.toString(); // ✅ Actual MongoDB _id

    // Access token store karo
    await Email.updateMany({ userId }, { $set: { accessToken: tokens.access_token } });

    // Emails fetch karo — userId = MongoDB _id
    const result = await fetchGmailEmails(tokens.access_token, userId, 30);
    console.log(`Gmail fetch for ${userInfo.email}: imported ${result.imported}, errors: ${result.errors.length}`);

    res.redirect(
      `${redirectBase}?gmail_success=true&imported=${result.imported}&user=${encodeURIComponent(
        userInfo.email
      )}`
    );
  } catch (err) {
    console.error("Gmail callback error:", err);
    res.redirect(`${redirectBase}?gmail_error=server_error`);
  }
});

// Get OAuth URL
router.get("/auth-url", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const role = req.query.role as string || "user";
  if (!clientId) return sendSuccess(res, { url: null, configured: false });

  const state = JSON.stringify({ role });
  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId, redirect_uri: getRedirectUri(),
    response_type: "code", access_type: "offline", prompt: "consent",
    scope: SCOPES,
    state: state
  });
  sendSuccess(res, { url, configured: true });
});

// ── AI draft follow-up ✅ authMiddleware added ────────────────────────────────
router.post("/draft-followup", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { emailId } = req.body;
    const userId = req.userId!; // ✅ token se
    if (!emailId) return sendError(res, "emailId required", 400);

    const email = await Email.findOne({ emailId, userId });
    if (!email) return sendError(res, "Email not found", 404);

    const apiKey = process.env.GROQ_API_KEY || "";
    const isXAI = apiKey.startsWith("xai-");
    const endpoint = isXAI 
      ? "https://api.x.ai/v1/chat/completions" 
      : "https://api.groq.com/openai/v1/chat/completions";
    
    const model = isXAI ? "grok-beta" : "llama3-8b-8192";

    const groqRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
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

Write a professional follow-up. Sign off with "Best regards,\\n${req.userEmail?.split("@")[0]}"`,
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
        body: `Hi,\n\nFollowing up on your email regarding "${email.subject}".\n\nPlease let me know if you need anything.\n\nBest regards,\n${req.userEmail?.split("@")[0]}`,
        to: email.from,
      };
    }

    sendSuccess(res, { draft, emailId, originalSubject: email.subject });
  } catch (err) {
    console.error("Draft error:", err);
    sendError(res, "Failed to generate draft");
  }
});

// ── Send follow-up ✅ authMiddleware added ────────────────────────────────────
router.post("/send-followup", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { emailId, to, subject, body } = req.body;
    const userId = req.userId!; // ✅ token se
    if (!emailId || !to || !subject || !body) {
      return sendError(res, "Missing required fields", 400);
    }

    const emailDoc = await Email.findOne({ userId }).sort({ receivedAt: -1 }).select("accessToken");
    if (!emailDoc || !(emailDoc as any).accessToken) {
      return sendError(res, "No Gmail access token found. Please reconnect Gmail.", 401);
    }

    const accessToken = (emailDoc as any).accessToken;

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

// ── Get sent mails ✅ authMiddleware added ────────────────────────────────────
router.get("/sent", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!; // ✅ token se, query se nahi
    const mails = await SentMail.find({ userId }).sort({ sentAt: -1 });
    sendSuccess(res, mails);
  } catch {
    sendError(res, "Failed to fetch sent mails");
  }
});

// Debug
router.get("/debug", async (_req: Request, res: Response) => {
  const count = await Email.countDocuments();
  const latest = await Email.find().sort({ receivedAt: -1 }).limit(3).select("userId subject from receivedAt");
  sendSuccess(res, {
    emailCount: count, latest,
    config: {
      hasClientId:     !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      backendUrl:      process.env.BACKEND_URL || "http://localhost:5000",
      frontendUrl:     process.env.FRONTEND_URL || "http://localhost:3000",
    }
  });
});

export default router;