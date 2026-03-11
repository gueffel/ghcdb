import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { api } from '../api.js';

function EditableRow({ card, onSave, onCancel, saving }) {
  const [draft, setDraft] = useState({
    card_number: card.card_number || '',
    description: card.description || '',
    team_city:   card.team_city || '',
    team_name:   card.team_name || '',
    rookie:      card.rookie ? 1 : 0,
    auto:        card.auto ? 1 : 0,
    mem:         card.mem || '',
    serial_of:   card.serial_of ?? '',
    grade:       card.grade || '',
    // pass-through fields needed by normalizeCard on the server
    set_name:    card.set_name || '',
    serial:      card.serial ?? '',
    thickness:   card.thickness || '',
    year:        card.year || '',
    product:     card.product || '',
  });

  const set = (field, value) => setDraft(d => ({ ...d, [field]: value }));
  const txt = (field, placeholder, cls = '') => (
    <input
      className={`inline-edit-input ${cls}`}
      value={draft[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
    />
  );

  return (
    <tr className="row-editing">
      <td>{txt('card_number', '#', 'w-60')}</td>
      <td>{txt('description', 'Player / description', 'w-200')}</td>
      <td>{txt('team_city', 'City', 'w-100')}</td>
      <td>{txt('team_name', 'Team', 'w-100')}</td>
      <td className="text-center">
        <input type="checkbox" checked={!!draft.rookie} onChange={e => set('rookie', e.target.checked ? 1 : 0)} />
      </td>
      <td className="text-center">
        <input type="checkbox" checked={!!draft.auto} onChange={e => set('auto', e.target.checked ? 1 : 0)} />
      </td>
      <td>{txt('mem', 'Mem', 'w-80')}</td>
      <td>{txt('serial_of', 'e.g. 99', 'w-60')}</td>
      <td>{txt('grade', 'Grade', 'w-60')}</td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className="btn-primary btn-sm" onClick={() => onSave(draft)} disabled={saving}>
            {saving ? '…' : 'Save'}
          </button>
          <button className="btn-ghost btn-sm" onClick={onCancel} disabled={saving}>Cancel</button>
        </div>
      </td>
    </tr>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | users

  // Catalog state
  const [sets, setSets] = useState([]);
  const [step, setStep] = useState('list'); // list | preview | importing | done | edit-set
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importCount, setImportCount] = useState(0);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [error, setError] = useState('');
  const [deletingKey, setDeletingKey] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Edit-set state
  const [editSet, setEditSet] = useState(null); // { year, product, cards: [] }
  const [editRowId, setEditRowId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [editSearch, setEditSearch] = useState('');
  const [editError, setEditError] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const fileRef = useRef();

  const loadSets = () => api.getCatalogSets().then(setSets);

  const loadUsers = () => {
    setUsersLoading(true);
    setUsersError('');
    api.getAdminUsers()
      .then(setUsers)
      .catch(err => setUsersError(err.message))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => { loadSets(); }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0) { setError('No data found in file.'); return; }
        setHeaders(result.meta.fields || []);
        setRows(result.data);
        setStep('preview');
      },
      error: () => setError('Failed to read file.'),
    });
  };

  const doImport = async () => {
    setStep('importing');
    setError('');
    const BATCH = 500;
    let imported = 0;
    try {
      for (let i = 0; i < rows.length; i += BATCH) {
        const isFirst = i === 0;
        await api.importToCatalog(rows.slice(i, i + BATCH), isFirst && replaceExisting);
        imported += Math.min(BATCH, rows.length - i);
        setImportCount(imported);
      }
      setStep('done');
      loadSets();
    } catch (err) {
      setError(err.message);
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('list');
    setRows([]);
    setHeaders([]);
    setImportCount(0);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteSet = async (year, product) => {
    setDeletingKey(`${year}::${product}`);
    try {
      await api.deleteCatalogSet(year, product);
      loadSets();
    } finally {
      setDeletingKey('');
      setConfirmDelete(null);
    }
  };

  const openEditSet = async (year, product) => {
    setEditError('');
    setEditSearch('');
    setEditRowId(null);
    const cards = await api.getCatalogCards(year, product);
    setEditSet({ year, product, cards });
    setStep('edit-set');
  };

  const closeEditSet = () => {
    setEditSet(null);
    setEditRowId(null);
    setEditSearch('');
    setEditError('');
    setStep('list');
  };

  const saveCard = async (id, draft) => {
    setSavingId(id);
    setEditError('');
    try {
      await api.updateCatalogCard(id, draft);
      setEditSet(prev => ({
        ...prev,
        cards: prev.cards.map(c => c.id === id ? { ...c, ...draft, serial_of: draft.serial_of === '' ? null : Number(draft.serial_of) } : c),
      }));
      setEditRowId(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleAdmin = async (id) => {
    setTogglingId(id);
    try {
      const res = await api.toggleAdminUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: res.is_admin } : u));
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const deleteUser = async (id) => {
    setDeletingUserId(id);
    try {
      await api.deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setDeletingUserId(null);
      setConfirmDeleteUser(null);
    }
  };

  // Group sets by year
  const byYear = sets.reduce((acc, s) => {
    if (!acc[s.year]) acc[s.year] = [];
    acc[s.year].push(s);
    return acc;
  }, {});

  const filteredCards = editSet
    ? editSet.cards.filter(c => {
        if (!editSearch) return true;
        const q = editSearch.toLowerCase();
        return (c.card_number || '').toLowerCase().includes(q)
          || (c.description || '').toLowerCase().includes(q)
          || (c.team_city || '').toLowerCase().includes(q)
          || (c.team_name || '').toLowerCase().includes(q);
      })
    : [];

  return (
    <div className="page">
      <h1 className="page-title">Admin</h1>

      <div className="tab-row" style={{ marginBottom: 24 }}>
        <button className={`tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Catalog Management</button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
      </div>

      {activeTab === 'users' && (
        <div>
          {usersError && <div className="alert error" style={{ marginBottom: 12 }}>{usersError}</div>}
          {usersLoading ? (
            <div className="page-loading">Loading users...</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Cards</th>
                    <th>Admin</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td className="text-muted">{[u.first_name, u.last_name].filter(Boolean).join(' ') || <span className="text-muted">—</span>}</td>
                      <td className="text-muted">{u.email || <span className="text-muted">—</span>}</td>
                      <td className="text-muted">{u.card_count}</td>
                      <td className="text-center">
                        {u.is_admin ? <span className="badge badge-purple">Admin</span> : ''}
                      </td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        {confirmDeleteUser === u.id ? (
                          <div className="confirm-delete">
                            <span>Delete {u.username}?</span>
                            <button className="btn-danger btn-sm" onClick={() => deleteUser(u.id)} disabled={deletingUserId === u.id}>
                              {deletingUserId === u.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button className="btn-ghost btn-sm" onClick={() => setConfirmDeleteUser(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn-ghost btn-sm"
                              onClick={() => toggleAdmin(u.id)}
                              disabled={togglingId === u.id}
                              title={u.is_admin ? 'Remove admin' : 'Make admin'}
                            >
                              {togglingId === u.id ? '…' : u.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button className="btn-danger btn-sm" onClick={() => setConfirmDeleteUser(u.id)}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="table-empty">No users found.</div>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && step === 'list' && (
        <>
          <div className="admin-import-bar">
            <label className="btn-primary" style={{ cursor: 'pointer' }}>
              Import Set from CSV
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
            </label>
            {error && <span className="inline-error">{error}</span>}
          </div>

          {sets.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 48 }}>
              <div className="empty-icon">📦</div>
              <p>No sets in catalog yet. Import a CSV to add the first set.</p>
            </div>
          ) : (
            Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map(year => (
              <div key={year} className="table-card" style={{ marginBottom: 16 }}>
                <h2 className="chart-title">{year}</h2>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Cards</th>
                        <th>Rookies</th>
                        <th>Autos</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {byYear[year].map(s => {
                        const key = `${s.year}::${s.product}`;
                        return (
                          <tr key={s.product}>
                            <td>
                              <button className="link-btn" onClick={() => openEditSet(s.year, s.product)}>
                                {s.product}
                              </button>
                            </td>
                            <td>{s.total}</td>
                            <td>{s.rookies > 0 ? s.rookies : <span className="text-muted">—</span>}</td>
                            <td>{s.autos > 0 ? s.autos : <span className="text-muted">—</span>}</td>
                            <td>
                              {confirmDelete === key ? (
                                <div className="confirm-delete">
                                  <span>Delete all {s.total} cards?</span>
                                  <button className="btn-danger" onClick={() => deleteSet(s.year, s.product)} disabled={!!deletingKey}>
                                    {deletingKey === key ? 'Deleting...' : 'Confirm'}
                                  </button>
                                  <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button className="btn-ghost btn-sm" onClick={() => openEditSet(s.year, s.product)}>Edit Cards</button>
                                  <button className="btn-danger" onClick={() => setConfirmDelete(key)}>Delete</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {activeTab === 'catalog' && step === 'edit-set' && editSet && (
        <div>
          <div className="edit-set-header">
            <button className="btn-ghost" onClick={closeEditSet}>← Back to Catalog</button>
            <div>
              <span className="edit-set-title">{editSet.product}</span>
              <span className="text-muted" style={{ marginLeft: 8, fontSize: 13 }}>{editSet.year} · {editSet.cards.length} cards</span>
            </div>
            <input
              className="collection-search"
              type="search"
              placeholder="Search cards…"
              value={editSearch}
              onChange={e => setEditSearch(e.target.value)}
              style={{ marginLeft: 'auto' }}
            />
          </div>

          {editError && <div className="alert error" style={{ marginBottom: 12 }}>{editError}</div>}

          <div className="table-wrap">
            <table className="data-table catalog-edit-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player / Description</th>
                  <th>Team City</th>
                  <th>Team Name</th>
                  <th>RC</th>
                  <th>AU</th>
                  <th>Mem</th>
                  <th>Serial#</th>
                  <th>Grade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map(card => (
                  editRowId === card.id ? (
                    <EditableRow
                      key={card.id}
                      card={card}
                      saving={savingId === card.id}
                      onSave={(draft) => saveCard(card.id, draft)}
                      onCancel={() => setEditRowId(null)}
                    />
                  ) : (
                    <tr key={card.id} className="catalog-edit-row">
                      <td className="text-muted">{card.card_number}</td>
                      <td>{card.description}</td>
                      <td className="text-muted">{card.team_city}</td>
                      <td className="text-muted">{card.team_name}</td>
                      <td className="text-center">{card.rookie ? <span className="badge badge-orange">RC</span> : ''}</td>
                      <td className="text-center">{card.auto ? <span className="badge badge-purple">AU</span> : ''}</td>
                      <td className="text-muted">{card.mem || ''}</td>
                      <td className="text-muted">{card.serial_of ? `/${card.serial_of}` : ''}</td>
                      <td className="text-muted">{card.grade || ''}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => { setEditRowId(card.id); setEditError(''); }}
                          title="Edit card"
                          disabled={editRowId !== null}
                        >✎</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
            {filteredCards.length === 0 && (
              <div className="table-empty">No cards match the search.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'catalog' && step === 'preview' && (
        <div>
          <div className="preview-meta">
            <strong>{rows.length.toLocaleString()} rows</strong> · <strong>{headers.length} columns</strong>
          </div>

          <div className="import-options">
            <label className="checkbox-label">
              <input type="checkbox" checked={replaceExisting} onChange={e => setReplaceExisting(e.target.checked)} />
              <span>Replace existing set if it already exists in the catalog</span>
            </label>
          </div>

          {error && <div className="alert error">{error}</div>}

          <div className="table-wrap preview-table-wrap">
            <table className="data-table">
              <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>{headers.map(h => <td key={h}>{String(row[h] ?? '')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && <div className="preview-note">Showing first 10 of {rows.length.toLocaleString()} rows</div>}

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={doImport}>Import {rows.length.toLocaleString()} Cards to Catalog</button>
            <button className="btn-ghost" onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && step === 'importing' && (
        <div className="import-progress">
          <div className="spinner large" />
          <p>Importing to catalog... {importCount.toLocaleString()} / {rows.length.toLocaleString()}</p>
        </div>
      )}

      {activeTab === 'catalog' && step === 'done' && (
        <div className="import-success">
          <div className="success-icon">✓</div>
          <h2>Catalog Updated!</h2>
          <p>{importCount.toLocaleString()} cards imported to the catalog.</p>
          <div className="form-actions">
            <button className="btn-primary" onClick={reset}>Back to Catalog</button>
          </div>
        </div>
      )}
    </div>
  );
}
