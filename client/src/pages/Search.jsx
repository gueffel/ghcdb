import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';
import CardModal from '../components/CardModal.jsx';
import CardDetailModal from '../components/CardDetailModal.jsx';
import SerialPromptModal from '../components/SerialPromptModal.jsx';
import { useSortableTable } from '../hooks/useSortableTable.jsx';
import TeamChip from '../components/TeamChip.jsx';

function deduplicateCards(cards) {
  const map = new Map();
  for (const card of cards) {
    const setSegment = card.set_name ? `::${card.set_name}` : '';
    const key = card.card_number != null && card.card_number !== ''
      ? `${card.year}::${card.product}::${card.card_number}${setSegment}`
      : `${card.year}::${card.product}::desc::${card.description}::${card.team_city}${setSegment}`;
    if (!map.has(key)) {
      map.set(key, { ...card, duplicates: card.duplicates || 0 });
    } else {
      const existing = map.get(key);
      existing.owned = existing.owned || card.owned;
      existing.duplicates = (existing.duplicates || 0) + 1 + (card.duplicates || 0);
    }
  }
  return [...map.values()];
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ owned: '', year: '', product: '', rookie: '', auto: '' });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [serialPromptCard, setSerialPromptCard] = useState(null);
  const [cardDetail, setCardDetail] = useState(null);
  const [products, setProducts] = useState([]);
  const [years, setYears] = useState([]);
  const [poppingIds, setPoppingIds] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef(null);
  const LIMIT = 35;

  useEffect(() => {
    api.getProducts().then(p => {
      setProducts([...new Set(p.map(x => x.product))].sort());
      setYears([...new Set(p.map(x => x.year))].sort((a, b) => b.localeCompare(a)));
    });
  }, []);

  const doSearch = (q, f, pg) => {
    setLoading(true);
    const params = { search: q, page: pg, limit: LIMIT };
    if (f.owned !== '') params.owned = f.owned;
    if (f.year) params.year = f.year;
    if (f.product) params.product = f.product;
    if (f.rookie !== '') params.rookie = f.rookie;
    if (f.auto !== '') params.auto = f.auto;

    api.getCards(params).then(data => {
      setResults(deduplicateCards(data.cards));
      setTotal(data.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      doSearch(query, filters, 1);
    }, 600);
  }, [query, filters]);

  useEffect(() => {
    doSearch(query, filters, page);
  }, [page]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const { sorted: displayResults, onSort, sortKey, indicator } = useSortableTable(results, 'description', 'asc');

  const doToggleOwned = async (card, newOwned, serial) => {
    const updated = { ...card, owned: newOwned, ...(serial !== undefined ? { serial } : {}), ...(newOwned ? { wishlisted: 0 } : {}) };
    setResults(prev => prev.map(c => c.id === card.id ? updated : c));
    if (newOwned) setPoppingIds(prev => new Set([...prev, card.id]));
    await api.toggleOwned(card.id, newOwned, serial);
  };

  const toggleWishlist = async (card) => {
    const newVal = card.wishlisted ? 0 : 1;
    setResults(prev => prev.map(c => c.id === card.id ? { ...c, wishlisted: newVal } : c));
    await api.toggleWishlist(card.id, newVal);
  };

  const toggleOwned = (card) => {
    if (!card.owned && card.serial_of) {
      setSerialPromptCard(card);
      return;
    }
    doToggleOwned(card, !card.owned, card.owned ? null : undefined);
  };

  const confirmSerial = (serial) => {
    const card = serialPromptCard;
    setSerialPromptCard(null);
    doToggleOwned(card, true, serial);
  };

  return (
    <div className="page page-wide">
      <h1 className="page-title">Search Cards</h1>

      <div className="search-bar-wrap">
        <div className="search-input-row">
          <div className="search-input-wrap">
            <input
              className="search-input"
              placeholder="e.g. Pettersson, or Pettersson Red Parallel"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button className="search-clear-btn" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
            )}
          </div>
          <button
            className={`filter-toggle-btn${filtersOpen ? ' active' : ''}${(filters.year || filters.product || filters.rookie || filters.auto) ? ' has-active' : ''}`}
            onClick={() => setFiltersOpen(o => !o)}
            aria-label="Toggle filters"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
              <rect x="3" y="7" width="10" height="1.5" rx="0.75"/>
              <rect x="5.5" y="11.5" width="5" height="1.5" rx="0.75"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="filter-row">
        <div className={`filter-dropdowns${filtersOpen ? ' open' : ''}`}>
          <select value={filters.year} onChange={e => setFilter('year', e.target.value)} className="filter-select">
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filters.product} onChange={e => setFilter('product', e.target.value)} className="filter-select">
            <option value="">All products</option>
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.rookie} onChange={e => setFilter('rookie', e.target.value)} className="filter-select">
            <option value="">All cards</option>
            <option value="1">Rookies only</option>
            <option value="0">Non-rookies</option>
          </select>
          <select value={filters.auto} onChange={e => setFilter('auto', e.target.value)} className="filter-select">
            <option value="">Any type</option>
            <option value="1">Autos only</option>
            <option value="0">No autos</option>
          </select>
          <button className="btn-ghost" onClick={() => { setQuery(''); setFilters({ owned: '', year: '', product: '', rookie: '', auto: '' }); }}>
            Clear
          </button>
        </div>
      </div>

      <div className="search-meta">
        <span>{loading ? <><div className="spinner" />Searching...</> : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}`}</span>
        <div className="filter-tabs" style={{ marginLeft: 'auto' }}>
          {[['', 'All'], ['true', 'Owned'], ['false', 'Missing']].map(([val, label]) => (
            <button key={val} className={`tab ${filters.owned === val ? 'active' : ''}`} onClick={() => setFilter('owned', val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <>
          <div className="table-wrap search-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => onSort('owned')} className={`sortable-th ${sortKey === 'owned' ? 'sorted' : ''}`}><span className="th-full">Owned</span><span className="th-short">✓</span> {indicator('owned')}</th>
                  <th className="col-sm-hide"></th>
                  <th onClick={() => onSort('card_number')} className={`sortable-th col-sm-hide ${sortKey === 'card_number' ? 'sorted' : ''}`}># {indicator('card_number')}</th>
                  <th onClick={() => onSort('description')} className={`sortable-th ${sortKey === 'description' ? 'sorted' : ''}`}><span className="th-full">Player / Description</span><span className="th-short">Player</span> {indicator('description')}</th>
                  <th onClick={() => onSort('set_name')} className={`sortable-th ${sortKey === 'set_name' ? 'sorted' : ''}`}>Set {indicator('set_name')}</th>
                  <th onClick={() => onSort('team_city')} className={`sortable-th col-sm-hide ${sortKey === 'team_city' ? 'sorted' : ''}`}>Team {indicator('team_city')}</th>
                  <th onClick={() => onSort('year')} className={`sortable-th col-sm-hide ${sortKey === 'year' ? 'sorted' : ''}`}>Year {indicator('year')}</th>
                  <th onClick={() => onSort('product')} className={`sortable-th col-sm-hide ${sortKey === 'product' ? 'sorted' : ''}`}>Product {indicator('product')}</th>
                  <th onClick={() => onSort('rookie')} className={`sortable-th col-sm-hide ${sortKey === 'rookie' ? 'sorted' : ''}`}>RC {indicator('rookie')}</th>
                  <th onClick={() => onSort('auto')} className={`sortable-th col-sm-hide ${sortKey === 'auto' ? 'sorted' : ''}`}>AUTO {indicator('auto')}</th>
                  <th onClick={() => onSort('mem')} className={`sortable-th col-sm-hide ${sortKey === 'mem' ? 'sorted' : ''}`}>Mem {indicator('mem')}</th>
                  <th onClick={() => onSort('serial_of')} className={`sortable-th col-sm-hide ${sortKey === 'serial_of' ? 'sorted' : ''}`}>Serial {indicator('serial_of')}</th>
                  <th onClick={() => onSort('grade')} className={`sortable-th col-sm-hide ${sortKey === 'grade' ? 'sorted' : ''}`}>Grade {indicator('grade')}</th>
                  <th onClick={() => onSort('duplicates')} className={`sortable-th col-sm-hide ${sortKey === 'duplicates' ? 'sorted' : ''}`}>Dupes {indicator('duplicates')}</th>
                  <th className="col-sm-hide"></th>
                </tr>
              </thead>
              <tbody>
                {displayResults.map(card => (
                  <tr key={card.id} className={`${card.owned ? 'row-owned' : 'row-missing'} row-clickable`} onClick={() => setCardDetail(card)}>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className={`owned-toggle ${card.owned ? 'owned' : ''} ${poppingIds.has(card.id) ? 'just-owned' : ''}`}
                        onClick={() => toggleOwned(card)}
                        onAnimationEnd={() => setPoppingIds(prev => { const s = new Set(prev); s.delete(card.id); return s; })}
                      >
                        {card.owned ? '✓' : '○'}
                      </button>
                    </td>
                    <td className="col-sm-hide" onClick={e => e.stopPropagation()}>
                      {!card.owned && (
                        <button
                          className={`wishlist-btn${card.wishlisted ? ' wishlisted' : ''}`}
                          onClick={() => toggleWishlist(card)}
                          title={card.wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        >♥</button>
                      )}
                    </td>
                    <td className="text-muted col-sm-hide">{card.card_number}</td>
                    <td><strong>{card.description}</strong></td>
                    <td className="text-muted">{card.set_name}</td>
                    <td className="text-muted col-sm-hide"><TeamChip team_city={card.team_city} team_name={card.team_name} /></td>
                    <td className="text-muted col-sm-hide">{card.year}</td>
                    <td className="text-muted col-sm-hide">{card.product}</td>
                    <td className="col-sm-hide">{card.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                    <td className="col-sm-hide">{card.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
                    <td className="text-muted col-sm-hide">{card.mem || ''}</td>
                    <td className="text-muted col-sm-hide">
                      {card.serial && card.serial_of ? `${card.serial}/${card.serial_of}` : card.serial_of ? `/${card.serial_of}` : ''}
                    </td>
                    <td className="text-muted col-sm-hide">{card.grade || ''}</td>
                    <td className="text-muted col-sm-hide">{card.duplicates > 0 ? card.duplicates : ''}</td>
                    <td className="col-sm-hide" onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => setEditCard(card)} title="Edit">✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <div className="pagination">
              <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button className="btn-ghost" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {!loading && results.length === 0 && (query || Object.values(filters).some(Boolean)) && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No cards found. Try a different search or filter.</p>
        </div>
      )}

      {!loading && results.length === 0 && !query && !Object.values(filters).some(Boolean) && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>Type any combination of player, set, team, product, or year — each word narrows the results.</p>
        </div>
      )}

      {cardDetail && !editCard && (
        <CardDetailModal
          card={cardDetail}
          onClose={() => setCardDetail(null)}
          onEdit={(card) => { setCardDetail(null); setEditCard(card); }}
          onToggleWishlist={(card) => {
            const newVal = card.wishlisted ? 0 : 1;
            setCardDetail(prev => prev ? { ...prev, wishlisted: newVal } : null);
            setResults(prev => prev.map(c => c.id === card.id ? { ...c, wishlisted: newVal } : c));
            api.toggleWishlist(card.id, newVal).catch(() => {});
          }}
          onToggleOwned={(card) => {
            if (!card.owned && card.serial_of) {
              setCardDetail(null);
              setSerialPromptCard(card);
              return;
            }
            const newOwned = !card.owned;
            const updated = { ...card, owned: newOwned, serial: newOwned ? card.serial : null };
            setCardDetail(updated);
            doToggleOwned(card, newOwned, newOwned ? undefined : null);
          }}
        />
      )}

      {editCard && (
        <CardModal
          card={editCard}
          onClose={() => setEditCard(null)}
          onSaved={(updated) => {
            setResults(prev => prev.map(c => c.id === updated.id ? updated : c));
            setEditCard(null);
          }}
          onDeleted={(id) => {
            setResults(prev => prev.filter(c => c.id !== id));
            setEditCard(null);
          }}
        />
      )}

      {serialPromptCard && (
        <SerialPromptModal
          card={serialPromptCard}
          onConfirm={confirmSerial}
          onCancel={() => setSerialPromptCard(null)}
        />
      )}
    </div>
  );
}
