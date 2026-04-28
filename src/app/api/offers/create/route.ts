import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, buyerId, offeredPrice } = body;

    if (!listingId || !buyerId || !offeredPrice) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Vérifier si une offre existe déjà
    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId,
        buyerId,
        status: { in: ["pending", "countered"] },
      },
    });

    if (existingOffer) {
      return Response.json(
        { error: "Une offre en attente existe déjà" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId,
        offeredPrice,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });

    return Response.json({ data: offer }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const listingId = req.nextUrl.searchParams.get("listingId");
    const buyerId = req.nextUrl.searchParams.get("buyerId");

    const where: any = {};
    if (listingId) where.listingId = listingId;
    if (buyerId) where.buyerId = buyerId;

    const offers = await prisma.offer.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        listing: { select: { title: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: offers });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
