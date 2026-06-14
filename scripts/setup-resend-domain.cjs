const { Resend } = require('resend');

const API_KEY = process.env.RESEND_API_KEY;
if (!API_KEY) {
  console.error('RESEND_API_KEY manquant dans .env');
  process.exit(1);
}

const resend = new Resend(API_KEY);

async function main() {
  const domain = process.argv[2] || 'stockos.site';

  console.log(`Configuration Resend pour : ${domain}\n`);

  const { data, error } = await resend.domains.create({ name: domain });

  if (error) {
    console.log('Erreur :', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n→ Le domaine existe déjà. Récupération des enregistrements...');

      const { data: existing } = await resend.domains.get(domain);
      if (existing) {
        console.log(`\nStatut : ${existing.status}`);
        console.log('\nEnregistrements DNS à ajouter sur Vercel :\n');

        for (const record of existing.records) {
          console.log(`  Type : ${record.type}`);
          console.log(`  Nom  : ${record.name}`);
          console.log(`  Valeur : ${record.value}`);
          console.log(`  TTL  : ${record.ttl || 'Auto'}`);
          console.log('');
        }
      }
    }
    return;
  }

  console.log('Domaine créé avec succès !');
  console.log(`Statut : ${data.status}\n`);

  if (data.records?.length) {
    console.log('Enregistrements DNS à ajouter sur Vercel :\n');
    for (const record of data.records) {
      console.log(`  Type : ${record.type}`);
      console.log(`  Nom  : ${record.name}`);
      console.log(`  Valeur : ${record.value}`);
      console.log(`  TTL  : ${record.ttl || 'Auto'}`);
      console.log('');
    }
  }

  console.log('Après avoir ajouté ces enregistrements sur Vercel DNS, attends 2-5 min puis vérifie :');
  console.log(`  npx tsx scripts/verify-resend-domain.ts ${domain}`);
}

main();
