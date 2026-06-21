'use server';

import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { createClient } from '@/lib/server';

export async function getUserMode(): Promise<'simple' | 'complete'> {
  const cookieStore = await cookies();
  const cookieMode = cookieStore.get('stockos-mode')?.value;
  if (cookieMode === 'simple' || cookieMode === 'complete') return cookieMode;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'complete';

    const [pref] = await db
      .select({ mode: userPreferences.mode })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const mode = (pref?.mode as 'simple' | 'complete') || 'complete';
    if (mode) {
      cookieStore.set('stockos-mode', mode, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    }
    return mode;
  } catch {
    return 'complete';
  }
}

export async function setUserMode(mode: 'simple' | 'complete') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Non connecté' };

    await db
      .insert(userPreferences)
      .values({ userId: user.id, mode })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { mode, updatedAt: new Date() },
      });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return { success: false, error: message };
  }
}
