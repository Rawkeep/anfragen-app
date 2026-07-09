// ============================================================
// HELPERS — Formatierung, IDs, Toast, Modals, Event-Delegation
// Extrahiert aus Export Afrika Pro (EAP) — Standalone-Fassung
// ============================================================

/** HTML-Escape für Textinhalte. */
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Escape für Attribut-Werte (identisch, eigener Name für Lesbarkeit). */
function escapeAttr(str) { return escapeHtml(str); }

/** Eindeutige ID (Base36-Timestamp + Random). */
var gid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/** Datum lokalisiert formatieren (DE/EN — _lang aus i18n.js). */
var fd = d => {
  if (!d) return '-';
  const loc = (typeof _lang !== 'undefined' && _lang === 'en') ? 'en-GB' : 'de-DE';
  return new Date(d).toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Geldbetrag lokalisiert: DE "11.000,00 €" / EN "€11,000.00" */
var fc = v => {
  if (!v) return '-';
  const num = parseFloat(v);
  if (!isFinite(num)) return '-';
  const en = typeof _lang !== 'undefined' && _lang === 'en';
  const formatted = num.toLocaleString(en ? 'en-GB' : 'de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return en ? '€' + formatted : formatted + ' €';
};

/** Zahl lokalisiert: DE "1.647" / "549,0" — EN "1,647" / "549.0".
 *  digits = feste Nachkommastellen (Standard: nur wenn nötig, max. 2). */
var fnum = (v, digits) => {
  const n = parseFloat(v);
  if (!isFinite(n)) return '-';
  const loc = (typeof _lang !== 'undefined' && _lang === 'en') ? 'en-GB' : 'de-DE';
  return n.toLocaleString(loc, {
    minimumFractionDigits: digits ?? 0,
    maximumFractionDigits: digits ?? 2
  });
};

/** Sicheres localStorage-Read mit Fallback. */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}

function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Toast-Benachrichtigungen ──
function toast(msg, type) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' toast-error' : type === 'warning' ? ' toast-warning' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ── Modal-Steuerung ──
function openM(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function closeM(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ── Event-Delegation: data-click / data-change / data-input ──
// Markup-Konvention wie in EAP: data-click="fn('arg')", '$value' wird
// durch den aktuellen Feldwert ersetzt.
function _runAction(expr, el) {
  if (!expr) return;
  const value = el && el.value !== undefined ? String(el.value) : '';
  const substituted = expr.split("'$value'").join(JSON.stringify(value));
  try {
    new Function('el', substituted)(el);
  } catch (e) {
    console.error('Aktion fehlgeschlagen:', expr, e);
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-click]');
  if (el) _runAction(el.dataset.click, el);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el) _runAction(el.dataset.change, el);
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if (el) _runAction(el.dataset.input, el);
});

// Modal-Overlay: Klick auf Hintergrund schließt
document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});
