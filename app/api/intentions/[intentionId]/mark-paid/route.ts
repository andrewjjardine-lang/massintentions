import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/app/generated/prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ intentionId: string }> }
) {
  const { intentionId } = await params;

  const intention = await prisma.massIntention.findUnique({
    where: { id: intentionId },
  });

  if (!intention) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (intention.paymentMethod !== "CASH") {
    return NextResponse.json(
      { error: "Only cash payments can be marked paid here" },
      { status: 400 }
    );
  }

  const updated = await prisma.massIntention.update({
    where: { id: intentionId },
    data: { paymentStatus: PaymentStatus.PAID },
  });

  return NextResponse.json(updated);
}
