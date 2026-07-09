// ============================================================
// CONTAINERBERECHNUNG — Specs, Presets, Empfehlung, Beladung,
// Stauplan-Visualisierung. Extrahiert aus Export Afrika Pro.
// ============================================================

// Container-Specs (Innenmaße in Metern, Nutzlast in kg)
const CONTAINER_SPECS = {
  '20ft': { len: 5.90, wid: 2.35, hgt: 2.39, payload: 21770, teu: 1, label: "20' Standard", icon: '📦', pallets: 11 },
  '40ft': { len: 12.03, wid: 2.35, hgt: 2.39, payload: 26680, teu: 2, label: "40' Standard", icon: '📦', pallets: 23 },
  '40hc': { len: 12.03, wid: 2.35, hgt: 2.69, payload: 26460, teu: 2, label: "40' High Cube", icon: '📦', pallets: 23 },
  '20ot': { len: 5.90, wid: 2.35, hgt: 2.35, payload: 21650, teu: 1, label: "20' Open Top", icon: '🔝', pallets: 11 },
  '40ot': { len: 12.03, wid: 2.35, hgt: 2.35, payload: 26350, teu: 2, label: "40' Open Top", icon: '🔝', pallets: 23 },
  '20rf': { len: 5.44, wid: 2.29, hgt: 2.27, payload: 21100, teu: 1, label: "20' Reefer", icon: '❄️', pallets: 10 },
  '40rf': { len: 11.56, wid: 2.29, hgt: 2.55, payload: 26120, teu: 2, label: "40' Reefer", icon: '❄️', pallets: 21 },
  '20fl': { len: 5.94, wid: 2.15, hgt: 2.23, payload: 21750, teu: 1, label: "20' Flatrack", icon: '🔲', pallets: 8 },
  '40fl': { len: 12.08, wid: 2.15, hgt: 1.96, payload: 26120, teu: 2, label: "40' Flatrack", icon: '🔲', pallets: 16 },
  '45hc': { len: 13.56, wid: 2.35, hgt: 2.69, payload: 25600, teu: 2, label: "45' High Cube", icon: '📦', pallets: 26 },
  '20tk': { len: 6.06, wid: 2.44, hgt: 2.44, payload: 21000, teu: 1, label: "20' Tank", icon: '🛢️', pallets: 0 }
};

// Produkt-Presets: Lagen und Einheiten pro Palette
const CONTAINER_PRESETS = {
  '030aa':         { label: '030AA Kanister 25kg (25L)', unit: 'kanister', layersLower: 3, layersUpper: 2, unitsPerLayerLower: 8, unitsPerLayerUpper: 8, halfPalUnits: 12, note: 'Standard 25kg Kanister — 24 unten, 16 oben pro Palette' },
  '015aa':         { label: '015AA Kanister 10kg', unit: 'kanister', layersLower: 3, layersUpper: 2, unitsPerLayerLower: 20, unitsPerLayerUpper: 20, halfPalUnits: 30, note: '10kg Kanister — 60 unten, 40 oben pro Palette' },
  '020xx':         { label: '020XX Kanister 20kg', unit: 'kanister', layersLower: 3, layersUpper: 2, unitsPerLayerLower: 8, unitsPerLayerUpper: 8, halfPalUnits: 12, note: '20kg Kanister — 24 unten, 16 oben pro Palette (wie 030AA)' },
  '064aa':         { label: '064AA Karton groß 25kg', unit: 'karton', layersLower: 4, layersUpper: 3, unitsPerLayerLower: 6, unitsPerLayerUpper: 6, halfPalUnits: 9, note: 'Große Kartons — 24 unten, 18 oben pro Palette' },
  '033aa':         { label: '033AA Fass 25kg', unit: 'fass', layersLower: 3, layersUpper: 2, unitsPerLayerLower: 6, unitsPerLayerUpper: 6, halfPalUnits: 9, note: 'Fässer 25kg — 18 unten, 12 oben pro Palette (schwer!)' },
  'carton-powder': { label: '027AA Kartons Pulver 25kg', unit: 'karton', layersLower: 5, layersUpper: 4, unitsPerLayerLower: 6, unitsPerLayerUpper: 6, halfPalUnits: 9, note: 'Pulver-Kartons — 30 unten, 24 oben pro Palette' },
  'small-can':     { label: 'Kleine Kanister (5L/10L)', unit: 'kanister', layersLower: 4, layersUpper: 3, unitsPerLayerLower: 12, unitsPerLayerUpper: 12, halfPalUnits: 18, note: 'Kleinere Kanister — mehr Lagen möglich' },
  'ibc':           { label: 'IBC Container (1000L)', unit: 'ibc', layersLower: 1, layersUpper: 0, unitsPerLayerLower: 1, unitsPerLayerUpper: 0, halfPalUnits: 0, note: 'IBC — nur untere Ebene, keine Stapelung' },
  'drums-200l':    { label: 'Fässer / Drums (200L)', unit: 'fass', layersLower: 1, layersUpper: 0, unitsPerLayerLower: 4, unitsPerLayerUpper: 0, halfPalUnits: 2, note: '200L Fässer — 4 pro Palette, 1 Lage' }
};

