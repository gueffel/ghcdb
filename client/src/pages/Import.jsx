import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { api } from '../api.js';

const COLUMN_MAP = {
  'owned': 'Owned',
  'card_number': 'Card #',
  'set_name': 'Set Name',
  'description': 'Description',
  'team_city': 'Team City',
  'team_name': 'Team Name',
  'rookie': 'Rookie',
  'auto': 'Auto',
  'mem': 'Mem',
  'serial': 'Serial',
  'serial_of': 'Of',
  'thickness': 'Thickness',
  'year': 'Year',
  'product': 'Product',
  'grade': 'Grade',
  'duplicates': 'Duplicates',
};

export default function Import() {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importCount, setImportCount] = useState(0);
  const [error, setError] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceYear, setReplaceYear] = useState('');
  const [replaceProduct, setReplaceProduct] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length && result.data.length === 0) {
          setError('Failed to parse CSV. Make sure it is a valid CSV file.');
          return;
        }
        setHeaders(result.meta.fields || []);
        setRows(result.data);
        // Auto-detect year/product from data
        if (result.data.length > 0) {
          const first = result.data[0];
          const yr = Object.entries(first).find(([k]) => k.toLowerCase() === 'year')?.[1] || '';
          const pr = Object.entries(first).find(([k]) => k.toLowerCase() === 'product')?.[1] || '';
          setReplaceYear(yr);
          setReplaceProduct(pr);
        }
        setStep('preview');
      },
      error: () => setError('Failed to read file.'),
    });
  };

  const doImport = async () => {
    setStep('importing');
    setError('');
    try {
      if (replaceMode && replaceYear && replaceProduct) {
        await api.deleteProduct(replaceYear, replaceProduct);
      }
      // Send in batches of 50 for frequent progress updates
      const BATCH = 50;
      let imported = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        await api.importCards(batch);
        imported += batch.length;
        setImportCount(imported);
      }
      setStep('done');
    } catch (err) {
      setError(err.message);
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('upload');
    setRows([]);
    setHeaders([]);
    setImportCount(0);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Import CSV</h1>

      {step === 'upload' && (
        <div className="import-card">
          <div className="import-icon">📂</div>
          <p className="import-desc">Upload a CSV file exported from your spreadsheet. Column headers should match your spreadsheet fields.</p>

          <div className="expected-columns">
            <div className="expected-title">Expected columns (case-insensitive):</div>
            <div className="column-list">
              {Object.values(COLUMN_MAP).map(col => <span key={col} className="column-badge">{col}</span>)}
            </div>
          </div>

          {error && <div className="alert error">{error}</div>}

          <label className="file-drop">
            <input ref={fileRef} type="file" accept=".csv,.tsv,text/csv" onChange={handleFile} hidden />
            <span className="file-drop-text">Click to choose a CSV file</span>
          </label>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div className="preview-meta">
            <strong>{rows.length.toLocaleString()} rows</strong> detected · <strong>{headers.length} columns</strong>
          </div>

          <div className="import-options">
            <label className="checkbox-label">
              <input type="checkbox" checked={replaceMode} onChange={e => setReplaceMode(e.target.checked)} />
              <span>Replace existing cards for this year/product</span>
            </label>
            {replaceMode && (
              <div className="replace-fields">
                <input className="filter-select" placeholder="Year (e.g. 2023-24)" value={replaceYear} onChange={e => setReplaceYear(e.target.value)} />
                <input className="filter-select" placeholder="Product (e.g. Series 1)" value={replaceProduct} onChange={e => setReplaceProduct(e.target.value)} />
              </div>
            )}
          </div>

          {error && <div className="alert error">{error}</div>}

          <div className="table-wrap preview-table-wrap">
            <table className="data-table">
              <thead>
                <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>{headers.map(h => <td key={h}>{String(row[h] ?? '')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && <div className="preview-note">Showing first 10 of {rows.length.toLocaleString()} rows</div>}

          <div className="form-actions">
            <button className="btn-primary" onClick={doImport}>Import {rows.length.toLocaleString()} Cards</button>
            <button className="btn-ghost" onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="import-progress">
          <div className="spinner large" />
          <p>Importing cards... {importCount.toLocaleString()} / {rows.length.toLocaleString()}</p>
          <div className="import-progress-bar-wrap">
            <div className="import-progress-bar" style={{ width: `${Math.round((importCount / rows.length) * 100)}%` }} />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="import-success">
          <div className="success-icon">✓</div>
          <h2>Import Complete!</h2>
          <p>{importCount.toLocaleString()} cards imported successfully.</p>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button className="btn-primary" onClick={reset}>Import Another File</button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/collection', {
                state: { autoSelect: { year: replaceYear, product: replaceProduct } }
              })}
            >
              Go to Collection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
