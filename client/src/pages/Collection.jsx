import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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

function buildProductTree(products) {
  const tree = {};
  for (const p of products) {
    if (!tree[p.product]) tree[p.product] = [];
    tree[p.product].push(p);
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
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [sidebarGroup, setSidebarGroup] = useState(() => localStorage.getItem('collection_sidebar_group') || 'year');
  const [openProducts, setOpenProducts] = useState({});
  const [cardDetail, setCardDetail] = useState(null);
  const [poppingIds, setPoppingIds] = useState(new Set());
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handler = (e) => setShowScrollTop((e.target.scrollTop || 0) > 400);
    el.addEventListener('scroll', handler, { passive: true, capture: true });
    return () => el.removeEventListener('scroll', handler, { capture: true });
  }, []);


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
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
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
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    localStorage.setItem('collection_last', `${year}::${product}`);
    api.getCards({ year, product, limit: 2000 })
      .then(data => setCards(deduplicateCards(data.cards)))
      .finally(() => setLoadingCards(false));
  }, []);

  useEffect(() => {
    api.getProducts().then(p => {
      setProducts(p);
      setTree(buildTree(p));
      setSidebarLoading(false);

      // Auto-select from navigation state (e.g. coming from Import page)
      const autoSelect = location.state?.autoSelect;
      if (autoSelect?.year && autoSelect?.product) {
        const { year, product } = autoSelect;
        const exists = p.some(x => x.year === year && x.product === product);
        if (exists) {
          setSelectedYear(year);
          setSelectedProduct(product);
          setShowAll(false);
          setOpenYears(prev => ({ ...prev, [year]: true }));
          setLoadingCards(true);
          localStorage.setItem('collection_last', `${year}::${product}`);
          api.getCards({ year, product, limit: 2000 })
            .then(data => setCards(deduplicateCards(data.cards)))
            .finally(() => setLoadingCards(false));
          return;
        }
      }

      const last = localStorage.getItem('collection_last');
      if (!last) {
        if (window.innerWidth <= 768) setSidebarOpen(true);
        return;
      }
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
    const updated = { ...card, owned: newOwned, ...(serial !== undefined ? { serial } : {}), ...(newOwned ? { wishlisted: 0 } : {}) };
    setCards(prev => prev.map(c => c.id === card.id ? updated : c));
    setProducts(prev => prev.map(p =>
      p.year === card.year && p.product === card.product
        ? { ...p, owned: Number(p.owned) + (newOwned ? 1 : -1) }
        : p
    ));
    if (newOwned) setPoppingIds(prev => new Set([...prev, card.id]));
    await api.toggleOwned(card.id, newOwned, serial);
  };

  const toggleWishlist = async (card) => {
    const newVal = card.wishlisted ? 0 : 1;
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, wishlisted: newVal } : c));
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

  const toggleYear = (year) => setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
  const toggleProduct = (product) => setOpenProducts(prev => ({ ...prev, [product]: !prev[product] }));

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

  const exportCsv = () => {
    const cols = ['owned','card_number','set_name','description','team_city','team_name','rookie','auto','mem','serial','serial_of','thickness','year','product','grade','duplicates'];
    const esc = v => v == null ? '' : String(v).includes(',') || String(v).includes('"') || String(v).includes('\n') ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    const rows = [cols.join(','), ...displayCards.map(c => cols.map(k => esc(c[k])).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = showAll ? 'collection.csv' : `${selectedYear} ${selectedProduct}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="collection-layout">
      {/* Sidebar */}
      <aside className={`collection-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span>Products</span>
          <button className="sidebar-add-btn" onClick={() => setCatalogOpen(true)} title="Add from catalog">+</button>
        </div>

        <div className="sidebar-search-wrap">
          <input
            className="sidebar-search"
            placeholder="Filter by year or product…"
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
          />
          {sidebarSearch && (
            <button className="sidebar-search-clear" onClick={() => setSidebarSearch('')}>✕</button>
          )}
        </div>

        <div className="sidebar-group-row">
          <button
            className={`sidebar-group-btn ${sidebarGroup === 'year' ? 'active' : ''}`}
            onClick={() => { setSidebarGroup('year'); localStorage.setItem('collection_sidebar_group', 'year'); }}
          >By Year</button>
          <button
            className={`sidebar-group-btn ${sidebarGroup === 'product' ? 'active' : ''}`}
            onClick={() => { setSidebarGroup('product'); localStorage.setItem('collection_sidebar_group', 'product'); }}
          >By Product</button>
        </div>

        {sidebarLoading ? (
          <div className="sidebar-spinner"><div className="spinner" /></div>
        ) : <>

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

        {sidebarSearch ? (() => {
          const tokens = sidebarSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
          const matches = products.filter(p =>
            tokens.every(t => p.year.toLowerCase().includes(t) || p.product.toLowerCase().includes(t))
          ).sort((a, b) => b.year.localeCompare(a.year) || a.product.localeCompare(b.product));
          return matches.length === 0
            ? <div className="sidebar-empty">No matches.</div>
            : matches.map(p => (
              <div
                key={`${p.year}::${p.product}`}
                className={`product-item ${selectedYear === p.year && selectedProduct === p.product ? 'active' : ''}`}
                onClick={() => selectProduct(p.year, p.product)}
              >
                <span className="product-name"><span className="product-year-tag">{p.year}</span>{p.product}</span>
                <span className="product-owned">{p.owned}/{p.total}</span>
                <button className="product-delete" onClick={e => { e.stopPropagation(); deleteSet(p.year, p.product); }} title="Delete set">del</button>
              </div>
            ));
        })() : sidebarGroup === 'product' ? (() => {
          const ptree = buildProductTree(products);
          return Object.keys(ptree).sort((a, b) => a.localeCompare(b)).map(prod => (
            <div key={prod} className="year-group">
              <button className="year-toggle" onClick={() => toggleProduct(prod)}>
                <span className="year-arrow">{openProducts[prod] ? '▼' : '▶'}</span>
                <span className="year-label">{prod}</span>
                <span className="year-count">{ptree[prod].reduce((s, p) => s + Number(p.owned), 0)}/{ptree[prod].reduce((s, p) => s + Number(p.total), 0)}</span>
              </button>
              {openProducts[prod] && (
                <div className="product-list">
                  {ptree[prod].slice().sort((a, b) => b.year.localeCompare(a.year)).map(p => (
                    <div
                      key={`${p.year}::${p.product}`}
                      className={`product-item ${selectedYear === p.year && selectedProduct === p.product ? 'active' : ''}`}
                      onClick={() => selectProduct(p.year, p.product)}
                    >
                      <span className="product-name">{p.year}</span>
                      <span className="product-owned">{p.owned}/{p.total}</span>
                      <button className="product-delete" onClick={e => { e.stopPropagation(); deleteSet(p.year, p.product); }} title="Delete set">del</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ));
        })() : Object.keys(tree).sort((a, b) => b.localeCompare(a)).map(year => (
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
        </>}
      </aside>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      {sidebarOpen && <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} title="Close">✕</button>}

      {/* Main content */}
      <div className="collection-main" ref={mainRef}>
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
                <button className="btn-ghost btn-icon-text col-sm-hide" onClick={exportCsv} title="Export to CSV">↓ Export CSV</button>
              </div>
            </div>

            {loadingCards ? (
              <div className="page-loading"><div className="spinner large" />Loading cards...</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table collection-table">
                  <thead>
                    <tr>
                      <th onClick={() => onSort('owned')} className={`sortable-th ${sortKey === 'owned' ? 'sorted' : ''}`}><span className="th-full">Owned</span><span className="th-short">✓</span> {indicator('owned')}</th>
                      <th className="col-sm-hide"></th>
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
                            className={`owned-toggle ${card.owned ? 'owned' : ''} ${poppingIds.has(card.id) ? 'just-owned' : ''}`}
                            onClick={() => toggleOwned(card)}
                            title={card.owned ? 'Mark as not owned' : 'Mark as owned'}
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
          onToggleWishlist={(card) => {
            const newVal = card.wishlisted ? 0 : 1;
            setCardDetail(prev => prev ? { ...prev, wishlisted: newVal } : null);
            setCards(prev => prev.map(c => c.id === card.id ? { ...c, wishlisted: newVal } : c));
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

      <button
        className={`scroll-top-btn${showScrollTop ? ' visible' : ''}`}
        onClick={() => mainRef.current?.querySelector('.table-wrap')?.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Back to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  );
}
