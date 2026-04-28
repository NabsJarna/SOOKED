import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { buyer: true, seller: true },
    });

    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Vérifier que c'est l'acheteur
    if (order.buyerId !== user.id) {
      return Response.json({ error: "Only buyer can confirm receipt" }, { status: 403 });
    }

    if (order.status !== "shipped") {
      return Response.json({ error: "Order is not shipped yet" }, { status: 400 });
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "delivered" },
      include: { buyer: true, seller: true, listing: true },
    });

    // Ajouter les fonds au portefeuille du vendeur
    await prisma.user.update({
      where: { id: order.sellerId },
      data: {
        walletBalance: {
          increment: order.sellerNet,
        },
      },
    });

    return Response.json({ order: updatedOrder, message: "Order confirmed, seller paid" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error confirming order" }, { status: 500 });
  }
}
