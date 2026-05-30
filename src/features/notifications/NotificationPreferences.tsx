import { useEffect, useRef, useState } from "react";
import type { NotificationPreferences } from "../../types";

interface Props {
  value: NotificationPreferences;
  onChange: (prefs: NotificationPreferences) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const ITEM_H = 56;

// Small inline drum
function Drum({ items, selected, onSelect }: { items: number[]; selected: number; onSelect: (v: number) => void }) {
  const idx = items.indexOf(selected);
  return (
    <div style={{ width: 52, height: 96, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", transform: `translateY(${32 - idx * 32}px)`, transition: "transform 0.18s cubic-bezier(0.25,0.8,0.25,1)" }}>
        {items.map((v, i) => {
          const dist = Math.abs(i - idx);
          return (
            <div key={v} onClick={() => onSelect(v)} style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: dist === 0 ? 22 : 18, fontWeight: dist === 0 ? 600 : 400, color: "var(--on-surface)", opacity: dist === 0 ? 1 : dist === 1 ? 0.35 : 0.15, cursor: "pointer", userSelect: "none", transition: "all 0.12s" }}>
              {pad(v)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Big draggable drum with snap
function BigDrum({ items, selected, onSelect }: { items: number[]; selected: number; onSelect: (v: number) => void }) {
  const idx = items.indexOf(selected);
  const startY = useRef(0);
  const startIdx = useRef(idx);
  const [dragOffset, setDragOffset] = useState(0); // offset while dragging
  const [snapping, setSnapping] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    startIdx.current = items.indexOf(selected);
    setSnapping(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!(e.buttons & 1)) return;
    const raw = startY.current - e.clientY;
    const rawIdx = startIdx.current + raw / ITEM_H;
    // overscroll rubber banding at edges
    const clamped = Math.max(0, Math.min(items.length - 1, rawIdx));
    const overscroll = rawIdx - clamped;
    const rubber = overscroll * ITEM_H * 0.25; // dampen overscroll
    setDragOffset(rubber);

    const next = Math.round(clamped);
    if (items[next] !== selected) onSelect(items[next]);
  }

  function onPointerUp() {
    setSnapping(true);
    setDragOffset(0);
  }

  const baseY = ITEM_H * 2 - idx * ITEM_H;
  const translateY = snapping
    ? baseY
    : baseY - dragOffset;

  return (
    <div
      style={{ position: "relative", width: 88, height: ITEM_H * 5, overflow: "hidden", cursor: "ns-resize", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: ITEM_H, marginTop: -ITEM_H / 2, background: "rgba(25,28,30,0.06)", borderRadius: "var(--radius-lg)", pointerEvents: "none" }} />
      <div style={{ display: "flex", flexDirection: "column", transform: `translateY(${translateY}px)`, transition: snapping ? "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}>
        {items.map((v, i) => {
          const dist = Math.abs(i - idx);
          return (
            <div key={v} onClick={() => onSelect(v)} style={{ height: ITEM_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: dist === 0 ? 40 : dist === 1 ? 28 : 22, fontWeight: dist === 0 ? 600 : 400, fontFamily: "var(--font-family-display)", color: "var(--on-surface)", opacity: dist === 0 ? 1 : dist === 1 ? 0.4 : 0.15, userSelect: "none", transition: "font-size 0.15s, opacity 0.15s" }}>
              {pad(v)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bottom sheet with slide up
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [slideY, setSlideY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) { setVisible(true); requestAnimationFrame(() => setSlideY(0)); }
    else { setSlideY(100); setTimeout(() => setVisible(false), 320); }
  }, [open]);

  function onHandlePointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientY;
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const dy = Math.max(0, e.clientY - dragStart.current);
    setSlideY(dy / (sheetRef.current?.offsetHeight || 400) * 100);
  }

  function onHandlePointerUp(e: React.PointerEvent) {
    isDragging.current = false;
    const dy = e.clientY - dragStart.current;
    if (dy > 80) { onClose(); }
    else { setSlideY(0); }
  }

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: `blur(${open ? 6 : 0}px)`, WebkitBackdropFilter: `blur(${open ? 6 : 0}px)`, background: `rgba(0,0,0,${open ? 0.3 : 0})`, transition: "background 0.3s, backdrop-filter 0.3s" }}
    >
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface-container-lowest)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 420, transform: `translateY(${slideY}%)`, transition: isDragging.current ? "none" : "transform 0.32s cubic-bezier(0.34,1.2,0.64,1)", willChange: "transform" }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          style={{ padding: "12px 0 4px", display: "flex", justifyContent: "center", cursor: "grab", touchAction: "none" }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(25,28,30,0.18)" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// Main component
export default function NotificationPreferencesPanel({ value, onChange }: Props) {
  const [enabled, setEnabled] = useState(value.enabled);
  const [is24h, setIs24h] = useState(false);
  const [hour, setHour] = useState(18);
  const [minute, setMinute] = useState(0);
  const [pm, setPm] = useState(true);
  const [open, setOpen] = useState(false);
  const [dHour, setDHour] = useState(hour);
  const [dMinute, setDMinute] = useState(minute);
  const [dPm, setDPm] = useState(pm);
  const [tapping, setTapping] = useState(false);

  useEffect(() => {
    setEnabled(value.enabled);
    const [h, m] = value.reminderTime.split(":").map(Number);
    setHour(is24h ? h : h % 12 || 12);
    setMinute(Math.round(m / 5) * 5 % 60);
    setPm(h >= 12);
  }, [value]);

  function emit(h: number, m: number, isPm: boolean, h24: boolean, en: boolean) {
    let h24val = h;
    if (!h24) { if (isPm && h !== 12) h24val = h + 12; else if (!isPm && h === 12) h24val = 0; }
    onChange({ enabled: en, reminderTime: `${pad(h24val)}:${pad(m)}` });
  }

  function toggleMode() {
    const next = !is24h;
    let newHour = hour;
    if (next) { if (pm && hour !== 12) newHour = hour + 12; else if (!pm && hour === 12) newHour = 0; }
    else { setPm(hour >= 12); newHour = hour % 12 || 12; }
    setIs24h(next);
    setHour(newHour);
    emit(newHour, minute, pm, next, enabled);
  }

  function openModal() {
    setTapping(true);
    setTimeout(() => setTapping(false), 180);
    setDHour(hour); setDMinute(minute); setDPm(pm);
    setOpen(true);
  }

  function confirm() {
    setHour(dHour); setMinute(dMinute); setPm(dPm);
    emit(dHour, dMinute, dPm, is24h, enabled);
    setOpen(false);
  }

  const hours = is24h ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i + 1);
  const chip = (active: boolean) => ({ padding: "3px 10px", fontSize: 12, fontWeight: 500, borderRadius: 20, border: `0.5px solid rgba(25,28,30,${active ? 0.18 : 0.1})`, background: active ? "rgba(25,28,30,0.07)" : "transparent", color: active ? "var(--on-surface)" : "rgba(25,28,30,0.4)", cursor: "pointer", fontFamily: "var(--font-family-body)" } as const);
  const displayTime = is24h ? `${pad(hour)}:${pad(minute)}` : `${pad(hour)}:${pad(minute)} ${pm ? "PM" : "AM"}`;

  return (
    <>
      <h2 className="settings-section-title" style={{ marginTop: 0 }}>Notifications</h2>

      <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ position: "relative", width: 44, height: 26, flexShrink: 0 }}>
            <input type="checkbox" checked={enabled} onChange={() => { const en = !enabled; setEnabled(en); emit(hour, minute, pm, is24h, en); }} style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: 13, background: enabled ? "var(--primary)" : "rgba(25,28,30,0.18)", transition: "background 0.22s" }} />
            <span style={{ position: "absolute", top: 3, left: enabled ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.22)", transition: "left 0.22s" }} />
          </span>
          <div>
            <div style={{ fontSize: "var(--font-body-md)", color: "var(--on-surface)" }}>Enable reminders</div>
            <div style={{ fontSize: 13, color: "rgba(25,28,30,0.5)", marginTop: 2 }}>Get a daily workout nudge</div>
          </div>
        </label>
      </div>

      <div style={{ opacity: enabled ? 1 : 0.38, pointerEvents: enabled ? "auto" : "none", transition: "opacity 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(25,28,30,0.45)" }}>Reminder time</span>
          <div style={{ display: "flex", gap: 5 }}>
            <button style={chip(!is24h)} onClick={toggleMode}>12h</button>
            <button style={chip(is24h)} onClick={toggleMode}>24h</button>
          </div>
        </div>

        {/* Mini drum*/}
        <div
          onClick={openModal}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(25,28,30,0.04)", border: "0.5px solid rgba(25,28,30,0.1)", borderRadius: "var(--radius-lg)", padding: "8px 14px", cursor: "pointer", transform: tapping ? "scale(0.96)" : "scale(1)", transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <Drum items={hours} selected={hour} onSelect={h => { setHour(h); emit(h, minute, pm, is24h, enabled); }} />
          <span style={{ fontSize: 24, fontWeight: 500, color: "var(--on-surface)", padding: "0 2px" }}>:</span>
          <Drum items={MINUTES} selected={minute} onSelect={m => { setMinute(m); emit(hour, m, pm, is24h, enabled); }} />
          {!is24h && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 6 }}>
              {(["AM", "PM"] as const).map(p => (
                <button key={p} onClick={e => { e.stopPropagation(); setPm(p === "PM"); emit(hour, minute, p === "PM", false, enabled); }} style={{ padding: "5px 10px", fontSize: 13, fontWeight: pm === (p === "PM") ? 600 : 400, borderRadius: "var(--radius-md)", border: "0.5px solid rgba(25,28,30,0.12)", background: pm === (p === "PM") ? "rgba(25,28,30,0.07)" : "transparent", color: pm === (p === "PM") ? "var(--on-surface)" : "rgba(25,28,30,0.35)", cursor: "pointer", fontFamily: "var(--font-family-body)" }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(25,28,30,0.5)" }}>
          Set for <span style={{ fontWeight: 600, color: "var(--on-surface)" }}>{displayTime}</span>
        </p>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <div style={{ padding: "8px 24px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 15, color: "rgba(25,28,30,0.5)", cursor: "pointer", fontFamily: "var(--font-family-body)", padding: 0 }}>Cancel</button>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--on-surface)" }}>Set reminder</span>
            <button onClick={confirm} style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "var(--primary)", cursor: "pointer", fontFamily: "var(--font-family-body)", padding: 0 }}>Done</button>
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(25,28,30,0.45)", margin: "0 0 20px" }}>
            {is24h ? `${pad(dHour)}:${pad(dMinute)}` : `${pad(dHour)}:${pad(dMinute)} ${dPm ? "PM" : "AM"}`}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <BigDrum items={hours} selected={dHour} onSelect={setDHour} />
            <span style={{ fontSize: 40, fontWeight: 300, color: "var(--on-surface)", lineHeight: 1, marginBottom: 4 }}>:</span>
            <BigDrum items={MINUTES} selected={dMinute} onSelect={setDMinute} />
            {!is24h && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 8 }}>
                {(["AM", "PM"] as const).map(p => (
                  <button key={p} onClick={() => setDPm(p === "PM")} style={{ width: 64, padding: "12px 0", fontSize: 16, fontWeight: dPm === (p === "PM") ? 700 : 400, borderRadius: "var(--radius-lg)", border: "0.5px solid rgba(25,28,30,0.12)", background: dPm === (p === "PM") ? "var(--primary)" : "transparent", color: dPm === (p === "PM") ? "#fff" : "rgba(25,28,30,0.4)", cursor: "pointer", fontFamily: "var(--font-family-body)", transition: "all 0.15s" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
}