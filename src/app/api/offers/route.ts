import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { listingId, offeredPrice } = await req.json();
    
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });
    if (listing.userId === user.id) return Response.json({ error: "Cannot offer on own listing" }, { status: 400 });

    // Minimum 50% du prix
    if (offeredPrice < listing.price * 0.5) {
      return Response.json({ error: "Offer must be at least 50% of asking price" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId: user.id,
        offeredPrice,
        status: "pending",
        expiresAt,
      },
      include: { buyer: true, listing: true },
    });

    return Response.json(offer);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error creating offer" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const offers = await prisma.offer.findMany({
      where: {
        buyerId: user.id,
      },
      include: { listing: true, buyer: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: offers });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error fetching offers" }, { status: 500 });
  }
}
