import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { PackForm } from '@/components/forms/pack-form';

export default async function NewPackPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: shopProducts } = await admin
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('name');

  return (
    <PackForm products={shopProducts ?? []} />
  );
}
