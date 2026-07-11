// ============================================================
// ANFRAGEN CRUD + TAB-NAVIGATION — Extrahiert aus EAP
// Persistenz: localStorage 'eapInquiriesV11' (kompatibel zu EAP)
// ============================================================

const SK_INQ = 'eapInquiriesV11';
var inquiries = lsGet(SK_INQ, []);
if (!Array.isArray(inquiries)) inquiries = [];

function save() {
  lsSet(SK_INQ, inquiries);
}

function _nextInqNr() {
  let max = 0;
  inquiries.forEach(i => {
    const m = /^INQ-(\d+)$/.exec(i.number || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max + 1;
}

function openInquiryModal(id) {
  populateCountrySelect('fInqCountry');
  showInqTab('basis', document.getElementById('inqTabBasis'));
  if (id) {
    const i = inquiries.find(x => String(x.id) === String(id));
    if (!i) return;
    document.getElementById('mInqTitle').textContent = 'Anfrage bearbeiten — ' + (i.number || '');
    document.getElementById('editInqId').value = id;
    document.getElementById('fInqCustomer').value = i.customer;
    document.getElementById('fInqCountry').value = i.country;
    document.getElementById('fInqIncoterm').value = i.incoterm;
    document.getElementById('fInqTransport').value = i.transport;
    document.getElementById('fInqDG').value = i.dg ? 'yes' : 'no';
    // Gefahrgut-Positionen laden (Katalog-basiert)
    _inqDgItems = JSON.parse(JSON.stringify(i.dgItems || []));
    dgRenderItems();
    document.getElementById('fInqCost').value = i.costPrice || '';
    document.getElementById('fInqSpediteur').value = i.spediteur || i.spediteurCustom || '';
    if (i.markupPercent && ![10, 15, 30].includes(i.markupPercent)) {
      document.getElementById('fInqMarkup').value = 'custom';
      document.getElementById('fInqMarkupCustom').value = i.markupPercent;
    } else {
      document.getElementById('fInqMarkup').value = i.markupPercent || 30;
    }
    toggleCustomMarkup();
    document.getElementById('fInqSell').value = i.sellPrice || '';
    document.getElementById('fInqWeight').value = i.weight || '';
    document.getElementById('fInqVolume').value = i.volume || '';
    document.getElementById('fInqRefNr').value = i.referenceNumber || '';
    document.getElementById('fInqNotes').value = i.notes || '';
    document.getElementById('fInqPriority').value = i.priority || 'normal';
    document.getElementById('fInqDestCity').value = i.destinationCity || '';
    document.getElementById('fInqWunschtermin').value = i.wunschtermin || '';
    // Artikel & Berechnung (Multi-Artikel laden)
    _inqArticles = [];
    if (i.articles && i.articles.length) {
      i.articles.forEach(a => _inqArticles.push({ id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), artNr: a.artNr || '', artName: a.artName || '', code: a.code, mode: a.mode || 'qty', qty: a.qty || '', netto: a.netto || '', unitPrice: a.unitPrice || '' }));
    } else if (i.articleCode && INQ_PRODUCTS[i.articleCode]) {
      // Legacy-Einzelartikel-Format
      _inqArticles.push({ id: 'legacy', artNr: '', artName: '', code: i.articleCode, mode: i.netWeight > 0 && !i.quantity ? 'netto' : 'qty', qty: i.quantity || '', netto: i.netWeight || '' });
    }
    inqRenderArticles();
    inqCalcAll();
    toggleInqDGPanel();
    filterIncotermsByTransport();
    // Angebote laden
    _inqOffers = JSON.parse(JSON.stringify(i.freightRequests || []));
    renderInqOffers();
    onInqCountryChange();
  } else {
    document.getElementById('mInqTitle').textContent = 'Neue Frachtanfrage';
    document.getElementById('editInqId').value = '';
    ['fInqCustomer', 'fInqRefNr', 'fInqCost', 'fInqSell', 'fInqWeight', 'fInqVolume', 'fInqNotes', 'fInqSpediteur', 'fInqMarkupCustom', 'fInqDestCity', 'fInqWunschtermin'].forEach(f => {
      const el = document.getElementById(f); if (el) el.value = '';
    });
    _inqDgItems = [];
    dgRenderItems();
    document.getElementById('fInqCountry').value = '';
    document.getElementById('fInqIncoterm').value = '';
    document.getElementById('fInqTransport').value = '';
    document.getElementById('fInqDG').value = 'no';
    document.getElementById('fInqMarkup').value = '30';
    document.getElementById('fInqPriority').value = 'normal';
    toggleCustomMarkup();
    _inqArticles = [];
    inqRenderArticles();
    _inqOffers = [];
    renderInqOffers();
    toggleInqDGPanel();
    document.getElementById('inqCountryInfo').style.display = 'none';
    document.getElementById('inqCalcResult').style.display = 'none';
    filterIncotermsByTransport();
  }
  openM('mInquiry');
  applyRoleFieldRules();
}

// ── Rollentrennung im Modal ──
// Transport: Ladungs-/Kundendaten nur lesen (Kernbereich = Angebote);
// Außendienst: Preisfelder sind per CSS ausgeblendet.
function applyRoleFieldRules() {
  const readOnly = currentRole === 'transport';
  const fields = ['fInqCustomer', 'fInqRefNr', 'fInqCountry', 'fInqDestCity', 'fInqPriority',
    'fInqWunschtermin', 'fInqTransport', 'fInqIncoterm', 'fInqDG', 'fInqNotes', 'fInqWeight', 'fInqVolume'];
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.disabled = readOnly;
  });
  document.querySelectorAll('#inqPanelArtikel input, #inqPanelArtikel select, #inqDGList input, #inqDGList select')
    .forEach(el => { el.disabled = readOnly; });
  // VK-Feld: nur Transport steuert es; Innendienst sieht es nur (read-only)
  const vk = document.getElementById('fInqSell');
  if (vk) vk.readOnly = currentRole !== 'transport';
  const banner = document.getElementById('inqRoleBanner');
  if (banner) {
    if (readOnly) {
      banner.style.display = '';
      banner.textContent = t('Nur-Lese-Ansicht der Ladungsdaten — Angebote im Tab „Angebote" erfassen und an den Innendienst übergeben.');
    } else {
      banner.style.display = 'none';
    }
  }
}

