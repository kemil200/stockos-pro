const { Resend } = require('resend');

const r = new Resend(process.env.RESEND_API_KEY);

r.emails.send({
  from: 'StockOS Pro <noreply@stockos.site>',
  to: 'kemilalberto@outlook.com',
  subject: 'Invitation — StockOS Pro',
  html: `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:24px;font-weight:700;color:#18181b">StockOS Pro</h1>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Gestion commerciale, facturation et stock pour PME en Afrique de l'Ouest.
      </p>
      <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-top:16px">
        <h2 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 8px">Vous etes invite</h2>
        <p style="font-size:14px;color:#52525b;line-height:1.6;margin:0 0 16px">
          Decouvrez StockOS Pro : facturez en 30 secondes, suivez votre stock en temps reel, encaissez sans stress.
        </p>
        <ul style="font-size:13px;color:#52525b;line-height:1.8;padding-left:20px;margin:0 0 20px">
          <li>Facturation professionnelle</li>
          <li>Gestion de stock avec alertes</li>
          <li>Caisse enregistreuse integree</li>
          <li>Rapports et analyses</li>
          <li>Essai gratuit de 30 jours</li>
        </ul>
        <a href="https://stockos.site/sign-up" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:500">
          Creer mon compte gratuitement
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin:20px 0 0">
          30 jours gratuits — Sans carte bancaire — Annulez quand vous voulez.
        </p>
      </div>
      <p style="font-size:12px;color:#a1a1aa;text-align:center;margin-top:24px;line-height:1.6">
        Disponible au Togo, Benin, Cote d'Ivoire, Senegal, Guinee, Mali, Burkina, Niger, Ghana, Nigeria.<br/>
        <a href="https://stockos.site" style="color:#a1a1aa">stockos.site</a>
      </p>
    </div>
  `
}).then(d => console.log('OK — Email ID:', d.data?.id || d))
  .catch(e => console.log('ERREUR:', e.message));
