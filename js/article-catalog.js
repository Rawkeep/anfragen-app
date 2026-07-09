// ============================================================
// ARTIKEL-KATALOG-VERWALTUNG (Stammdaten)
// Liste, Einzelpflege, Bulk-Import (JSON oder CSV), Export.
// Datenmodell/Speicher: ArtikelKatalog (inquiry-form.js).
// ============================================================

function _artGebindeOptions(sel) {
  return '<option value="">' + t('— kein Standard-Gebinde —') + '</option>' +
    Object.entries(INQ_PRODUCTS).map(([k, v]) => `<option value="${k}"${sel === k ? ' selected' : ''}>${k} — ${v.name}</option>`).join('');
}

function renderArticleCatalog() {
  const wrap = document.getElementById('articleCatalog');
  if (!wrap) return;
  const items = ArtikelKatalog.list();
  if (!items.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px">${t('Noch keine Artikel im Katalog — einzeln anlegen oder importieren.')}</div>`;
    return;
  }
  const rows = items.map(x => {
    const p = x.code ? INQ_PRODUCTS[x.code] : null;
    return `<tr>
      <td style="font-weight:700;white-space:nowrap">${escapeHtml(x.artNr)}</td>
      <td>${escapeHtml(x.name || '—')}</td>
      <td style="white-space:nowrap">${p ? escapeHtml(x.code) + ' — ' + escapeHtml(p.name) : '<span style="color:var(--text-3)">—</span>'}</td>
      <td style="white-space:nowrap;text-align:right">
        <button class="btn btn-ghost btn-icon sm" data-click="openArticleModal('${escapeAttr(x.artNr)}')" title="${escapeAttr(t('Bearbeiten'))}">✏️</button>
        <button class="btn btn-ghost btn-icon sm" data-click="deleteArticleEntry('${escapeAttr(x.artNr)}')" title="${escapeAttr(t('Löschen'))}" style="color:var(--danger)">🗑</button>
      </td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `<table class="pal-table" style="width:100%">
    <tr><th style="text-align:left">${t('Artikel-Nr.')}</th><th style="text-align:left">${t('Bezeichnung')}</th><th style="text-align:left">${t('Standard-Gebinde')}</th><th></th></tr>
    ${rows}
  </table>`;
}

// ── Einzel-Artikel anlegen / bearbeiten ──
function openArticleModal(nr) {
  const entry = nr ? ArtikelKatalog.get(nr) : null;
  document.getElementById('mArticleTitle').textContent = entry ? t('Artikel bearbeiten') + ' — ' + entry.artNr : t('Neuer Artikel');
  const nrEl = document.getElementById('fArtNr');
  nrEl.value = entry ? entry.artNr : '';
  nrEl.disabled = !!entry;
  document.getElementById('fArtName').value = entry ? entry.name : '';
  document.getElementById('fArtCode').innerHTML = _artGebindeOptions(entry ? entry.code : '');
  openM('mArticle');
}

// Beim Tippen der Nr. das Gebinde automatisch vorbelegen (aus Suffix)
function onArtNrInput(v) {
  const sel = document.getElementById('fArtCode');
  if (sel && !sel.value) {
    const g = detectGebindeFromArtNr(v);
    if (g) sel.value = g;
  }
}

function saveArticleEntry() {
  const nr = document.getElementById('fArtNr').value.trim();
  if (!nr) { toast(t('Artikel-Nr. fehlt'), 'error'); return; }
  ArtikelKatalog.upsert(nr, document.getElementById('fArtName').value, document.getElementById('fArtCode').value);
  closeM('mArticle');
  renderArticleCatalog();
  toast(t('Artikel gespeichert') + ': ' + nr);
}

function deleteArticleEntry(nr) {
  if (!confirm(t('Artikel aus Katalog löschen?') + ' (' + nr + ')')) return;
  ArtikelKatalog.remove(nr);
  renderArticleCatalog();
}

// ── Export (JSON) ──
function exportArticleCatalog() {
  const data = ArtikelKatalog.list().map(x => ({ artNr: x.artNr, name: x.name, code: x.code }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'artikel-katalog-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast(t('Export erstellt') + ': ' + data.length + ' ' + t('Artikel'));
}

// ── Bulk-Import (JSON oder CSV/Zeilen) ──
function openArticleImport() {
  document.getElementById('fArtImport').value = '';
  openM('mArticleImport');
}

// CSV-/Textzeilen parsen: "Nr; Bezeichnung; Gebinde" (Trenner ; , oder Tab)
function _parseArticleText(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line, idx) => {
    const raw = line.trim();
    if (!raw) return;
    const parts = raw.split(/[;\t]|,(?=\s*\S)/).map(s => s.trim());
    const nr = parts[0] || '';
    // Kopfzeile überspringen
    if (idx === 0 && /^(art(ikel)?[-\s]?nr|nummer|no\.?)$/i.test(nr)) return;
    if (!nr) return;
    out.push({ artNr: nr, name: parts[1] || '', code: (parts[2] || '').toUpperCase() });
  });
  return out;
}

function runArticleImport() {
  const raw = document.getElementById('fArtImport').value.trim();
  if (!raw) { toast(t('Nichts zum Importieren'), 'error'); return; }
  let arr = [];
  try {
    if (raw[0] === '[' || raw[0] === '{') {
      const json = JSON.parse(raw);
      const list = Array.isArray(json) ? json : [json];
      arr = list.map(r => ({
        artNr: (r.artNr || r.nr || r.nummer || r.number || '').toString().trim(),
        name: (r.name || r.bezeichnung || r.description || '').toString().trim(),
        code: (r.code || r.gebinde || r.packstueck || '').toString().trim().toUpperCase()
      }));
    } else {
      arr = _parseArticleText(raw);
    }
  } catch (e) {
    toast(t('Import fehlgeschlagen') + ': ' + e.message, 'error');
    return;
  }
  const valid = arr.filter(r => r.artNr);
  if (!valid.length) { toast(t('Keine gültigen Artikel erkannt'), 'error'); return; }
  const n = ArtikelKatalog.importMany(valid);
  closeM('mArticleImport');
  renderArticleCatalog();
  toast(n + ' ' + t('Artikel importiert'));
}
