'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvite } from '@/lib/actions/invites';
import { LinkIcon, Copy, Clock } from 'lucide-react';

export function InviteLink() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await createInvite();
      if (result.success) {
        setInviteCode(result.code);
      } else {
        alert(result.error);
      }
    } finally {
      setGenerating(false);
      router.refresh();
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inviteCode) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`;

    return (
      <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <LinkIcon className="size-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">Lien créé</p>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock className="size-3" /> Valable 7 jours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 px-3 py-2 bg-zinc-50 border rounded-lg text-xs text-zinc-600 outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-all"
          >
            {copied ? 'Copié' : <Copy className="size-3.5" />}
          </button>
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent('Rejoins ma boutique sur StockOS Pro : ' + url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-all"
        >
          Partager via WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5">
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
      >
        <LinkIcon className="size-4" />
        {generating ? 'Création...' : 'Créer un lien d\'invitation'}
      </button>
    </div>
  );
}
