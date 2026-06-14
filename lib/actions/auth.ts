'use server';

import { randomBytes } from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { passwordResetTokens } from '@/lib/db/schema';
import { createAdminClient } from '@/lib/server';
import { sendPasswordResetEmail } from '@/lib/resend';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function getResetLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stockos.site';
  return `${baseUrl}/reset-password?token=${token}`;
}

async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  let page = 0;
  const perPage = 500;
  let totalFetched = 0;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error || !data?.users?.length) break;

    const found = data.users.find((u: any) => u.email === email);
    if (found) return { id: found.id };

    totalFetched += data.users.length;
    if (data.users.length < perPage || totalFetched >= data.total) break;
    page++;
  }

  return null;
}

export async function requestPasswordReset(email: string) {
  try {
    const authUser = await findAuthUserByEmail(email);

    if (!authUser) {
      console.log(`[auth] Aucun compte Supabase Auth trouvé pour : ${email}`);
      return { success: true };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await db.insert(passwordResetTokens).values({
        email,
        token,
        expiresAt,
      });
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[auth] DB insert échoué pour ${email}:`, msg);
      return { success: false, error: 'Erreur base de données. Réessayez.' };
    }

    const resetLink = getResetLink(token);
    console.log(`[auth] Envoi email reset à ${email}, lien : ${resetLink}`);

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (emailError) {
      const msg = emailError instanceof Error ? emailError.message : String(emailError);
      console.error(`[auth] Resend échoué pour ${email}:`, msg);
      return { success: false, error: 'Impossible d\'envoyer l\'email. Vérifiez votre adresse ou réessayez plus tard.' };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[auth] Erreur globale pour ${email}:`, message);
    return { success: false, error: message.includes('not configured') ? 'Service momentanément indisponible. Réessayez dans quelques minutes.' : 'Erreur lors de l\'envoi de l\'email' };
  }
}

export async function validateResetToken(token: string) {
  try {
    const results = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (results.length === 0) {
      return { success: false, error: 'Lien expiré ou invalide.' };
    }

    const resetToken = results[0];
    if (resetToken.usedAt) {
      return { success: false, error: 'Ce lien a déjà été utilisé.' };
    }

    return { success: true, email: resetToken.email };
  } catch {
    return { success: false, error: 'Erreur de validation du token.' };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const admin = createAdminClient();

    const results = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (results.length === 0) {
      return { success: false, error: 'Lien expiré ou invalide.' };
    }

    const resetToken = results[0];
    if (resetToken.usedAt) {
      return { success: false, error: 'Ce lien a déjà été utilisé.' };
    }

    const authUser = await findAuthUserByEmail(resetToken.email);

    if (!authUser) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur lors de la réinitialisation.' };
  }
}
