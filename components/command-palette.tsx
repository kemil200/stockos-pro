'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search, FileText, Package, Layers, Warehouse, Receipt, Wallet, Settings,
  ShoppingCart, Users, BarChart3, ArrowRight,
} from 'lucide-react';

interface SearchResult {
  type: 'invoice' | 'product' | 'pack' | 'page';
  id?: string;
  label: string;
  subtitle?: string;
  href: string;
  icon: React.ElementType;
}

const PAGES = [
  { label: 'Factures', href: '/invoices', icon: FileText },
  { label: 'Nouvelle facture', href: '/invoices/new', icon: FileText },
  { label: 'Clients débiteurs', href: '/clients', icon: Users },
  { label: 'Approvisionnement', href: '/supply', icon: ShoppingCart },
  { label: 'Produits', href: '/products', icon: Package },
  { label: 'Packs', href: '/products/packs', icon: Layers },
  { label: 'Stock', href: '/stock', icon: Warehouse },
  { label: 'Paiements', href: '/payments', icon: Receipt },
  { label: 'Caisse', href: '/cash-register', icon: Wallet },
  { label: 'Rapports', href: '/reports', icon: BarChart3 },
  { label: 'Paramètres', href: '/settings', icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === 'K' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    const lower = q.toLowerCase();

    const pageMatches = PAGES.filter(
      (p) => p.label.toLowerCase().includes(lower),
    ).map((p) => ({
      type: 'page' as const,
      label: p.label,
      href: p.href,
      icon: p.icon,
    }));

    setResults(pageMatches);
    setLoading(false);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 h-8 px-3 text-xs text-zinc-400 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
      >
        <Search className="size-3.5" />
        <span>Rechercher...</span>
        <kbd className="ml-8 px-1.5 py-0.5 text-[10px] bg-zinc-200 rounded font-mono">⌘K</kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Recherche globale"
        className="fixed inset-0 z-50"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed inset-x-4 top-[15%] mx-auto max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden animate-in zoom-in-95 fade-in">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Search className="size-4 text-zinc-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={search}
              placeholder="Rechercher une facture, un produit, un pack..."
              className="flex-1 text-sm outline-none placeholder:text-zinc-300"
              autoFocus
            />
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            {loading && (
              <Command.Loading>
                <div className="py-6 text-center text-sm text-zinc-400">Recherche...</div>
              </Command.Loading>
            )}

            {!loading && results.length === 0 && query.length > 0 && (
              <Command.Empty>
                <div className="py-8 text-center text-sm text-zinc-400">Aucun résultat</div>
              </Command.Empty>
            )}

            {!loading && results.length === 0 && query.length === 0 && (
              <div className="py-4">
                <p className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Navigation rapide</p>
                {PAGES.map((p) => (
                  <Command.Item
                    key={p.href}
                    value={p.label}
                    onSelect={() => handleSelect(p.href)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer data-[selected=true]:bg-zinc-100 transition-colors"
                  >
                    <p.icon className="size-4 text-zinc-400" />
                    <span>{p.label}</span>
                    <ArrowRight className="size-3 text-zinc-300 ml-auto" />
                  </Command.Item>
                ))}
              </div>
            )}

            {!loading && results.length > 0 && (
              <Command.Group heading="Résultats">
                {results.map((r, i) => (
                  <Command.Item
                    key={`${r.type}-${i}`}
                    value={`${r.type}:${r.label}`}
                    onSelect={() => handleSelect(r.href)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer data-[selected=true]:bg-zinc-100 transition-colors"
                  >
                    <r.icon className="size-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate">{r.label}</p>
                      {r.subtitle && <p className="text-xs text-zinc-400 truncate">{r.subtitle}</p>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2 border-t bg-zinc-50/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Tapez pour chercher</span>
            <span>↵ ouvrir · esc fermer</span>
          </div>
        </div>
      </Command.Dialog>
    </>
  );
}
