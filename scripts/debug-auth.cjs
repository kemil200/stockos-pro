const { createClient } = require('@supabase/supabase-js');

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/debug-auth.cjs <email>');
    process.exit(1);
  }

  console.log(`1. Test Supabase admin connection...`);
  const admin = createClient(URL, KEY, {
    auth: { persistSession: false },
    global: { headers: { 'x-region': 'eu-west-1' } },
  });

  console.log(`2. Search user: ${email}`);
  let found = false;
  let page = 0;
  const perPage = 500;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.log(`   ERREUR liste page ${page}:`, error.message);
      break;
    }
    if (!data?.users?.length) {
      console.log(`   Aucun user page ${page}`);
      break;
    }

    console.log(`   Page ${page}: ${data.users.length} users (total: ${data.total})`);

    const match = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      console.log(`   TROUVE: ${match.email} (id: ${match.id})`);
      found = true;
    }

    if (data.users.length < perPage) break;
    page++;
  }

  if (!found) {
    console.log(`\nRESULTAT: Aucun compte avec l'email "${email}" dans Supabase Auth.`);
    console.log('Causes possibles :');
    console.log(' - L\'utilisateur s\'est inscrit avec un autre email');
    console.log(' - Le compte a ete supprime');
    console.log(' - Faute de frappe dans l\'email');
  } else {
    console.log(`\nRESULTAT: Compte trouve. Le reset devrait fonctionner.`);
    console.log('Si l\'email n\'est pas recu, verifie :');
    console.log(' - Que RESEND_API_KEY est bien configure sur Vercel');
    console.log(' - Que le domaine stockos.site est verifie dans Resend');
    console.log(' - Les logs Vercel pour voir l\'erreur exacte');
  }
}

main().catch(e => console.log('ERREUR GLOBALE:', e.message));
