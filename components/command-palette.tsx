'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search, FileText, Package, Layers, Warehouse, Receipt, Settings,
  ShoppingCart, Users, BarChart3, ArrowRight, Tag, Hash, Zap,
} from 'lucide-react';
import { searchAll } from '@/lib/actions/search';

interface SearchResult {
  id: string;
  type: 'invoice' | 'product' | 'pack' | 'category' | 'page';
  label: string;
  subtitle?: string;
  href: string;
  icon: React.ElementType;
}

const ICONS: Record<string, React.ElementType> = {
  invoice: FileText,
  product: Package,
  pack: Layers,
  category: Tag,
  page: ArrowRight,
};

const PAGES = [
  { label: 'Factures', href: '/invoices', icon: FileText },
  { label: 'Nouvelle facture', href: '/invoices/new', icon: FileText },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Approvisionnement', href: '/supply', icon: ShoppingCart },
  { label: 'Produits', href: '/products', icon: Package },
  { label: 'Packs', href: '/products/packs', icon: Layers },
  { label: 'Stock', href: '/stock', icon: Warehouse },
  { label: 'Paiements', href: '/payments', icon: Receipt },
  { label: 'Vente rapide', href: '/mode-simple', icon: Zap },
  { label: 'Rapports', href: '/reports', icon: BarChart3 },
  { label: 'Paramètres', href: '/settings', icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    const lower = q.toLowerCase();

    // Page matches (instant)
    const pageMatches: SearchResult[] = PAGES.filter((p) =>
      p.label.toLowerCase().includes(lower),
    ).map((p) => ({
      id: p.href,
      type: 'page' as const,
      label: p.label,
      href: p.href,
      icon: p.icon,
    }));

    // DB search (debounced)
    if (q.length >= 2) {
      const dbResults = await searchAll(q);
      const dbMapped: SearchResult[] = dbResults.map((r) => ({
        ...r,
        icon: ICONS[r.type] || ArrowRight,
      }));
      setResults([...dbMapped, ...pageMatches]);
    } else {
      setResults(pageMatches);
    }
    setLoading(false);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 150);
  }, [doSearch]);

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

      <Command.Dialog open={open} onOpenChange={setOpen} label="Recherche globale" className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed inset-x-4 top-[15%] mx-auto max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200/80 overflow-hidden animate-in zoom-in-95 fade-in">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Search className="size-4 text-zinc-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={handleInputChange}
              placeholder="Rechercher un produit, une facture, une catégorie..."
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
                {results.map((r) => (
                  <Command.Item
                    key={`${r.type}:${r.id}`}
                    value={`${r.type}:${r.label}`}
                    onSelect={() => handleSelect(r.href)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer data-[selected=true]:bg-zinc-100 transition-colors"
                  >
                    <r.icon className="size-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{r.label}</p>
                      {r.subtitle && <p className="text-xs text-zinc-400 truncate">{r.subtitle}</p>}
                    </div>
                    <span className="text-[10px] text-zinc-300 uppercase shrink-0">{r.type}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2 border-t bg-zinc-50/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Produits · Factures · Catégories · Packs</span>
            <span>↵ ouvrir · esc fermer</span>
          </div>
        </div>
      </Command.Dialog>
    </>
  );
}