function toggleInqDGPanel() {
  const isDG = document.getElementById('fInqDG').value === 'yes';
  const wrap = document.getElementById('inqDGPanel');
  if (wrap) wrap.style.display = isDG ? '' : 'none';
  // Abfrage „Ja" → direkt erste Position anlegen, damit nur noch gewählt werden muss
  if (isDG && !_inqDgItems.length) dgAddItem();
}

function saveInquiry() {
  const customer = document.getElementById('fInqCustomer').value.trim();
  const country = document.getElementById('fInqCountry').value;
  const incoterm = document.getElementById('fInqIncoterm').value;
  const transport = document.getElementById('fInqTransport').value;
  if (!customer || !country || !incoterm || !transport) { toast('Bitte alle Pflichtfelder ausfüllen!', 'error'); return; }
  // Incoterm-Transport-Validierung (Incoterms 2020)
  if (_SEA_ONLY_INCOTERMS.indexOf(incoterm) >= 0 && transport !== 'sea') {
    toast(incoterm + ' ist nur für Seefracht gültig (Incoterms 2020)!', 'error'); return;
  }
  // Gefahrgut-Validierung: mindestens eine Position mit UN-Nummer
  if (document.getElementById('fInqDG').value === 'yes' && !_inqDgItems.some(d => d.un)) {
    toast(t('Gefahrgut: Bitte mindestens eine Position aus dem Katalog wählen!'), 'error'); return;
  }
  const costPrice = parseFloat(document.getElementById('fInqCost').value) || 0;
  const markupSel = document.getElementById('fInqMarkup').value;
  const markupPercent = markupSel === 'custom' ? (parseFloat(document.getElementById('fInqMarkupCustom').value) || 0) : (parseInt(markupSel) || 30);
  const sellPrice = Math.round(costPrice * (1 + markupPercent / 100) * 100) / 100;
  const editId = document.getElementById('editInqId').value;
  // Artikel & Berechnung (Multi-Artikel)
  const articles = _inqArticles.filter(a => a.code && INQ_PRODUCTS[a.code]).map(a => {
    const q = parseInt(a.qty) || 0;
    const n = parseFloat(a.netto) || 0;
    const calc = a.mode === 'netto' && n > 0 ? (calcFromNetWeight(a.code, n) || {}) : (q > 0 ? (calcPalletsInline(a.code, q) || {}) : {});
    // Artikel-Nr. in den Katalog übernehmen (für spätere Auswahl)
    if ((a.artNr || '').trim()) ArtikelKatalog.upsert(a.artNr, a.artName, a.code);
    return { artNr: (a.artNr || '').trim(), artName: (a.artName || '').trim(), code: a.code, mode: a.mode, qty: calc.qty || q, netto: n, unitPrice: parseFloat(a.unitPrice) || 0, calculation: calc };
  });
  const articleCode = articles.length === 1 ? articles[0].code : (articles.length > 1 ? articles.map(a => a.code).join('+') : '');
  const totalCalcResults = articles.filter(a => a.calculation && a.calculation.type);
  let calculation = {};
  if (totalCalcResults.length === 1) {
    calculation = totalCalcResults[0].calculation;
  } else if (totalCalcResults.length > 1) {
    calculation = {
      type: totalCalcResults.every(r => r.calculation.type === 'loose') ? 'loose' : 'palletized',
      pallets: totalCalcResults.reduce((s, r) => s + (r.calculation.pallets || 0), 0),
      grossWeight: Math.round(totalCalcResults.reduce((s, r) => s + (r.calculation.grossWeight || 0), 0) * 100) / 100,
      qty: totalCalcResults.reduce((s, r) => s + (r.calculation.qty || 0), 0),
      maxHeight: Math.max(...totalCalcResults.map(r => r.calculation.maxHeight || 0)),
      details: totalCalcResults.flatMap(r => r.calculation.details || []),
      multiArticle: true
    };
  }
  // product-Referenz aus calculation entfernen (zirkulär/groß für JSON)
  const cleanCalc = c => { const { product, ...rest } = c || {}; return rest; };
  calculation = cleanCalc(calculation);

  const netto = articles.reduce((s, a) => s + (a.netto || (a.qty * (INQ_PRODUCTS[a.code]?.fillWt || 0))), 0);
  const data = {
    customer, country, incoterm, transport,
    costPrice, markupPercent, sellPrice,
    priority: document.getElementById('fInqPriority').value || 'normal',
    spediteur: document.getElementById('fInqSpediteur').value.trim() || null,
    wunschtermin: document.getElementById('fInqWunschtermin').value || null,
    referenceNumber: document.getElementById('fInqRefNr').value.trim(),
    destinationCity: document.getElementById('fInqDestCity').value.trim(),
    weight: calculation.grossWeight || parseFloat(document.getElementById('fInqWeight').value) || 0,
    volume: parseFloat(document.getElementById('fInqVolume').value) || 0,
    notes: document.getElementById('fInqNotes').value,
    dg: document.getElementById('fInqDG').value === 'yes',
    dgItems: document.getElementById('fInqDG').value === 'yes'
      ? JSON.parse(JSON.stringify(_inqDgItems.filter(d => d.un)))
      : [],
    dgText: document.getElementById('fInqDG').value === 'yes' ? dgSummary(_inqDgItems) : '',
    articleCode,
    articles: articles.map(a => ({ artNr: a.artNr, artName: a.artName, code: a.code, mode: a.mode, qty: a.qty, netto: a.netto, unitPrice: a.unitPrice })),
    quantity: calculation.qty || 0,
    netWeight: netto,
    calculation,
    freightRequests: JSON.parse(JSON.stringify(_inqOffers || [])),
    containerRecommendation: window._inqLastContainerRec ? JSON.parse(JSON.stringify(window._inqLastContainerRec)) : null,
  };
  if (editId) {
    const idx = inquiries.findIndex(i => String(i.id) === String(editId));
    if (idx >= 0) {
      Object.assign(inquiries[idx], data, { updatedAt: new Date().toISOString() });
      _inqAddHistory(inquiries[idx], 'edited');
    }
  } else {
    // Duplikatschutz
    const dup = inquiries.find(i => i.customer === customer && i.country === country && i.incoterm === incoterm && !['angenommen', 'abgelehnt'].includes(i.status) && i.articleCode === articleCode);
    if (dup && !confirm(`Es existiert bereits eine laufende Anfrage für ${customer} nach ${country} (${dup.number}). Trotzdem erstellen?`)) return;
    const neu = {
      id: gid(), ...data,
      status: 'entwurf', // Staffelstart: liegt beim Außendienst, bis gesendet
      createdAt: new Date().toISOString(),
      history: [],
      number: 'INQ-' + (_nextInqNr()).toString().padStart(4, '0')
    };
    _inqAddHistory(neu, 'created');
    inquiries.push(neu);
  }
  try { save(); toast('✅ Anfrage gespeichert'); } catch (e) { toast('❌ Speichern fehlgeschlagen: ' + e.message, 'error'); return; }
  closeM('mInquiry');
  renderInq();
}

