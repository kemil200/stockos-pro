'use client';

import { useState, useRef, useEffect } from 'react';
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Package, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSuggestion {
  id: string;
  name: string;
  unit_price: string;
}

interface Props {
  products: ProductSuggestion[];
  value: string;
  onChange: (product: { id?: string; name: string; price: string }) => void;
  className?: string;
}

export function ProductInput({ products, value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : products;

  const exactMatch = products.find((p) => p.name.toLowerCase() === query.toLowerCase());

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder="Chercher un produit..."
        autoComplete="off"
        className="w-full border-0 border-b-2 border-zinc-200 bg-transparent px-0 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-0 placeholder:text-zinc-300"
      />
      {open && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
          <Command>
            <CommandList>
              {!exactMatch && (
                <CommandEmpty>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ name: query, price: '' });
                      setQuery(query);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 text-sm hover:bg-zinc-50 transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Plus className="size-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-zinc-900">Créer « {query} »</div>
                      <div className="text-xs text-zinc-400">Ajouter au catalogue</div>
                    </div>
                  </button>
                </CommandEmpty>
              )}
              {filtered.length > 0 && (
                <CommandGroup heading={query ? 'Produits correspondants' : 'Tous les produits'}>
                  {filtered.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        onChange({ id: p.id, name: p.name, price: p.unit_price });
                        setQuery(p.name);
                        setOpen(false);
                      }}
                    >
                      <Package className="size-4 text-zinc-400" />
                      <span className="flex-1 text-sm">{p.name}</span>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {Number(p.unit_price).toLocaleString('fr-FR')} F
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
