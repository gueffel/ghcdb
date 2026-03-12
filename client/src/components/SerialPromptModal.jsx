import React, { useState } from 'react';

export default function SerialPromptModal({ card, onConfirm, onCancel }) {
  const [serial, setSerial] = useState(card.serial ? String(card.serial) : '');
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onCancel, 180); };

  const handleConfirm = () => {
    const val = serial.trim() === '' ? null : parseInt(serial, 10);
    onConfirm(isNaN(val) ? null : val);
  };

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`} onClick={close}>
      <div className="modal serial-prompt-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enter Serial Number</h2>
          <button className="modal-close" onClick={close}>✕</button>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14 }}>
            <strong style={{ color: 'var(--text)' }}>{card.description}</strong>
            {' '}— serialized /{card.serial_of}
          </p>
          <div className="field">
            <label>Your card number <span className="field-optional">(leave blank to skip)</span></label>
            <input
              type="number"
              min={1}
              max={card.serial_of}
              placeholder={`1 – ${card.serial_of}`}
              value={serial}
              onChange={e => setSerial(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') close(); }}
            />
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '0 20px 20px', borderTop: 'none', marginTop: 0 }}>
          <button className="btn-ghost" onClick={close}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm}>Mark as Owned</button>
        </div>
      </div>
    </div>
  );
}
