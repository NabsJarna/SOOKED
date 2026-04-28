import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, listingId, action } = body;

    if (!userId || !listingId || !action) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    if (action === "add") {
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          favorites: {
            connect: { id: userId },
          },
        },
      });
    } else if (action === "remove") {
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          favorites: {
            disconnect: { id: userId },
          },
        },
      });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    const favorites = await prisma.listing.findMany({
      where: {
        favorites: {
          some: { id: userId },
        },
      },
      include: {
        user: { select: { id: true, name: true, city: true, avatar: true, rating: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: favorites });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
