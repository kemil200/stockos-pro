const { Resend } = require('resend');

const r = new Resend(process.env.RESEND_API_KEY);

r.emails.send({
  from: 'StockOS Pro <contact@stockos.site>',
  to: 'sowahkemilalberto@gmail.com',
  subject: 'Bienvenue chez StockOS Pro',
  html: `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:24px;font-weight:700;color:#18181b;margin:0 0 4px">StockOS Pro</h1>
      <p style="font-size:13px;color:#a1a1aa;margin:0 0 24px">Gestion commerciale pour PME en Afrique de l'Ouest</p>

      <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">
        <h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px">Bienvenue a bord !</h2>

        <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0 0 20px">
          Merci de faire confiance a StockOS Pro pour la gestion de votre commerce.
          Voici ce que vous pouvez faire des maintenant :
        </p>

        <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:0 0 20px">
          <p style="font-size:13px;color:#52525b;margin:0 0 8px"><strong>1.</strong> Creez votre premiere facture en 30 secondes</p>
          <p style="font-size:13px;color:#52525b;margin:0 0 8px"><strong>2.</strong> Ajoutez vos produits et suivez votre stock en temps reel</p>
          <p style="font-size:13px;color:#52525b;margin:0 0 8px"><strong>3.</strong> Utilisez la caisse enregistreuse pour vos ventes</p>
          <p style="font-size:13px;color:#52525b;margin:0"><strong>4.</strong> Imprimez des tickets thermiques pour vos clients</p>
        </div>

        <a href="https://stockos.site/sign-in" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:500;margin:0 0 20px">
          Acceder a mon espace
        </a>

        <p style="font-size:13px;color:#a1a1aa;margin:0 0 16px;line-height:1.6">
          StockOS Pro est disponible au <strong>Togo, Benin, Cote d'Ivoire, Senegal, Guinee, Mali, Burkina Faso, Niger, Ghana et Nigeria</strong>.
          L'application fonctionne sur mobile sans installation et supporte le <strong>FCFA, EUR, USD, NGN et GHS</strong>.
        </p>

        <div style="border-top:1px solid #e4e4e7;padding-top:16px">
          <p style="font-size:13px;color:#52525b;margin:0 0 4px">Besoin d'aide ?</p>
          <p style="font-size:13px;color:#a1a1aa;margin:0">
            WhatsApp : <a href="https://wa.me/22892294858" style="color:#18181b;font-weight:500">+228 92 29 48 58</a>
          </p>
        </div>
      </div>

      <p style="font-size:11px;color:#a1a1aa;text-align:center;margin-top:24px;line-height:1.6">
        Cet email a ete envoye par StockOS Pro.<br/>
        <a href="https://stockos.site" style="color:#a1a1aa">stockos.site</a>
      </p>
    </div>
  `
}).then(d => console.log('OK — Email ID:', d.data?.id || d))
  .catch(e => console.log('ERREUR:', e.message));
