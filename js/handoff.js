// ============================================================
// ÜBERGABE-LINK — Daten-Sync im Staffellauf, ohne Server
// Beim Stab-Weitergeben wird der komplette Vorgang komprimiert in
// einen Link gepackt (#uebergabe=…). Der Empfänger tippt den Link,
// seine App importiert den Vorgang und der Stab liegt bei ihm.
// Datenschutz: alles hinter dem # verlässt den Browser nie — auch
// der Webserver (GitHub Pages) sieht die Nutzdaten nicht.
// ============================================================

// Hash sofort beim Laden sichern — app.js überschreibt ihn in go()
// per replaceState, bevor der DOMContentLoaded-Import laufen würde.
var _hoPendingHash = location.hash || '';

// ── Base64url (chunked, damit große Payloads btoa nicht sprengen) ──
function _hoB64FromBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function _hoBytesFromB64(s) {
  const bin = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function _hoPipe(bytes, StreamCtor) {
  const stream = new Blob([bytes]).stream().pipeThrough(new StreamCtor('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Payload-Format: "c.<base64url>" = deflate-komprimiert, "r.<base64url>" = roh
// (Fallback für Browser ohne CompressionStream — Format bleibt lesbar für beide).
async function encodeHandoffPayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    try { return 'c.' + _hoB64FromBytes(await _hoPipe(bytes, CompressionStream)); } catch (e) { /* Fallback roh */ }
  }
  return 'r.' + _hoB64FromBytes(bytes);
}

async function decodeHandoffPayload(payload) {
  const dot = payload.indexOf('.');
  if (dot < 1) throw new Error('Format');
  const kind = payload.slice(0, dot);
  let bytes = _hoBytesFromB64(payload.slice(dot + 1));
  if (kind === 'c') bytes = await _hoPipe(bytes, DecompressionStream);
  else if (kind !== 'r') throw new Error('Format');
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ── Link bauen ──
// overrides = Zielzustand der Übergabe (z. B. { status: 'neu' }): der Link
// trägt den Vorgang so, wie er beim Empfänger ankommen soll — der lokale
// Status wechselt erst nach dem Senden (onSend), der Link braucht ihn vorab.
async function buildHandoffLink(i, overrides) {
  if (!/^https?:$/.test(location.protocol)) return null; // file:// — kein tragfähiger Link
  const copy = Object.assign(JSON.parse(JSON.stringify(i)), overrides || {}, {
    updatedAt: new Date().toISOString()
  });
  const payload = await encodeHandoffPayload(copy);
  return location.origin + location.pathname + '#uebergabe=' + payload;
}

// Mail-Vorschau mit angehängtem Übergabe-Link — Wrapper um showMailPreview,
// damit der bestehende Mail-Versand unverändert bleibt.
function showMailPreviewWithHandoff(i, overrides, opts) {
  const en = typeof _lang !== 'undefined' && _lang === 'en';
  buildHandoffLink(i, overrides).then(link => {
    if (link) {
      opts.body += '\n\n---\n' + (en
        ? '📲 Take over this case in the Anfragen app (tap the link):'
        : '📲 Vorgang in der Anfragen-App übernehmen (Link antippen):') + '\n' + link;
    }
    showMailPreview(opts);
  }).catch(() => showMailPreview(opts));
}

// ── Import: #uebergabe=… beim Laden und bei Link-Klick in laufender App ──
function _handoffMerge(rec) {
  const en = typeof _lang !== 'undefined' && _lang === 'en';
  if (!rec || typeof rec !== 'object' || !rec.id || !rec.customer) {
    toast(en ? 'Handoff link invalid' : 'Übergabe-Link ungültig', 'error');
    return;
  }
  rec.status = migrateStatus(rec.status || 'neu');
  const idx = inquiries.findIndex(x => String(x.id) === String(rec.id));
  if (idx >= 0) {
    const mine = inquiries[idx];
    // Neuester Stand gewinnt — der Stab-Inhaber ist der einzige Schreiber,
    // daher ist der Zeitstempel-Vergleich hier konfliktfrei.
    if ((rec.updatedAt || '') <= (mine.updatedAt || mine.createdAt || '')) {
      toast('ℹ️ ' + (rec.number || '') + (en ? ' is already up to date' : ' ist bereits aktuell'));
      return;
    }
    inquiries[idx] = rec;
  } else {
    inquiries.push(rec);
  }
  const merged = idx >= 0 ? inquiries[idx] : inquiries[inquiries.length - 1];
  _inqAddHistory(merged, 'handoff-received', { note: en ? 'Taken over via handoff link' : 'Per Übergabe-Link übernommen' });
  save();
  if (typeof go === 'function') go('anfragen');
  renderInq(document.getElementById('inqSearch')?.value || '');
  const my = typeof isMyTurn === 'function' && isMyTurn(merged);
  toast('📲 ' + (merged.number || '') + (en ? ' taken over' : ' übernommen') +
    (my ? (en ? ' — the baton is with you' : ' — Staffelstab bei dir') : ''));
}

async function _handoffImportFromHash(hash) {
  const m = /[#&]uebergabe=([^&]+)/.exec(hash || '');
  if (!m) return;
  // Hash neutralisieren: kein Doppel-Import bei Reload/Teilen des Browser-Tabs
  try { history.replaceState(null, '', location.pathname + location.search + '#anfragen'); } catch (e) { /* file:// */ }
  const en = typeof _lang !== 'undefined' && _lang === 'en';
  let rec;
  try {
    rec = await decodeHandoffPayload(decodeURIComponent(m[1]));
  } catch (e) {
    try { rec = await decodeHandoffPayload(m[1]); } catch (e2) {
      toast(en ? 'Handoff link invalid or damaged' : 'Übergabe-Link ungültig oder beschädigt', 'error');
      return;
    }
  }
  _handoffMerge(rec);
}

document.addEventListener('DOMContentLoaded', () => { _handoffImportFromHash(_hoPendingHash); });
window.addEventListener('hashchange', () => { _handoffImportFromHash(location.hash); });
