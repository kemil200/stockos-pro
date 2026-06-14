import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password || !supabaseUrl || !serviceRoleKey) {
  console.error('SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey,
  {
    auth: { persistSession: false },
    realtime: { transport: ws },
  },
);

async function main() {
  const { data: existing, error: lookupError } = await supabase.auth.admin.listUsers();
  if (lookupError) { console.error('Erreur listing:', lookupError.message); process.exit(1); }

  const found = existing.users.find((u) => u.email === email);

  if (found) {
    console.log('Utilisateur existe déjà, mise à jour du rôle...');
    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      app_metadata: { role: 'SUPERADMIN' },
    });
    if (error) { console.error('Erreur mise à jour:', error.message); process.exit(1); }
    console.log('Rôle SUPERADMIN attribué à', email);
    process.exit(0);
  }

  console.log('Création de', email);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'SUPERADMIN' },
  });

  if (error) { console.error('Erreur création:', error.message); process.exit(1); }
  console.log('SUPERADMIN créé avec succès :', data.user?.id);
}

main();
