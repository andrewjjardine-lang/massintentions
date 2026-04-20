import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter });

async function main() {
  const stMary = await prisma.parish.upsert({
    where: { id: "parish-st-mary" },
    update: {},
    create: {
      id: "parish-st-mary",
      name: "St. Mary's Parish",
      address: "123 Church Street",
      city: "Springfield",
      state: "IL",
      phone: "(555) 123-4567",
      email: "office@stmary.org",
    },
  });

  const stJoseph = await prisma.parish.upsert({
    where: { id: "parish-st-joseph" },
    update: {},
    create: {
      id: "parish-st-joseph",
      name: "St. Joseph's Parish",
      address: "456 Faith Avenue",
      city: "Springfield",
      state: "IL",
      phone: "(555) 987-6543",
      email: "secretary@stjoseph.org",
    },
  });

  const now = new Date();
  const masses = [];

  for (let week = 0; week < 2; week++) {
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday + week * 7);

    masses.push({
      parishId: stMary.id,
      scheduledAt: new Date(new Date(sunday).setHours(8, 0, 0, 0)),
      description: "Sunday 8:00 AM Mass",
    });
    masses.push({
      parishId: stMary.id,
      scheduledAt: new Date(new Date(sunday).setHours(10, 30, 0, 0)),
      description: "Sunday 10:30 AM Mass",
    });

    for (let day = 1; day <= 5; day++) {
      const weekday = new Date(now);
      weekday.setDate(now.getDate() + day + week * 7);
      masses.push({
        parishId: stMary.id,
        scheduledAt: new Date(weekday.setHours(7, 30, 0, 0)),
        description: "Daily Mass",
      });
    }

    const stJSunday = new Date(now);
    stJSunday.setDate(now.getDate() + daysUntilSunday + week * 7);
    masses.push({
      parishId: stJoseph.id,
      scheduledAt: new Date(new Date(stJSunday).setHours(9, 0, 0, 0)),
      description: "Sunday 9:00 AM Mass",
    });
    masses.push({
      parishId: stJoseph.id,
      scheduledAt: new Date(new Date(stJSunday).setHours(11, 0, 0, 0)),
      description: "Sunday 11:00 AM Mass",
    });
  }

  for (const mass of masses) {
    await prisma.mass.create({ data: mass });
  }

  // Create a default super admin if none exists
  const adminExists = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
    await prisma.user.create({
      data: {
        name: "Site Administrator",
        email: "admin@massintentions.local",
        passwordHash,
        role: "SUPER_ADMIN",
        parishId: null,
      },
    });
    console.log("\n⚠️  Default admin created:");
    console.log("   Email:    admin@massintentions.local");
    console.log("   Password: ChangeMe123!");
    console.log("   → Change this password immediately after first login!\n");
  }

  console.log("Seed complete:", { parishes: 2, masses: masses.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
