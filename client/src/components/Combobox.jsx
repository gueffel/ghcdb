import React, { useState, useRef, useEffect } from 'react';

export default function Combobox({ value, onChange, options = [], placeholder, required, className }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll active item into view (offset by 1 for the header li)
  useEffect(() => {
    if (!listRef.current || activeIdx < 0) return;
    const el = listRef.current.children[activeIdx + 1];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const select = (opt) => {
    onChange(opt);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); setActiveIdx(0); e.preventDefault(); }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1); }
    else if (e.key === 'ArrowDown') { setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { select(filtered[activeIdx]); e.preventDefault(); }
    else if (e.key === 'Tab') { setOpen(false); setActiveIdx(-1); }
  };

  return (
    <div className="combobox-wrap" ref={wrapRef}>
      <input
        className={className}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActiveIdx(-1); }}
        onFocus={() => { setOpen(true); setActiveIdx(-1); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="combobox-list" ref={listRef} role="listbox">
          <li className="combobox-header">Suggestions</li>
          {filtered.map((opt, i) => (
            <li
              key={opt}
              className={`combobox-item${i === activeIdx ? ' active' : ''}`}
              onMouseDown={() => select(opt)}
              role="option"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
