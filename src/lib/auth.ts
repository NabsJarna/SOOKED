import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export async function getAuthUser(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) return null;
    return session.user;
  } catch {
    return null;
  }
}
