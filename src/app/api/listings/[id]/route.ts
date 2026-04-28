import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            city: true,
            avatar: true,
            rating: true,
          },
        },
      },
    });

    if (!listing) {
      return Response.json({ error: "Annonce non trouvée" }, { status: 404 });
    }

    // Enregistrer la vue
    await prisma.view.create({
      data: {
        listingId: id,
      },
    });

    return Response.json({ data: listing });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
