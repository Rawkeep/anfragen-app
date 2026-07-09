// ============================================================
// ANFRAGE-FORMULAR — Artikel & Berechnung (Multi-Artikel),
// Länder-Info, Angebote-Management. Extrahiert aus EAP.
// ============================================================

let _inqArticles = []; // [{id, artNr, artName, code, mode, qty, netto}]

// ── Artikel-Katalog: wächst durch Erfassung, ermöglicht späteres Auswählen ──
// Speichert je Artikel-Nr.: Bezeichnung + Standard-Gebinde (Packstück-Code).
var ArtikelKatalog = (function () {
  const SK = 'anfragenArtikelKatalog';
  function all() { return lsGet(SK, {}); }
  function get(nr) { return all()[(nr || '').trim().toUpperCase()] || null; }
  function list() { return Object.values(all()).sort((a, b) => (a.artNr || '').localeCompare(b.artNr || '')); }
  function upsert(nr, name, code) {
    nr = (nr || '').trim();
    if (!nr) return;
    const map = all();
    const key = nr.toUpperCase();
    const prev = map[key] || {};
    // Gebinde: explizit > vorher > aus Nummern-Suffix erkannt
    const gebinde = code || prev.code || detectGebindeFromArtNr(nr) || '';
    map[key] = { artNr: nr, name: (name || '').trim() || prev.name || '', code: gebinde };
    lsSet(SK, map);
  }
  function remove(nr) {
    const map = all();
    delete map[(nr || '').trim().toUpperCase()];
    lsSet(SK, map);
  }
  // Bulk-Import: Array von {artNr, name, code}. Gibt Anzahl importierter zurück.
  function importMany(arr) {
    let n = 0;
    (arr || []).forEach(r => {
      const nr = (r.artNr || '').trim();
      if (!nr) return;
      upsert(nr, r.name, r.code && INQ_PRODUCTS[r.code] ? r.code : '');
      n++;
    });
    return n;
  }
  return { all, get, list, upsert, remove, importMany, count: () => list().length };
})();

function _artNrDatalist() {
  return '<datalist id="artNrList">' + ArtikelKatalog.list().map(x =>
    `<option value="${escapeAttr(x.artNr)}">${escapeAttr(x.name || '')}</option>`).join('') + '</datalist>';
}

// ── Gebinde aus Artikel-Nr.-Suffix erkennen (z.B. …30A → 030AA, …15A → 015AA) ──
// Varianten werden aus den vorhandenen Packstück-Codes abgeleitet (wächst mit
// eigenen Packstücken mit). Priorität: voller Code > Nr+Buchstaben > Nr+1 Buchstabe
// > reine Nummer (nur wenn eindeutig).
function detectGebindeFromArtNr(artNr) {
  const raw = String(artNr || '').toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  const codes = Object.keys(INQ_PRODUCTS);
  // 1) voller Code irgendwo enthalten (z.B. "…030AA…")
  for (const c of codes) { if (compact.includes(c)) return c; }
  // Suffix-Varianten + Nummern-Index je Code aufbauen
  const byNum = {};        // Nummer (ohne führende Null) → [codes]
  const variants = [];     // {key, code}
  codes.forEach(c => {
    const m = /^(\d+)([A-Z]+)$/.exec(c);
    if (!m) return;
    const numFull = m[1];
    const numNoZero = String(parseInt(numFull, 10));
    const letters = m[2];
    const l1 = letters[0];
    (byNum[numNoZero] = byNum[numNoZero] || []).push(c);
    [numFull + letters, numNoZero + letters, numFull + l1, numNoZero + l1].forEach(k => variants.push({ key: k, code: c }));
  });
  variants.sort((a, b) => b.key.length - a.key.length); // längste (spezifischste) zuerst
  // Suffix = letztes Segment nach Trenner (z.B. "ETH-30A" → "30A")
  const tokens = raw.split(/[^A-Z0-9]+/).filter(Boolean);
  const last = tokens.length ? tokens[tokens.length - 1] : compact;
  // 2) passende Buchstaben-Variante am Ende (z.B. "…30A", "…030AA")
  for (const v of variants) { if (last.endsWith(v.key) || compact.endsWith(v.key)) return v.code; }
  // 3) Nummer aus dem Suffix (Ziffern + evtl. abweichender Buchstabe wie „a"),
  //    nur wenn eindeutig einer Packstück-Nummer zugeordnet (z.B. "20a" → 020XX)
  const nm = /(\d+)[A-Z]*$/.exec(last);
  if (nm) {
    const num = String(parseInt(nm[1], 10));
    if (byNum[num] && byNum[num].length === 1) return byNum[num][0];
  }
  return '';
}

function inqAddArticle(data) {
  const a = data || { id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), artNr: '', artName: '', code: '', mode: 'qty', qty: '', netto: '' };
  _inqArticles.push(a);
  inqRenderArticles();
  return a;
}

