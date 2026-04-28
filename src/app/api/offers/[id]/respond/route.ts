import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, counterPrice } = await req.json();

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { listing: true, buyer: true },
    });

    if (!offer) return Response.json({ error: "Offer not found" }, { status: 404 });

    // Vérifier que c'est le vendeur
    const listing = await prisma.listing.findUnique({
      where: { id: offer.listingId },
    });

    if (listing?.userId !== user.id) {
      return Response.json({ error: "Only seller can respond to offers" }, { status: 403 });
    }

    if (action === "accept") {
      // Créer la commande
      const SHIPPING_FEE = 30; // DH
      const PLATFORM_FEE_PERCENT = 0.13; // 13%
      const CASHUP_FEE = 10; // DH

      const totalPaid = offer.offeredPrice + CASHUP_FEE + SHIPPING_FEE;
      const platformRevenue = offer.offeredPrice * PLATFORM_FEE_PERCENT + CASHUP_FEE;
      const sellerNet = offer.offeredPrice - offer.offeredPrice * PLATFORM_FEE_PERCENT;

      const order = await prisma.order.create({
        data: {
          buyerId: offer.buyerId,
          sellerId: listing!.userId,
          listingId: offer.listingId,
          amount: offer.offeredPrice,
          originalPrice: listing!.price,
          buyerFees: CASHUP_FEE,
          shippingFees: SHIPPING_FEE,
          totalPaid,
          sellerNet,
          platformRevenue,
          status: "pending_payment",
          paymentMethod: "cashup",
          deliveryMethod: "standard",
          isNegotiated: true,
        },
        include: { buyer: true, seller: true, listing: true },
      });

      // Mettre à jour l'offre
      await prisma.offer.update({
        where: { id },
        data: { status: "accepted" },
      });

      return Response.json({ order, message: "Offer accepted, order created" });
    } else if (action === "reject") {
      await prisma.offer.update({
        where: { id },
        data: { status: "rejected" },
      });
      return Response.json({ message: "Offer rejected" });
    } else if (action === "counter") {
      if (!counterPrice || counterPrice <= 0) {
        return Response.json({ error: "Invalid counter price" }, { status: 400 });
      }
      await prisma.offer.update({
        where: { id },
        data: { counterPrice, status: "countered" },
      });
      return Response.json({ message: "Counter offer sent" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error processing offer" }, { status: 500 });
  }
}
