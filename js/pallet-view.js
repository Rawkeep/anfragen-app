// ============================================================
// PALETTENRECHNER (Standalone-Ansicht) + PACKSTÜCK-VERWALTUNG
// Berechnung: calcPalletsInline / calcFromNetWeight (products.js)
// ============================================================

function _palProductOptions() {
  return '<option value="">— Packstück wählen —</option>' +
    Object.entries(INQ_PRODUCTS).map(([k, v]) => `<option value="${k}">${v.emoji} ${k} — ${v.name}</option>`).join('');
}

function initPalletView() {
  const sel = document.getElementById('fPalArticle');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = _palProductOptions();
    if (cur && INQ_PRODUCTS[cur]) sel.value = cur;
  }
  renderProductCatalog();
  if (typeof renderArticleCatalog === 'function') renderArticleCatalog();
  runPalletCalc();
}

function togglePalMode() {
  const mode = document.getElementById('fPalMode').value;
  document.getElementById('palQtyWrap').style.display = mode === 'qty' ? '' : 'none';
  document.getElementById('palNettoWrap').style.display = mode === 'netto' ? '' : 'none';
  runPalletCalc();
}

function setPalHeightPreset(v) {
  document.getElementById('fPalMaxHeight').value = v;
  runPalletCalc();
}

function runPalletCalc() {
  const out = document.getElementById('palCalcResult');
  if (!out) return;
  const code = document.getElementById('fPalArticle')?.value || '';
  const mode = document.getElementById('fPalMode')?.value || 'qty';
  const maxH = parseInt(document.getElementById('fPalMaxHeight')?.value) || 0;
  const p = INQ_PRODUCTS[code];
  if (!p) { out.style.display = 'none'; return; }

  let r = null;
  if (mode === 'netto') {
    const n = parseFloat(document.getElementById('fPalNetto')?.value) || 0;
    if (n > 0) r = calcFromNetWeight(code, n, maxH || undefined);
  } else {
    const q = parseInt(document.getElementById('fPalQty')?.value) || 0;
    if (q > 0) r = calcPalletsInline(code, q, maxH || undefined);
  }
  if (!r) { out.style.display = 'none'; return; }

  out.style.display = '';
  const effMax = Math.min(p.layers[p.maxLayers].pcs, Math.floor(NETTO_LIMIT / p.fillWt));
  const prodInfo = `<div class="inq-art-info" style="margin-bottom:10px">${p.emoji} ${code} — ${p.name} | ${p.dim.l}×${p.dim.w}×${p.dim.h} mm | Füll: ${p.fillWt} kg | Brutto: ${fnum(p.bruttoWt, 2)} kg/Stk | Max/Pal: ${effMax} Stk | Netto-Limit: ${NETTO_LIMIT} kg/Pal.</div>`;

  if (r.type === 'loose') {
    out.innerHTML = prodInfo + `<div style="font-weight:800;font-size:16px;margin-bottom:6px">Ergebnis: LOSE Sendung</div>
      <div style="font-size:14px"><strong>${r.qty}</strong> Stück (lose, ≤ ${p.maxLoose} Stk) | Bruttogewicht: <strong>${fnum(r.grossWeight)} kg</strong></div>
      <div style="font-size:12px;color:var(--text-2);margin-top:4px">Maße je Kollo: ${p.dim.l}×${p.dim.w}×${p.dim.h} mm</div>`;
    return;
  }

  const palRows = r.details.map((x, i) => `<tr>
    <td style="font-weight:700">Palette ${i + 1}</td>
    <td style="text-align:center">${x.pcs} Stk</td>
    <td style="text-align:center">${x.layers} Lagen</td>
    <td style="text-align:center">${x.height} cm</td>
    <td style="text-align:center">${fnum(x.pcs * p.bruttoWt + PALLET_WT, 1)} kg</td>
  </tr>`).join('');
  const totalVol = Math.round(r.pallets * 1.2 * 0.8 * (r.maxHeight / 100) * 100) / 100;

  out.innerHTML = prodInfo + `<div style="font-weight:800;font-size:16px;margin-bottom:6px">Ergebnis: PALETTIERT</div>
    <div style="font-size:14px;margin-bottom:10px"><strong>${r.pallets}</strong> Palette(n) | <strong>${r.qty}</strong> Stück | Brutto: <strong>${fnum(r.grossWeight)} kg</strong> | Volumen ca. <strong>${fnum(totalVol, 2)} m³</strong></div>
    <table class="pal-table">
      <tr><th style="text-align:left">Palette</th><th>Stück</th><th>Lagen</th><th>Höhe</th><th>Gewicht (inkl. ${PALLET_WT} kg Pal.)</th></tr>
      ${palRows}
    </table>
    <div style="font-size:12px;color:var(--text-2);margin-top:8px">Max. Palettenhöhe: <strong>${r.maxHeight} cm</strong> | Europalette 120×80 cm</div>
    ${r.heightLimited ? '<div style="margin-top:6px;padding:6px 10px;background:rgba(245,158,11,.1);border-left:3px solid #f59e0b;border-radius:6px;font-size:11px;font-weight:600;color:#92400e">⚠️ Höhenlimit ' + maxH + ' cm aktiv — Lagen gekappt, Palettenzahl erhöht</div>' : ''}`;
}