// Freitext-Eingabe (kein Re-Render, Fokus bleibt)
function inqArtInput(aid, field, value) {
  const a = _inqArticles.find(x => x.id === aid);
  if (a) a[field] = value;
}

// Artikel-Nr. bestätigt/ausgewählt → aus Katalog Bezeichnung & Gebinde übernehmen
function inqArtNrCommit(aid, value) {
  const a = _inqArticles.find(x => x.id === aid);
  if (!a) return;
  a.artNr = value;
  const hit = ArtikelKatalog.get(value);
  if (hit) {
    if (hit.name && !a.artName) a.artName = hit.name;
    if (hit.code && INQ_PRODUCTS[hit.code] && !a.code) a.code = hit.code;
  }
  // Gebinde aus Nummern-Suffix erkennen, falls noch keins gesetzt
  if (!a.code) { const g = detectGebindeFromArtNr(value); if (g) a.code = g; }
  inqRenderArticles();
  inqCalcAll();
}

function inqRemoveArticle(aid) {
  _inqArticles = _inqArticles.filter(a => a.id !== aid);
  inqRenderArticles();
  inqCalcAll();
}

function inqClearArticles() {
  if (_inqArticles.length && !confirm('Alle Artikel entfernen?')) return;
  _inqArticles = [];
  inqRenderArticles();
  inqCalcAll();
}

function _inqArticleResultHtml(a) {
  const p = a.code ? INQ_PRODUCTS[a.code] : null;
  if (!p) return '';
  const r = a.mode === 'netto'
    ? (parseFloat(a.netto) > 0 ? calcFromNetWeight(a.code, parseFloat(a.netto)) : null)
    : (parseInt(a.qty) > 0 ? calcPalletsInline(a.code, parseInt(a.qty)) : null);
  if (!r) return '';
  if (r.type === 'loose') {
    return `<div class="inq-art-result"><strong>LOSE:</strong> ${escapeHtml(r.qty)} Stk | ${fnum(r.grossWeight)} kg</div>`;
  }
  return `<div class="inq-art-result"><strong>${escapeHtml(r.pallets)} Pal.</strong> | ${escapeHtml(r.qty)} Stk | ${fnum(r.grossWeight)} kg | ${r.details.map((x, i) => 'P' + (i + 1) + ': ' + escapeHtml(x.pcs) + '×' + escapeHtml(x.layers) + 'L').join(', ')}</div>`;
}

function inqRenderArticles() {
  const wrap = document.getElementById('inqArticlesList');
  if (!wrap) return;
  const dl = _artNrDatalist();
  if (!_inqArticles.length) {
    wrap.innerHTML = dl + '<div style="text-align:center;padding:24px;color:var(--text-3);font-size:13px">' + t('Noch kein Artikel — klicke „+ Artikel hinzufügen"') + '</div>';
    return;
  }
  wrap.innerHTML = dl + _inqArticles.map((a, idx) => {
    const p = a.code ? INQ_PRODUCTS[a.code] : null;
    let info = '';
    if (p) {
      const effMax = Math.min(p.layers[p.maxLayers].pcs, Math.floor(NETTO_LIMIT / p.fillWt));
      const ref = inqBestLayer(p, effMax);
      info = `<div class="inq-art-info">${p.emoji} ${a.code} — ${p.name} | ${p.dim.l}x${p.dim.w}x${p.dim.h} mm | Füll: ${p.fillWt} kg | Brutto: ${fnum(p.bruttoWt, 2)} kg | Max/Pal: ${effMax} Stk (${ref.layers}L, ${ref.height} cm)</div>`;
    }
    const codeOpts = '<option value="">' + t('— Gebinde / Packstück —') + '</option>' +
      Object.entries(INQ_PRODUCTS).map(([k, v]) => `<option value="${k}"${a.code === k ? ' selected' : ''}>${k} — ${v.name}</option>`).join('');
    return `<div class="inq-art-row" data-aid="${a.id}">
      <div class="inq-art-l1">
        <span class="inq-art-idx">#${idx + 1}</span>
        <input class="form-input" list="artNrList" placeholder="${escapeAttr(t('Artikel-Nr.'))}" value="${escapeAttr(a.artNr || '')}"
          data-input="inqArtInput('${a.id}','artNr','$value')" data-change="inqArtNrCommit('${a.id}','$value')" style="width:150px;font-size:12px">
        <input class="form-input" placeholder="${escapeAttr(t('Bezeichnung'))}" value="${escapeAttr(a.artName || '')}"
          data-input="inqArtInput('${a.id}','artName','$value')" style="flex:1;min-width:130px;font-size:12px">
        <button class="btn btn-ghost btn-sm" data-click="inqRemoveArticle('${a.id}')" style="color:var(--danger);padding:2px 6px;font-size:14px" title="${escapeAttr(t('Entfernen'))}">×</button>
      </div>
      <div class="inq-art-l2">
        <select class="form-select" style="flex:2;min-width:190px;font-size:12px" data-change="inqArticleFieldChange('${a.id}','code','$value')" title="${escapeAttr(t('Gebinde für Palettenberechnung'))}">${codeOpts}</select>
        <select class="form-select" style="width:120px;font-size:12px" data-change="inqArticleFieldChange('${a.id}','mode','$value')">
          <option value="qty"${a.mode === 'qty' ? ' selected' : ''}>${t('Stückzahl')}</option>
          <option value="netto"${a.mode === 'netto' ? ' selected' : ''}>${t('Netto kg')}</option>
        </select>
        ${a.mode === 'netto'
          ? `<input type="number" class="form-input" style="width:120px;font-size:13px;padding:8px 10px" placeholder="kg" value="${a.netto || ''}" step="any" data-input="inqArticleFieldChange('${a.id}','netto','$value')">`
          : `<input type="number" class="form-input" style="width:120px;font-size:13px;padding:8px 10px" placeholder="Stk" value="${a.qty || ''}" min="1" data-input="inqArticleFieldChange('${a.id}','qty','$value')">`
        }
      </div>
      ${info}${_inqArticleResultHtml(a)}
    </div>`;
  }).join('');
}

