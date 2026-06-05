import { notFound } from 'next/navigation';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { PackForm } from '@/components/forms/pack-form';

export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const [{ data: packData }, { data: packItemsData }, { data: shopProducts }] = await Promise.all([
    admin.from('packs').select('*').eq('id', id).eq('shop_id', shop.id).single(),
    admin.from('pack_items').select('*, products(name)').eq('pack_id', id),
    admin.from('products').select('*').eq('shop_id', shop.id).order('name'),
  ]);

  if (!packData) notFound();

  const pack = {
    ...packData,
    items: packItemsData ?? [],
  };

  return (
    <PackForm products={shopProducts ?? []} pack={pack} />
  );
}
