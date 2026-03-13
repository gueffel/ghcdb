import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useSortableTable } from '../hooks/useSortableTable.jsx';
import { formatTeam } from '../utils.js';

function buildTree(sets) {
  const tree = {};
  for (const s of sets) {
    if (!tree[s.year]) tree[s.year] = [];
    tree[s.year].push(s);
  }
  return tree;
}

function buildProductTree(sets) {
  const tree = {};
  for (const s of sets) {
    if (!tree[s.product]) tree[s.product] = [];
    tree[s.product].push(s);
  }
  return tree;
}

export default function CatalogPickerModal({ onClose, onAdded }) {
  const [sets, setSets] = useState([]);
  const [tree, setTree] = useState({});
  const [openYears, setOpenYears] = useState({});
  const [openProducts, setOpenProducts] = useState({});
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewCards, setPreviewCards] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [userProducts, setUserProducts] = useState(new Set());
  const [sidebarGroup, setSidebarGroup] = useState('year');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [busyProgress, setBusyProgress] = useState({ pct: 0, done: 0, total: 0 });
  const [msg, setMsg] = useState(null);
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onClose, 180); };

  useEffect(() => {
    Promise.all([api.getCatalogSets(), api.getProducts()]).then(([catalogSets, userProds]) => {
      setSets(catalogSets);
      setTree(buildTree(catalogSets));
      setUserProducts(new Set(userProds.map(p => `${p.year}::${p.product}`)));
      setSidebarLoading(false);
    });
  }, []);

  const selectSet = (year, product) => {
    setSelectedYear(year);
    setSelectedProduct(product);
    setLoadingPreview(true);
    setPreviewCards([]);
    setMsg(null);
    api.getCatalogCards(year, product)
      .then(setPreviewCards)
      .finally(() => setLoadingPreview(false));
  };

  const toggleYear = (year) => setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
  const toggleProduct = (product) => setOpenProducts(prev => ({ ...prev, [product]: !prev[product] }));

  const addToCollection = async (year, product, mode = 'add') => {
    setMsg(null);
    setBusy(`${year}::${product}`);
    const initTotal = sets.find(s => s.year === year && s.product === product)?.total ?? 0;
    setBusyProgress({ pct: 0, done: 0, total: initTotal });
    try {
      const result = await api.addToCollection(year, product, mode, ({ progress, done, total }) => {
        setBusyProgress({ pct: progress, done, total });
      });
      setMsg({ type: 'success', text: `Added ${result.added} cards from ${product} (${year}) to your collection.` });
      setUserProducts(prev => new Set([...prev, `${year}::${product}`]));
      onAdded();
    } catch (err) {
      if (err.message === 'already_exists') {
        setMsg({ type: 'confirm', text: `You already have ${product} (${year}) in your collection. Replace it with the catalog version?`, year, product });
      } else {
        setMsg({ type: 'error', text: err.message });
      }
    } finally {
      setBusy('');
      setBusyProgress({ pct: 0, done: 0, total: 0 });
    }
  };

  const { sorted: sortedPreview, onSort, sortKey, indicator } = useSortableTable(previewCards, 'card_number', 'asc');
  const currentSet = sets.find(s => s.year === selectedYear && s.product === selectedProduct);
  const alreadyOwned = selectedYear && selectedProduct ? userProducts.has(`${selectedYear}::${selectedProduct}`) : false;

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`} onClick={close}>
      <div className="catalog-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add from Catalog</h2>
          <button className="modal-close" onClick={close}>✕</button>
        </div>

        <div className="catalog-picker-body">
          {/* Set list */}
          <div className="catalog-picker-sidebar">
            <div className="sidebar-header" style={{ position: 'sticky', top: 0 }}>Available Sets</div>
            <div className="sidebar-group-row" style={{ position: 'sticky', top: 41 }}>
              <button
                className={`sidebar-group-btn ${sidebarGroup === 'year' ? 'active' : ''}`}
                onClick={() => setSidebarGroup('year')}
              >By Year</button>
              <button
                className={`sidebar-group-btn ${sidebarGroup === 'product' ? 'active' : ''}`}
                onClick={() => setSidebarGroup('product')}
              >By Product</button>
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
            {sidebarLoading ? (
              <div className="sidebar-spinner"><div className="spinner" /></div>
            ) : sidebarSearch ? (() => {
              const tokens = sidebarSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
              const matches = sets.filter(s =>
                tokens.every(t => s.year.toLowerCase().includes(t) || s.product.toLowerCase().includes(t))
              ).sort((a, b) => b.year.localeCompare(a.year) || a.product.localeCompare(b.product));
              return matches.length === 0
                ? <div className="sidebar-empty">No matches.</div>
                : matches.map(s => (
                  <button
                    key={`${s.year}::${s.product}`}
                    className={`product-item ${selectedYear === s.year && selectedProduct === s.product ? 'active' : ''}`}
                    onClick={() => selectSet(s.year, s.product)}
                  >
                    <span className="product-name"><span className="product-year-tag">{s.year}</span>{s.product}</span>
                    <span className="product-owned">
                      {userProducts.has(`${s.year}::${s.product}`) ? <span className="catalog-owned-dot" title="In your collection">●</span> : ''}
                      {s.total}
                    </span>
                  </button>
                ));
            })() : sidebarGroup === 'product' ? (() => {
              const ptree = buildProductTree(sets);
              return Object.keys(ptree).sort((a, b) => a.localeCompare(b)).map(prod => (
                <div key={prod} className="year-group">
                  <button className="year-toggle" onClick={() => toggleProduct(prod)}>
                    <span className="year-arrow">{openProducts[prod] ? '▼' : '▶'}</span>
                    <span className="year-label">{prod}</span>
                    <span className="year-count">{ptree[prod].length}</span>
                  </button>
                  {openProducts[prod] && (
                    <div className="product-list">
                      {ptree[prod].slice().sort((a, b) => b.year.localeCompare(a.year)).map(s => (
                        <button
                          key={`${s.year}::${s.product}`}
                          className={`product-item ${selectedYear === s.year && selectedProduct === s.product ? 'active' : ''}`}
                          onClick={() => selectSet(s.year, s.product)}
                        >
                          <span className="product-name">{s.year}</span>
                          <span className="product-owned">
                            {userProducts.has(`${s.year}::${s.product}`) ? <span className="catalog-owned-dot" title="In your collection">●</span> : ''}
                            {s.total}
                          </span>
                        </button>
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
                  <span className="year-count">{tree[year].length}</span>
                </button>
                {openYears[year] && (
                  <div className="product-list">
                    {tree[year].map(s => (
                      <button
                        key={s.product}
                        className={`product-item ${selectedYear === year && selectedProduct === s.product ? 'active' : ''}`}
                        onClick={() => selectSet(year, s.product)}
                      >
                        <span className="product-name">{s.product}</span>
                        <span className="product-owned">
                          {userProducts.has(`${year}::${s.product}`) ? <span className="catalog-owned-dot" title="In your collection">●</span> : ''}
                          {s.total}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!sidebarLoading && sets.length === 0 && (
              <div className="sidebar-empty">No sets in catalog.<br />An admin needs to import sets first.</div>
            )}
          </div>

          {/* Preview panel */}
          <div className="catalog-picker-main">
            {msg && (
              <div className={`catalog-msg ${msg.type}`}>
                <span>{msg.text}</span>
                {msg.type === 'confirm' ? (
                  <div className="catalog-msg-actions">
                    <button className="btn-primary" onClick={() => addToCollection(msg.year, msg.product, 'replace')}>Replace</button>
                    <button className="btn-ghost" onClick={() => setMsg(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="catalog-msg-close" onClick={() => setMsg(null)}>✕</button>
                )}
              </div>
            )}

            {!selectedProduct ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p>Select a set to preview its cards</p>
              </div>
            ) : (
              <>
                <div className="collection-header" style={{ position: 'sticky', top: 0 }}>
                  <div>
                    <h2 className="collection-title">{selectedProduct}</h2>
                    <span className="collection-meta">
                      {selectedYear} · {currentSet?.total ?? 0} cards
                      {currentSet?.rookies > 0 && ` · ${currentSet.rookies} RC`}
                      {currentSet?.autos > 0 && ` · ${currentSet.autos} AU`}
                    </span>
                  </div>
                  <div className="collection-controls" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    {busy === `${selectedYear}::${selectedProduct}` ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 220 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Adding {busyProgress.done.toLocaleString()} / {busyProgress.total.toLocaleString()} cards ({busyProgress.pct}%)
                        </span>
                        <div className="import-progress-bar-wrap" style={{ width: '100%' }}>
                          <div className="import-progress-bar" style={{ width: `${busyProgress.pct}%`, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    ) : alreadyOwned ? (
                      <div className="catalog-in-collection">
                        <span className="badge badge-green">✓ In your collection</span>
                        <button className="btn-ghost" onClick={() => addToCollection(selectedYear, selectedProduct, 'replace')} disabled={!!busy}>
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => addToCollection(selectedYear, selectedProduct)}
                        disabled={!!busy}
                      >
                        + Add to Collection
                      </button>
                    )}
                  </div>
                </div>

                {loadingPreview ? (
                  <div className="page-loading"><div className="spinner large" />Loading cards...</div>
                ) : (
                  <div className="table-wrap" style={{ padding: '0 16px 16px' }}>
                    <table className="data-table collection-table">
                      <thead>
                        <tr>
                          <th onClick={() => onSort('card_number')} className={`sortable-th ${sortKey === 'card_number' ? 'sorted' : ''}`}># {indicator('card_number')}</th>
                          <th onClick={() => onSort('description')} className={`sortable-th ${sortKey === 'description' ? 'sorted' : ''}`}>Player / Description {indicator('description')}</th>
                          <th onClick={() => onSort('set_name')} className={`sortable-th ${sortKey === 'set_name' ? 'sorted' : ''}`}>Set {indicator('set_name')}</th>
                          <th onClick={() => onSort('team_city')} className={`sortable-th ${sortKey === 'team_city' ? 'sorted' : ''}`}>Team {indicator('team_city')}</th>
                          <th onClick={() => onSort('rookie')} className={`sortable-th ${sortKey === 'rookie' ? 'sorted' : ''}`}>RC {indicator('rookie')}</th>
                          <th onClick={() => onSort('auto')} className={`sortable-th ${sortKey === 'auto' ? 'sorted' : ''}`}>AUTO {indicator('auto')}</th>
                          <th onClick={() => onSort('mem')} className={`sortable-th ${sortKey === 'mem' ? 'sorted' : ''}`}>Mem {indicator('mem')}</th>
                          <th onClick={() => onSort('serial_of')} className={`sortable-th ${sortKey === 'serial_of' ? 'sorted' : ''}`}>Serial {indicator('serial_of')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPreview.map(card => (
                          <tr key={card.id}>
                            <td className="text-muted card-num">{card.card_number}</td>
                            <td className="card-desc">{card.description}</td>
                            <td className="text-muted">{card.set_name}</td>
                            <td className="text-muted">{formatTeam(card.team_city, card.team_name)}</td>
                            <td>{card.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                            <td>{card.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
                            <td className="text-muted">{card.mem || ''}</td>
                            <td className="text-muted">{card.serial_of ? `/${card.serial_of}` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sortedPreview.length === 0 && <div className="table-empty">No cards in this set.</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
