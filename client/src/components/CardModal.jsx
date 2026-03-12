import React, { useState } from 'react';
import { api } from '../api.js';
import { NHL_CITIES, NHL_NAMES, autoFillTeam } from '../nhlTeams.js';
import Combobox from './Combobox.jsx';

export default function CardModal({ card, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({ ...card });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCard(card.id, form);
      onSaved({ ...form, id: card.id });
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api.deleteCard(card.id);
      onDeleted(card.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal card-edit-modal">
        <div className="modal-header">
          <h2>Edit Card</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={save} className="card-form">
          <div className="form-grid">
            <div className="field">
              <label>Year</label>
              <input value={form.year || ''} onChange={e => set('year', e.target.value)} />
            </div>
            <div className="field">
              <label>Product</label>
              <input value={form.product || ''} onChange={e => set('product', e.target.value)} />
            </div>
            <div className="field">
              <label>Set Name</label>
              <input value={form.set_name || ''} onChange={e => set('set_name', e.target.value)} />
            </div>
            <div className="field">
              <label>Card #</label>
              <input value={form.card_number || ''} onChange={e => set('card_number', e.target.value)} />
            </div>
            <div className="field field-wide">
              <label>Description / Player</label>
              <input value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="field">
              <label>Team City</label>
              <Combobox value={form.team_city || ''} onChange={v => autoFillTeam('team_city', v, setForm)} options={NHL_CITIES} />
            </div>
            <div className="field">
              <label>Team Name</label>
              <Combobox value={form.team_name || ''} onChange={v => autoFillTeam('team_name', v, setForm)} options={NHL_NAMES} />
            </div>
            <div className="field">
              <label>Mem / Relic</label>
              <input value={form.mem || ''} onChange={e => set('mem', e.target.value)} />
            </div>
            <div className="field">
              <label>Serial #</label>
              <input type="number" value={form.serial || ''} onChange={e => set('serial', e.target.value)} />
            </div>
            <div className="field">
              <label>Numbered /</label>
              <input type="number" value={form.serial_of || ''} onChange={e => set('serial_of', e.target.value)} />
            </div>
            <div className="field">
              <label>Thickness</label>
              <input value={form.thickness || ''} onChange={e => set('thickness', e.target.value)} />
            </div>
            <div className="field">
              <label>Grade</label>
              <input value={form.grade || ''} onChange={e => set('grade', e.target.value)} />
            </div>
            <div className="field">
              <label>Duplicates</label>
              <input type="number" min="0" value={form.duplicates || 0} onChange={e => set('duplicates', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={Boolean(form.owned)} onChange={e => set('owned', e.target.checked)} />
              <span>Owned</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={Boolean(form.rookie)} onChange={e => set('rookie', e.target.checked)} />
              <span>Rookie (RC)</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={Boolean(form.auto)} onChange={e => set('auto', e.target.checked)} />
              <span>Autograph (AU)</span>
            </label>
          </div>

          <div className="modal-footer">
            <div className="modal-footer-left">
              {!confirmDelete ? (
                <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
              ) : (
                <div className="confirm-delete">
                  <span>Sure?</span>
                  <button type="button" className="btn-danger" onClick={del} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              )}
            </div>
            <div className="modal-footer-right">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
