import 'server-only';
import { Resend } from 'resend';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: 'StockOS Pro <noreply@stockos.pro>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0;">StockOS Pro</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 8px;">Réinitialisation du mot de passe</h2>
          <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px;">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <a href="${resetLink}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Réinitialiser mon mot de passe
          </a>
          <p style="font-size: 12px; color: #a1a1aa; margin: 24px 0 0; line-height: 1.5;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
        <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin-top: 24px;">
          StockOS Pro — Gérez votre commerce en toute simplicité
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