const UNIT_NAMES = { kanister: 'Kanister', karton: 'Kartons', fass: 'Fässer', ibc: 'IBC', stueck: 'Stück' };
const UNIT_ICONS = { kanister: '🛢', karton: '📦', fass: '🪣', ibc: '🏗', stueck: '📦' };

// ─── Container-Empfehlung: beste Größe für Sendungs-Eckdaten ───
// Liefert {best, label, units, fits, fillPct, alternatives, note, ...}
function recommendContainer({ pallets = 0, weight = 0, volumeM3 = 0, transport = 'sea', dg = false } = {}) {
  const KEYS = ['20ft', '40ft', '40hc', '45hc'];
  const candidates = KEYS.map(k => ({ key: k, spec: CONTAINER_SPECS[k] })).filter(x => x.spec);
  // Nutzlast je Container; volumeMax ≈ len*wid*hgt*0.85 (Stauverlust)
  candidates.forEach(c => {
    c.volMax = +(c.spec.len * c.spec.wid * c.spec.hgt * 0.85).toFixed(1);
    c.payload = c.spec.payload;
    c.pallets = c.spec.pallets;
  });
  const need = { pallets: pallets | 0, weight: +weight || 0, volumeM3: +volumeM3 || 0 };
  const fits = c => {
    const palOk = need.pallets ? need.pallets <= c.pallets : true;
    const wtOk = need.weight ? need.weight <= c.payload : true;
    const volOk = need.volumeM3 ? need.volumeM3 <= c.volMax : true;
    return palOk && wtOk && volOk;
  };
  if (!need.pallets && !need.weight && !need.volumeM3) return null;
  const fitting = candidates.filter(fits);
  if (transport === 'air') {
    return {
      best: null, transport: 'air',
      note: 'Luftfracht — Container-Empfehlung nicht anwendbar (ULD-Layout per IATA).',
      fits: false, ...need
    };
  }
  if (transport === 'road') {
    return {
      best: 'truck-megatrailer',
      label: 'Mega-Trailer 13,6 m',
      pallets: 33, payload: 24000, volMax: 100,
      transport: 'road',
      note: 'LKW: 33 Europaletten / ~24 t / ~100 m³ (Mega-Trailer). 26 t Gesamt-zGG mit Sattelzug.',
      fits: (need.pallets ? need.pallets <= 33 : true) && (need.weight ? need.weight <= 24000 : true),
      ...need
    };
  }
  if (!fitting.length) {
    // Über mehrere Container splitten: best = größter, Anzahl ableiten
    const biggest = candidates[candidates.length - 1];
    const byPal = need.pallets ? Math.ceil(need.pallets / biggest.pallets) : 0;
    const byWt = need.weight ? Math.ceil(need.weight / biggest.payload) : 0;
    const byVol = need.volumeM3 ? Math.ceil(need.volumeM3 / biggest.volMax) : 0;
    const units = Math.max(1, byPal, byWt, byVol);
    return {
      best: biggest.key,
      label: biggest.spec.label,
      units,
      note: `Sendung passt nicht in einen einzelnen Container — empfohlen: ${units}× ${biggest.spec.label}.`,
      fits: false, ...need,
      payload: biggest.payload, pallets: biggest.pallets, volMax: biggest.volMax
    };
  }
  // Kleinste passende Größe = effizienteste
  const best = fitting[0];
  const fillPct = Math.round(Math.max(
    need.pallets ? (need.pallets / best.pallets) * 100 : 0,
    need.weight ? (need.weight / best.payload) * 100 : 0,
    need.volumeM3 ? (need.volumeM3 / best.volMax) * 100 : 0
  ));
  const altKeys = fitting.slice(1, 3).map(c => c.spec.label);
  return {
    best: best.key,
    label: best.spec.label,
    units: 1,
    fits: true,
    fillPct,
    palletsCap: best.pallets,
    payloadCap: best.payload,
    volMaxCap: best.volMax,
    alternatives: altKeys,
    note: `Empfohlen: 1× ${best.spec.label} (Auslastung ~${fillPct}%${dg ? ' — DG-Sendung: separater Stauplatz nötig' : ''}).`,
    ...need
  };
}
if (typeof window !== 'undefined') window.recommendContainer = recommendContainer;

