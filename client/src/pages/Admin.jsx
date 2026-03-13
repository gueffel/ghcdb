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

function BugStatusBadge({ status }) {
  return <span className={`bug-status ${status}`}>{status}</span>;
}

function AdminBugRow({ bug, expanded, onExpand, onReply, onSetStatus, onDelete }) {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExpand = async () => {
    onExpand(bug.id);
    if (!detail && !loadingDetail) {
      setLoadingDetail(true);
      try {
        const d = await api.getBug(bug.id);
        setDetail(d);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const newReply = await onReply(bug.id, replyText.trim());
      setDetail(prev => prev ? { ...prev, replies: [...(prev.replies || []), newReply] } : prev);
      setReplyText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetStatus = async (status) => {
    await onSetStatus(bug.id, status);
    setDetail(prev => prev ? { ...prev, status } : prev);
  };

  return (
    <>
      <tr className={expanded ? 'bug-admin-row expanded' : 'bug-admin-row'} onClick={handleExpand} style={{ cursor: 'pointer' }}>
        <td><BugStatusBadge status={bug.status} /></td>
        <td><strong>{bug.title}</strong></td>
        <td className="text-muted">{bug.username}</td>
        <td className="text-muted">{bug.reply_count > 0 ? `💬 ${bug.reply_count}` : '—'}</td>
        <td className="text-muted" style={{ fontSize: 12 }}>{new Date(bug.created_at).toLocaleDateString()}</td>
        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div className="bug-admin-detail">
              {loadingDetail ? (
                <div style={{ padding: 16, color: 'var(--text-muted)' }}>Loading…</div>
              ) : (
                <>
                  <div className="bug-admin-desc">
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Description</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail?.description || bug.description}</p>
                    {bug.email && <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>User email: {bug.email}</p>}
                  </div>

                  {/* Replies */}
                  {detail?.replies?.length > 0 && (
                    <div className="bug-replies" style={{ margin: '12px 16px 0' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Replies</div>
                      {detail.replies.map(r => (
                        <div key={r.id} className="bug-reply">
                          <div className="bug-reply-header">
                            <span className="bug-reply-admin">{r.admin_username}</span>
                            <span className="bug-reply-date">{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                          <p className="bug-reply-text">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  <div className="bug-reply-form" style={{ margin: '12px 16px 0' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Send Reply</div>
                    <textarea
                      className="bug-reply-textarea"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a reply to the user…"
                      rows={3}
                      onClick={e => e.stopPropagation()}
                    />
                    <button className="btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); submitReply(); }} disabled={submitting || !replyText.trim()}>
                      {submitting ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="bug-actions" style={{ margin: '12px 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {(detail?.status || bug.status) !== 'fixed' && (
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}
                        onClick={e => { e.stopPropagation(); handleSetStatus('fixed'); }}>
                        Mark Fixed
                      </button>
                    )}
                    {(detail?.status || bug.status) !== 'closed' && (
                      <button className="btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); handleSetStatus('closed'); }}>
                        Close
                      </button>
                    )}
                    {(detail?.status || bug.status) !== 'open' && (
                      <button className="btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); handleSetStatus('open'); }}>
                        Reopen
                      </button>
                    )}
                    {(detail?.status || bug.status) !== 'open' && (
                      confirmDelete ? (
                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Delete this report?</span>
                          <button className="btn-danger btn-sm" onClick={e => { e.stopPropagation(); onDelete(bug.id); }}>Confirm</button>
                          <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn-danger btn-sm" style={{ marginLeft: 'auto' }}
                          onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}>
                          Delete
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | users | bugs | announcements

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

  // Bugs state
  const [bugsList, setBugsList] = useState([]);
  const [bugsLoading, setBugsLoading] = useState(false);
  const [bugsError, setBugsError] = useState('');
  const [expandedBugId, setExpandedBugId] = useState(null);

  // Announcements state
  const [currentAnn, setCurrentAnn] = useState(undefined); // undefined = not loaded, null = none
  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');
  const [annSaving, setAnnSaving] = useState(false);
  const [annDeleting, setAnnDeleting] = useState(false);
  const [annError, setAnnError] = useState('');
  const [annConfirmDelete, setAnnConfirmDelete] = useState(false);

  // Web import state
  const [importMode, setImportMode] = useState('csv'); // 'csv' | 'web'
  const [webUrl, setWebUrl] = useState('');
  const [webFetching, setWebFetching] = useState(false);
  const [webProgress, setWebProgress] = useState(0);
  const [webError, setWebError] = useState('');
  const [webYear, setWebYear] = useState('');
  const [webProduct, setWebProduct] = useState('');

  const fileRef = useRef();
  const webProgressRef = useRef(null);

  const loadSets = () => api.getCatalogSets().then(setSets);

  const loadUsers = () => {
    setUsersLoading(true);
    setUsersError('');
    api.getAdminUsers()
      .then(setUsers)
      .catch(err => setUsersError(err.message))
      .finally(() => setUsersLoading(false));
  };

  const loadBugs = () => {
    setBugsLoading(true);
    setBugsError('');
    api.getAdminBugs()
      .then(setBugsList)
      .catch(err => setBugsError(err.message))
      .finally(() => setBugsLoading(false));
  };

  useEffect(() => { loadSets(); }, []);

  const loadAnnouncement = () => {
    api.getAnnouncement()
      .then(ann => { setCurrentAnn(ann); setAnnTitle(ann?.title || ''); setAnnText(ann?.message || ''); })
      .catch(() => setCurrentAnn(null));
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'bugs') loadBugs();
    if (activeTab === 'announcements' && currentAnn === undefined) loadAnnouncement();
  }, [activeTab]);

  const fetchFromWeb = async () => {
    setWebError('');
    setWebFetching(true);
    setError('');
    try {
      const data = await api.scrapeChecklist(webUrl);
      setRows(data.cards);
      setHeaders(data.cards.length ? Object.keys(data.cards[0]) : []);
      setWebYear(data.year || '');
      setWebProduct(data.product || '');
      setStep('preview');
    } catch (err) {
      setWebError(err.message);
    } finally {
      setWebFetching(false);
    }
  };

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
    const BATCH = 50;
    let imported = 0;
    // For web imports, inject year/product into each row since the table doesn't have those columns
    const effectiveRows = importMode === 'web'
      ? rows.map(r => ({ ...r, year: webYear, product: webProduct }))
      : rows;
    try {
      for (let i = 0; i < effectiveRows.length; i += BATCH) {
        const isFirst = i === 0;
        await api.importToCatalog(effectiveRows.slice(i, i + BATCH), isFirst && replaceExisting);
        imported += Math.min(BATCH, effectiveRows.length - i);
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
    setWebUrl('');
    setWebError('');
    setWebYear('');
    setWebProduct('');
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

  const exportSetCsv = async (year, product) => {
    const cards = await api.getCatalogCards(year, product);
    const headers = ['year', 'product', 'card_number', 'set_name', 'description', 'team_city', 'team_name', 'rookie', 'auto', 'mem', 'serial_of', 'thickness'];
    const escape = v => v == null ? '' : String(v).includes(',') || String(v).includes('"') || String(v).includes('\n') ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    const rows = [headers.join(','), ...cards.map(c => headers.map(h => escape(c[h])).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${year}_${product.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
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

  const saveAnnouncement = async () => {
    if (!annText.trim()) return;
    setAnnSaving(true);
    setAnnError('');
    try {
      const ann = await api.setAnnouncement(annTitle.trim(), annText.trim());
      setCurrentAnn(ann);
      setAnnTitle(ann.title || '');
      setAnnText(ann.message);
    } catch (err) {
      setAnnError(err.message);
    } finally {
      setAnnSaving(false);
    }
  };

  const deleteAnnouncement = async () => {
    setAnnDeleting(true);
    setAnnError('');
    try {
      await api.deleteAnnouncement();
      setCurrentAnn(null);
      setAnnTitle('');
      setAnnText('');
      setAnnConfirmDelete(false);
    } catch (err) {
      setAnnError(err.message);
    } finally {
      setAnnDeleting(false);
    }
  };

  const handleBugReply = async (id, message) => {
    const reply = await api.replyToBug(id, message);
    setBugsList(prev => prev.map(b => b.id === id ? { ...b, reply_count: b.reply_count + 1 } : b));
    return reply;
  };

  const handleBugStatus = async (id, status) => {
    await api.setBugStatus(id, status);
    setBugsList(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleBugDelete = async (id) => {
    await api.deleteBug(id);
    setBugsList(prev => prev.filter(b => b.id !== id));
    setExpandedBugId(null);
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

  const openCount = bugsList.filter(b => b.status === 'open').length;

  return (
    <div className="page">
      <h1 className="page-title">Admin</h1>

      <div className="tab-row" style={{ marginBottom: 24 }}>
        <button className={`tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Catalog Management</button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
        <button className={`tab ${activeTab === 'bugs' ? 'active' : ''}`} onClick={() => setActiveTab('bugs')}>
          Bug Reports{openCount > 0 && <span className="bug-tab-badge">{openCount}</span>}
        </button>
        <button className={`tab ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
          Announcements{currentAnn && <span className="bug-tab-badge" style={{ background: 'var(--accent)' }}>1</span>}
        </button>
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

      {activeTab === 'bugs' && (
        <div>
          {bugsError && <div className="alert error" style={{ marginBottom: 12 }}>{bugsError}</div>}
          {bugsLoading ? (
            <div className="page-loading">Loading bug reports...</div>
          ) : bugsList.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 48 }}>
              <div className="empty-icon">🐛</div>
              <p>No bug reports yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Title</th>
                    <th>User</th>
                    <th>Replies</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bugsList.map(bug => (
                    <AdminBugRow
                      key={bug.id}
                      bug={bug}
                      expanded={expandedBugId === bug.id}
                      onExpand={(id) => setExpandedBugId(prev => prev === id ? null : id)}
                      onReply={handleBugReply}
                      onSetStatus={handleBugStatus}
                      onDelete={handleBugDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && step === 'list' && (
        <>
          <div className="admin-import-bar">
            <div className="import-mode-toggle">
              <button
                className={`tab ${importMode === 'csv' ? 'active' : ''}`}
                onClick={() => { setImportMode('csv'); setWebError(''); setError(''); }}
              >CSV File</button>
              <button
                className={`tab ${importMode === 'web' ? 'active' : ''}`}
                onClick={() => { setImportMode('web'); setError(''); }}
              >From Web</button>
            </div>

            {importMode === 'csv' ? (
              <>
                <label className="btn-primary" style={{ cursor: 'pointer' }}>
                  Import Set from CSV
                  <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
                </label>
                {error && <span className="inline-error">{error}</span>}
              </>
            ) : (
              <div className="web-import-row">
                <input
                  type="url"
                  className="web-import-input"
                  value={webUrl}
                  onChange={e => setWebUrl(e.target.value)}
                  placeholder="https://upperdeck.com/checklist/…"
                  onKeyDown={e => e.key === 'Enter' && webUrl && !webFetching && fetchFromWeb()}
                />
                <button
                  className="btn-primary"
                  onClick={fetchFromWeb}
                  disabled={webFetching || !webUrl.trim()}
                >
                  {webFetching ? 'Fetching…' : 'Fetch Checklist'}
                </button>
                {webError && <span className="inline-error">{webError}</span>}
              </div>
            )}
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
                        <th>Rookie Cards</th>
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
                                  <button className="btn-ghost btn-sm" onClick={() => exportSetCsv(s.year, s.product)}>Export CSV</button>
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
                  <th>AUTO</th>
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
                      <td className="text-center">{card.auto ? <span className="badge badge-purple">AUTO</span> : ''}</td>
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

          {importMode === 'web' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="field" style={{ flex: '0 0 140px' }}>
                <label>Year</label>
                <input
                  value={webYear}
                  onChange={e => setWebYear(e.target.value)}
                  placeholder="e.g. 2025-26"
                />
              </div>
              <div className="field" style={{ flex: '1 1 240px' }}>
                <label>Product</label>
                <input
                  value={webProduct}
                  onChange={e => setWebProduct(e.target.value)}
                  placeholder="e.g. SP Game Used Hockey"
                />
              </div>
            </div>
          )}

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
            <button
              className="btn-primary"
              onClick={doImport}
              disabled={importMode === 'web' && (!webYear.trim() || !webProduct.trim())}
              title={importMode === 'web' && (!webYear.trim() || !webProduct.trim()) ? 'Year and Product are required' : undefined}
            >Import {rows.length.toLocaleString()} Cards to Catalog</button>
            <button className="btn-ghost" onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && step === 'importing' && (
        <div className="import-progress">
          <div className="spinner large" />
          <p>Importing to catalog... {importCount.toLocaleString()} / {rows.length.toLocaleString()}</p>
          <div className="import-progress-bar-wrap">
            <div className="import-progress-bar" style={{ width: `${Math.round((importCount / rows.length) * 100)}%` }} />
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div style={{ maxWidth: 600 }}>
          {currentAnn === undefined ? (
            <div className="page-loading"><div className="spinner" /> Loading…</div>
          ) : (
            <>
              {currentAnn && (
                <div className="ann-preview">
                  <div className="ann-preview-label">Current announcement</div>
                  {currentAnn.title && <div className="ann-preview-title">{currentAnn.title}</div>}
                  <p className="ann-preview-text">{currentAnn.message}</p>
                  <div className="ann-preview-meta">
                    Posted {new Date(currentAnn.updated_at).toLocaleString()}
                  </div>
                </div>
              )}

              <div style={{ marginTop: currentAnn ? 20 : 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field">
                  <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    {currentAnn ? 'Edit announcement' : 'New announcement'}
                  </label>
                  <input
                    className="collection-search"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    placeholder="Title (optional) — e.g. Scheduled Maintenance"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="field">
                  <textarea
                    className="bug-reply-textarea"
                    rows={4}
                    value={annText}
                    onChange={e => setAnnText(e.target.value)}
                    placeholder="Write a short message for users… (news, downtime, etc.)"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {annError && <div className="alert error" style={{ marginTop: 8 }}>{annError}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={saveAnnouncement}
                  disabled={annSaving || !annText.trim() || (annText.trim() === currentAnn?.message && annTitle.trim() === (currentAnn?.title || ''))}
                >
                  {annSaving ? 'Saving…' : currentAnn ? 'Update Message' : 'Post Announcement'}
                </button>
                {currentAnn && (
                  annConfirmDelete ? (
                    <>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Remove for all users?</span>
                      <button className="btn-danger btn-sm" onClick={deleteAnnouncement} disabled={annDeleting}>
                        {annDeleting ? 'Removing…' : 'Confirm'}
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => setAnnConfirmDelete(false)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn-danger btn-sm" onClick={() => setAnnConfirmDelete(true)}>
                      Delete
                    </button>
                  )
                )}
              </div>
            </>
          )}
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
