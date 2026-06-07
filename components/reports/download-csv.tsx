'use client';

import { Download } from 'lucide-react';

interface Props {
  data: Record<string, string | number>[];
  filename?: string;
  columns?: { key: string; label: string }[];
}

export function DownloadCSV({ data, filename = 'rapport', columns }: Props) {
  const handleDownload = () => {
    if (!data || !data.length) return;

    const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));

    const header = cols.map((c) => `"${c.label}"`).join(',');
    const rows = data.map((row) =>
      cols.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csv = [header, ...rows].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="print-hide inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all shadow-sm active:scale-[0.98]"
    >
      <Download className="size-4" />
      Télécharger
    </button>
  );
}