// Europalette 1.20m × 0.80m — Staumuster im Container
function calcPalletLayout(spec) {
  const rowsLaengs = Math.floor(spec.len / 1.20); // Reihen in Längsrichtung
  const palPerRow = 2; // 2 Paletten quer nebeneinander (2×80=160cm < 235cm)
  return {
    rowsLaengs,
    palPerRow,
    total: spec.pallets, // Branchenwerte aus CONTAINER_SPECS
    restBreiteCm: Math.round((spec.wid - palPerRow * 0.80) * 100),
    restLaengeCm: Math.round((spec.len - rowsLaengs * 1.20) * 100)
  };
}

// ============================================================
// INTERAKTIVER BELADUNGSRECHNER (Standalone — ohne Sendungslink)
// ============================================================
function applyContainerPreset() {
  const type = document.getElementById('fCLProductType')?.value;
  if (!type || type === 'custom') { calcContainerLoad(); return; }
  const p = CONTAINER_PRESETS[type];
  if (!p) return;
  const ct = document.getElementById('fCLContainerType')?.value || '40hc';
  const spec = CONTAINER_SPECS[ct] || CONTAINER_SPECS['40hc'];
  const maxPal = spec.pallets || 23;
  document.getElementById('fCLPalLower').value = maxPal;
  document.getElementById('fCLPalUpper').value = p.layersUpper > 0 ? maxPal : 0;
  document.getElementById('fCLLayersLower').value = p.layersLower;
  document.getElementById('fCLLayersUpper').value = p.layersUpper;
  document.getElementById('fCLUnitsPerLayerLower').value = p.unitsPerLayerLower;
  document.getElementById('fCLUnitsPerLayerUpper').value = p.unitsPerLayerUpper;
  document.getElementById('fCLUnit').value = p.unit;
  document.getElementById('fCLUnitsHalfPal').value = p.halfPalUnits;
  calcContainerLoad();
}

function onContainerTypeChange() {
  const ct = document.getElementById('fCLContainerType').value;
  const spec = CONTAINER_SPECS[ct];
  if (spec) {
    const pL = document.getElementById('fCLPalLower');
    const pU = document.getElementById('fCLPalUpper');
    if (pL) pL.value = spec.pallets;
    const pt = document.getElementById('fCLProductType')?.value || '030aa';
    const preset = CONTAINER_PRESETS[pt];
    if (pU) pU.value = (preset && preset.layersUpper > 0) ? spec.pallets : 0;
    if (ct === '20tk' || ct.includes('fl')) { if (pU) pU.value = 0; }
  }
  // Viz-Referenz mitziehen
  const vizSel = document.getElementById('clVizContainer');
  if (vizSel) vizSel.value = ct;
  calcContainerLoad();
  renderContainerViz();
}