function inqArticleFieldChange(aid, field, value) {
  const a = _inqArticles.find(x => x.id === aid);
  if (!a) return;
  a[field] = value;
  if (field === 'qty' || field === 'netto') {
    // Nur Berechnung aktualisieren, NICHT neu rendern (sonst verliert Input den Fokus)
    inqCalcAll();
    const wrap = document.querySelector('[data-aid="' + aid + '"]');
    if (wrap) {
      const old = wrap.querySelector('.inq-art-result');
      if (old) old.remove();
      const result = _inqArticleResultHtml(a);
      if (result) wrap.insertAdjacentHTML('beforeend', result);
    }
    return;
  }
  if (field === 'mode') { a.qty = ''; a.netto = ''; }
  inqRenderArticles();
  inqCalcAll();
}

function inqCalcAll() {
  const resultEl = document.getElementById('inqCalcResult');
  if (!resultEl) return;
  const transport = document.getElementById('fInqTransport')?.value || '';
  const airHeightCap = transport === 'air' ? 160 : undefined;
  const results = [];
  for (const a of _inqArticles) {
    if (!a.code || !INQ_PRODUCTS[a.code]) continue;
    let r;
    if (a.mode === 'netto') {
      const n = parseFloat(a.netto) || 0;
      if (n <= 0) continue;
      r = calcFromNetWeight(a.code, n, airHeightCap);
    } else {
      const q = parseInt(a.qty) || 0;
      if (q <= 0) continue;
      r = calcPalletsInline(a.code, q, airHeightCap);
    }
    if (r) results.push({ ...r, articleCode: a.code });
  }
  if (!results.length) {
    resultEl.style.display = 'none';
    document.getElementById('fInqWeight').value = '';
    const volEl0 = document.getElementById('fInqVolume');
    if (volEl0) volEl0.value = '';
    window._inqLastContainerRec = null;
    return;
  }

  const totalPallets = results.reduce((s, r) => s + r.pallets, 0);
  const totalQty = results.reduce((s, r) => s + r.qty, 0);
  const totalGross = Math.round(results.reduce((s, r) => s + r.grossWeight, 0) * 100) / 100;
  const maxH = Math.max(...results.map(r => r.maxHeight || 0));
  const allLoose = results.every(r => r.type === 'loose');
  const airHeightLimited = results.some(r => r.heightLimited);

  resultEl.style.display = '';
  if (results.length === 1) {
    // Einzelartikel — Detailansicht
    const r = results[0]; const p = r.product;
    if (r.type === 'loose') {
      resultEl.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:6px">Ergebnis: LOSE Sendung</div>
        <div style="font-size:13px"><strong>${r.qty}</strong> Stück (lose) | Bruttogewicht: <strong>${fnum(r.grossWeight)} kg</strong></div>
        <div style="font-size:12px;color:var(--text-2);margin-top:4px">Masse je Kollo: ${p.dim.l}x${p.dim.w}x${p.dim.h} mm</div>`;
    } else {
      const hasMixed = r.details.length > 1 && !r.details.every(x => x.pcs === r.details[0].pcs);
      let wtInfo = '';
      if (hasMixed) { wtInfo = r.details.map((x, i) => `Pal.${i + 1}: ${fnum(x.pcs * p.bruttoWt + PALLET_WT, 1)} kg`).join(' | '); }
      else if (r.details.length > 0) { wtInfo = `Gewicht/Palette: ${fnum(r.details[0].pcs * p.bruttoWt + PALLET_WT, 1)} kg (inkl. ${PALLET_WT} kg Palette)`; }
      resultEl.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:6px">Ergebnis: PALETTIERT</div>
        <div style="font-size:13px"><strong>${r.pallets}</strong> Palette(n) | <strong>${r.qty}</strong> Stück | Bruttogewicht: <strong>${fnum(r.grossWeight)} kg</strong></div>
        <div style="font-size:12px;color:var(--text-2);margin-top:6px">${r.details.map((x, i) => `Palette ${i + 1}: ${x.pcs} Stk, ${x.layers} Lagen, Höhe: ${x.height} cm`).join(' | ')}</div>
        ${hasMixed ? '<div style="font-size:11px;color:var(--warning);margin-top:4px;font-weight:600">Hinweis: Paletten mit unterschiedlichen Lagen/Gewichten</div>' : ''}
        <div style="font-size:12px;color:var(--text-2);margin-top:4px">${wtInfo}</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:2px">Max. Palettenhöhe: <strong>${r.maxHeight} cm</strong> | Europalette 120×80 cm</div>`;
    }
  } else {
    // Multi-Artikel — Summenansicht
    const lines = results.map(r => {
      const p = INQ_PRODUCTS[r.articleCode];
      return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px">
        <span>${p.emoji} <strong>${r.articleCode}</strong> — ${p.name}</span>
        <span>${r.type === 'loose' ? r.qty + ' Stk (lose)' : r.pallets + ' Pal. / ' + r.qty + ' Stk'} | <strong>${fnum(r.grossWeight)} kg</strong></span>
      </div>`;
    }).join('');
    resultEl.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:8px">📦 Gesamtergebnis: ${results.length} Artikel</div>
      ${lines}
      <div style="margin-top:10px;padding-top:8px;border-top:2px solid var(--brand);display:flex;justify-content:space-between;font-size:14px;font-weight:700">
        <span>GESAMT</span>
        <span>${allLoose ? totalQty + ' Stück (lose)' : totalPallets + ' Palette(n) / ' + totalQty + ' Stück'} | <strong>${fnum(totalGross)} kg</strong></span>
      </div>
      ${!allLoose && maxH > 0 ? '<div style="font-size:12px;color:var(--text-2);margin-top:4px">Max. Palettenhöhe: <strong>' + maxH + ' cm</strong> | Europalette 120×80 cm</div>' : ''}`;
  }
  // Gewicht automatisch übernehmen
  document.getElementById('fInqWeight').value = totalGross;

  // Volumen automatisch: 1,2m × 0,8m × Höhe je Palette
  if (!allLoose && totalPallets > 0 && maxH > 0) {
    const autoVol = Math.round(totalPallets * 1.2 * 0.8 * (maxH / 100) * 100) / 100;
    const volAutoEl = document.getElementById('fInqVolume');
    if (volAutoEl) volAutoEl.value = autoVol;
  }

  // Luftfracht 160cm-Hinweis
  if (airHeightLimited) {
    resultEl.innerHTML += `<div style="margin-top:6px;padding:6px 10px;background:rgba(245,158,11,.1);border-left:3px solid #f59e0b;border-radius:6px;font-size:11px;font-weight:600;color:#92400e">⚠️ Luftfracht: Palettenhöhe auf 160 cm begrenzt — Paletten wurden aufgeteilt und Anzahl erhöht</div>`;
  }

  // ── Container-Empfehlung anhängen (nur Seefracht / Straße) ──
  const dg = (document.getElementById('fInqDG')?.value || 'no') === 'yes';
  const volEl = document.getElementById('fInqVolume');
  const vol = volEl && volEl.value ? parseFloat(volEl.value) : 0;
  if (transport && transport !== 'air') {
    const rec = recommendContainer({
      pallets: allLoose ? 0 : totalPallets,
      weight: totalGross,
      volumeM3: vol,
      transport,
      dg
    });
    if (rec) {
      const fillBar = rec.fillPct != null
        ? `<div class="rec-fillbar"><div style="width:${Math.min(100, rec.fillPct)}%;background:${rec.fits ? 'var(--accent-green)' : 'var(--danger)'}"></div></div>`
        : '';
      const altInfo = rec.alternatives && rec.alternatives.length
        ? `<div style="font-size:10px;color:var(--text-3);margin-top:3px">Alternativen: ${rec.alternatives.join(' · ')}</div>` : '';
      const icon = rec.fits ? '📦' : '⚠️';
      resultEl.innerHTML += `<div id="inqContainerRec" style="margin-top:10px;padding:10px 12px;background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(16,185,129,.04));border-left:3px solid ${rec.fits ? '#10b981' : '#f59e0b'};border-radius:8px;font-size:12px">
        <div style="font-weight:700;color:var(--text);margin-bottom:2px">${icon} Container-Empfehlung</div>
        <div style="color:var(--text-2)">${escapeHtml(rec.note)}</div>
        ${fillBar}${altInfo}
      </div>`;
      window._inqLastContainerRec = rec;
    } else {
      window._inqLastContainerRec = null;
    }
  } else {
    window._inqLastContainerRec = null;
  }
}

// ============================================================
// LÄNDER-INFO BEI AUSWAHL
// ============================================================
function onInqCountryChange() {
  const country = document.getElementById('fInqCountry').value;
  const infoEl = document.getElementById('inqCountryInfo');
  if (!country) { infoEl.style.display = 'none'; return; }
  const c = gCountry(country);
  if (!c) { infoEl.style.display = 'none'; return; }
  const bsc = checkBSCRequired(country);
  infoEl.style.display = '';
  infoEl.innerHTML = `<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
    <span><strong>${escapeHtml(country)}</strong></span>
    <span>Hafen: ${escapeHtml(c.port || '—')}</span>
    <span>Airport: ${escapeHtml(c.airport || '—')}</span>
    <span>See: ${escapeHtml(c.transitSea || '—')} Tage</span>
    <span>Luft: ${escapeHtml(c.transitAir || '—')} Tage</span>
    <span>Risiko: <span style="color:${c.risk === 'high' ? 'var(--danger)' : c.risk === 'medium' ? 'var(--warning)' : 'var(--accent-green)'};font-weight:700">${escapeHtml(c.risk)}</span></span>
    ${c.specialCert ? `<span style="color:var(--warning);font-weight:600">${escapeHtml(c.specialCert)}</span>` : ''}
    ${bsc ? `<span style="color:var(--danger);font-weight:600">${escapeHtml(bsc)}</span>` : ''}
    ${c.recommended ? `<span>Empf.: ${escapeHtml(c.recommended)}</span>` : ''}
  </div>`;
  // Zielort vorschlagen
  const destEl = document.getElementById('fInqDestCity');
  if (destEl && !destEl.value) destEl.value = c.port ? c.port.split('/')[0].trim() : '';
}

// ============================================================
// INCOTERM ↔ TRANSPORT (Incoterms 2020)
// ============================================================
const _SEA_ONLY_INCOTERMS = ['FAS', 'FOB', 'CFR', 'CIF'];

function filterIncotermsByTransport() {
  const transport = document.getElementById('fInqTransport')?.value || '';
  const sel = document.getElementById('fInqIncoterm');
  if (!sel) return;
  [...sel.options].forEach(opt => {
    if (!opt.value) return;
    const seaOnly = _SEA_ONLY_INCOTERMS.includes(opt.value);
    opt.disabled = seaOnly && transport && transport !== 'sea';
  });
  if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled) sel.value = '';
}

// ============================================================
// AUFSCHLAG → VERKAUFSPREIS
// ============================================================
function calcMU() {
  const cost = parseFloat(document.getElementById('fInqCost').value) || 0;
  const markupSel = document.getElementById('fInqMarkup').value;
  const markup = markupSel === 'custom'
    ? (parseFloat(document.getElementById('fInqMarkupCustom').value) || 0)
    : (parseInt(markupSel) || 30);
  document.getElementById('fInqSell').value = cost > 0 ? Math.round(cost * (1 + markup / 100) * 100) / 100 : '';
}

function toggleCustomMarkup() {
  const isCustom = document.getElementById('fInqMarkup').value === 'custom';
  const el = document.getElementById('fInqMarkupCustom');
  if (el) el.style.display = isCustom ? '' : 'none';
  calcMU();
}

// ============================================================
// ANGEBOTE-MANAGEMENT (inkl. Zuschläge + Vergleich)
// ============================================================
let _inqOffers = [];

const SURCHARGE_DEFS = {
  sea: [
    { key: 'thc', label: 'THC' },
    { key: 'baf', label: 'BAF / Fuel' },
    { key: 'caf', label: 'CAF' },
    { key: 'isps', label: 'ISPS' },
    { key: 'surOther', label: 'Sonstige' },
  ],
  air: [
    { key: 'fsc', label: 'FSC (Fuel)' },
    { key: 'scc', label: 'SCC (Security)' },
    { key: 'awb', label: 'AWB / Handling' },
    { key: 'surOther', label: 'Sonstige' },
  ],
  road: [
    { key: 'toll', label: 'Maut' },
    { key: 'diesel', label: 'Diesel-Zuschlag' },
    { key: 'surOther', label: 'Sonstige' },
  ],
};

function offerTotal(o, defs) {
  let t = parseFloat(o.price) || 0;
  (defs || []).forEach(d => { t += parseFloat(o[d.key]) || 0; });
  return t;
}

function addInqOffer() {
  _inqOffers.push({ spediteur: '', price: '', currency: 'EUR', transitDays: '', validUntil: '', notes: '', status: 'pending' });
  renderInqOffers();
}

function removeInqOffer(idx) {
  _inqOffers.splice(idx, 1);
  renderInqOffers();
}

function inqOfferUpdate(el) {
  const idx = parseInt(el.dataset.idx, 10);
  const field = el.dataset.field;
  if (isNaN(idx) || !_inqOffers[idx] || !field) return;
  _inqOffers[idx][field] = el.value;
  if (el.dataset.render) renderInqOffers();
  else renderOfferComparison();
}

function toggleSurchargePanel(idx) {
  const panel = document.getElementById('sur-' + idx);
  if (panel) panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
}

function renderInqOffers() {
  const container = document.getElementById('inqOffersContainer');
  if (!container) return;
  const badge = document.getElementById('bInqOffers');
  if (badge) badge.textContent = _inqOffers.length;
  if (_inqOffers.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px">Noch keine Angebote. Klicken Sie auf "+ Angebot hinzufügen".</div>';
    document.getElementById('inqOfferComparison').style.display = 'none';
    return;
  }
  const transport = document.getElementById('fInqTransport')?.value || 'sea';
  const defs = SURCHARGE_DEFS[transport] || SURCHARGE_DEFS.sea;
  const transportLabel = transport === 'air' ? 'Luftfracht' : transport === 'sea' ? 'Seefracht' : 'Landtransport';

  container.innerHTML = _inqOffers.map((o, idx) => {
    const surSum = defs.reduce((s, d) => s + (parseFloat(o[d.key]) || 0), 0);
    const expanded = surSum > 0;
    const surBtnLabel = expanded ? `▾ Zuschläge · ${fc(surSum)}` : '▸ Zuschläge hinzufügen';
    const surFields = defs.map(d => `
      <div>
        <label style="font-size:10px;color:var(--text-2);display:block;margin-bottom:2px">${d.label} (€)</label>
        <input class="form-input" type="number" min="0" step="0.01"
          value="${parseFloat(o[d.key]) > 0 ? o[d.key] : ''}"
          data-change="inqOfferUpdate(el)" data-idx="${idx}" data-field="${d.key}" data-render="1"
          placeholder="0" style="font-size:11px;padding:4px 6px">
      </div>`).join('');
    return `<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:12px">Angebot ${idx + 1}${surSum > 0 ? ' <span style="font-weight:400;color:var(--text-2);font-size:11px">· Gesamt: ' + fc(offerTotal(o, defs)) + '</span>' : ''}</strong>
        <button class="btn btn-ghost btn-sm" data-click="removeInqOffer(${idx})" title="Entfernen" style="color:var(--danger)">&#10005;</button>
      </div>
      <div class="form-row-3">
        <div class="form-group"><label class="form-label" style="font-size:11px">Spediteur</label><input class="form-input" value="${escapeAttr(o.spediteur || '')}" data-change="inqOfferUpdate(el)" data-idx="${idx}" data-field="spediteur" data-render="1" placeholder="Name" style="font-size:12px"></div>
        <div class="form-group"><label class="form-label" style="font-size:11px">Basispreis (EUR)</label><input class="form-input" type="number" value="${o.price || ''}" data-change="inqOfferUpdate(el)" data-idx="${idx}" data-field="price" data-render="1" style="font-size:12px"></div>
        <div class="form-group"><label class="form-label" style="font-size:11px">Transitzeit (Tage)</label><input class="form-input" value="${escapeAttr(o.transitDays || '')}" data-change="inqOfferUpdate(el)" data-idx="${idx}" data-field="transitDays" style="font-size:12px"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label" style="font-size:11px">Gültig bis</label><input class="form-input" type="date" value="${o.validUntil || ''}" data-change="inqOfferUpdate(el)" data-idx="${idx}" data-field="validUntil" style="font-size:12px"></div>
        <div class="form-group"><label class="form-label" style="font-size:11px">Bemerkung</label><input class="form-input" value="${escapeAttr(o.notes || '')}" data-change="inqOfferUpdate(el)" data-idx="${idx}" data-field="notes" placeholder="Freitext" style="font-size:12px"></div>
      </div>
      <div style="margin-top:8px">
        <button type="button" data-click="toggleSurchargePanel(${idx})" style="background:none;border:none;color:var(--brand);font-size:11px;cursor:pointer;padding:2px 0;font-weight:600">${surBtnLabel}</button>
        <div id="sur-${idx}" style="display:${expanded ? 'grid' : 'none'};grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin-top:8px;padding:10px;background:var(--surface-3);border-radius:8px;border:1px solid var(--border-light)">
          <div style="grid-column:1/-1;font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Zuschläge — ${transportLabel}</div>
          ${surFields}
        </div>
      </div>
    </div>`;
  }).join('');
  renderOfferComparison();
}

function renderOfferComparison() {
  const comp = document.getElementById('inqOfferComparison');
  if (!comp) return;
  const transport = document.getElementById('fInqTransport')?.value || 'sea';
  const defs = SURCHARGE_DEFS[transport] || SURCHARGE_DEFS.sea;
  const valid = _inqOffers.filter(o => parseFloat(o.price) > 0);
  if (valid.length < 2) { comp.style.display = 'none'; return; }
  comp.style.display = '';

  const withTotals = valid.map(o => ({
    ...o,
    _base: parseFloat(o.price) || 0,
    _sur: defs.reduce((s, d) => s + (parseFloat(o[d.key]) || 0), 0),
    _total: offerTotal(o, defs),
  }));
  const sorted = [...withTotals].sort((a, b) => a._total - b._total);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const hasSurcharges = sorted.some(o => o._sur > 0);

  comp.innerHTML = `<div class="info-banner info-banner-success" style="margin-bottom:0">
    <strong style="font-size:13px">Angebotsvergleich${hasSurcharges ? ' inkl. Zuschläge' : ''}</strong>
    <table style="width:100%;margin-top:8px;font-size:12px;border-collapse:collapse">
      <tr style="border-bottom:1px solid var(--border)">
        <th style="text-align:left;padding:4px 8px">Spediteur</th>
        <th style="text-align:center">Basispreis</th>
        ${hasSurcharges ? '<th style="text-align:center;color:var(--text-2)">Zuschläge</th>' : ''}
        <th style="text-align:center">Gesamt</th>
        <th style="text-align:center">Transit</th>
        <th style="text-align:center">Diff.</th>
        <th></th>
      </tr>
      ${sorted.map((o, i) => `<tr style="background:${i === 0 ? 'rgba(16,185,129,.08)' : ''}">
        <td style="padding:4px 8px;font-weight:${i === 0 ? 700 : 400}">${escapeHtml(o.spediteur || 'Unbenannt')}</td>
        <td style="text-align:center">${fc(o._base)}</td>
        ${hasSurcharges ? `<td style="text-align:center;color:var(--text-2);font-size:11px">${o._sur > 0 ? fc(o._sur) : '—'}</td>` : ''}
        <td style="text-align:center;font-weight:700">${fc(o._total)}</td>
        <td style="text-align:center">${escapeHtml(o.transitDays || '—')}</td>
        <td style="text-align:center;color:${i === 0 ? 'var(--accent-green)' : 'var(--danger)'}">${i === 0 ? 'Günstigster' : '+' + fc(o._total - best._total)}</td>
        <td style="text-align:center">${i === 0 ? '<button class="btn btn-accent btn-sm" data-click="selectBestOffer()" style="font-size:10px">Auswählen</button>' : ''}</td>
      </tr>`).join('')}
    </table>
    <div style="font-size:11px;color:var(--text-2);margin-top:6px">Ersparnis vs. teuerstes: <strong>${fc(worst._total - best._total)}</strong></div>
  </div>`;
}

function selectBestOffer() {
  const transport = document.getElementById('fInqTransport')?.value || 'sea';
  const defs = SURCHARGE_DEFS[transport] || SURCHARGE_DEFS.sea;
  const sorted = [..._inqOffers].filter(o => parseFloat(o.price) > 0)
    .sort((a, b) => offerTotal(a, defs) - offerTotal(b, defs));
  if (sorted.length === 0) return;
  const best = sorted[0];
  document.getElementById('fInqCost').value = best.price;
  calcMU();
  document.getElementById('fInqSpediteur').value = best.spediteur || '';
  const total = offerTotal(best, defs);
  const surNote = total > best.price ? ` (inkl. ${fc(total - best.price)} Zuschläge)` : '';
  toast('Günstigstes Angebot übernommen: ' + fc(best.price) + surNote + ' · ' + (best.spediteur || ''));
  showInqTab('basis', document.getElementById('inqTabBasis'));
}

// ============================================================
// GEFAHRGUT — Katalog-basierte Auswahl (wenig Tipparbeit)
// UN-Eintrag wählen → Klasse/VG/Bezeichnung werden übernommen
// ============================================================
const DG_CATALOG = [
  { key: 'un1170', un: '1170', class: '3',   pg: 'II',  name: 'Ethanol / Ethanol-Lösung',                          nameEn: 'Ethanol / Ethanol solution' },
  { key: 'un1197', un: '1197', class: '3',   pg: 'III', name: 'Extrakte, Aromastoffe, flüssig',                    nameEn: 'Extracts, flavouring, liquid' },
  { key: 'un1219', un: '1219', class: '3',   pg: 'II',  name: 'Isopropanol',                                       nameEn: 'Isopropanol' },
  { key: 'un1263', un: '1263', class: '3',   pg: 'III', name: 'Farbe / Farbzubehörstoffe',                         nameEn: 'Paint / Paint related material' },
  { key: 'un1266', un: '1266', class: '3',   pg: 'III', name: 'Parfümerieerzeugnisse',                             nameEn: 'Perfumery products' },
  { key: 'un1760', un: '1760', class: '8',   pg: 'III', name: 'Ätzender flüssiger Stoff, n.a.g.',                  nameEn: 'Corrosive liquid, n.o.s.' },
  { key: 'un1866', un: '1866', class: '3',   pg: 'III', name: 'Harzlösung',                                        nameEn: 'Resin solution' },
  { key: 'un1950', un: '1950', class: '2.1', pg: '—',   name: 'Druckgaspackungen (Aerosole)',                      nameEn: 'Aerosols' },
  { key: 'un1993', un: '1993', class: '3',   pg: 'III', name: 'Entzündbarer flüssiger Stoff, n.a.g.',              nameEn: 'Flammable liquid, n.o.s.' },
  { key: 'un2924', un: '2924', class: '3',   pg: 'III', name: 'Entzündbarer flüssiger Stoff, ätzend, n.a.g.',      nameEn: 'Flammable liquid, corrosive, n.o.s.' },
  { key: 'un3077', un: '3077', class: '9',   pg: 'III', name: 'Umweltgefährdender Stoff, fest, n.a.g.',            nameEn: 'Environmentally hazardous substance, solid, n.o.s.' },
  { key: 'un3082', un: '3082', class: '9',   pg: 'III', name: 'Umweltgefährdender Stoff, flüssig, n.a.g.',         nameEn: 'Environmentally hazardous substance, liquid, n.o.s.' },
  { key: 'un3175', un: '3175', class: '4.1', pg: 'II',  name: 'Feste Stoffe mit entzündbarer Flüssigkeit, n.a.g.', nameEn: 'Solids containing flammable liquid, n.o.s.' }
];
const DG_CLASSES = ['2.1', '2.2', '2.3', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '8', '9'];
const DG_PGS = ['—', 'I', 'II', 'III'];

let _inqDgItems = []; // [{key, un, class, pg, name, nameEn}]

function dgAddItem(data) {
  _inqDgItems.push(data || { key: '', un: '', class: '3', pg: 'III', name: '', nameEn: '' });
  dgRenderItems();
}

function dgRemoveItem(idx) {
  _inqDgItems.splice(idx, 1);
  dgRenderItems();
}

function dgFieldChange(idx, field, value) {
  const d = _inqDgItems[idx];
  if (!d) return;
  if (field === 'key') {
    const cat = DG_CATALOG.find(c => c.key === value);
    if (cat) {
      Object.assign(d, { key: cat.key, un: cat.un, class: cat.class, pg: cat.pg, name: cat.name, nameEn: cat.nameEn });
    } else {
      Object.assign(d, { key: value === 'custom' ? 'custom' : '', un: '', name: '', nameEn: '' });
    }
    dgRenderItems();
    return;
  }
  d[field] = value;
  if (field === 'name') d.nameEn = value; // Eigene Angabe: eine Bezeichnung für beide Sprachen
}

function dgRenderItems() {
  const wrap = document.getElementById('inqDGList');
  if (!wrap) return;
  if (!_inqDgItems.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:14px;color:var(--text-3);font-size:12px">' + t('Noch keine Gefahrgut-Position — Eintrag aus dem Katalog wählen.') + '</div>';
    return;
  }
  const catOptions = d => '<option value="">' + t('— Wählen —') + '</option>' +
    DG_CATALOG.map(c => `<option value="${c.key}"${d.key === c.key ? ' selected' : ''}>UN ${c.un} — ${escapeHtml(_lang === 'en' ? c.nameEn : c.name)} (${c.class})</option>`).join('') +
    `<option value="custom"${d.key === 'custom' ? ' selected' : ''}>${t('Eigene Angabe…')}</option>`;
  wrap.innerHTML = _inqDgItems.map((d, idx) => {
    const isCustom = d.key === 'custom';
    return `<div class="inq-art-row" style="border-left:3px solid var(--danger)">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:700;color:var(--danger);min-width:24px">⚠️${idx + 1}</span>
        <select class="form-select" style="flex:2;min-width:220px;font-size:12px" data-change="dgFieldChange(${idx},'key','$value')">${catOptions(d)}</select>
        <input class="form-input" style="width:80px;font-size:12px" placeholder="UN" maxlength="4" value="${escapeAttr(d.un)}" ${isCustom ? '' : 'readonly tabindex="-1" style="width:80px;font-size:12px;background:var(--surface-3)"'} data-input="dgFieldChange(${idx},'un','$value')">
        <select class="form-select" style="width:86px;font-size:12px" data-change="dgFieldChange(${idx},'class','$value')">
          ${DG_CLASSES.map(c => `<option value="${c}"${d.class === c ? ' selected' : ''}>Kl. ${c}</option>`).join('')}
        </select>
        <select class="form-select" style="width:82px;font-size:12px" data-change="dgFieldChange(${idx},'pg','$value')">
          ${DG_PGS.map(p => `<option value="${p}"${d.pg === p ? ' selected' : ''}>VG ${p}</option>`).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" data-click="dgRemoveItem(${idx})" style="color:var(--danger);padding:2px 6px;font-size:14px" title="${escapeAttr(t('Entfernen'))}">×</button>
      </div>
      ${isCustom ? `<div style="margin-top:6px"><input class="form-input" style="font-size:12px" placeholder="${escapeAttr(t('Bezeichnung (Proper Shipping Name)'))}" value="${escapeAttr(d.name)}" data-input="dgFieldChange(${idx},'name','$value')"></div>` : ''}
    </div>`;
  }).join('');
}

// Kurzfassung für Listen/Legacy-Feld: "UN 1993 Kl.3 VG III; …"
function dgSummary(items) {
  return (items || []).filter(d => d.un).map(d =>
    'UN ' + d.un + ' Kl.' + d.class + (d.pg && d.pg !== '—' ? ' VG ' + d.pg : '')
  ).join('; ');
}
