import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // FIX: liste des routes publiques étendue + vérification exacte pour '/'
  // On utilise startsWith uniquement pour les préfixes vrais — '/' en exact match
  // pour éviter que tout soit considéré public (pathname.startsWith('/') = toujours vrai)
  const publicRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/invite', '/_next', '/favicon'];
  const isPublic =
    pathname === '/' ||
    publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // FIX: utilisation de la clé anon standard de Supabase
    // Si ton .env.local utilise NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, garde cette ligne.
    // Si tu as NEXT_PUBLIC_SUPABASE_ANON_KEY, remplace par process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: getUser() fait une vérification serveur — ne jamais utiliser getSession() ici
  // car la session peut être falsifiée côté client
  let user;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    if (result.error) throw result.error;
  } catch {
    // Session invalide ou refresh token expiré → rediriger proprement
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete('sb-kbdmfbwouejuxjizkrzo-auth-token');
    response.cookies.delete('sb-kbdmfbwouejuxjizkrzo-auth-token-code-verifier');
    return response;
  }

  if (!user) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete('sb-kbdmfbwouejuxjizkrzo-auth-token');
    response.cookies.delete('sb-kbdmfbwouejuxjizkrzo-auth-token-code-verifier');
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques et les routes API internes Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
    '/(api|trpc)(.*)',
  ],
};
