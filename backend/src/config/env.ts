import "dotenv/config";

const REQUIRED = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of REQUIRED) {
  if (!process.env[key]) {
    // Fail fast and loud rather than crashing later with a confusing error
    // the first time something touches the database or signs a token.
    throw new Error(`Missing required environment variable: ${key} (copy .env.example to .env and fill it in)`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5183",
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? "",
};
