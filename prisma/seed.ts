import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SOOKED...");

  const user1 = await prisma.user.upsert({
    where: { phone: "+212600000001" },
    update: {},
    create: { phone: "+212600000001", name: "Nadia Benali", city: "Casablanca", rating: 4.8, walletBalance: 219 },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: "+212600000002" },
    update: {},
    create: { phone: "+212600000002", name: "Karim Mansouri", city: "Rabat", rating: 5.0 },
  });

  await prisma.user.upsert({
    where: { phone: "+212600000099" },
    update: {},
    create: { phone: "+212600000099", name: "Admin SOOKED", city: "Casablanca", isAdmin: true },
  });

  const l1 = await prisma.listing.create({
    data: { userId: user1.id, title: "Veste en cuir caramel", description: "Belle veste en cuir.", price: 280, category: "Vestes", size: "M", condition: "Très bon", city: "Casablanca", images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"], isNegotiable: true },
  });

  const l2 = await prisma.listing.create({
    data: { userId: user1.id, title: "Robe midi à fleurs", description: "Robe légère pour l'été.", price: 150, category: "Robes", size: "S", condition: "Bon", city: "Casablanca", images: ["https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600"], isNegotiable: false },
  });

  await prisma.listing.create({
    data: { userId: user2.id, title: "Sneakers Nike Air Max", description: "Jamais portées.", price: 420, category: "Chaussures", size: "42", condition: "Neuf", city: "Rabat", images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"], isNegotiable: true },
  });

  const order = await prisma.order.create({
    data: { buyerId: user2.id, sellerId: user1.id, listingId: l2.id, amount: 150, originalPrice: 150, buyerFees: 10, shippingFees: 30, totalPaid: 190, sellerNet: 100.5, platformRevenue: 29.5, status: "delivered", paymentMethod: "card", deliveryMethod: "relay" },
  });

  await prisma.offer.create({
    data: { listingId: l1.id, buyerId: user2.id, offeredPrice: 200, status: "pending", expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
  });

  await prisma.notification.createMany({
    data: [
      { userId: user1.id, title: "Nouvelle offre", message: "Karim propose 200 DH", type: "offer" },
      { userId: user2.id, title: "Commande confirmée", message: "Achat confirmé", type: "sale", isRead: true },
    ],
  });

  console.log("✅ Seed terminé !");
}

main().catch(console.error).finally(() => prisma.$disconnect());