// ── Tab-Navigation im Modal ──
function showInqTab(tab, btn) {
  const panelMap = { basis: 'inqPanelBasis', artikel: 'inqPanelArtikel', proforma: 'inqPanelProforma', angebote: 'inqPanelAngebote', verlauf: 'inqPanelVerlauf' };
  ['basis', 'artikel', 'proforma', 'angebote', 'verlauf'].forEach(t => {
    const panel = document.getElementById(panelMap[t]);
    if (panel) panel.style.display = t === tab ? '' : 'none';
  });
  if (btn) {
    btn.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }
  if (tab === 'proforma' && typeof renderProformaPanel === 'function') renderProformaPanel();
  if (tab === 'verlauf') renderInqTimeline();
}

function renderInqTimeline() {
  const wrap = document.getElementById('inqTimeline');
  if (!wrap) return;
  const id = document.getElementById('editInqId').value;
  const i = id ? inquiries.find(x => String(x.id) === String(id)) : null;
  const hist = (i && i.history) || [];
  if (!hist.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px">Noch kein Verlauf.</div>';
    return;
  }
  const labels = {
    created: '📝 Erstellt', edited: '✏️ Bearbeitet', quoted: '✉️ Angeboten',
    accepted: '✅ Angenommen', rejected: '❌ Abgelehnt', open: '🔓 Wieder geöffnet',
    'email-sent': '✉️ E-Mail gesendet',
    'handoff-received': '📲 Per Übergabe-Link übernommen'
  };
  wrap.innerHTML = [...hist].reverse().map(h => `
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:12px">
      <span style="min-width:130px;color:var(--text-3)">${fd(h.at)} ${h.at ? new Date(h.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
      <span style="font-weight:600">${labels[h.action] || escapeHtml(h.action)}</span>
      ${h.reason ? '<span style="color:var(--text-2)">' + escapeHtml(h.reason) + (h.note ? ': ' + escapeHtml(h.note) : '') + '</span>' : ''}
    </div>`).join('');
}
