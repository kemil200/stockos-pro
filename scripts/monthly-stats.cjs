const { Resend } = require('resend');
const postgres = require('postgres');

const DB_URL = 'postgresql://postgres.kbdmfbwouejuxjizkrzo:%3FaF_pZ7yhpKN6mK@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const RESEND_KEY = process.env.RESEND_API_KEY;

async function main() {
  const sql = postgres(DB_URL, { ssl: 'require', max: 1, connection: { family: 4 } });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  console.log(`Recuperation des stats pour ${monthName}...\n`);

  const stats = {};

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM shops`;
    stats.shopsTotal = r[0].total;
  } catch(e) { stats.shopsTotal = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM shops WHERE created_at >= ${monthStart}::timestamptz`;
    stats.shopsNew = r[0].total;
  } catch(e) { stats.shopsNew = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM users`;
    stats.usersTotal = r[0].total;
  } catch(e) { stats.usersTotal = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM users WHERE created_at >= ${monthStart}::timestamptz`;
    stats.usersNew = r[0].total;
  } catch(e) { stats.usersNew = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM invoices`;
    stats.invoicesTotal = r[0].total;
  } catch(e) { stats.invoicesTotal = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM invoices WHERE created_at >= ${monthStart}::timestamptz`;
    stats.invoicesMonth = r[0].total;
  } catch(e) { stats.invoicesMonth = 'N/A'; }

  try {
    const r = await sql`SELECT COALESCE(SUM(total::numeric), 0)::float as total FROM invoices WHERE created_at >= ${monthStart}::timestamptz`;
    stats.revenueMonth = Math.round(r[0].total || 0);
  } catch(e) { stats.revenueMonth = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM invoices WHERE status = 'DRAFT'`;
    stats.draftInvoices = r[0].total;
  } catch(e) { stats.draftInvoices = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM products`;
    stats.productsTotal = r[0].total;
  } catch(e) { stats.productsTotal = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM payments WHERE created_at >= ${monthStart}::timestamptz`;
    stats.paymentsMonth = r[0].total;
  } catch(e) { stats.paymentsMonth = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM invoices WHERE status = 'VALIDATED' AND created_at >= ${monthStart}::timestamptz`;
    stats.validatedMonth = r[0].total;
  } catch(e) { stats.validatedMonth = 'N/A'; }

  try {
    const r = await sql`SELECT COUNT(*)::int as total FROM audits WHERE created_at >= ${monthStart}::timestamptz`;
    stats.auditsMonth = r[0].total;
  } catch(e) { stats.auditsMonth = 'N/A'; }

  console.log(stats);
  await sql.end();

  const fmt = (v) => typeof v === 'number' ? v.toLocaleString('fr-FR') : v;

  const r = new Resend(RESEND_KEY);
  const { data, error } = await r.emails.send({
    from: 'StockOS Pro <contact@stockos.site>',
    to: 'betosow49@gmail.com',
    subject: `StockOS Pro — Statistiques ${monthName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;font-weight:700;color:#18181b;margin:0 0 4px">StockOS Pro</h1>
        <p style="font-size:13px;color:#a1a1aa;margin:0 0 24px">Rapport mensuel — ${monthName}</p>

        <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">
          <h2 style="font-size:16px;font-weight:600;color:#18181b;margin:0 0 16px">Resume</h2>

          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Boutiques totales</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.shopsTotal)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Nouvelles boutiques</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;color:#22c55e">+${fmt(stats.shopsNew)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Utilisateurs total</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.usersTotal)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Nouveaux utilisateurs</td>
              <td style="padding:8px 0;text-align:right;font-weight:600;color:#22c55e">+${fmt(stats.usersNew)}</td>
            </tr>
          </table>

          <h2 style="font-size:16px;font-weight:600;color:#18181b;margin:24px 0 16px">Facturation</h2>
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Factures du mois</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.invoicesMonth)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Dont validees</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.validatedMonth)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">En attente (brouillon)</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.draftInvoices)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Paiements enregistres</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.paymentsMonth)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#52525b;font-weight:600">Chiffre d'affaires</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;font-size:16px">${fmt(stats.revenueMonth)} FCFA</td>
            </tr>
          </table>

          <h2 style="font-size:16px;font-weight:600;color:#18181b;margin:24px 0 16px">Activite</h2>
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Factures totales</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.invoicesTotal)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e4e4e7">
              <td style="padding:8px 0;color:#52525b">Produits en catalogue</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.productsTotal)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#52525b">Actions auditees</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${fmt(stats.auditsMonth)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size:11px;color:#a1a1aa;text-align:center;margin-top:24px">
          Rapport genere automatiquement par StockOS Pro.<br/>
          <a href="https://stockos.site" style="color:#a1a1aa">stockos.site</a>
        </p>
      </div>
    `
  });

  if (error) {
    console.log('ERREUR:', error.message);
  } else {
    console.log('OK — Email ID:', data.id);
  }
}

main().catch(e => console.log('ERREUR:', e.message));