// ============================================================
// PACKSTÜCK-KATALOG + CRUD
// ============================================================
function renderProductCatalog() {
  const wrap = document.getElementById('productCatalog');
  if (!wrap) return;
  const rows = Object.entries(INQ_PRODUCTS).map(([code, p]) => {
    const layerInfo = Object.entries(p.layers).map(([l, v]) => `${l}L: ${v.pcs} Stk / ${v.h} cm`).join(' · ');
    const custom = Packstuecke.isCustom(code);
    return `<tr>
      <td style="font-weight:700;white-space:nowrap">${p.emoji} ${escapeHtml(code)}${custom ? ' <span style="font-size:9px;color:var(--brand);font-weight:700">CUSTOM</span>' : ''}</td>
      <td>${escapeHtml(p.name)}</td>
      <td style="text-align:center;white-space:nowrap">${p.dim.l}×${p.dim.w}×${p.dim.h}</td>
      <td style="text-align:center">${p.fillWt} kg</td>
      <td style="text-align:center">${fnum(p.bruttoWt, 2)} kg</td>
      <td style="text-align:center">${p.maxLoose}</td>
      <td style="font-size:10px;color:var(--text-2)">${layerInfo}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-icon sm" data-click="openPackstueckModal('${escapeAttr(code)}')" title="Bearbeiten">✏️</button>
        <button class="btn btn-ghost btn-icon sm" data-click="deletePackstueck('${escapeAttr(code)}')" title="Löschen" style="color:var(--danger)">🗑</button>
      </td>
    </tr>`;
  }).join('');
  wrap.innerHTML = `<table class="pal-table" style="width:100%">
    <tr><th style="text-align:left">Code</th><th style="text-align:left">Name</th><th>Maße (mm)</th><th>Füllgewicht</th><th>Brutto/Stk</th><th>Max. lose</th><th style="text-align:left">Lagen</th><th></th></tr>
    ${rows}
  </table>`;
}

function openPackstueckModal(code) {
  const p = code ? INQ_PRODUCTS[code] : null;
  document.getElementById('mPackTitle').textContent = p ? 'Packstück bearbeiten — ' + code : 'Neues Packstück';
  document.getElementById('fPackCode').value = code || '';
  document.getElementById('fPackCode').disabled = !!p;
  document.getElementById('fPackName').value = p ? p.name : '';
  document.getElementById('fPackEmoji').value = p ? p.emoji : '📦';
  document.getElementById('fPackL').value = p ? p.dim.l : '';
  document.getElementById('fPackW').value = p ? p.dim.w : '';
  document.getElementById('fPackH').value = p ? p.dim.h : '';
  document.getElementById('fPackEmptyWt').value = p ? p.emptyWt : '';
  document.getElementById('fPackFillWt').value = p ? p.fillWt : '';
  document.getElementById('fPackMaxLoose').value = p ? p.maxLoose : '';
  // Lagen als editierbare Zeilen "höhe_cm:stück" pro Lage
  const layersText = p
    ? Object.entries(p.layers).map(([l, v]) => `${l}: ${v.h} cm, ${v.pcs} Stk`).join('\n')
    : '1: 55 cm, 8 Stk\n2: 95 cm, 16 Stk\n3: 135 cm, 20 Stk';
  document.getElementById('fPackLayers').value = layersText;
  openM('mPackstueck');
}

function savePackstueck() {
  const code = document.getElementById('fPackCode').value.trim().toUpperCase();
  if (!code) { toast('Code fehlt', 'error'); return; }
  // Lagen-Text parsen: "1: 55 cm, 8 Stk"
  const layers = {};
  let maxLayers = 0;
  document.getElementById('fPackLayers').value.split('\n').forEach(line => {
    const m = /^\s*(\d+)\s*:\s*([\d.,]+)\s*(?:cm)?\s*,\s*([\d]+)/.exec(line);
    if (m) {
      const l = parseInt(m[1], 10);
      layers[l] = { h: parseFloat(m[2].replace(',', '.')), pcs: parseInt(m[3], 10) };
      maxLayers = Math.max(maxLayers, l);
    }
  });
  if (!maxLayers) { toast('Mindestens eine Lage angeben (Format: "1: 55 cm, 8 Stk")', 'error'); return; }
  try {
    Packstuecke.upsert(code, {
      name: document.getElementById('fPackName').value,
      emoji: document.getElementById('fPackEmoji').value || '📦',
      l: document.getElementById('fPackL').value,
      w: document.getElementById('fPackW').value,
      h: document.getElementById('fPackH').value,
      emptyWt: document.getElementById('fPackEmptyWt').value,
      fillWt: document.getElementById('fPackFillWt').value,
      maxLoose: document.getElementById('fPackMaxLoose').value,
      layers, maxLayers
    });
    closeM('mPackstueck');
    initPalletView();
    toast('Packstück ' + code + ' gespeichert');
  } catch (e) {
    toast('Fehler: ' + e.message, 'error');
  }
}

function deletePackstueck(code) {
  if (!confirm('Packstück ' + code + ' löschen?')) return;
  Packstuecke.remove(code);
  initPalletView();
  toast('Packstück ' + code + ' gelöscht');
}

function resetPackstuecke() {
  if (!confirm('Alle Packstücke auf Werkseinstellungen zurücksetzen? Eigene Packstücke gehen verloren.')) return;
  Packstuecke.reset();
  initPalletView();
  toast('Packstücke zurückgesetzt');
}
