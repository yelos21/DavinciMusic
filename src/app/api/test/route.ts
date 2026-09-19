import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const categoria_instrumentos = await prisma.categoria_instrumento.findMany();
    return NextResponse.json({ ok: true, categoria_instrumentos: categoria_instrumentos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}