import { PrismaClient } from "@prisma/client";

// Singleton so we don't open a new connection pool per import (especially
// important with `tsx watch` reloading modules during local dev).
export const prisma = new PrismaClient();
