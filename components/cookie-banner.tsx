'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[99] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 space-y-3">
        <p className="text-sm text-zinc-600 leading-relaxed">
          Nous utilisons des cookies essentiels pour le fonctionnement du site et l&apos;analyse anonyme du trafic. Aucune donnée personnelle n&apos;est collectée sans votre accord.
        </p>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={decline}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Refuser
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 text-center">
          <a href="/privacy" className="underline underline-offset-2 hover:text-zinc-600">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  );
}
