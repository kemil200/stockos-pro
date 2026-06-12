import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const pg = postgres(dbUrl, { ssl: 'require', max: 1, connection: { family: 4 } });

  try {
    const [result] = await pg`
      SELECT 
        COUNT(*)::int AS total_movements,
        COUNT(*) FILTER (WHERE movement_type = 'PURCHASE')::int AS purchases,
        COUNT(*) FILTER (WHERE movement_type = 'SALE')::int AS sales,
        (
          SELECT COUNT(*)::int 
          FROM stock_items si 
          LEFT JOIN stock_movements sm ON sm.stock_item_id = si.id 
          WHERE si.quantity != COALESCE(
            (SELECT SUM(CASE WHEN sm2.movement_type <> 'ADJUSTMENT' THEN sm2.quantity ELSE 0 END)
             FROM stock_movements sm2 WHERE sm2.stock_item_id = si.id), 0
          )
        ) AS mismatches
      FROM stock_movements
    `;

    const health = {
      status: result.mismatches === 0 ? 'healthy' : 'degraded',
      total_movements: result.total_movements,
      purchases: result.purchases,
      sales: result.sales,
      stock_mismatches: result.mismatches,
    };

    return NextResponse.json(health);
  } finally {
    await pg.end();
  }
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const pg = postgres(dbUrl, { ssl: 'require', max: 1, connection: { family: 4 } });

  try {
    const [before] = await pg`
      SELECT COUNT(*)::int AS mismatches
      FROM stock_items si
      WHERE si.quantity != COALESCE(
        (SELECT SUM(CASE WHEN sm.movement_type <> 'ADJUSTMENT' THEN sm.quantity ELSE 0 END)
         FROM stock_movements sm WHERE sm.stock_item_id = si.id), 0
      )
    `;

    const { count: repaired } = await pg`
      UPDATE stock_items si
      SET quantity = COALESCE(sub.computed, 0), updated_at = NOW()
      FROM (
        SELECT stock_item_id, SUM(CASE WHEN movement_type <> 'ADJUSTMENT' THEN quantity ELSE 0 END) AS computed
        FROM stock_movements GROUP BY stock_item_id
      ) sub
      WHERE si.id = sub.stock_item_id
    `;

    const [after] = await pg`
      SELECT COUNT(*)::int AS mismatches
      FROM stock_items si
      WHERE si.quantity != COALESCE(
        (SELECT SUM(CASE WHEN sm.movement_type <> 'ADJUSTMENT' THEN sm.quantity ELSE 0 END)
         FROM stock_movements sm WHERE sm.stock_item_id = si.id), 0
      )
    `;

    return NextResponse.json({
      status: 'repaired',
      mismatches_before: before.mismatches,
      mismatches_after: after.mismatches,
      items_repaired: repaired,
    });
  } finally {
    await pg.end();
  }
}
