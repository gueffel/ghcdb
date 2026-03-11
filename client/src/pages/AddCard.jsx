import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

const EMPTY = {
  owned: true, card_number: '', set_name: '', description: '', team_city: '', team_name: '',
  rookie: false, auto: false, mem: '', serial: '', serial_of: '', thickness: '', year: '',
  product: '', grade: '', duplicates: 0,
};

export default function AddCard() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [years, setYears] = useState([]);
  const [setNames, setSetNames] = useState([]);

  useEffect(() => {
    api.getProducts().then(p => {
      setProducts([...new Set(p.map(x => x.product))].sort());
      setYears([...new Set(p.map(x => x.year))].sort((a, b) => b.localeCompare(a)));
    });
  }, []);

  useEffect(() => {
    api.getSetNames(form.year, form.product).then(setSetNames).catch(() => {});
  }, [form.year, form.product]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.addCard(form);
      if (result.action === 'marked_owned') {
        setSuccess(`"${form.description || form.card_number}" does exist already — marked as owned.`);
      } else if (result.action === 'duplicated') {
        setSuccess(`"${form.description || form.card_number}" is already owned — duplicate count increased.`);
      } else {
        setSuccess(`Card "${form.description || form.card_number}" added successfully!`);
      }
      setForm({ ...EMPTY, year: form.year, product: form.product }); // keep year/product for quick re-add
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Add Card</h1>

      <form onSubmit={submit} className="card-form">
        {success && <div className="alert success">{success}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="form-section">
          <div className="form-section-title">Card Identity</div>
          <div className="form-grid">
            <div className="field">
              <label>Year *</label>
              <input value={form.year} onChange={e => set('year', e.target.value)} placeholder="2023-24" required list="year-list" autoComplete="off" />
              <datalist id="year-list">
                {years.map(y => <option key={y} value={y} />)}
              </datalist>
            </div>
            <div className="field">
              <label>Product *</label>
              <input value={form.product} onChange={e => set('product', e.target.value)} placeholder="Series 1" required list="product-list" autoComplete="off" />
              <datalist id="product-list">
                {products.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="field">
              <label>Set Name</label>
              <input value={form.set_name} onChange={e => set('set_name', e.target.value)} placeholder="e.g. Young Guns" list="set-name-list" autoComplete="off" />
              <datalist id="set-name-list">
                {setNames.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="field">
              <label>Card #</label>
              <input value={form.card_number} onChange={e => set('card_number', e.target.value)} placeholder="e.g. 101" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Player & Team</div>
          <div className="form-grid">
            <div className="field field-wide">
              <label>Player Name *</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Nils Hoglander" required />
            </div>
            <div className="field">
              <label>Team City</label>
              <input value={form.team_city} onChange={e => set('team_city', e.target.value)} placeholder="e.g. Vancouver" />
            </div>
            <div className="field">
              <label>Team Name</label>
              <input value={form.team_name} onChange={e => set('team_name', e.target.value)} placeholder="e.g. Canucks" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Card Attributes</div>
          <div className="form-grid">
            <div className="field">
              <label>Mem / Relic</label>
              <input value={form.mem} onChange={e => set('mem', e.target.value)} placeholder="Jsy / Patch" />
            </div>
            <div className="field">
              <label>Serial #</label>
              <input type="number" value={form.serial} onChange={e => set('serial', e.target.value)} placeholder="42" />
            </div>
            <div className="field">
              <label>Numbered to</label>
              <input type="number" value={form.serial_of} onChange={e => set('serial_of', e.target.value)} placeholder="99" />
            </div>
            <div className="field">
              <label>Thickness</label>
              <input value={form.thickness} onChange={e => set('thickness', e.target.value)} placeholder="pt" />
            </div>
            <div className="field">
              <label>Grade</label>
              <input value={form.grade} onChange={e => set('grade', e.target.value)} placeholder="PSA 10" />
            </div>
            <div className="field">
              <label>Duplicates</label>
              <input type="number" min="0" value={form.duplicates} onChange={e => set('duplicates', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Flags</div>
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.owned} onChange={e => set('owned', e.target.checked)} />
              <span>Owned</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.rookie} onChange={e => set('rookie', e.target.checked)} />
              <span>Rookie (RC)</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.auto} onChange={e => set('auto', e.target.checked)} />
              <span>Autograph (AU)</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Adding...' : 'Add Card'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setForm(EMPTY)}>Reset</button>
        </div>
      </form>
    </div>
  );
}