function calcContainerLoad() {
  const palLower = parseInt(document.getElementById('fCLPalLower')?.value) || 0;
  const palUpper = parseInt(document.getElementById('fCLPalUpper')?.value) || 0;
  const layersLower = parseInt(document.getElementById('fCLLayersLower')?.value) || 1;
  const layersUpper = parseInt(document.getElementById('fCLLayersUpper')?.value) || 1;
  const unitsLower = parseInt(document.getElementById('fCLUnitsPerLayerLower')?.value) || 1;
  const unitsUpper = parseInt(document.getElementById('fCLUnitsPerLayerUpper')?.value) || 1;
  const perPalletLower = layersLower * unitsLower;
  const perPalletUpper = layersUpper * unitsUpper;
  const totalLower = palLower * perPalletLower;
  const totalUpper = palUpper * perPalletUpper;

  // Lückenfüllung
  const gapFill = document.getElementById('fCLGapFill')?.value || 'none';
  const halfPals = (gapFill === 'half' || gapFill === 'both') ? (parseInt(document.getElementById('fCLHalfPallets')?.value) || 0) : 0;
  const looseUnits = (gapFill === 'loose' || gapFill === 'both') ? (parseInt(document.getElementById('fCLLooseUnits')?.value) || 0) : 0;
  const unitsPerHalf = parseInt(document.getElementById('fCLUnitsHalfPal')?.value) || 0;
  const gapTotal = (halfPals * unitsPerHalf) + looseUnits;

  const total = totalLower + totalUpper + gapTotal;

  // Gewichts-Check gegen Nutzlast
  const ct = document.getElementById('fCLContainerType')?.value || '40hc';
  const spec = CONTAINER_SPECS[ct] || CONTAINER_SPECS['40hc'];
  const unitWt = parseFloat(document.getElementById('fCLUnitWeight')?.value) || 0;
  const totalPalCount = palLower + palUpper + halfPals;
  const grossKg = unitWt > 0 ? Math.round(total * unitWt + totalPalCount * PALLET_WT) : 0;

  // UI aktualisieren
  const unit = document.getElementById('fCLUnit')?.value || 'kanister';
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('clCalcTotal', total);
  set('clCalcLower', totalLower);
  set('clCalcUpper', totalUpper);
  set('clCalcUnitLabel', UNIT_NAMES[unit] || unit);
  set('clCalcPallets', totalPalCount);
  const gapInfoEl = document.getElementById('clCalcGapInfo');
  if (gapInfoEl) {
    gapInfoEl.style.display = gapTotal > 0 ? '' : 'none';
    set('clCalcGapTotal', gapTotal);
  }
  const wtEl = document.getElementById('clCalcWeight');
  if (wtEl) {
    if (grossKg > 0) {
      const over = grossKg > spec.payload;
      wtEl.style.display = '';
      wtEl.innerHTML = `Brutto ca. <strong>${fnum(grossKg / 1000, 1)} t</strong> / Nutzlast ${fnum(spec.payload / 1000, 1)} t ` +
        (over ? '<span style="color:var(--danger);font-weight:700">— ÜBERLADEN!</span>' : '<span style="color:var(--accent-green);font-weight:600">✓ OK</span>');
    } else {
      wtEl.style.display = 'none';
    }
  }
  // Sichtbarkeit der Lücken-Detailfelder
  const halfWrap = document.getElementById('clGapHalfWrap');
  const looseWrap = document.getElementById('clGapLooseWrap');
  if (halfWrap) halfWrap.style.display = (gapFill === 'half' || gapFill === 'both') ? '' : 'none';
  if (looseWrap) looseWrap.style.display = (gapFill === 'loose' || gapFill === 'both') ? '' : 'none';
}

