import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response";

export interface AuthRequest extends Request {
  userId?: string;   // MongoDB _id as string
  userEmail?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return sendError(res, "Unauthorized — no token", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.userId    = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return sendError(res, "Unauthorized — invalid or expired token", 401);
  }
}

// Helper to generate access + refresh tokens
export function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  return { accessToken };
}