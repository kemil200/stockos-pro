import { NextResponse } from 'next/server';
import { fetchAndRenderThermal } from '@/lib/services/thermal-renderer';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { html, error } = await fetchAndRenderThermal(id);

  if (error) {
    return NextResponse.json({ error }, { status: 404 });
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
