import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// One-time setup endpoint — creates the admin account if it doesn't exist.
// Visit /api/setup once after deployment, then this becomes a no-op.
export async function GET() {
  try {
    const adminEmail = "admin@brocante.fr";

    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "Admin déjà créé.",
        email: adminEmail,
      });
    }

    const passwordHash = await bcrypt.hash("Admin1234!", 12);
    await db.user.create({
      data: {
        name: "Administrateur",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Compte admin créé avec succès !",
      email: adminEmail,
      password: "Admin1234!",
    });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
