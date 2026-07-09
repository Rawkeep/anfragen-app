// ============================================================
// ANFRAGEN-LISTE — Rendering, KPIs, Status-Ops, Export/Import
// Extrahiert aus EAP (render-views.js + inquiry-status-ops.js)
// ============================================================

var fInq = 'all'; // aktiver Status-Filter

// Migration: alte EAP-Status auf Workflow-Status heben
(function () {
  let migrated = false;
  inquiries.forEach(i => {
    const m = migrateStatus(i.status);
    if (m !== i.status) { i.status = m; migrated = true; }
  });
  if (migrated) save();
})();

function _inqAddHistory(inquiry, action, extra) {
  if (!inquiry.history) inquiry.history = [];
  inquiry.history.push(Object.assign({ action, at: new Date().toISOString() }, extra || {}));
}

function transIcon(t) {
  return t === 'air' ? '✈️' : t === 'sea' ? '🚢' : t === 'road' ? '🚚' : '—';
}

function statusBadge(s) {
  const meta = STATUS_META[s] || { label: s, cls: '' };
  const title = meta.hint ? ' title="' + escapeAttr(t(meta.hint)) + '"' : '';
  return `<span class="badge ${meta.cls}"${title}>${escapeHtml(t(meta.label))}</span>`;
}

// Aktionen je Rolle & Workflow-Schritt
function _roleActions(i) {
  const acts = [];
  acts.push(`<button class="btn btn-ghost btn-icon sm" data-click="openInquiryModal('${i.id}')" title="${escapeAttr(t('Öffnen'))}">✏️</button>`);
  if (currentRole === 'aussendienst') {
    if (i.status === 'entwurf') {
      acts.push(`<button class="btn btn-primary btn-sm" data-click="sendToInnendienst('${i.id}')">${t('✉️ An Innendienst')}</button>`);
    }
    if (i.status === 'beantwortet') {
      acts.push(`<button class="btn btn-accent btn-sm" data-click="acceptInquiry('${i.id}')">${t('✓ Angenommen')}</button>`);
      acts.push(`<button class="btn btn-ghost btn-icon sm" data-click="rejectInquiry('${i.id}')" title="${escapeAttr(t('Abgelehnt'))}" style="color:var(--danger)">✕</button>`);
    }
  } else if (currentRole === 'innendienst') {
    if (i.status === 'neu') {
      acts.push(`<button class="btn btn-primary btn-sm" data-click="forwardToTransport('${i.id}')">${t('→ An Transport')}</button>`);
    }
    if (i.status === 'kalkuliert') {
      acts.push(`<button class="btn btn-ghost btn-sm" data-click="openInquiryModalTab('${i.id}','proforma')">${t('🧾 Proforma')}</button>`);
      acts.push(`<button class="btn btn-primary btn-sm" data-click="sendFeedbackToField('${i.id}')">${t('✉️ Rückmeldung')}</button>`);
    }
    if (['entwurf', 'neu', 'transport', 'kalkuliert', 'beantwortet'].includes(i.status)) {
      acts.push(`<button class="btn btn-ghost btn-icon sm" data-click="rejectInquiry('${i.id}')" title="${escapeAttr(t('Abgelehnt'))}" style="color:var(--danger)">✕</button>`);
    }
  } else if (currentRole === 'transport') {
    if (i.status === 'transport') {
      acts.push(`<button class="btn btn-ghost btn-sm" data-click="generateCarrierRFQ('${i.id}')">${t('🚚 Speditions-Anfrage')}</button>`);
      acts.push(`<button class="btn btn-ghost btn-sm" data-click="openInquiryModalTab('${i.id}','angebote')">${t('💰 Angebote')}</button>`);
      acts.push(`<button class="btn btn-primary btn-sm" data-click="handFreightToInnendienst('${i.id}')">${t('→ Fracht an Innendienst')}</button>`);
    }
  }
  if (currentRole === 'innendienst' || (currentRole === 'aussendienst' && i.status === 'entwurf')) {
    acts.push(`<button class="btn btn-ghost btn-icon sm" data-click="deleteInq('${i.id}')" title="Dauerhaft löschen" style="color:var(--danger)">🗑</button>`);
  }
  return acts.join('');
}

function openInquiryModalTab(id, tab) {
  openInquiryModal(id);
  const btnMap = { basis: 'inqTabBasis', artikel: 'inqTabArtikel', angebote: 'inqTabAngebote', verlauf: 'inqTabVerlauf' };
  showInqTab(tab, document.getElementById(btnMap[tab] || 'inqTabBasis'));
}

