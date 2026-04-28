import { NextRequest } from "next/server";
import { POST as createOffer } from "@/app/api/offers/route";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: jest.fn(),
    },
    offer: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/offers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create an offer successfully", async () => {
    const mockUser = { id: "user1", name: "Buyer" };
    const mockListing = {
      id: "listing1",
      userId: "seller1",
      price: 1000,
      title: "Item",
    };
    const mockOffer = {
      id: "offer1",
      listingId: "listing1",
      buyerId: "user1",
      offeredPrice: 600,
      status: "pending",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
    (prisma.offer.create as jest.Mock).mockResolvedValue(mockOffer);

    const mockJson = jest.fn().mockResolvedValue({
      listingId: "listing1",
      offeredPrice: 600,
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createOffer(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("offer1");
    expect(data.offeredPrice).toBe(600);
  });

  it("should reject offer below 50% of price", async () => {
    const mockUser = { id: "user1" };
    const mockListing = {
      id: "listing1",
      userId: "seller1",
      price: 1000,
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

    const mockJson = jest.fn().mockResolvedValue({
      listingId: "listing1",
      offeredPrice: 400, // 40% - too low
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createOffer(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("at least 50%");
  });

  it("should reject if not authenticated", async () => {
    (getAuthUser as jest.Mock).mockResolvedValue(null);

    const mockJson = jest.fn().mockResolvedValue({});

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createOffer(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
