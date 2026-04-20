import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPllentyCharge } from "@/lib/pllenty";
import { PaymentStatus } from "@/app/generated/prisma/client";

export async function POST(req: NextRequest) {
  const { intentionId } = await req.json();

  if (!intentionId) {
    return NextResponse.json({ error: "intentionId is required" }, { status: 400 });
  }

  const intention = await prisma.massIntention.findUnique({
    where: { id: intentionId },
    include: { mass: { include: { parish: true } } },
  });

  if (!intention) {
    return NextResponse.json({ error: "Intention not found" }, { status: 404 });
  }

  if (intention.paymentStatus === PaymentStatus.PAID) {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  const result = await createPllentyCharge({
    amountCents: intention.amountCents,
    description: `Mass Intention — ${intention.honoreeName} — ${intention.mass.parish.name}`,
    customerName: intention.requesterName,
    customerEmail: intention.requesterEmail,
    referenceId: intention.id,
  });

  if (!result.success) {
    await prisma.massIntention.update({
      where: { id: intentionId },
      data: { paymentStatus: PaymentStatus.FAILED },
    });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const updated = await prisma.massIntention.update({
    where: { id: intentionId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      pllentyPaymentId: result.paymentId ?? null,
    },
  });

  return NextResponse.json({
    intention: updated,
    checkoutUrl: result.checkoutUrl ?? null,
  });
}
