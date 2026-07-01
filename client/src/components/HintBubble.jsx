import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const BUBBLE_W = 300;
const GAP = 14;

function getCoords(el, position) {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Use center point — edge checks miss e.g. the Collection sidebar at r.right===0
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  if (cx < 0 || cx > vw || cy < 0 || cy > vh) return null;

  let top, left, arrow;

  if (position === 'right') {
    top = r.top + r.height / 2;
    left = r.right + GAP;
    arrow = 'left';
  } else if (position === 'left') {
    top = r.top + r.height / 2;
    left = r.left - GAP - BUBBLE_W;
    arrow = 'right';
  } else if (position === 'bottom') {
    top = r.bottom + GAP;
    left = r.left + r.width / 2 - BUBBLE_W / 2;
    arrow = 'top';
  } else {
    top = r.top - GAP;
    left = r.left + r.width / 2 - BUBBLE_W / 2;
    arrow = 'bottom';
  }

  left = Math.max(12, Math.min(vw - BUBBLE_W - 12, left));
  if (arrow === 'bottom' && top < 80) {
    top = r.bottom + GAP;
    arrow = 'top';
  }
  return { top, left, arrow };
}

export default function HintBubble({ hint, targetRef, remaining, onNext, onDismiss, sheetOffset = 0 }) {
  const [coords, setCoords] = useState(null);
  const lastCoords = useRef(null);
  const isMobile = window.innerWidth < 640;

  const update = useCallback(() => {
    const el = targetRef?.current;
    if (!el || isMobile) return;
    const c = getCoords(el, hint.position || 'bottom');
    setCoords(c);
    if (c) lastCoords.current = c;
  }, [targetRef, hint.position, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, { capture: true });
    };
  }, [update, isMobile]);

  const isLast = remaining <= 1;
  const asSheet = isMobile;

  // On mobile: always show sheet. On desktop: show positioned bubble, fading out when off-screen.
  const visible = isMobile || !!coords;
  const displayCoords = coords || lastCoords.current;

  // Don't render at all until we have a position to show (avoids flash at 0,0 on mount)
  if (!asSheet && !displayCoords) return null;

  const inner = (
    <div
      className={`hint-bubble ${asSheet ? 'hint-bubble--sheet' : `hint-bubble--${displayCoords.arrow}`}`}
      style={!asSheet ? {
        top: displayCoords.top,
        left: displayCoords.left,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'all' : 'none',
        transition: 'opacity 0.2s ease',
      } : undefined}
    >
      {hint.miniUI && <div className="hint-mini-ui">{hint.miniUI}</div>}
      <div className="hint-title">{hint.title}</div>
      <p className="hint-body">{hint.body}</p>
      <div className="hint-footer">
        <button className="hint-skip" onClick={onDismiss}>Turn off tips</button>
        <button className="hint-next" onClick={onNext}>
          {isLast ? 'Got it!' : 'Next tip →'}
        </button>
      </div>
    </div>
  );

  if (asSheet) {
    return createPortal(
      <div className="hint-sheet-wrap" style={sheetOffset ? { bottom: sheetOffset } : undefined}>{inner}</div>,
      document.body
    );
  }

  return createPortal(inner, document.body);
}
