export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "active" },
      include: { user: { select: { id:true, name:true, city:true, avatar:true, rating:true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return Response.json({ data: listings });
  } catch(e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
