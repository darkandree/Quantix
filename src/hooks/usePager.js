import { useEffect, useMemo, useState } from 'react';

// Client-side pagination. `resetKey` changes (filters, search...) send the user back to page 1.
export function usePager(items, resetKey) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  useEffect(() => { setPage(1); }, [resetKey, size]);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  const slice = useMemo(() => items.slice(start, start + size), [items, start, size]);

  return { page: current, setPage, size, setSize, pageCount, total, slice, from: total ? start + 1 : 0, to: Math.min(start + size, total) };
}