import { prisma } from "../config/prisma.js";

export async function logAudit(user: string, action: string) {
  await prisma.auditEntry.create({ data: { user, action } });
}
