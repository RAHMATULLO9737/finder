import { ChevronLeft, ChevronRight } from 'lucide-react';

function pagesToShow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…' + p);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Sahifalar">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Oldingi"><ChevronLeft size={16} /></button>
      {pagesToShow(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="dots">…</span>
        ) : (
          <button key={p} className={p === page ? 'active' : ''} onClick={() => onChange(p)}>{p}</button>
        )
      )}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Keyingi"><ChevronRight size={16} /></button>
    </nav>
  );
}
