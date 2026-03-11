import { useState, useMemo } from 'react';

const NUMERIC_COLS = new Set(['serial', 'serial_of', 'duplicates', 'owned', 'rookie', 'auto']);

function compareValues(a, b, key) {
  const av = a[key];
  const bv = b[key];
  // nulls always last
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;

  if (key === 'card_number') {
    // Try numeric first, fall back to string
    const an = parseInt(av, 10);
    const bn = parseInt(bv, 10);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    return String(av).localeCompare(String(bv));
  }

  if (NUMERIC_COLS.has(key)) return Number(av) - Number(bv);
  return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
}

export function useSortableTable(data, defaultKey = 'card_number', defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const cmp = compareValues(a, b, sortKey);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const onSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const thProps = (key) => ({
    onClick: () => onSort(key),
    className: `sortable-th ${sortKey === key ? 'sorted' : ''}`,
    children: undefined, // caller provides children
  });

  const indicator = (key) => {
    if (sortKey !== key) return <span className="sort-icon unsorted">⇅</span>;
    return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return { sorted, sortKey, sortDir, onSort, thProps, indicator };
}
