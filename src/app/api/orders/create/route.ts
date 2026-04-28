import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, buyerId, sellerId, amount, deliveryMethod } = body;

    if (!listingId || !buyerId || !sellerId || !amount) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Calculer les frais
    const buyerFees = Math.round(amount * 0.05 * 100) / 100; // 5%
    const shippingFees = deliveryMethod === "delivery" ? 49 : 0;
    const totalPaid = amount + buyerFees + shippingFees;
    const platformRevenue = buyerFees;
    const sellerNet = amount;

    const order = await prisma.order.create({
      data: {
        listingId,
        buyerId,
        sellerId,
        amount,
        buyerFees,
        shippingFees,
        totalPaid,
        sellerNet,
        platformRevenue,
        status: "pending_payment",
        paymentMethod: "cashplus",
        deliveryMethod: deliveryMethod || "meetup",
      },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        listing: { select: { title: true } },
      },
    });

    return Response.json({ data: order }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
