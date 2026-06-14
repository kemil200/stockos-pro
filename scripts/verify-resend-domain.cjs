const { Resend } = require('resend');

const API_KEY = process.env.RESEND_API_KEY;
if (!API_KEY) {
  console.error('RESEND_API_KEY manquant dans .env');
  process.exit(1);
}

const resend = new Resend(API_KEY);

async function main() {
  const domain = process.argv[2] || 'stockos.site';

  const { data, error } = await resend.domains.verify(domain);

  if (error) {
    console.log('Échec vérification :', error.message);
    return;
  }

  console.log(`Domaine vérifié avec succès !`);
  console.log(`Statut : ${data.status}`);
  console.log('\nLes emails depuis noreply@stockos.site peuvent maintenant être envoyés.');
}

main();
