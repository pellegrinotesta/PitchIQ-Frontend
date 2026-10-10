/**
 * Token di colore del modulo tracking — allineati al design system PitchIQ.
 * Sfondo nero, accento verde #00ff87, bordi #1e1e1e, font system-ui.
 */
export const TRACKING_TOKENS = `
:host {
  --tk-bg:              #0a0a0a;
  --tk-surface:         #111111;
  --tk-surface-2:       #1a1a1a;
  --tk-line:            #1e1e1e;
  --tk-line-2:          #2a2a2a;
  --tk-fg:              #ffffff;
  --tk-muted:           #555555;
  --tk-muted-2:         #888888;
  --tk-accent:          #00ff87;
  --tk-accent-dim:      rgba(0, 255, 135, 0.08);
  --tk-accent-border:   rgba(0, 255, 135, 0.2);
  --tk-att:             #00ff87;
  --tk-def:             #60a5fa;
  --tk-superata:        #00ff87;
  --tk-neutralizzata:   #ff6464;
  --tk-contenuta:       #555555;
  --tk-warning:         #ffb400;
  --tk-screen:          #0a0a0a;
  --tk-screen-line:     #1e1e1e;
  --tk-mono:            "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  display: block;
  color: var(--tk-fg);
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--tk-bg);
}

/* Card */
.tk-card {
  background: var(--tk-surface);
  border: 1px solid var(--tk-line);
  border-radius: 12px;
  padding: 1.25rem;
  min-width: 0;
}

/* Label uppercase */
.tk-label {
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tk-muted);
  font-family: var(--tk-mono);
}

/* Pill esito */
.tk-pill {
  display: inline-flex;
  align-items: center;
  font-size: .72rem;
  font-weight: 700;
  font-family: var(--tk-mono);
  letter-spacing: .06em;
  padding: .25rem .6rem;
  border-radius: 999px;
  color: #000;
}
.tk-pill.SUPERATA      { background: var(--tk-superata);      color: #000; }
.tk-pill.NEUTRALIZZATA { background: var(--tk-neutralizzata); color: #fff; }
.tk-pill.CONTENUTA     { background: var(--tk-contenuta);     color: #ccc; }

/* Bottoni */
.tk-btn {
  font-size: .88rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--tk-fg);
  background: transparent;
  border: 1px solid var(--tk-line-2);
  border-radius: 8px;
  padding: .55rem .9rem;
  cursor: pointer;
  transition: border-color .15s, color .15s;
  line-height: 1;
}
.tk-btn:hover:not(:disabled) {
  border-color: var(--tk-muted);
  color: #fff;
}
.tk-btn:disabled { opacity: .4; cursor: not-allowed; }
.tk-btn.primary {
  background: var(--tk-accent);
  border-color: var(--tk-accent);
  color: #000;
  font-weight: 700;
}
.tk-btn.primary:hover:not(:disabled) { background: #00cc6a; border-color: #00cc6a; }
.tk-btn.danger {
  border-color: var(--tk-neutralizzata);
  color: var(--tk-neutralizzata);
}
.tk-btn.danger:hover:not(:disabled) {
  background: rgba(255, 100, 100, .1);
}
.tk-btn:focus-visible,
button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid var(--tk-accent);
  outline-offset: 2px;
}

/* Numeri monospace */
.tk-num {
  font-family: var(--tk-mono);
  font-variant-numeric: tabular-nums;
  font-size: .88rem;
}

/* Errore */
.tk-error { color: var(--tk-neutralizzata); }

/* Accento verde su testo */
.tk-accent { color: var(--tk-accent); }

/* Badge stato import */
.tk-stato-IN_CODA          { color: var(--tk-muted); }
.tk-stato-IN_ELABORAZIONE  { color: var(--tk-warning); }
.tk-stato-COMPLETATO       { color: var(--tk-accent); }
.tk-stato-ERRORE           { color: var(--tk-neutralizzata); }
`;