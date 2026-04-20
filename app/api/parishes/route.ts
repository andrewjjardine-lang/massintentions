import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const parishes = await prisma.parish.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { masses: true } },
    },
  });
  return NextResponse.json(parishes);
}
