import { NextRequest } from "next/server";
import { POST as confirmOrder } from "@/app/api/orders/[id]/confirm/route";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getAuthUser: jest.fn(),
}));

describe("POST /api/orders/[id]/confirm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should confirm order and credit seller wallet", async () => {
    const mockUser = { id: "buyer1" };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      sellerId: "seller1",
      status: "shipped",
      sellerNet: 696,
    };
    const mockUpdatedOrder = {
      ...mockOrder,
      status: "confirmed",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "seller1",
      walletBalance: 696,
    });

    const req = {} as unknown as NextRequest;

    const response = await confirmOrder(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.status).toBe("confirmed");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "seller1" },
      data: { walletBalance: { increment: 696 } },
    });
  });

  it("should reject if not buyer", async () => {
    const mockUser = { id: "random_user" };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      sellerId: "seller1",
      status: "shipped",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const req = {} as unknown as NextRequest;

    const response = await confirmOrder(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("only buyer");
  });

  it("should reject if order not shipped", async () => {
    const mockUser = { id: "buyer1" };
    const mockOrder = {
      id: "order1",
      buyerId: "buyer1",
      status: "pending_payment",
    };

    (getAuthUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const req = {} as unknown as NextRequest;

    const response = await confirmOrder(req, {
      params: Promise.resolve({ id: "order1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("not shipped");
  });
});
