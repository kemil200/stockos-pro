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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/reset-password?token=${token}`;
}

export async function requestPasswordReset(email: string) {
  try {
    const admin = createAdminClient();

    const { data: authUsers } = await admin.auth.admin.listUsers();
    const authUser = authUsers.users.find((u: any) => u.email === email);

    if (!authUser) {
      return { success: true };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt,
    });

    const resetLink = getResetLink(token);
    await sendPasswordResetEmail(email, resetLink);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' };
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

    const { data: authUsers } = await admin.auth.admin.listUsers();
    const authUser = authUsers.users.find((u: any) => u.email === resetToken.email);

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
