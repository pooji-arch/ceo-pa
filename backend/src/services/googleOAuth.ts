import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const googleClient = new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleCallbackUrl);

export function getGoogleAuthUrl(): string {
  return googleClient.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) throw new Error("Google did not return an id_token.");
  const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: env.googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) throw new Error("Google profile did not include an email.");
  return { googleId: payload.sub, email: payload.email, name: payload.name ?? payload.email };
}
