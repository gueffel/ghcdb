import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';
import { NHL_CITIES, NHL_NAMES, autoFillTeam } from '../nhlTeams.js';
import { usePageHints } from '../context/HintsContext.jsx';
import HintBubble from '../components/HintBubble.jsx';
import { MiniAddSingle } from '../components/HintMiniUIs.jsx';

const MEM_OPTIONS = ['Jsy', 'Patch', 'Laundry Tag', 'Nameplate', 'Logo', 'Stick', 'Puck', 'Glove', 'Skate', 'Helmet', 'Auto', 'Dual Jsy', 'Dual Patch', 'Triple Jsy'];
import Combobox from '../components/Combobox.jsx';

const ADD_HINTS = [
  {
    id: 'add_single',
    position: 'bottom',
    title: 'Add a single card',
    body: 'Fill in what you know. Once you pick a Year and Product, the Set field shows matching options from the catalog. If a card already exists in your collection it\'ll mark it owned (or add a duplicate).',
    miniUI: <MiniAddSingle />,
  },
];

const EMPTY = {
  owned: true, card_number: '', set_name: '', description: '', team_city: '', team_name: '',
  rookie: false, auto: false, mem: '', serial: '', serial_of: '', thickness: '', year: '',
  product: '', grade: '', duplicates: 0,
};

export default function AddCard() {
  const titleRef = useRef(null);
  const pageHint = usePageHints(ADD_HINTS);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [catalogYears, setCatalogYears] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogSetNames, setCatalogSetNames] = useState([]);
  const [productSetNames, setProductSetNames] = useState([]);
  const [recentYears, setRecentYears] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    api.getCatalogSets().then(sets => {
      setCatalogProducts([...new Set(sets.map(x => x.product))].sort());
      setCatalogYears([...new Set(sets.map(x => x.year))].sort((a, b) => b.localeCompare(a)));
    }).catch(() => {});
    api.getRecentAdditions().then(({ years, products }) => {
      setRecentYears(years);
      setRecentProducts(products);
    }).catch(() => {});
  }, []);

  // Load set names for the selected product whenever year/product changes
  useEffect(() => {
    if (!form.year || !form.product) { setProductSetNames([]); return; }
    let cancelled = false;
    api.getCatalogSetNames(form.year, form.product, '')
      .then(names => { if (!cancelled) setProductSetNames(names); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [form.year, form.product]);

  // Use product set names if the product is in the catalog, otherwise search the full catalog
  useEffect(() => {
    if (productSetNames.length > 0) { setCatalogSetNames(productSetNames); return; }
    if (!form.set_name || form.set_name.length < 2) { setCatalogSetNames([]); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      api.getCatalogSetNames('', '', form.set_name)
        .then(names => { if (!cancelled) setCatalogSetNames(names); })
        .catch(() => {});
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [productSetNames, form.set_name]);

  const defaultYears    = recentYears.length    > 0 ? recentYears    : catalogYears.slice(0, 3);
  const defaultProducts = recentProducts.length > 0 ? recentProducts : catalogProducts.slice(0, 3);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.addCard(form);
      if (result.action === 'marked_owned') {
        setSuccess(`"${form.description || form.card_number}" was already in your collection, so we marked it as owned.`);
      } else if (result.action === 'duplicated') {
        setSuccess(`"${form.description || form.card_number}" is already owned, so we added a duplicate.`);
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
      <h1 className="page-title"><span ref={titleRef} style={{ display: 'inline-block' }}>Add Single</span></h1>

      <form onSubmit={submit} className="card-form">
        {success && <div className="alert success">{success}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="form-section">
          <div className="form-section-title">Card Type</div>
          <div className="toggle-pill-row">
            <label className={`toggle-pill toggle-pill--owned${form.owned ? ' toggle-pill--on' : ''}`}>
              <input type="checkbox" checked={form.owned} onChange={e => set('owned', e.target.checked)} />
              <span className="toggle-pill-dot" />
              <span>Owned</span>
            </label>
            <label className={`toggle-pill toggle-pill--rc${form.rookie ? ' toggle-pill--on' : ''}`}>
              <input type="checkbox" checked={form.rookie} onChange={e => set('rookie', e.target.checked)} />
              <span className="toggle-pill-dot" />
              <span>Rookie Card</span>
            </label>
            <label className={`toggle-pill toggle-pill--au${form.auto ? ' toggle-pill--on' : ''}`}>
              <input type="checkbox" checked={form.auto} onChange={e => set('auto', e.target.checked)} />
              <span className="toggle-pill-dot" />
              <span>Autograph</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Card Identity</div>
          <div className="form-grid">
            <div className="field">
              <label>Year *</label>
              <Combobox value={form.year} onChange={v => set('year', v)} options={catalogYears} defaultOptions={defaultYears} placeholder="2023-24" required />
            </div>
            <div className="field">
              <label>Product *</label>
              <Combobox value={form.product} onChange={v => set('product', v)} options={catalogProducts} defaultOptions={defaultProducts} placeholder="Series 1" required />
            </div>
            <div className="field">
              <label>Set Name</label>
              <Combobox value={form.set_name} onChange={v => set('set_name', v)} options={catalogSetNames} defaultOptions={catalogSetNames.slice(0, 3)} placeholder="e.g. Young Guns" />
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
              <Combobox value={form.team_city} onChange={v => autoFillTeam('team_city', v, setForm)} options={NHL_CITIES} placeholder="e.g. Vancouver" />
            </div>
            <div className="field">
              <label>Team Name</label>
              <Combobox value={form.team_name} onChange={v => autoFillTeam('team_name', v, setForm)} options={NHL_NAMES} placeholder="e.g. Canucks" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Card Attributes</div>
          <div className="form-grid">
            <div className="field">
              <label>Mem / Relic</label>
              <Combobox value={form.mem} onChange={v => set('mem', v)} options={MEM_OPTIONS} placeholder="Jsy / Patch" />
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

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Adding...' : 'Add Single'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setForm(EMPTY)}>Reset</button>
        </div>
      </form>

      {pageHint && (
        <HintBubble
          hint={pageHint.hint}
          targetRef={titleRef}
          remaining={pageHint.remaining}
          onNext={() => pageHint.markSeen(pageHint.hint.id)}
          onDismiss={() => pageHint.disable(false)}
        />
      )}
    </div>
  );
}
