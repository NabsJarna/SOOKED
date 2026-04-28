import { NextRequest } from "next/server";
import { POST as respondOffer } from "@/app/api/offers/[id]/respond/route";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    offer: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    listing: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/offers/[id]/respond", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should accept offer and create order", async () => {
    const mockUser = { id: "seller1" };
    const mockOffer = {
      id: "offer1",
      listingId: "listing1",
      buyerId: "buyer1",
      offeredPrice: 800,
      counterPrice: null,
      status: "pending",
    };
    const mockListing = {
      id: "listing1",
      userId: "seller1",
      price: 1000,
    };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      sellerId: "seller1",
      listingId: "listing1",
      amount: 800,
      totalPaid: 840,
      sellerNet: 696,
      platformRevenue: 104,
      status: "pending_payment",
      isNegotiated: true,
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.offer.findUnique as jest.Mock).mockResolvedValue(mockOffer);
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
    (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);
    (prisma.offer.update as jest.Mock).mockResolvedValue({
      ...mockOffer,
      status: "accepted",
    });

    const mockJson = jest.fn().mockResolvedValue({
      action: "accept",
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await respondOffer(req, {
      params: Promise.resolve({ id: "offer1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe("pending_payment");
    expect(data.order.isNegotiated).toBe(true);
  });

  it("should reject offer", async () => {
    const mockUser = { id: "seller1" };
    const mockOffer = {
      id: "offer1",
      listingId: "listing1",
      buyerId: "buyer1",
      offeredPrice: 800,
      status: "pending",
    };
    const mockListing = {
      id: "listing1",
      userId: "seller1",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.offer.findUnique as jest.Mock).mockResolvedValue(mockOffer);
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
    (prisma.offer.update as jest.Mock).mockResolvedValue({
      ...mockOffer,
      status: "rejected",
    });

    const mockJson = jest.fn().mockResolvedValue({
      action: "reject",
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await respondOffer(req, {
      params: Promise.resolve({ id: "offer1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("rejected");
  });

  it("should reject if not seller", async () => {
    const mockUser = { id: "random_user" };
    const mockOffer = {
      id: "offer1",
      listingId: "listing1",
      buyerId: "buyer1",
    };
    const mockListing = {
      id: "listing1",
      userId: "seller1",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.offer.findUnique as jest.Mock).mockResolvedValue(mockOffer);
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

    const mockJson = jest.fn().mockResolvedValue({});

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await respondOffer(req, {
      params: Promise.resolve({ id: "offer1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Only seller");
  });
});
