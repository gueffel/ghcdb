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

    api.getCards(params).then(data => {
      let cards = data.cards;
      if (f.rookie !== '') cards = cards.filter(c => Boolean(c.rookie) === (f.rookie === '1'));
      if (f.auto !== '') cards = cards.filter(c => Boolean(c.auto) === (f.auto === '1'));
      setResults(deduplicateCards(cards));
      setTotal(data.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      doSearch(query, filters, 1);
    }, 300);
  }, [query, filters]);

  useEffect(() => {
    doSearch(query, filters, page);
  }, [page]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const { sorted: displayResults, onSort, sortKey, indicator } = useSortableTable(results, 'description', 'asc');

  const doToggleOwned = async (card, newOwned, serial) => {
    const updated = { ...card, owned: newOwned, ...(serial !== undefined ? { serial } : {}) };
    setResults(prev => prev.map(c => c.id === card.id ? updated : c));
    await api.toggleOwned(card.id, newOwned, serial);
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
        <div className="search-input-wrap">
          <input
            className="search-input"
            placeholder="Search by player, team, card number..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
          )}
        </div>
      </div>

      <div className="filter-row">
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
        <div className="filter-tabs" style={{ marginLeft: 'auto' }}>
          {[['', 'All'], ['true', 'Owned'], ['false', 'Missing']].map(([val, label]) => (
            <button key={val} className={`tab ${filters.owned === val ? 'active' : ''}`} onClick={() => setFilter('owned', val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="search-meta">
        {loading ? <><div className="spinner" />Searching...</> : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}`}
      </div>

      {results.length > 0 && (
        <>
          <div className="table-wrap search-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => onSort('owned')} className={`sortable-th ${sortKey === 'owned' ? 'sorted' : ''}`}>Owned {indicator('owned')}</th>
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
                        className={`owned-toggle ${card.owned ? 'owned' : ''}`}
                        onClick={() => toggleOwned(card)}
                      >
                        {card.owned ? '✓' : '○'}
                      </button>
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
          <p>Type a player name, team, or card number to search your collection.</p>
        </div>
      )}

      {cardDetail && !editCard && (
        <CardDetailModal
          card={cardDetail}
          onClose={() => setCardDetail(null)}
          onEdit={(card) => { setCardDetail(null); setEditCard(card); }}
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
