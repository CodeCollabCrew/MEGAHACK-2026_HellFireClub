import { Router, Request, Response } from "express";
import { User } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/response";
import { generateTokens, authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

function getRedirectUri() {
  return `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return sendError(res, "email, password, name required", 400);
    }
    if (password.length < 8) {
      return sendError(res, "Password must be at least 8 characters", 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return sendError(res, "Email already registered", 409);

    const user = await User.create({ email, password, name });
    const { accessToken } = generateTokens(user._id.toString(), user.email);

    sendSuccess(res, {
      token: accessToken,
      user: { _id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Register error:", err);
    sendError(res, "Registration failed");
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, "email and password required", 400);

    // Need password field (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return sendError(res, "Invalid email or password", 401);

    // Google OAuth user trying to login with password
    if (!user.password) return sendError(res, "This account uses Google sign-in", 400);

    const valid = await user.comparePassword(password);
    if (!valid) return sendError(res, "Invalid email or password", 401);

    const { accessToken } = generateTokens(user._id.toString(), user.email);

    sendSuccess(res, {
      token: accessToken,
      user: { _id: user._id, email: user.email, name: user.name, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Login error:", err);
    sendError(res, "Login failed");
  }
});

// ── Guest Login ───────────────────────────────────────────────────────────────
router.post("/guest", async (_req: Request, res: Response) => {
  try {
    // Create a unique guest user every time (or reuse by fingerprint if needed)
    const guestEmail = `guest_${Date.now()}@axon.guest`;
    const user = await User.create({
      email: guestEmail,
      name: "Guest",
      isGuest: true,
    });

    const { accessToken } = generateTokens(user._id.toString(), user.email);

    sendSuccess(res, {
      token: accessToken,
      user: { _id: user._id, email: user.email, name: "Guest", isGuest: true },
    });
  } catch (err) {
    sendError(res, "Guest login failed");
  }
});

// ── Google OAuth — Step 1: Redirect ──────────────────────────────────────────
router.get("/google", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return sendError(res, "Google OAuth not configured", 500);

  const url = `${GOOGLE_AUTH_URL}?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

// ── Google OAuth — Step 2: Callback ──────────────────────────────────────────
router.get("/google/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=google_denied`);
  }

  try {
    // Exchange code for tokens
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

    const tokens = await tokenRes.json() as any;
    if (!tokens.access_token) {
      return res.redirect(`${frontendUrl}/login?error=token_failed`);
    }

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json() as any;

    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}/login?error=no_email`);
    }

    // Upsert user in DB
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email: googleUser.email.toLowerCase(),
        name: googleUser.name || googleUser.email.split("@")[0],
        googleId: googleUser.id,
        avatar: googleUser.picture,
      });
    } else if (!user.googleId) {
      user.googleId = googleUser.id;
      user.avatar   = googleUser.picture;
      await user.save();
    }

    const { accessToken } = generateTokens(user._id.toString(), user.email);

    // Redirect to frontend with token
    res.redirect(
      `${frontendUrl}/dashboard?token=${accessToken}&name=${encodeURIComponent(user.name)}`
    );
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
});

// ── Get current user (/api/auth/me) ──────────────────────────────────────────
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return sendError(res, "User not found", 404);
    sendSuccess(res, user);
  } catch {
    sendError(res, "Failed to get user");
  }
});

export default router;