import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const parishId = req.nextUrl.searchParams.get("parishId");

  const masses = await prisma.mass.findMany({
    where: {
      ...(parishId ? { parishId } : {}),
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      parish: { select: { id: true, name: true } },
      _count: { select: { intentions: true } },
    },
  });

  return NextResponse.json(
    masses.map((m) => ({
      ...m,
      spotsAvailable: m.maxIntentions - m._count.intentions,
      isFull: m._count.intentions >= m.maxIntentions,
    }))
  );
}
