import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validation/authSchemas.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getGoogleAuthUrl, exchangeGoogleCode } from "../services/googleOAuth.js";

export const authRouter = Router();

type AnyRole = "CEO" | "PA";

function issueToken(user: { id: string; email: string; name: string; role: AnyRole }) {
  return signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
}

function publicUser(user: { id: string; email: string; name: string; role: AnyRole }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// PA-only — this app has a fixed roster, not open self-service sign-up.
// Registering a new account (CEO or PA) is an administrative action only
// an existing PA can take.
authRouter.post("/auth/register", requireAuth, requireRole("PA"), validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists.");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name, role } });
    res.status(201).json({ success: true, data: { user: publicUser(user) }, error: null });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/auth/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    const token = issueToken(user);
    res.json({ success: true, data: { token, user: publicUser(user) }, error: null });
  } catch (err) {
    next(err);
  }
});

// Stateless JWTs: nothing to invalidate server-side — the client just discards the token.
authRouter.post("/auth/logout", requireAuth, (_req, res) => {
  res.json({ success: true, data: null, error: null });
});

authRouter.get("/auth/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found.");
    res.json({ success: true, data: { user: publicUser(user) }, error: null });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/auth/google", (_req, res) => {
  res.redirect(getGoogleAuthUrl());
});

// This app has a fixed CEO/PA roster (seeded, not self-service) — Google
// sign-in links an existing account by email, it never creates a new one.
authRouter.get("/auth/google/callback", async (req, res) => {
  const frontend = env.corsOrigin;
  try {
    const code = req.query.code;
    if (typeof code !== "string") throw new Error("Missing authorization code.");
    const profile = await exchangeGoogleCode(code);
    const user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      res.redirect(
        `${frontend}/oauth/callback?error=${encodeURIComponent("No CEO PA account found for this Google email. Ask an admin to create your account first.")}`
      );
      return;
    }
    if (!user.googleId) {
      await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.googleId } });
    }
    const token = issueToken(user);
    res.redirect(`${frontend}/oauth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error(err);
    res.redirect(`${frontend}/oauth/callback?error=${encodeURIComponent("Google sign-in failed. Please try again.")}`);
  }
});
