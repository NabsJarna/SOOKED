import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      include: {
        buyer: true,
        seller: true,
        listing: true,
        dispute: true,
        ratings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: orders });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error fetching orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { listingId, quantity = 1 } = await req.json();

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });
    if (listing.userId === user.id) return Response.json({ error: "Cannot create order for own listing" }, { status: 400 });

    // Calcul des frais
    const SHIPPING_FEE = 30; // DH
    const PLATFORM_FEE_PERCENT = 0.13; // 13%
    const CASHUP_FEE = 10; // DH

    const totalPaid = listing.price + CASHUP_FEE + SHIPPING_FEE;
    const platformRevenue = listing.price * PLATFORM_FEE_PERCENT + CASHUP_FEE;
    const sellerNet = listing.price - listing.price * PLATFORM_FEE_PERCENT;

    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        sellerId: listing.userId,
        listingId,
        amount: listing.price,
        originalPrice: listing.price,
        buyerFees: CASHUP_FEE,
        shippingFees: SHIPPING_FEE,
        totalPaid,
        sellerNet,
        platformRevenue,
        status: "pending_payment",
        paymentMethod: "cashup",
        deliveryMethod: "standard",
      },
      include: { buyer: true, seller: true, listing: true },
    });

    return Response.json(order, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error creating order" }, { status: 500 });
  }
}
