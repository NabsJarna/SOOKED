import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = { status: "active" };
    if (category) where.category = category;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const listings = await prisma.listing.findMany({
      where,
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
