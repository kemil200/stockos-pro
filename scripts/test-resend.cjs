const { Resend } = require('resend');

const r = new Resend(process.env.RESEND_API_KEY);

r.emails.send({
  from: 'StockOS Pro <noreply@stockos.site>',
  to: 'betos@stockos.site',
  subject: 'Test — Reinitialisation mot de passe StockOS Pro',
  html: `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:24px;font-weight:700">StockOS Pro</h1>
      <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">
        <h2 style="font-size:18px;font-weight:600;margin:0 0 8px">Reinitialisation du mot de passe</h2>
        <p style="font-size:14px;color:#52525b;line-height:1.6;margin:0 0 24px">
          Test d'envoi depuis noreply@stockos.site via Resend.
        </p>
        <a href="https://stockos.site/reset-password?token=test123" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500">
          Reinitialiser mon mot de passe
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">
          Ce lien expire dans 1 heure.
        </p>
      </div>
      <p style="font-size:12px;color:#a1a1aa;text-align:center;margin-top:24px">
        StockOS Pro — Gerer votre commerce en toute simplicite
      </p>
    </div>
  `
}).then(d => console.log('OK - Email ID:', d.data?.id || d))
  .catch(e => console.log('ERREUR:', e.message));
