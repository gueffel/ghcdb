import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import CardModal from '../components/CardModal.jsx';
import CardDetailModal from '../components/CardDetailModal.jsx';
import SerialPromptModal from '../components/SerialPromptModal.jsx';
import CatalogPickerModal from '../components/CatalogPickerModal.jsx';
import { useSortableTable } from '../hooks/useSortableTable.jsx';
import TeamChip from '../components/TeamChip.jsx';

function deduplicateCards(cards, scopeBySet = false) {
  const map = new Map();
  for (const card of cards) {
    const setSegment = card.set_name ? `::${card.set_name}` : '';
    const cardKey = card.card_number != null && card.card_number !== ''
      ? `${card.card_number}${setSegment}`
      : `desc::${card.description}::${card.team_city}${setSegment}`;
    const key = scopeBySet ? `${card.year}::${card.product}::${cardKey}` : cardKey;
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

function buildTree(products) {
  const tree = {};
  for (const p of products) {
    if (!tree[p.year]) tree[p.year] = [];
    tree[p.year].push(p);
  }
  return tree;
}

export default function Collection() {
  const [products, setProducts] = useState([]);
  const [tree, setTree] = useState({});
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [openYears, setOpenYears] = useState({});
  const [filter, setFilter] = useState('all'); // all | owned | missing
  const [search, setSearch] = useState('');
  const [serialPromptCard, setSerialPromptCard] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [cardDetail, setCardDetail] = useState(null);

  const loadProducts = useCallback(() => {
    api.getProducts().then(p => {
      setProducts(p);
      setTree(buildTree(p));
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedYear(null);
    setSelectedProduct(null);
    setShowAll(true);
    setSearch('');
    setLoadingCards(true);
    setSidebarOpen(false);
    localStorage.setItem('collection_last', '__all__');
    api.getCards({ limit: 10000 })
      .then(data => setCards(deduplicateCards(data.cards, true)))
      .finally(() => setLoadingCards(false));
  }, []);

  const selectProduct = useCallback((year, product) => {
    setSelectedYear(year);
    setSelectedProduct(product);
    setShowAll(false);
    setSearch('');
    setLoadingCards(true);
    setSidebarOpen(false);
    localStorage.setItem('collection_last', `${year}::${product}`);
    api.getCards({ year, product, limit: 2000 })
      .then(data => setCards(deduplicateCards(data.cards)))
      .finally(() => setLoadingCards(false));
  }, []);

  useEffect(() => {
    api.getProducts().then(p => {
      setProducts(p);
      setTree(buildTree(p));
      const last = localStorage.getItem('collection_last');
      if (!last) return;
      if (last === '__all__') {
        setSelectedYear(null);
        setSelectedProduct(null);
        setShowAll(true);
        setLoadingCards(true);
        api.getCards({ limit: 10000 })
          .then(data => setCards(deduplicateCards(data.cards, true)))
          .finally(() => setLoadingCards(false));
      } else {
        const [year, ...rest] = last.split('::');
        const product = rest.join('::');
        const exists = p.some(x => x.year === year && x.product === product);
        if (exists) {
          setSelectedYear(year);
          setSelectedProduct(product);
          setShowAll(false);
          setOpenYears(prev => ({ ...prev, [year]: true }));
          setLoadingCards(true);
          api.getCards({ year, product, limit: 2000 })
            .then(data => setCards(deduplicateCards(data.cards)))
            .finally(() => setLoadingCards(false));
        }
      }
    });
  }, []);

  const doToggleOwned = async (card, newOwned, serial) => {
    const updated = { ...card, owned: newOwned, ...(serial !== undefined ? { serial } : {}) };
    setCards(prev => prev.map(c => c.id === card.id ? updated : c));
    await api.toggleOwned(card.id, newOwned, serial);
    loadProducts();
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

  const toggleYear = (year) => setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));

  const deleteSet = async (year, product) => {
    if (!window.confirm(`Delete all ${product} (${year}) cards from your collection?\n\nThis cannot be undone.`)) return;
    await api.deleteProduct(year, product);
    if (selectedYear === year && selectedProduct === product) {
      setSelectedYear(null);
      setSelectedProduct(null);
      setShowAll(false);
      setCards([]);
      localStorage.removeItem('collection_last');
    } else if (showAll) {
      setCards(prev => prev.filter(c => !(c.year === year && c.product === product)));
    }
    loadProducts();
  };

  const filteredCards = cards.filter(c => {
    if (filter === 'owned' && !c.owned) return false;
    if (filter === 'missing' && c.owned) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.description || '').toLowerCase().includes(q)
          || (c.card_number || '').toLowerCase().includes(q)
          || (c.team_city || '').toLowerCase().includes(q)
          || (c.team_name || '').toLowerCase().includes(q)
          || (c.set_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const { sorted: displayCards, onSort, sortKey, indicator } = useSortableTable(
    filteredCards,
    showAll ? 'year' : 'card_number',
    showAll ? 'desc' : 'asc'
  );

  const currentProduct = selectedYear && selectedProduct
    ? products.find(p => p.year === selectedYear && p.product === selectedProduct)
    : null;

  const totalOwned = products.reduce((s, p) => s + Number(p.owned), 0);
  const totalCards = products.reduce((s, p) => s + Number(p.total), 0);

  return (
    <div className="collection-layout">
      {/* Sidebar */}
      <aside className={`collection-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span>Products</span>
          <button className="sidebar-add-btn" onClick={() => setCatalogOpen(true)} title="Add from catalog">+</button>
        </div>

        {/* All Collections entry */}
        {products.length > 0 && (
          <button
            className={`product-item all-collections-item ${showAll ? 'active' : ''}`}
            onClick={selectAll}
          >
            <span className="product-name">All Collections</span>
            <span className="product-owned">{totalOwned}/{totalCards}</span>
          </button>
        )}

        {Object.keys(tree).sort((a, b) => b.localeCompare(a)).map(year => (
          <div key={year} className="year-group">
            <button className="year-toggle" onClick={() => toggleYear(year)}>
              <span className="year-arrow">{openYears[year] ? '▼' : '▶'}</span>
              <span className="year-label">{year}</span>
              <span className="year-count">{tree[year].reduce((s, p) => s + Number(p.owned), 0)}/{tree[year].reduce((s, p) => s + Number(p.total), 0)}</span>
            </button>
            {openYears[year] && (
              <div className="product-list">
                {tree[year].map(p => (
                  <div
                    key={p.product}
                    className={`product-item ${selectedYear === year && selectedProduct === p.product ? 'active' : ''}`}
                    onClick={() => selectProduct(year, p.product)}
                  >
                    <span className="product-name">{p.product}</span>
                    <span className="product-owned">{p.owned}/{p.total}</span>
                    <button
                      className="product-delete"
                      onClick={e => { e.stopPropagation(); deleteSet(year, p.product); }}
                      title="Delete set"
                    >del</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {Object.keys(tree).length === 0 && (
          <div className="sidebar-empty">No cards yet.<br />Import a CSV to get started.</div>
        )}
      </aside>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="collection-main">
        <button className="collection-sidebar-toggle btn-ghost" onClick={() => setSidebarOpen(o => !o)}>
          ☰ Products
        </button>
        {!selectedProduct && !showAll ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Select a product from the sidebar to view cards</p>
          </div>
        ) : (
          <>
            <div className="collection-header">
              <div>
                {showAll ? (
                  <>
                    <h2 className="collection-title">All Collections</h2>
                    <span className="collection-meta">{totalOwned} / {totalCards} owned across {products.length} sets</span>
                  </>
                ) : (
                  <>
                    <h2 className="collection-title">{selectedProduct}</h2>
                    <span className="collection-meta">{selectedYear} · {currentProduct?.owned ?? 0} / {currentProduct?.total ?? 0} owned</span>
                  </>
                )}
              </div>
              <div className="collection-controls">
                <div className="search-input-wrap" style={{ flex: 1, minWidth: 120 }}>
                  <input
                    className="collection-search"
                    type="text"
                    placeholder="Search cards…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="search-clear-btn" onClick={() => setSearch('')} aria-label="Clear search">✕</button>
                  )}
                </div>
                <div className="filter-tabs">
                  {[['all', 'All'], ['owned', 'Owned'], ['missing', 'Missing']].map(([val, label]) => (
                    <button key={val} className={`tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingCards ? (
              <div className="page-loading"><div className="spinner large" />Loading cards...</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table collection-table">
                  <thead>
                    <tr>
                      <th onClick={() => onSort('owned')} className={`sortable-th ${sortKey === 'owned' ? 'sorted' : ''}`}>Owned {indicator('owned')}</th>
                      <th onClick={() => onSort('card_number')} className={`sortable-th col-sm-hide ${sortKey === 'card_number' ? 'sorted' : ''}`}># {indicator('card_number')}</th>
                      <th onClick={() => onSort('description')} className={`sortable-th ${sortKey === 'description' ? 'sorted' : ''}`}><span className="th-full">Player / Description</span><span className="th-short">Player</span> {indicator('description')}</th>
                      <th onClick={() => onSort('set_name')} className={`sortable-th ${sortKey === 'set_name' ? 'sorted' : ''}`}>Set {indicator('set_name')}</th>
                      <th onClick={() => onSort('team_city')} className={`sortable-th col-sm-hide ${sortKey === 'team_city' ? 'sorted' : ''}`}>Team {indicator('team_city')}</th>
                      {showAll && <th onClick={() => onSort('year')} className={`sortable-th col-sm-hide ${sortKey === 'year' ? 'sorted' : ''}`}>Year {indicator('year')}</th>}
                      {showAll && <th onClick={() => onSort('product')} className={`sortable-th col-sm-hide ${sortKey === 'product' ? 'sorted' : ''}`}>Product {indicator('product')}</th>}
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
                    {displayCards.map(card => (
                      <tr key={card.id} className={`${card.owned ? 'row-owned' : 'row-missing'} row-clickable`} onClick={() => setCardDetail(card)}>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className={`owned-toggle ${card.owned ? 'owned' : ''}`}
                            onClick={() => toggleOwned(card)}
                            title={card.owned ? 'Mark as not owned' : 'Mark as owned'}
                          >
                            {card.owned ? '✓' : '○'}
                          </button>
                        </td>
                        <td className="text-muted card-num col-sm-hide">{card.card_number}</td>
                        <td className="card-desc">{card.description}</td>
                        <td className="text-muted">{card.set_name}</td>
                        <td className="text-muted col-sm-hide"><TeamChip team_city={card.team_city} team_name={card.team_name} /></td>
                        {showAll && <td className="text-muted col-sm-hide">{card.year}</td>}
                        {showAll && <td className="text-muted col-sm-hide">{card.product}</td>}
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
                {filteredCards.length === 0 && (
                  <div className="table-empty">No cards match the current filter.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

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
            setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
            setEditCard(null);
            loadProducts();
          }}
          onDeleted={(id) => {
            setCards(prev => prev.filter(c => c.id !== id));
            setEditCard(null);
            loadProducts();
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

      {catalogOpen && (
        <CatalogPickerModal
          onClose={() => setCatalogOpen(false)}
          onAdded={loadProducts}
        />
      )}
    </div>
  );
}
