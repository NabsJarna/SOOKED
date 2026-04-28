import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, senderId, receiverId, content } = body;

    if (!orderId || !senderId || !receiverId || !content) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    return Response.json({ data: message }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("orderId");
    const userId = req.nextUrl.searchParams.get("userId");

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (userId) {
      where.OR = [
        { senderId: userId },
        { receiverId: userId },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return Response.json({ data: messages });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
