import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, authorId, targetId, score, comment } = body;

    if (!orderId || !authorId || !targetId || score === undefined) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    if (score < 1 || score > 5) {
      return Response.json(
        { error: "Score doit être entre 1 et 5" },
        { status: 400 }
      );
    }

    const rating = await prisma.rating.create({
      data: {
        orderId,
        authorId,
        targetId,
        score,
        comment,
      },
    });

    // Mettre à jour la note moyenne du vendeur
    const allRatings = await prisma.rating.findMany({
      where: { targetId },
    });

    const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    await prisma.user.update({
      where: { id: targetId },
      data: { rating: avgRating },
    });

    return Response.json({ data: rating }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const targetId = req.nextUrl.searchParams.get("targetId");

    if (!targetId) {
      return Response.json({ error: "targetId requis" }, { status: 400 });
    }

    const ratings = await prisma.rating.findMany({
      where: { targetId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: ratings });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
