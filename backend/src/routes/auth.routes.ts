import { Router, Request, Response } from "express";
import { User } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/response";
import { generateTokens, authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { log } from "../utils/logger";

const router = Router();

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
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

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return sendError(res, "Invalid email or password", 401);

    if (!user.password) return sendError(res, "This account uses Google sign-in", 400);

    const valid = await user.comparePassword(password);
    if (!valid) return sendError(res, "Invalid email or password", 401);

    const { accessToken } = generateTokens(user._id.toString(), user.email);

    sendSuccess(res, {
      token: accessToken,
      user: { _id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    sendError(res, "Login failed");
  }
});

// ── Guest Login ───────────────────────────────────────────────────────────────
router.post("/guest", async (_req: Request, res: Response) => {
  try {
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

  const url =
    `${GOOGLE_AUTH_URL}?` +
    new URLSearchParams({
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

    const tokens = (await tokenRes.json()) as any;
    if (!tokens.access_token) {
      return res.redirect(`${frontendUrl}/login?error=token_failed`);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = (await userInfoRes.json()) as any;

    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}/login?error=no_email`);
    }

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
      user.avatar = googleUser.picture;
      await user.save();
    }

    const { accessToken } = generateTokens(user._id.toString(), user.email);

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

// ── Admin user management routes (from Lavanya branch) ───────────────────────
router.get("/users", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    sendSuccess(res, users);
  } catch {
    sendError(res, "Failed to fetch users");
  }
});

router.patch("/users/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");
    if (!user) return sendError(res, "User not found", 404);
    const changes = Object.entries(req.body)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    await log({
      action: "User Updated",
      type: "update",
      entity: "user",
      entityId: String(user._id),
      target: user.name,
      details: changes,
      performedBy: "admin",
    });
    sendSuccess(res, user);
  } catch {
    sendError(res, "Failed to update user");
  }
});

router.delete("/users/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);
    await log({
      action: "User Deleted",
      type: "delete",
      entity: "user",
      entityId: req.params.id,
      target: user?.name || req.params.id,
      details: `Email: ${user?.email || "unknown"}`,
      performedBy: "admin",
    });
    sendSuccess(res, { deleted: true });
  } catch {
    sendError(res, "Failed to delete user");
  }
});

router.post("/users", authMiddleware, async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email) return sendError(res, "Name and email required", 400);
  try {
    const exists = await User.findOne({ email });
    if (exists) return sendError(res, "Email already exists", 409);
    const user = await User.create({
      name,
      email,
      password: password || "changeme123",
      role: role || "user",
      status: "active",
    });
    await log({
      action: "User Created (Admin)",
      type: "create",
      entity: "user",
      entityId: String(user._id),
      target: user.name,
      details: `Email: ${user.email} · Role: ${user.role}`,
      performedBy: "admin",
    });
    sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role });
  } catch {
    sendError(res, "Failed to create user");
  }
});

export default router;