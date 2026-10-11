import React, { useRef, useState } from 'react';
import { PlusIcon } from './Icons.jsx';

const R = 130;       // distance of the icons from the centre button (px)
const STEP = 30;     // degrees between neighbouring icons
const VISIBLE = 4;   // icons shown on the arc at once; the rest are reached by scrolling

// Phone-only circular navigation. Tap the centre button to open/close; drag (or scroll)
// around the arc to bring the other pages into view.
export default function RadialNav({ items, page, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const centre = useRef(null);
  const drag = useRef(null);   // { x, y, last, captured }
  const moved = useRef(false); // true when the last gesture was a drag, so it is not treated as a tap

  const max = Math.max(0, items.length - VISIBLE);
  const clamp = (v) => Math.min(max, Math.max(0, v));

  // Angle of a screen point around the centre button: 0 = straight left, 90 = straight up.
  function angleOf(x, y) {
    const r = centre.current.getBoundingClientRect();
    return (Math.atan2(r.top + r.height / 2 - y, r.left + r.width / 2 - x) * 180) / Math.PI;
  }

  function toggle() {
    if (!open) {
      // make sure the current page is on the visible part of the arc
      const idx = Math.max(0, items.findIndex((i) => i.id === page));
      setOffset((o) => clamp(idx < o ? idx : idx > o + VISIBLE - 1 ? idx - (VISIBLE - 1) : Math.round(o)));
    }
    setOpen((o) => !o);
  }

  function onPointerDown(e) {
    moved.current = false;
    drag.current = { x: e.clientX, y: e.clientY, last: angleOf(e.clientX, e.clientY), captured: false };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    if (!d.captured) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.captured = true;
      moved.current = true;
      d.last = angleOf(e.clientX, e.clientY);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      setDragging(true);
      return;
    }
    const a = angleOf(e.clientX, e.clientY);
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    setOffset((o) => clamp(o - delta / STEP)); // dragging up the arc moves icons up
  }

  function endDrag() {
    const d = drag.current;
    drag.current = null;
    if (d?.captured) {
      setDragging(false);
      setOffset((o) => clamp(Math.round(o))); // snap to a whole icon
    }
  }

  function pick(item) {
    if (moved.current) { moved.current = false; return; }
    onNavigate(item.id);
    setOpen(false);
  }

  return (
    <>
      <div className={'radial-scrim' + (open ? ' show' : '')} onClick={() => setOpen(false)} />
      <div className={'radial' + (open ? ' open' : '')}>
        <div
          className={'radial-ring' + (dragging ? ' dragging' : '')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={(e) => setOffset((o) => clamp(Math.round(o + Math.sign(e.deltaY))))}
        >
          <div className="radial-disc" />
          {items.map((item, i) => {
            const s = i - offset;
            const rad = (s * STEP * Math.PI) / 180;
            const x = -R * Math.cos(rad);
            const y = -R * Math.sin(rad);
            // fade icons that scroll off either end of the arc
            const fade = Math.max(0, Math.min(1, s < 0 ? 1 + s * 2 : s > VISIBLE - 1 ? 1 - (s - (VISIBLE - 1)) * 2 : 1));
            const shown = open && fade > 0.5;
            return (
              <button
                key={item.id}
                type="button"
                className={'radial-item' + (item.id === page ? ' active' : '')}
                aria-label={item.label}
                tabIndex={shown ? 0 : -1}
                style={{
                  transform: open ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` : 'translate(-50%, -50%) scale(0.3)',
                  opacity: open ? fade : 0,
                  pointerEvents: shown ? 'auto' : 'none',
                  transitionDelay: open && !dragging ? `${i * 25}ms` : '0ms',
                }}
                onClick={() => pick(item)}
              >
                <item.Icon />
                <span className="radial-label">{item.label}</span>
              </button>
            );
          })}
        </div>
        <button
          ref={centre}
          type="button"
          className="radial-main"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={toggle}
        >
          <PlusIcon />
        </button>
      </div>
    </>
  );
}