function setInqFilter(s, el) {
  fInq = s;
  document.querySelectorAll('#inqTabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInq(document.getElementById('inqSearch')?.value || '');
}

function filterInquiries(v) { renderInq(v); }

function renderInq(search = '') {
  let list = inquiries;
  if (fInq !== 'all') list = list.filter(i => i.status === fInq);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(i => ((i.customer || '') + (i.country || '') + (i.number || '') + (i.articleCode || '') + (i.destinationCity || '')).toLowerCase().includes(q));
  }
  // Neueste zuerst
  list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const tbody = document.getElementById('inqTbody');
  if (!tbody) return;
  tbody.innerHTML = list.map(i => {
    const offers = (i.freightRequests || []).filter(o => parseFloat(o.price) > 0);
    const bestOffer = offers.length > 0 ? [...offers].sort((a, b) => a.price - b.price)[0] : null;
    const calcInfo = i.calculation?.type === 'palletized' ? `${i.calculation.pallets} Pal.` : i.calculation?.type === 'loose' ? `${i.calculation.qty || ''} lose` : '';
    const expiredCount = offers.filter(o => o.validUntil && new Date(o.validUntil) < new Date()).length;
    const prioIcon = i.priority === 'dringend' ? '<span title="Dringend">🔴</span> ' : i.priority === 'hoch' ? '<span title="Hoch">🟡</span> ' : '';
    const rejInfo = i.status === 'rejected' && i.rejectionReason ? ' title="' + escapeAttr(i.rejectionReason + (i.rejectionNote ? ': ' + i.rejectionNote : '')) + '"' : '';
    return `<tr${i.priority === 'dringend' && i.status === 'open' ? ' style="background:rgba(239,68,68,.04)"' : ''}>
      <td>${prioIcon}<strong>${escapeHtml(i.number)}</strong></td>
      <td>${fd(i.createdAt)}</td>
      <td>${escapeHtml(i.customer)}</td>
      <td>${escapeHtml(i.country)}${i.destinationCity ? '<br><span style="font-size:10px;color:var(--text-3)">' + escapeHtml(i.destinationCity) + '</span>' : ''}</td>
      <td>${escapeHtml(i.incoterm || '')}</td>
      <td style="white-space:nowrap">${transIcon(i.transport)}${i.dg ? ' <span style="color:var(--danger);font-weight:700;font-size:10px">DG</span>' : ''}${i.articleCode ? '<br><span style="font-size:10px;color:var(--text-3)">' + escapeHtml(i.articleCode) + '</span>' : ''}</td>
      <td style="font-size:11.5px;white-space:nowrap">${calcInfo ? '<span style="font-size:10px;color:var(--brand);font-weight:600">' + escapeHtml(calcInfo) + '</span><br>' : ''}${currentRole === 'transport' ? escapeHtml(i.spediteur || '—') : ''}</td>
      <td>${offers.length > 0 ? `<span style="font-size:10px;color:var(--accent);font-weight:600">${offers.length} Ang.</span>${expiredCount ? '<br><span style="font-size:9px;color:var(--danger);font-weight:600">' + expiredCount + ' verfallen</span>' : ''}${bestOffer ? '<br><span style="font-size:10px">' + t('ab') + ' ' + fc(bestOffer.price) + '</span>' : ''}` : '<span style="font-size:10px;color:var(--text-3)">—</span>'}</td>
      <td><span class="markup">${i.markupPercent || 30}%</span></td>
      <td>${fc(i.costPrice)}</td>
      <td><strong>${i.sellPrice ? fc(i.sellPrice) : '—'}</strong>${i.offerValidUntil && ['beantwortet', 'angenommen', 'abgelehnt'].includes(i.status) ? '<br><span style="font-size:9px;color:var(--text-3)">' + t('gültig bis') + ' ' + fd(i.offerValidUntil) + '</span>' : ''}</td>
      <td${rejInfo}>${statusBadge(i.status)}${i.status === 'abgelehnt' && i.rejectionReason ? '<br><span style="font-size:9px;color:var(--text-3)">' + escapeHtml(i.rejectionReason) + '</span>' : ''}</td>
      <td style="white-space:nowrap"><div style="display:flex;gap:4px;align-items:center">${_roleActions(i)}</div></td>
    </tr>`;
  }).join('');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:48px;color:var(--text-3)">
      <div style="font-size:36px;margin-bottom:8px">📋</div>
      <div style="font-weight:700;margin-bottom:4px">${t(search ? 'Keine Treffer' : 'Noch keine Anfragen')}</div>
      <div style="font-size:12px;margin-bottom:14px">${t(search ? 'Versuche einen anderen Suchbegriff' : 'Erstelle deine erste Anfrage')}</div>
      ${search ? '' : '<button class="btn btn-primary" data-click="openInquiryModal()">' + t('+ Neue Anfrage') + '</button>'}
    </td></tr>`;
  }
  renderInqKPIs();
  renderRoleWorkspace();
}

// ═══ KPI-LEISTE ═══
function renderInqKPIs() {
  var bar = document.getElementById('inqKpiBar');
  if (!bar) return;
  var total = inquiries.length;
  if (!total) { bar.innerHTML = ''; return; }
  var neu = 0, beiTransport = 0, kalkuliert = 0, beantwortet = 0, converted = 0, dringend = 0;
  var totalSell = 0, totalCost = 0, daysToQuote = [];
  var now = Date.now();
  var expiredOffers = 0;
  for (var idx = 0; idx < total; idx++) {
    var inq = inquiries[idx];
    if (inq.status === 'neu') neu++;
    else if (inq.status === 'transport') beiTransport++;
    else if (inq.status === 'kalkuliert') kalkuliert++;
    else if (inq.status === 'beantwortet') beantwortet++;
    else if (inq.status === 'angenommen') converted++;
    if (inq.priority === 'dringend' && !['angenommen', 'abgelehnt'].includes(inq.status)) dringend++;
    if (inq.sellPrice) totalSell += inq.sellPrice;
    if (inq.costPrice) totalCost += inq.costPrice;
    if (inq.status !== 'neu' && inq.createdAt && inq.updatedAt) {
      var diff = (new Date(inq.updatedAt) - new Date(inq.createdAt)) / 86400000;
      if (diff >= 0 && diff < 365) daysToQuote.push(diff);
    }
    var offers = inq.freightRequests || [];
    for (var oi = 0; oi < offers.length; oi++) {
      if (offers[oi].validUntil && new Date(offers[oi].validUntil).getTime() < now) expiredOffers++;
    }
  }
  var convRate = total > 0 ? Math.round(converted / total * 100) : 0;
  var avgDays = daysToQuote.length ? (daysToQuote.reduce(function (a, b) { return a + b }, 0) / daysToQuote.length).toFixed(1) : '—';
  var margin = totalSell - totalCost;
  var _k = function (label, value, color, sub) {
    return '<div class="kpi-card">' +
      '<div class="kpi-label">' + escapeHtml(label) + '</div>' +
      '<div class="kpi-value" style="color:' + color + '">' + escapeHtml(String(value)) + '</div>' +
      (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') + '</div>';
  };
  bar.innerHTML = _k(t('Gesamt'), total, 'var(--text)', neu + ' ' + t('neu')) +
    _k(t('In Bearbeitung'), beiTransport + kalkuliert, 'var(--accent)', beiTransport + ' Transport · ' + kalkuliert + ' ' + t('kalkuliert')) +
    _k(t('Beantwortet'), beantwortet, 'var(--warning)', t('warten auf Kunde')) +
    _k(t('Conversion'), convRate + '%', convRate > 30 ? 'var(--accent-green)' : 'var(--accent)', converted + ' ' + t('angenommen')) +
    _k(t('Ø Tage bis Rückmeldung'), avgDays, 'var(--accent)', '') +
    (currentRole === 'transport' ? _k(t('Marge (gesamt)'), fc(margin), margin > 0 ? 'var(--accent-green)' : 'var(--danger)', escapeHtml(fc(totalSell)) + ' ' + t('VK')) : '') +
    (dringend > 0 ? _k(t('Dringend'), dringend, 'var(--danger)', t('in Bearbeitung')) : '') +
    (expiredOffers > 0 ? _k(t('Verfallene Angebote'), expiredOffers, 'var(--danger)', t('Offers abgelaufen')) : '');
}

// ═══ STATUS-OPERATIONEN ═══
function updateInqStatus(id, s) {
  const i = inquiries.find(x => String(x.id) === String(id));
  if (i) {
    _inqAddHistory(i, s);
    i.status = s;
    i.updatedAt = new Date().toISOString();
    save();
    renderInq(document.getElementById('inqSearch')?.value || '');
  }
}

function acceptInquiry(id) {
  updateInqStatus(id, 'angenommen');
  const i = inquiries.find(x => String(x.id) === String(id));
  // Finale Rückmeldung: Außendienst meldet Kundenentscheidung an Innendienst
  if (i && currentRole === 'aussendienst') {
    sendFinalFeedback(i, 'angenommen');
    toast(_lang === 'en' ? '✅ Accepted — final feedback for Inside Sales generated' : '✅ Angenommen — finale Rückmeldung an Innendienst generiert');
  } else {
    toast(t('Angenommen') + ': ' + (i ? i.number : ''));
  }
}

function deleteInq(id) {
  if (!confirm('Anfrage löschen?')) return;
  inquiries = inquiries.filter(i => String(i.id) !== String(id));
  save();
  renderInq(document.getElementById('inqSearch')?.value || '');
}

// Hinweis: Das Angebot (VK + Gültigkeit) an den Außendienst sendet jetzt
// das Team Transport über sendQuoteToField() in roles.js.

// ── Ablehnung mit Begründung ──
function rejectInquiry(id) {
  var i = inquiries.find(function (x) { return String(x.id) === String(id); });
  if (!i) return;
  var overlay = document.getElementById('mInqReject');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'mInqReject';
    overlay.innerHTML = '<div class="modal" style="max-width:440px"></div>';
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.modal').innerHTML =
    '<div class="modal-title">' + t('Anfrage ablehnen') + '</div>' +
    '<p style="font-size:13px;margin-bottom:12px"><strong>' + escapeHtml(i.number) + '</strong> — ' + escapeHtml(i.customer) + ' → ' + escapeHtml(i.country) + '</p>' +
    '<div class="form-group"><label class="form-label">' + t('Ablehnungsgrund') + '</label>' +
    '<select class="form-select" id="fRejectReason"><option value="">' + t('— Wählen —') + '</option>' +
    '<option value="preis">' + t('Preis zu hoch') + '</option><option value="transit">' + t('Transitzeit zu lang') + '</option>' +
    '<option value="kapazitaet">' + t('Keine Kapazität') + '</option><option value="kunde">' + t('Kunde abgesprungen') + '</option>' +
    '<option value="konkurrenz">' + t('Konkurrenzangebot angenommen') + '</option><option value="sonstiges">' + t('Sonstiges') + '</option></select></div>' +
    '<div class="form-group"><label class="form-label">' + t('Bemerkung (optional)') + '</label><textarea class="form-textarea" id="fRejectNote" rows="2"></textarea></div>' +
    '<div class="form-footer"><button class="btn btn-ghost" data-click="closeM(\'mInqReject\')">' + t('Abbrechen') + '</button>' +
    '<button class="btn btn-danger" data-click="confirmRejectInquiry(\'' + i.id + '\')">' + t('Ablehnen') + '</button></div>';
  openM('mInqReject');
}

function confirmRejectInquiry(id) {
  var i = inquiries.find(function (x) { return String(x.id) === String(id); });
  if (!i) return;
  var reason = document.getElementById('fRejectReason')?.value || '';
  var note = document.getElementById('fRejectNote')?.value?.trim() || '';
  i.status = 'abgelehnt';
  i.rejectionReason = reason;
  i.rejectionNote = note;
  i.rejectedAt = new Date().toISOString();
  i.updatedAt = new Date().toISOString();
  _inqAddHistory(i, 'rejected', { reason: reason, note: note });
  save();
  closeM('mInqReject');
  renderInq(document.getElementById('inqSearch')?.value || '');
  // Finale Rückmeldung: Außendienst meldet Ablehnung an Innendienst
  if (currentRole === 'aussendienst') {
    const reasonLabels = { preis: 'Preis zu hoch', transit: 'Transitzeit zu lang', kapazitaet: 'Keine Kapazität', kunde: 'Kunde abgesprungen', konkurrenz: 'Konkurrenzangebot angenommen', sonstiges: 'Sonstiges' };
    sendFinalFeedback(i, 'abgelehnt', t(reasonLabels[reason] || reason), note);
    toast(_lang === 'en' ? '❌ Rejected — final feedback for Inside Sales generated' : '❌ Abgelehnt — finale Rückmeldung an Innendienst generiert');
  } else {
    toast(t('Anfrage ablehnen') + ': ' + i.number);
  }
}

// ═══ EXPORT / IMPORT (JSON — kompatibel zu EAP eapInquiriesV11) ═══
function exportInquiriesJSON() {
  const blob = new Blob([JSON.stringify(inquiries, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'anfragen-export-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Export erstellt: ' + inquiries.length + ' Anfragen');
}

function importInquiriesJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) { toast('Ungültiges Format: JSON-Array erwartet', 'error'); return; }
        let added = 0, skipped = 0;
        data.forEach(rec => {
          if (!rec || !rec.customer) { skipped++; return; }
          if (rec.id && inquiries.some(i => String(i.id) === String(rec.id))) { skipped++; return; }
          inquiries.push(Object.assign({}, rec, {
            id: rec.id || gid(),
            status: migrateStatus(rec.status || 'neu'),
            createdAt: rec.createdAt || new Date().toISOString(),
            number: rec.number || ('INQ-' + (_nextInqNr()).toString().padStart(4, '0'))
          }));
          added++;
        });
        save();
        renderInq();
        toast(added + ' Anfragen importiert' + (skipped ? ', ' + skipped + ' übersprungen (Duplikat/ungültig)' : ''));
      } catch (e) {
        toast('Import fehlgeschlagen: ' + e.message, 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
