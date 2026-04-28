import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { reason } = await req.json();

    if (!reason || reason.trim().length === 0) {
      return Response.json({ error: "Reason is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { buyer: true, seller: true },
    });

    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Vérifier que c'est l'acheteur ou le vendeur
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      return Response.json({ error: "You cannot dispute this order" }, { status: 403 });
    }

    if (order.status === "confirmed" || order.status === "disputed") {
      return Response.json({ error: "Cannot dispute this order" }, { status: 400 });
    }

    // Créer la dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId: id,
        reason,
        status: "open",
      },
    });

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "disputed" },
      include: { buyer: true, seller: true, dispute: true },
    });

    return Response.json({ order: updatedOrder, dispute, message: "Dispute created" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error creating dispute" }, { status: 500 });
  }
}
