import { NextRequest } from "next/server";
import { POST as createDispute } from "@/app/api/orders/[id]/dispute/route";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dispute: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/orders/[id]/dispute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create dispute successfully", async () => {
    const mockUser = { id: "buyer1" };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      sellerId: "seller1",
      status: "shipped",
    };
    const mockDispute = {
      id: "dispute1",
      orderId: "order1",
      reason: "Item damaged",
      status: "open",
    };
    const mockUpdatedOrder = {
      ...mockOrder,
      status: "disputed",
      dispute: mockDispute,
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    (prisma.dispute.create as jest.Mock).mockResolvedValue(mockDispute);
    (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

    const mockJson = jest.fn().mockResolvedValue({
      reason: "Item damaged",
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createDispute(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe("disputed");
    expect(data.dispute.reason).toBe("Item damaged");
  });

  it("should reject if reason is empty", async () => {
    const mockUser = { id: "buyer1" };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);

    const mockJson = jest.fn().mockResolvedValue({
      reason: "   ",
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createDispute(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Reason");
  });

  it("should reject if seller tries to dispute already confirmed order", async () => {
    const mockUser = { id: "seller1" };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      sellerId: "seller1",
      status: "confirmed",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const mockJson = jest.fn().mockResolvedValue({
      reason: "Invalid order",
    });

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createDispute(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Cannot dispute");
  });

  it("should reject if not buyer or seller", async () => {
    const mockUser = { id: "random_user" };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      sellerId: "seller1",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const mockJson = jest.fn().mockResolvedValue({});

    const req = {
      json: mockJson,
    } as unknown as NextRequest;

    const response = await createDispute(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("cannot dispute");
  });
});
