import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

// A - Alta 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nueva = await prisma.categoria_instrumento.create({
      data: {
        nombre_categoria: body.nombre_categoria,
        descripcion: body.descripcion ?? null,
      },
    });
    return NextResponse.json({ ok: true, categoria: nueva }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// C - Consulta
export async function GET() {
  try {
    const categorias = await prisma.categoria_instrumento.findMany();
    return NextResponse.json({ ok: true, categorias });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// B - Cambio 
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const actualizada = await prisma.categoria_instrumento.update({
      where: { id_categoria: body.id_categoria },
      data: {
        nombre_categoria: body.nombre_categoria,
        descripcion: body.descripcion,
      },
    });
    return NextResponse.json({ ok: true, categoria: actualizada });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
// D - Baja
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    await prisma.categoria_instrumento.delete({
      where: { id_categoria: id },
    });
    return NextResponse.json({ ok: true, message: "Categoría eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}