// ============================================================
// STAUPLAN-VISUALISIERUNG (Referenzmodus)
// ============================================================
function renderContainerViz() {
  const ct = (document.getElementById('clVizContainer')?.value) || '40hc';
  const pt = (document.getElementById('clVizProduct')?.value) || '030aa';
  const spec = CONTAINER_SPECS[ct] || CONTAINER_SPECS['40hc'];
  const preset = CONTAINER_PRESETS[pt] || CONTAINER_PRESETS['030aa'];
  const isTank = ct === '20tk';
  const isFlat = ct.includes('fl');

  const palL = isTank ? 0 : spec.pallets;
  const palU = (!isTank && !isFlat && preset.layersUpper > 0) ? spec.pallets : 0;
  const uPerPalL = preset.layersLower * preset.unitsPerLayerLower;
  const uPerPalU = preset.layersUpper * preset.unitsPerLayerUpper;
  const totalL = palL * uPerPalL;
  const totalU = palU * uPerPalU;
  const total = totalL + totalU;
  const uName = UNIT_NAMES[preset.unit] || preset.unit;
  const uIcon = UNIT_ICONS[preset.unit] || '📦';

  const viz = document.getElementById('containerRefViz');
  const sum = document.getElementById('containerRefSummary');
  if (!viz) return;

  const dimBar = `<div class="cl-dimbar">
    <span style="font-weight:700;color:var(--text)">${spec.icon} ${spec.label}</span>
    <span class="cl-sep">|</span>
    <span>📐 ${fnum(spec.len, 2)} m × ${fnum(spec.wid, 2)} m × ${fnum(spec.hgt, 2)} m</span>
    <span class="cl-sep">|</span>
    <span>⚖️ ${fnum(spec.payload / 1000, 1)} t max</span>
    <span class="cl-sep">|</span>
    <span>${spec.teu} TEU</span>
    <span class="cl-sep">|</span>
    <span>🔲 Europalette 120×80cm</span>
    <span class="cl-sep">|</span>
    <span style="font-weight:600;color:var(--accent)">max. ${spec.pallets} Pal. (einlagig)</span>
    ${ct.includes('rf') ? '<span class="cl-sep">|</span><span>❄️ Kühl</span>' : ''}
    ${ct.includes('ot') ? '<span class="cl-sep">|</span><span>🔝 Offen</span>' : ''}
    ${ct === '40hc' || ct === '45hc' ? '<span class="cl-sep">|</span><span>📏 +30cm Höhe → mehr Lagen möglich</span>' : ''}
  </div>`;

  if (isTank) {
    const capL = Math.round(spec.len * spec.wid * spec.hgt * 0.95 * 1000);
    viz.innerHTML = dimBar + `<div style="text-align:center;padding:20px"><div style="font-size:40px;margin-bottom:8px">🛢️</div><div style="font-size:14px;font-weight:700">Flüssig-Transport — keine Palettierung</div><div style="font-size:12px;color:var(--text-2);margin-top:8px">Kapazität ca. ${fnum(capL / 1000)} m³</div></div>`;
    if (sum) sum.innerHTML = `Tankcontainer ${spec.label}: Kapazität ~${fnum(capL / 1000)} m³ | Nutzlast: <span style="color:var(--accent)">${fnum(spec.payload / 1000, 1)} t</span>`;
    return;
  }
  if (isFlat) {
    viz.innerHTML = dimBar + `<div style="text-align:center;padding:20px"><div style="font-size:40px;margin-bottom:8px">🔲</div><div style="font-size:14px;font-weight:700">Flatrack — offene Plattform</div><div style="font-size:12px;color:var(--text-2);margin-top:8px">${spec.pallets} Europaletten einlagig | Übermaß-/Schwergut</div></div>`;
    if (sum) sum.innerHTML = `Flatrack: ${palL} Paletten × ${uPerPalL} ${uName} = <span style="color:var(--accent)">${totalL} ${uName}</span> (nur untere Ebene)`;
    return;
  }

  let html = dimBar;
  const numRows = Math.ceil(palL / 2);
  const lastRowSingle = palL % 2 === 1;

  html += '<div class="cl-viz-grid">';

  // Untere Ebene
  html += '<div>';
  html += `<div class="cl-level-head"><span class="cl-pill cl-pill-blue">UNTEN</span>${palL} Pal. × ${preset.layersLower} Lagen × ${preset.unitsPerLayerLower}/Lage = ${uPerPalL}/Pal.</div>`;
  html += `<div class="cl-box cl-box-blue"><div class="cl-box-inner cl-box-inner-blue">`;
  html += `<div class="cl-len-label">← ${spec.len}m →</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(${Math.min(numRows, 13)},1fr);gap:2px">`;
  for (let r = 0; r < numRows; r++) {
    const isLast = (r === numRows - 1) && lastRowSingle;
    html += `<div style="display:flex;flex-direction:column;gap:1px">`;
    html += `<div class="cl-cell cl-cell-blue" title="Palette ${r * 2 + 1}: ${uPerPalL} ${uName}"><span style="font-size:10px">${uIcon}</span><span>${uPerPalL}</span></div>`;
    if (!isLast) {
      html += `<div class="cl-cell cl-cell-blue-light" title="Palette ${r * 2 + 2}: ${uPerPalL} ${uName}"><span style="font-size:10px">${uIcon}</span><span>${uPerPalL}</span></div>`;
    }
    html += `</div>`;
  }
  html += '</div></div>';
  html += `<div class="cl-level-sum cl-level-sum-blue">${palL} × ${uPerPalL} = <strong>${totalL} ${uName}</strong></div></div>`;

  // Obere Ebene
  if (palU > 0) {
    const numRowsU = Math.ceil(palU / 2);
    const lastRowSingleU = palU % 2 === 1;
    html += '<div>';
    html += `<div class="cl-level-head"><span class="cl-pill cl-pill-amber">OBEN</span>${palU} Pal. × ${preset.layersUpper} Lagen × ${preset.unitsPerLayerUpper}/Lage = ${uPerPalU}/Pal.</div>`;
    html += `<div class="cl-box cl-box-amber"><div class="cl-box-inner cl-box-inner-amber">`;
    html += `<div style="display:grid;grid-template-columns:repeat(${Math.min(numRowsU, 12)},1fr);gap:2px">`;
    for (let r = 0; r < numRowsU; r++) {
      const isLast = (r === numRowsU - 1) && lastRowSingleU;
      html += `<div style="display:flex;flex-direction:column;gap:1px">`;
      html += `<div class="cl-cell cl-cell-amber"><span style="font-size:10px">${uIcon}</span><span>${uPerPalU}</span></div>`;
      if (!isLast) {
        html += `<div class="cl-cell cl-cell-amber-light"><span style="font-size:10px">${uIcon}</span><span>${uPerPalU}</span></div>`;
      }
      html += `</div>`;
    }
    html += '</div></div>';
    html += `<div class="cl-level-sum cl-level-sum-amber">${palU} × ${uPerPalU} = <strong>${totalU} ${uName}</strong></div></div>`;
  } else {
    html += `<div class="cl-no-upper">Keine obere Ebene (${preset.note || preset.label})</div>`;
  }
  html += '</div>';

  viz.innerHTML = html;

  if (sum) sum.innerHTML = `Gesamt: ${palL + palU} Paletten (Europal. 120×80) = <span style="color:var(--accent);font-size:15px;font-weight:800">${total} ${uName}</span> &nbsp;|&nbsp; Unten: ${totalL} &nbsp;|&nbsp; Oben: ${totalU} &nbsp;|&nbsp; Höhe: ${fnum(spec.hgt, 2)} m`;
}

