import React from 'react';

export function MiniStats() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[['247', 'Owned', '#22c55e', '#0d9488'], ['31', 'RC', '#f97316', '#eab308'], ['12', 'Auto', '#a855f7', '#ec4899']].map(([v, l, c1, c2]) => (
        <div key={l} style={{
          flex: 1, padding: '6px 8px', borderRadius: 8, textAlign: 'center',
          background: `linear-gradient(135deg, ${c1}33, ${c2}22)`,
          border: `1px solid ${c1}55`,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: c1 }}>{v}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export function MiniSidebar() {
  return (
    <div style={{ fontSize: 11, borderRadius: 6, overflow: 'hidden', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
      <div style={{ padding: '4px 8px', background: 'var(--bg2)', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
        <span>Products</span><span style={{ color: 'var(--accent)' }}>+</span>
      </div>
      <div style={{ padding: '3px 8px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
        <span>▼ 2024-25</span><span>12/45</span>
      </div>
      <div style={{ padding: '3px 8px 3px 16px', color: 'var(--text)', background: 'rgba(59,130,246,0.15)', borderLeft: '2px solid var(--accent)', display: 'flex', justifyContent: 'space-between' }}>
        <span>SP Authentic</span><span style={{ color: 'var(--text-muted)' }}>8/20</span>
      </div>
      <div style={{ padding: '3px 8px 3px 16px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Series 1</span><span>4/25</span>
      </div>
      <div style={{ padding: '3px 8px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
        <span>▶ 2023-24</span><span>31/80</span>
      </div>
    </div>
  );
}

export function MiniGroupSwitch() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '6px 10px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
      {[['By Year', true], ['By Product', false]].map(([l, a]) => (
        <span key={l} style={{
          flex: 1, padding: '3px 6px', fontSize: 11, fontWeight: 600, textAlign: 'center',
          border: '1px solid var(--border)', borderRadius: 4,
          background: a ? 'var(--bg4)' : 'transparent',
          color: a ? 'var(--text)' : 'var(--text-muted)',
        }}>{l}</span>
      ))}
    </div>
  );
}

export function MiniOwnedToggle() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[['Connor McDavid', true], ['Nathan MacKinnon', false]].map(([name, owned]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
            background: owned ? '#22c55e' : 'transparent',
            border: owned ? '1px solid #22c55e' : '1px solid var(--border)',
            color: owned ? 'white' : 'var(--text-muted)',
          }}>{owned ? '✓' : '○'}</span>
          <span style={{ fontSize: 12, color: owned ? 'var(--text)' : 'var(--text-muted)' }}>{name}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniTabs() {
  return (
    <div style={{ display: 'flex' }}>
      {[['All', false], ['Owned', true], ['Missing', false]].map(([l, a]) => (
        <span key={l} style={{
          flex: 1, padding: '7px', borderRadius: 6, fontSize: 11, fontWeight: 500,
          textAlign: 'center',
          background: a ? 'var(--bg4)' : 'transparent',
          color: a ? 'var(--text)' : 'var(--text-muted)',
        }}>{l}</span>
      ))}
    </div>
  );
}

export function MiniWishlist() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[['Auston Matthews', true], ['Sidney Crosby', false]].map(([name, w]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 22, textAlign: 'center' }}>○</span>
          <span style={{ color: w ? '#ef4444' : 'var(--text-dim)', fontSize: 13 }}>♥</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{name}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniAddSingle() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[['Year', '2024-25', false], ['Product', 'SP Authentic', false], ['Set', '', true]].map(([l, v, isDropdown]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 46, flexShrink: 0, paddingTop: 3 }}>{l}</span>
          {isDropdown ? (
            <div style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--accent)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ fontSize: 10, color: 'var(--text)', background: 'rgba(59,130,246,0.2)', padding: '2px 6px' }}>Future Watch</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 6px' }}>Base Set</div>
            </div>
          ) : (
            <div style={{ flex: 1, fontSize: 11, color: 'var(--text)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>{v}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function MiniSearch() {
  const rows = [
    ['Connor McDavid', 'Young Guns', true],
    ['Connor McDavid', 'Base Set', false],
    ['Connor McDavid', 'Future Watch Auto', true],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔍</span>
        <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'monospace' }}>mcdavid</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 1 }}>3 results</div>
      {rows.map(([name, set, owned]) => (
        <div key={set} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            background: owned ? '#22c55e' : 'transparent',
            border: `1px solid ${owned ? '#22c55e' : 'var(--border)'}`,
            color: owned ? 'white' : 'var(--text-muted)',
          }}>{owned ? '✓' : '○'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{set}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniImport() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 22 }}>📂</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>Player, Year, Product, Owned</div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>McDavid, 2024-25, SP Auth, YES</div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-dim)' }}>Crosby, 2023-24, Series 1, NO</div>
      </div>
    </div>
  );
}
