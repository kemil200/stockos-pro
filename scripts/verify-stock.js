// Verify stock trigger and data integrity
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('=== 1. TRIGGER CHECK ===');
  const { data: triggers } = await admin.rpc('check_trigger');
  try {
    const { data: func } = await admin
      .from('pg_proc')
      .select('*')
      .filter('proname', 'eq', 'apply_stock_movement')
      .limit(1);
    console.log('Function exists:', !!func);
  } catch {}

  // Check if trigger exists via raw query
  const { data: trigData, error: trigErr } = await admin
    .rpc('get_trigger_info')
    .select('*');
  
  // Alternative: check trigger via SQL
  console.log('\n=== 2. RECENT STOCK MOVEMENTS ===');
  const { data: recentMovements, error: movErr } = await admin
    .from('stock_movements')
    .select('movement_type, quantity, stock_item_id, created_at, reason')
    .order('created_at', { ascending: false })
    .limit(10);

  if (movErr) {
    console.error('Error fetching movements:', movErr);
  } else {
    console.log('Last 10 movements:');
    for (const m of recentMovements || []) {
      console.log(`  ${m.movement_type.padEnd(15)} qty=${m.quantity.toString().padEnd(8)} stock_item=${m.stock_item_id} ${m.reason || ''}`);
    }
  }

  console.log('\n=== 3. STOCK ITEMS (sample) ===');
  const { data: stockItems, error: stockErr } = await admin
    .from('stock_items')
    .select('id, product_id, quantity, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (stockErr) {
    console.error('Error fetching stock:', stockErr);
  } else {
    for (const s of stockItems || []) {
      console.log(`  product=${s.product_id?.slice(0,8)} qty=${s.quantity} updated=${s.updated_at}`);
    }
  }

  console.log('\n=== 4. CROSS-CHECK: Movements vs Stock ===');
  // For each stock item with movements, verify sum matches
  const { data: stockWithMoves } = await admin
    .from('stock_items')
    .select('id, product_id, quantity');

  if (stockWithMoves) {
    for (const si of stockWithMoves.slice(0, 5)) {
      const { data: moves } = await admin
        .from('stock_movements')
        .select('quantity, movement_type')
        .eq('stock_item_id', si.id);
      
      const expectedQty = (moves || [])
        .filter(m => m.movement_type !== 'ADJUSTMENT')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const match = Math.abs(expectedQty - Number(si.quantity)) < 0.001;
      console.log(`  stock_item=${si.id?.slice(0,8)} stored=${si.quantity} computed=${expectedQty} ${match ? '✓' : '✗ MISMATCH'}`);
    }
  }

  console.log('\n=== 5. PRODUCTS WITH STOCK ===');
  const { data: productsWithStock } = await admin
    .from('products')
    .select('id, name')
    .limit(5);
  
  if (productsWithStock) {
    for (const p of productsWithStock) {
      const { data: si } = await admin
        .from('stock_items')
        .select('quantity')
        .eq('product_id', p.id)
        .limit(1);
      const { data: moves } = await admin
        .from('stock_movements')
        .select('movement_type, quantity')
        .eq('product_id', p.id);
      const moveCount = moves?.length || 0;
      const stockQty = si?.[0]?.quantity || '0';
      console.log(`  ${p.name?.slice(0,20).padEnd(22)} stock=${stockQty} movements=${moveCount}`);
    }
  }
}

main().catch(console.error);
