import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/server';
import { fetchAndRenderThermal } from '@/lib/services/thermal-renderer';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: shopUsers } = await admin.from('users').select('shop_id').eq('auth_user_id', user.id);
  const shopId = shopUsers?.[0]?.shop_id;
  if (!shopId) {
    return NextResponse.json({ error: 'Aucune boutique' }, { status: 403 });
  }

  const { id } = await params;

  const { html, error } = await fetchAndRenderThermal(id, shopId);

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