// ============================================================
// SCHNELL-EMPFEHLUNG (Eckdaten → Container-Vorschlag)
// ============================================================
function runContainerRecommend() {
  const pallets = parseInt(document.getElementById('fRecPallets')?.value) || 0;
  const weight = parseFloat(document.getElementById('fRecWeight')?.value) || 0;
  const volumeM3 = parseFloat(document.getElementById('fRecVolume')?.value) || 0;
  const transport = document.getElementById('fRecTransport')?.value || 'sea';
  const out = document.getElementById('recResult');
  if (!out) return;
  const rec = recommendContainer({ pallets, weight, volumeM3, transport });
  if (!rec) {
    out.style.display = 'none';
    return;
  }
  out.style.display = '';
  const fillBar = rec.fillPct != null
    ? `<div class="rec-fillbar"><div style="width:${Math.min(100, rec.fillPct)}%;background:${rec.fits ? 'var(--accent-green)' : 'var(--danger)'}"></div></div>`
    : '';
  const altInfo = rec.alternatives && rec.alternatives.length
    ? `<div style="font-size:11px;color:var(--text-3);margin-top:4px">Alternativen: ${rec.alternatives.join(' · ')}</div>` : '';
  out.innerHTML = `<div style="font-weight:700;margin-bottom:4px">${rec.fits ? '📦' : '⚠️'} Container-Empfehlung</div>
    <div style="color:var(--text-2)">${escapeHtml(rec.note)}</div>
    ${fillBar}${altInfo}`;
}
