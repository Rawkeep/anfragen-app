// ============================================================
// ROLLEN & WORKFLOW — Sales-Support-Kette
// Außendienst → Innendienst → Team Transport → Innendienst → Außendienst
// Übergaben: Status-Wechsel + generierte E-Mails (mailto, DE/EN)
// ============================================================

const ROLES = {
  aussendienst: { label: 'Außendienst', icon: '🧑‍💼' },
  innendienst: { label: 'Innendienst', icon: '🏢' },
  transport: { label: 'Team Transport', icon: '🚚' }
};

// ── Workflow-Status = Staffelstab-Positionen ──
// entwurf     → Außendienst erfasst, Stab noch beim Außendienst (senden)
// neu         → an Innendienst gesendet, Stab beim Innendienst (weiterleiten)
// transport   → an Team Transport weitergeleitet, Stab bei Transport (Fracht)
// kalkuliert  → Frachtkosten ermittelt, Stab zurück beim Innendienst (antworten)
// beantwortet → Rückmeldung an Außendienst, Stab beim Außendienst (entscheiden)
// angenommen / abgelehnt → Lauf geschlossen (Kundenentscheidung)
const STATUS_META = {
  entwurf:     { label: 'Entwurf',                cls: 'badge-draft',      hint: 'beim Außendienst — senden' },
  neu:         { label: 'Neu',                    cls: 'badge-open',       hint: 'beim Innendienst — weiterleiten' },
  transport:   { label: 'Bei Transport',          cls: 'badge-transport',  hint: 'Frachtkosten-Ermittlung läuft' },
  kalkuliert:  { label: 'Frachtkosten ermittelt', cls: 'badge-kalkuliert', hint: 'zurück beim Innendienst — antworten' },
  beantwortet: { label: 'Beantwortet',            cls: 'badge-quoted',     hint: 'beim Außendienst — Kundenentscheidung' },
  angenommen:  { label: 'Angenommen',             cls: 'badge-accepted',   hint: 'Lauf geschlossen' },
  abgelehnt:   { label: 'Abgelehnt',              cls: 'badge-rejected',   hint: 'Lauf geschlossen' }
};

// Migration alter EAP-Status → Workflow-Status (bestehende „neu" bleiben beim Innendienst)
const _STATUS_MIGRATION = { open: 'neu', quoted: 'beantwortet', accepted: 'angenommen', rejected: 'abgelehnt' };
function migrateStatus(s) { return STATUS_META[s] ? s : (_STATUS_MIGRATION[s] || 'neu'); }

// ── Staffelstab: Wer ist am Zug? ──
// Der Stab liegt immer bei genau EINER Station. Jede sieht nur, was sie
// zum Weiterreichen braucht; angenommen/abgelehnt = Lauf geschlossen.
const BATON = {
  entwurf: 'aussendienst',
  neu: 'innendienst',
  transport: 'transport',
  kalkuliert: 'innendienst', // Fracht-VK liegt vor → Innendienst ergänzt Warenwert + antwortet
  beantwortet: 'aussendienst'
};
function batonHolder(status) { return BATON[status] || null; }
function isMyTurn(i) { return batonHolder(i.status) === currentRole; }
function isClosed(i) { return i.status === 'angenommen' || i.status === 'abgelehnt'; }
function nextStationLabel(status) {
  const h = batonHolder(status);
  return h ? t(ROLES[h].label) : t('abgeschlossen');
}

// Staffel-Kette: 6 Stationen, Lauf kehrt zum Start zurück und schließt sich.
// AD → ID → Transport → ID → AD → 🏁
const RELAY = [
  { icon: '🧑‍💼', title: 'Außendienst — erfassen' },
  { icon: '🏢', title: 'Innendienst — prüfen' },
  { icon: '🚚', title: 'Transport — Fracht' },
  { icon: '🏢', title: 'Innendienst — VK/Antwort' },
  { icon: '🧑‍💼', title: 'Außendienst — Entscheidung' },
  { icon: '🏁', title: 'Abschluss' }
];
const RELAY_STAGE = { entwurf: 0, neu: 1, transport: 2, kalkuliert: 3, beantwortet: 4, angenommen: 5, abgelehnt: 5 };

function relayChainHtml(status) {
  const active = RELAY_STAGE[status] ?? 0;
  const closed = status === 'angenommen' || status === 'abgelehnt';
  return '<span class="relay-chain" aria-label="Staffel-Position">' + RELAY.map((s, idx) => {
    let cls = 'relay-dot';
    if (idx < active) cls += ' relay-done';
    else if (idx === active) cls += closed ? ' relay-closed' : ' relay-active';
    return `<span class="${cls}" title="${escapeAttr(s.title)}">${s.icon}</span>`;
  }).join('<span class="relay-line"></span>') + '</span>';
}

// ── Aktive Rolle (localStorage) ──
var currentRole = lsGet('anfragenRole', 'innendienst');
if (!ROLES[currentRole]) currentRole = 'innendienst';

function setRole(r) {
  if (!ROLES[r]) return;
  currentRole = r;
  lsSet('anfragenRole', r);
  applyRoleUI();
  // Sinnvoller Standard-Filter je Rolle
  fInq = r === 'transport' ? 'transport' : 'all';
  syncFilterTabs();
  renderInq(document.getElementById('inqSearch')?.value || '');
}

function applyRoleUI() {
  document.body.className = 'role-' + currentRole;
  const sel = document.getElementById('roleSelect');
  if (sel) sel.value = currentRole;
  const hint = document.getElementById('roleHint');
  if (hint) {
    const hints = {
      aussendienst: 'Artikel & Menge wählen → Anfrage an Innendienst senden',
      innendienst: 'Prüfen → an Transport weiterleiten → Warenwert/Proforma ergänzen → Rückmeldung an Außendienst',
      transport: 'Frachtkosten ermitteln → Fracht-VK an Innendienst übergeben'
    };
    hint.textContent = t(hints[currentRole] || '');
  }
}

function syncFilterTabs() {
  document.querySelectorAll('#inqTabs .tab').forEach(tb => {
    tb.classList.toggle('active', tb.dataset.filter === fInq);
  });
}

// ── Einstellungen (Absender, Team-Adressen, Abgangsort) ──
var appSettings = lsGet('anfragenSettings', {
  senderName: '', innendienstEmail: '', transportEmail: '', aussendienstEmail: '', abgangsort: ''
});

function openSettingsModal() {
  document.getElementById('fSetSender').value = appSettings.senderName || '';
  document.getElementById('fSetInnendienst').value = appSettings.innendienstEmail || '';
  document.getElementById('fSetTransport').value = appSettings.transportEmail || '';
  document.getElementById('fSetAussendienst').value = appSettings.aussendienstEmail || '';
  document.getElementById('fSetAbgang').value = appSettings.abgangsort || '';
  openM('mSettings');
}

function saveSettings() {
  appSettings = {
    senderName: document.getElementById('fSetSender').value.trim(),
    innendienstEmail: document.getElementById('fSetInnendienst').value.trim(),
    transportEmail: document.getElementById('fSetTransport').value.trim(),
    aussendienstEmail: document.getElementById('fSetAussendienst').value.trim(),
    abgangsort: document.getElementById('fSetAbgang').value.trim()
  };
  lsSet('anfragenSettings', appSettings);
  closeM('mSettings');
  toast(t('Einstellungen gespeichert'));
}

// ============================================================
// MEIN BEREICH — Aufgaben-Workspace je Abteilung
// ============================================================
function _wsMeta(i) {
  const bits = [];
  if (i.incoterm) bits.push(escapeHtml(i.incoterm));
  bits.push(transIcon(i.transport));
  if (i.calculation?.pallets) bits.push(i.calculation.pallets + ' Pal. / ' + fnum(i.calculation.grossWeight || 0) + ' kg');
  if (i.wunschtermin) bits.push('📅 ' + fd(i.wunschtermin));
  if (i.priority === 'dringend') bits.push('<span style="color:var(--danger);font-weight:700">🔴 ' + t('Dringend') + '</span>');
  return bits.join(' &nbsp;·&nbsp; ');
}

function _wsSort(list) {
  return [...list].sort((a, b) =>
    (b.priority === 'dringend') - (a.priority === 'dringend') ||
    (a.createdAt || '').localeCompare(b.createdAt || ''));
}

// Aktions-Karte für „Am Zug" — nur was die Rolle zum Weiterreichen braucht
function _amZugCard(i) {
  let priceHtml = '', buttons = '';
  if (currentRole === 'aussendienst') {
    if (i.status === 'entwurf') {
      const sent = (i.history || []).some(h => h.action === 'email-sent');
      buttons = `<button class="btn btn-primary btn-sm" data-click="sendToInnendienst('${i.id}')">${t('✉️ An Innendienst')}${sent ? ' ↻' : ''}</button>`;
    } else if (i.status === 'beantwortet') {
      // Außendienst: nur der VK-Preis + Gültigkeit (keine internen Preisdaten)
      priceHtml = '<strong>' + t('VK') + ': ' + fc(i.sellPrice) + '</strong>' +
        (i.offerValidUntil ? ' &nbsp;·&nbsp; ' + t('gültig bis') + ' ' + fd(i.offerValidUntil) : '');
      buttons = `<button class="btn btn-accent btn-sm" data-click="acceptInquiry('${i.id}')">${t('✓ Angenommen')}</button>
        <button class="btn btn-danger btn-sm" data-click="rejectInquiry('${i.id}')">${t('✕ Abgelehnt')}</button>`;
    }
  } else if (currentRole === 'innendienst') {
    // Innendienst: koordiniert; bei „kalkuliert" Warenwert ergänzen + Rückmeldung
    if (i.status === 'neu') {
      buttons = `<button class="btn btn-primary btn-sm" data-click="forwardToTransport('${i.id}')">${t('→ An Transport')}</button>`;
    } else if (i.status === 'kalkuliert') {
      const goods = proformaGoods(i);
      priceHtml = t('Fracht (VK)') + ': <strong>' + fc(i.sellPrice) + '</strong>' +
        (goods ? ' &nbsp;·&nbsp; ' + t('Warenwert') + ': <strong>' + fc(goods) + '</strong>' : '');
      buttons = `<button class="btn btn-ghost btn-sm" data-click="openInquiryModalTab('${i.id}','proforma')">${t('🧾 Warenwert / Proforma')}</button>
        <button class="btn btn-primary btn-sm" data-click="sendFeedbackToField('${i.id}')">${t('✉️ Rückmeldung an Außendienst')}</button>`;
    }
  } else if (currentRole === 'transport') {
    if (i.status === 'transport') {
      const offers = (i.freightRequests || []).filter(o => parseFloat(o.price) > 0);
      const preis = i.costPrice
        ? t('EK') + ': <strong>' + fc(i.costPrice) + '</strong> → ' + t('VK') + ': <strong>' + fc(i.sellPrice) + '</strong>'
        : '';
      priceHtml = [offers.length ? '<strong>' + offers.length + ' ' + t('Angebote') + '</strong>' : '', preis].filter(Boolean).join(' &nbsp;·&nbsp; ');
      buttons = `<button class="btn btn-ghost btn-sm" data-click="generateCarrierRFQ('${i.id}')">${t('🚚 Speditions-Anfrage')}</button>
        <button class="btn btn-ghost btn-sm" data-click="openInquiryModalTab('${i.id}','angebote')">${t('💰 Angebote')}</button>
        <button class="btn btn-primary btn-sm" data-click="handFreightToInnendienst('${i.id}')">${t('→ Fracht an Innendienst')}</button>`;
    }
  }
  return `<div class="ws-card${i.priority === 'dringend' ? ' ws-card-urgent' : ''}">
    <div class="ws-card-head">
      <strong>${escapeHtml(i.number)}</strong>
      <span>${escapeHtml(i.customer)} → ${escapeHtml(i.country)}</span>
      ${statusBadge(i.status)}
    </div>
    ${relayChainHtml(i.status)}
    <div class="ws-card-meta">${_wsMeta(i)}${priceHtml ? ' &nbsp;·&nbsp; ' + priceHtml : ''}</div>
    <div class="ws-card-actions">
      <button class="btn btn-ghost btn-sm" data-click="openInquiryModal('${i.id}')">✏️ ${t('Öffnen')}</button>
      ${buttons}
    </div>
  </div>`;
}

// Tracking-Zeile für „Unterwegs" — Stab bei anderer Station, nur lesen,
// keine internen Preis-/Spediteur-Daten
function _unterwegsRow(i) {
  return `<div class="relay-track" data-click="openInquiryModal('${i.id}')">
    <strong>${escapeHtml(i.number)}</strong>
    <span class="relay-track-cust">${escapeHtml(i.customer)} → ${escapeHtml(i.country)}</span>
    ${relayChainHtml(i.status)}
    <span class="relay-track-wait">⏳ ${t('wartet auf')} <strong>${nextStationLabel(i.status)}</strong></span>
  </div>`;
}

function renderRoleWorkspace() {
  const wrap = document.getElementById('roleWorkspace');
  if (!wrap) return;
  const role = ROLES[currentRole];
  const active = inquiries.filter(i => !isClosed(i));
  const mine = _wsSort(active.filter(isMyTurn));
  const enRoute = _wsSort(active.filter(i => !isMyTurn(i)));

  // ── Lane „Am Zug": Stab bei mir ──
  let amZug = '';
  if (currentRole === 'aussendienst') {
    amZug += `<div class="ws-card ws-card-cta">
      <div class="ws-card-head"><strong>📝 ${t('Neue Anfrage erstellen')}</strong></div>
      <div class="ws-card-meta">${t('Artikel, Menge/Füllmenge und Packstück wählen — Paletten und Gewicht werden automatisch berechnet.')}</div>
      <div class="ws-card-actions"><button class="btn btn-primary" data-click="openInquiryModal()">${t('+ Neue Anfrage')}</button></div>
    </div>`;
  }
  amZug += mine.map(_amZugCard).join('');
  const amZugEmpty = !mine.length && currentRole !== 'aussendienst'
    ? `<div class="ws-empty">${t('Kein Staffelstab bei dir — nichts zu tun. 🎉')}</div>` : '';

  // ── Lane „Unterwegs": Stab bei anderen (Tracking) ──
  const enRouteHtml = enRoute.length
    ? `<div class="relay-lane">
        <h3 class="relay-lane-title">⏳ ${t('Unterwegs (bei anderen Stationen)')} <span class="ws-count muted">${enRoute.length}</span></h3>
        ${enRoute.map(_unterwegsRow).join('')}
      </div>` : '';

  wrap.innerHTML = `<div class="ws-head">
      <h2>${role.icon} ${t('Mein Bereich')} — ${t(role.label)}${mine.length ? ` <span class="ws-count">${mine.length}</span>` : ''}</h2>
      <span class="ws-lane-tag">⚡ ${t('Am Zug')}</span>
    </div>
    <div class="ws-grid">${amZug}</div>${amZugEmpty}${enRouteHtml}`;
}

// ============================================================
// E-MAIL-BAUSTEINE (DE/EN — folgt dem Sprachumschalter)
// ============================================================
function _transportLabel(tr) {
  return t(tr === 'air' ? 'Luftfracht' : tr === 'sea' ? 'Seefracht' : tr === 'road' ? 'Landtransport' : tr);
}

function _cargoBlock(i) {
  const en = _lang === 'en';
  const stk = en ? 'pcs' : 'Stk';
  const lines = [];
  (i.articles || []).forEach(a => {
    const p = INQ_PRODUCTS[a.code];
    if (!p) return;
    const mengeTxt = a.mode === 'netto' && a.netto
      ? a.netto + (en ? ' kg net (' : ' kg netto (') + a.qty + ' ' + stk + ')'
      : a.qty + ' ' + stk;
    // Exakte Artikel-Nr. + Bezeichnung (Außendienst), dann Gebinde für die Berechnung
    const artHead = [a.artNr, a.artName].filter(Boolean).join(' — ');
    if (artHead) lines.push('  ' + artHead);
    lines.push((artHead ? '    ' : '  ') + (en ? 'Packaging: ' : 'Gebinde: ') + a.code + ' — ' + p.name + ' (' + p.dim.l + 'x' + p.dim.w + 'x' + p.dim.h + ' mm): ' + mengeTxt);
  });
  const c = i.calculation || {};
  if (c.type === 'palletized') {
    lines.push('  ' + c.pallets + (en ? ' Euro pallets (120x80 cm), max. height ' : ' Europaletten (120x80 cm), max. Höhe ') + (c.maxHeight || '—') + ' cm');
    (c.details || []).forEach((d, idx) => {
      lines.push('    ' + (en ? 'Pallet ' : 'Palette ') + (idx + 1) + ': ' + d.pcs + ' ' + stk + ', ' + d.layers + (en ? ' layers, ' : ' Lagen, ') + d.height + ' cm');
    });
  } else if (c.type === 'loose') {
    lines.push('  ' + (en ? 'Loose shipment: ' : 'Lose Sendung: ') + (c.qty || '') + ' ' + stk);
  }
  if (i.weight) lines.push('  ' + (en ? 'Gross weight: ' : 'Bruttogewicht: ') + fnum(i.weight) + ' kg');
  if (i.volume) lines.push('  ' + (en ? 'Volume: ' : 'Volumen: ') + fnum(i.volume, 2) + ' m³');
  if (i.dg) {
    if (i.dgItems && i.dgItems.length) {
      lines.push('  ' + (en ? 'DANGEROUS GOODS:' : 'GEFAHRGUT:'));
      i.dgItems.forEach(d => {
        lines.push('    UN ' + d.un + ', ' + (en ? 'Class ' : 'Klasse ') + d.class +
          (d.pg && d.pg !== '—' ? ', ' + (en ? 'PG ' : 'VG ') + d.pg : '') +
          ((en ? d.nameEn : d.name) ? ' — ' + (en ? (d.nameEn || d.name) : d.name) : ''));
      });
    } else {
      lines.push('  ' + (en ? 'DANGEROUS GOODS: ' : 'GEFAHRGUT: ') + (i.dgText || (en ? 'yes — details to follow' : 'ja — Details folgen')));
    }
  }
  return lines.join('\n');
}

function _openMailto(to, subject, body) {
  const mailto = 'mailto:' + encodeURIComponent(to || '') +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
  window.open(mailto, '_blank');
}

// ── E-Mail-Vorschau: alle generierten Mails laufen hier durch ──
// Empfänger, Betreff und Text sind vor dem Senden editierbar.
var _pendingMail = null;

function showMailPreview(opts) { // {to, subject, body, note, onSend}
  _pendingMail = opts;
  let overlay = document.getElementById('mMailPreview');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'mMailPreview';
    overlay.innerHTML = '<div class="modal" style="max-width:640px"></div>';
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.modal').innerHTML = `
    <div class="modal-title">${t('✉️ E-Mail-Vorschau — prüfen & anpassen')}</div>
    <div class="form-group">
      <label class="form-label">${t('An')}</label>
      <input class="form-input" id="fMailTo" value="${escapeAttr(opts.to || '')}" placeholder="${escapeAttr(_lang === 'en' ? 'recipient@company.com (empty = choose in mail client)' : 'empfaenger@firma.de (leer = im Mail-Client wählen)')}">
    </div>
    <div class="form-group">
      <label class="form-label">${t('Betreff')}</label>
      <input class="form-input" id="fMailSubject" value="${escapeAttr(opts.subject || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">${t('Nachricht')}</label>
      <textarea class="form-textarea" id="fMailBody" style="font-size:12.5px;line-height:1.55;resize:vertical">${escapeHtml(opts.body || '')}</textarea>
    </div>
    ${opts.note ? `<div style="font-size:11px;color:var(--text-2);padding:8px 12px;background:rgba(59,130,246,.08);border-radius:6px;margin-bottom:14px">${escapeHtml(opts.note)}</div>` : ''}
    <div class="form-footer">
      <button class="btn btn-ghost" data-click="cancelMailPreview()">${t('Abbrechen')}</button>
      <button class="btn btn-primary" data-click="confirmMailPreview()">${t('✉️ An E-Mail-Client senden')}</button>
    </div>`;
  openM('mMailPreview');
  // Textarea an Inhalt anpassen: komplette E-Mail ohne Scrollen sichtbar
  const ta = document.getElementById('fMailBody');
  if (ta) {
    ta.style.height = 'auto';
    const chrome = 320; // Kopf, Felder, Hinweis, Footer
    const maxH = Math.max(240, window.innerHeight - chrome);
    ta.style.height = Math.min(ta.scrollHeight + 6, maxH) + 'px';
  }
}

function cancelMailPreview() {
  _pendingMail = null;
  closeM('mMailPreview');
}

function confirmMailPreview() {
  if (!_pendingMail) return;
  const to = document.getElementById('fMailTo').value.trim();
  const subject = document.getElementById('fMailSubject').value;
  const body = document.getElementById('fMailBody').value;
  const onSend = _pendingMail.onSend;
  _pendingMail = null;
  closeM('mMailPreview');
  _openMailto(to, subject, body);
  if (onSend) onSend();
}

function _signature() {
  return (_lang === 'en' ? 'Best regards' : 'Mit freundlichen Grüßen') + '\n' + (appSettings.senderName || (_lang === 'en' ? '[Sender]' : '[Absender]'));
}

// Interne Anrede für alle Team-Übergaben
function _greeting() { return _lang === 'en' ? 'Hi all,' : 'Hallo zusammen,'; }

// ── 1) Außendienst → Innendienst ──
function sendToInnendienst(id) {
  const i = inquiries.find(x => String(x.id) === String(id));
  if (!i) return;
  const en = _lang === 'en';
  const subject = (en ? 'New freight inquiry ' : 'Neue Frachtanfrage ') + i.number + ' — ' + i.customer + ' → ' + i.country;
  const body = [
    _greeting(),
    '',
    en ? 'new inquiry from Field Sales — please arrange freight costing:' : 'neue Anfrage vom Außendienst — bitte Frachtkosten ermitteln lassen:',
    '',
    (en ? '  Inquiry no.:  ' : '  Anfrage-Nr.:  ') + i.number,
    (en ? '  Customer:     ' : '  Kunde:        ') + i.customer,
    (en ? '  Destination:  ' : '  Ziel:         ') + i.country + (i.destinationCity ? ' / ' + i.destinationCity : ''),
    '  Incoterm:     ' + (i.incoterm || '—'),
    '  Transport:    ' + _transportLabel(i.transport),
    i.wunschtermin ? (en ? '  Req. date:    ' : '  Wunschtermin: ') + fd(i.wunschtermin) : null,
    i.priority && i.priority !== 'normal' ? (en ? '  Priority:     ' : '  Priorität:    ') + i.priority.toUpperCase() : null,
    '',
    en ? 'CARGO' : 'LADUNG',
    _cargoBlock(i),
    '',
    i.notes ? (en ? 'Note: ' : 'Bemerkung: ') + i.notes + '\n' : null,
    _signature()
  ].filter(l => l !== null).join('\n');
  // Übergabe-Link trägt den Vorgang im Zielzustand (Stab beim Innendienst)
  showMailPreviewWithHandoff(i, { status: 'neu' }, {
    to: appSettings.innendienstEmail, subject, body,
    note: en ? 'After sending, the baton passes to Inside Sales.' : 'Nach dem Senden geht der Staffelstab an den Innendienst.',
    onSend: () => {
      // Staffelstab an Innendienst übergeben
      if (i.status === 'entwurf') i.status = 'neu';
      _inqAddHistory(i, 'email-sent', { note: 'Anfrage an Innendienst gesendet' });
      i.updatedAt = new Date().toISOString();
      save();
      renderInq(document.getElementById('inqSearch')?.value || '');
      toast(en ? '✉️ Sent to Inside Sales — baton passed' : '✉️ An Innendienst gesendet — Stab übergeben');
    }
  });
}

// ── 2) Innendienst → Team Transport ──
function forwardToTransport(id) {
  const i = inquiries.find(x => String(x.id) === String(id));
  if (!i) return;
  const en = _lang === 'en';
  const c = gCountry(i.country) || {};
  const subject = (en ? 'Freight cost request ' : 'Frachtkosten-Anfrage ') + i.number + ' — ' + (i.incoterm || '') + ' ' + i.country + ' (' + _transportLabel(i.transport) + ')';
  const body = [
    _greeting(),
    '',
    en ? 'please determine freight costs for the following inquiry:' : 'bitte Frachtkosten für folgende Anfrage ermitteln:',
    '',
    (en ? '  Inquiry no.:  ' : '  Anfrage-Nr.:  ') + i.number,
    (en ? '  Customer:     ' : '  Kunde:        ') + i.customer,
    (en ? '  Destination:  ' : '  Ziel:         ') + i.country + (i.destinationCity ? ' / ' + i.destinationCity : '') + (c.port && i.transport === 'sea' ? (en ? ' (port: ' : ' (Hafen: ') + c.port + ')' : ''),
    '  Incoterm:     ' + (i.incoterm || '—'),
    '  Transport:    ' + _transportLabel(i.transport),
    i.wunschtermin ? (en ? '  Req. date:    ' : '  Wunschtermin: ') + fd(i.wunschtermin) : null,
    '',
    en ? 'CARGO' : 'LADUNG',
    _cargoBlock(i),
    i.containerRecommendation?.note ? '\n  ' + (en ? 'Container recommendation: ' : 'Container-Empfehlung: ') + i.containerRecommendation.note : null,
    '',
    _signature()
  ].filter(l => l !== null).join('\n');
  showMailPreviewWithHandoff(i, { status: 'transport' }, {
    to: appSettings.transportEmail, subject, body,
    note: en ? 'After sending, the status changes to "With Transport".' : 'Nach dem Senden wechselt der Status auf „Bei Transport".',
    onSend: () => {
      updateInqStatus(id, 'transport');
      toast(en ? '✉️ Forwarded to Transport Team — status: With Transport' : '✉️ An Team Transport weitergeleitet — Status: Bei Transport');
    }
  });
}

// ── 3) Transport → Spediteur (speditionsangepasste Anfrage) ──
function generateCarrierRFQ(id) {
  const i = inquiries.find(x => String(x.id) === String(id));
  if (!i) return;
  const en = _lang === 'en';
  const c = gCountry(i.country) || {};
  const bscRaw = checkBSCRequired(i.country);
  const bsc = bscRaw && en ? bscRaw.replace('erforderlich für', 'required for') : bscRaw;
  const zielSee = c.port ? c.port + ', ' + i.country : (i.destinationCity ? i.destinationCity + ', ' : '') + i.country;
  const zielLuft = c.airport ? c.airport + ' (' + i.country + ')' : i.country;
  const ziel = i.transport === 'air' ? zielLuft : i.transport === 'sea' ? zielSee : (i.destinationCity ? i.destinationCity + ', ' : '') + i.country;
  const zuschlagHinweis = i.transport === 'air'
    ? (en ? 'Please quote including all surcharges (FSC, SCC, AWB/handling) and transit time.' : 'Bitte um Angebot inkl. aller Zuschläge (FSC, SCC, AWB/Handling) und Transitzeit.')
    : i.transport === 'road'
      ? (en ? 'Please quote including tolls/diesel surcharge and lead time.' : 'Bitte um Angebot inkl. Maut/Diesel-Zuschlag und Laufzeit.')
      : (en ? 'Please quote including all surcharges (THC, BAF/CAF, ISPS) and transit time.' : 'Bitte um Angebot inkl. aller Zuschläge (THC, BAF/CAF, ISPS) und Transitzeit.');
  const subject = (en ? 'Freight quotation request ' : 'Frachtanfrage ') + i.number + ' — ' + (i.incoterm || '') + ' ' + ziel + ' (' + _transportLabel(i.transport) + ')';
  const body = [
    en ? 'Dear Sir or Madam,' : 'Sehr geehrte Damen und Herren,',
    '',
    en ? 'please provide a freight quotation for the following shipment:' : 'bitte um Frachtangebot für folgende Sendung:',
    '',
    (en ? '  Reference:    ' : '  Referenz:     ') + i.number,
    '  Incoterm:     ' + (i.incoterm || '—'),
    (en ? '  Departure:    ' : '  Abgangsort:   ') + (appSettings.abgangsort || (en ? '[place of departure — set in settings]' : '[Abgangsort — in Einstellungen hinterlegen]')),
    (en ? '  Destination:  ' : '  Ziel:         ') + ziel,
    (en ? '  Mode:         ' : '  Transportweg: ') + _transportLabel(i.transport),
    i.wunschtermin ? (en ? '  Requested pickup/dispatch: ' : '  Abholung/Versand gewünscht: ') + fd(i.wunschtermin) : null,
    '',
    en ? 'CARGO' : 'LADUNG',
    _cargoBlock(i),
    i.containerRecommendation?.note ? '\n  ' + i.containerRecommendation.note : null,
    '',
    en ? 'NOTES' : 'HINWEISE',
    bsc ? '  ' + bsc : null,
    c.specialCert ? (en ? '  Certificate: ' : '  Zertifikat: ') + c.specialCert : null,
    i.transport === 'sea' && c.transitSea ? (en ? '  Expected transit time: ~' : '  Erwartete Transitzeit: ~') + c.transitSea + (en ? ' days' : ' Tage') : null,
    '',
    zuschlagHinweis,
    '',
    _signature()
  ].filter(l => l !== null).join('\n');
  showMailPreview({
    to: '', subject, body,
    note: en
      ? 'Enter the carrier here or in the mail client. Record received quotes in the "Quotes" tab afterwards.'
      : 'Empfänger (Spediteur) hier oder im Mail-Client eintragen. Erhaltene Angebote danach im Tab „Angebote" erfassen.',
    onSend: () => {
      _inqAddHistory(i, 'email-sent', { note: 'Speditions-Anfrage generiert' });
      save();
      renderInq(document.getElementById('inqSearch')?.value || '');
      toast(en ? '✉️ Carrier RFQ generated — record quotes in the "Quotes" tab' : '✉️ Speditions-Anfrage generiert — Angebote im Tab „Angebote" erfassen');
    }
  });
}

// ── 4) Transport → Innendienst (Fracht-VK übergeben) ──
// Transport ermittelt EK intern und übergibt dem Innendienst nur den
// Fracht-VK + Gültigkeit (kein EK/Marge). Der Innendienst ergänzt dann
// den Warenwert und sendet die Rückmeldung an den Außendienst.
function handFreightToInnendienst(id) {
  const i = inquiries.find(x => String(x.id) === String(id));
  if (!i) return;
  const en = _lang === 'en';
  const offers = (i.freightRequests || []).filter(o => parseFloat(o.price) > 0);
  if (!offers.length && !confirm(en ? 'No quotes recorded yet. Hand over anyway?' : 'Noch keine Angebote erfasst. Trotzdem übergeben?')) return;
  const defs = SURCHARGE_DEFS[i.transport] || SURCHARGE_DEFS.sea;
  let bestCost = i.costPrice || 0, bestSped = i.spediteur || '', bestValid = i.offerValidUntil || '';
  if (offers.length) {
    const best = [...offers].sort((a, b) => offerTotal(a, defs) - offerTotal(b, defs))[0];
    bestCost = offerTotal(best, defs);
    if (!bestSped) bestSped = best.spediteur || '';
    if (!bestValid) bestValid = best.validUntil || '';
  }
  const markup = i.markupPercent || 30;
  const vk = Math.round(bestCost * (1 + markup / 100) * 100) / 100;
  let validUntil = bestValid;
  if (!validUntil) { const d = new Date(); d.setDate(d.getDate() + 14); validUntil = d.toISOString().slice(0, 10); }
  const subject = (en ? 'Freight costs determined: ' : 'Frachtkosten ermittelt: ') + i.number + ' — ' + i.customer + ' → ' + i.country;
  const body = [
    _greeting(),
    '',
    (en ? 'the freight costs for inquiry ' : 'die Frachtkosten zur Anfrage ') + i.number + ' (' + i.customer + ' → ' + i.country + ')' + (en ? ' are ready:' : ' liegen vor:'),
    '',
    (en ? '  Freight (VK): ' : '  Fracht (VK):  ') + fc(vk),
    '  Incoterm:     ' + (i.incoterm || '—'),
    '  Transport:    ' + _transportLabel(i.transport),
    (en ? '  Valid until:  ' : '  Gültig bis:   ') + fd(validUntil),
    i.calculation?.pallets ? (en ? '  Pallets:      ' : '  Paletten:     ') + i.calculation.pallets + ' | ' + fnum(i.calculation.grossWeight || 0) + ' kg' : null,
    '',
    en ? 'Please add the goods values and send the quote to Field Sales.' : 'Bitte Warenwert ergänzen und die Rückmeldung an den Außendienst senden.',
    '',
    _signature()
  ].filter(l => l !== null).join('\n');
  // Link spiegelt, was onSend lokal setzt: VK, Gültigkeit, ggf. EK/Spediteur
  const handoffState = Object.assign(
    { status: 'kalkuliert', sellPrice: vk, offerValidUntil: validUntil },
    offers.length ? { costPrice: bestCost, spediteur: i.spediteur || bestSped } : {}
  );
  showMailPreviewWithHandoff(i, handoffState, {
    to: appSettings.innendienstEmail, subject, body,
    note: en
      ? 'After sending: status "Freight costs determined" — Inside Sales adds goods values.'
      : 'Nach dem Senden: Status „Frachtkosten ermittelt" — der Innendienst ergänzt den Warenwert.',
    onSend: () => {
      if (offers.length) {
        i.costPrice = bestCost;
        if (!i.spediteur) i.spediteur = bestSped;
      }
      i.sellPrice = vk;
      i.offerValidUntil = validUntil;
      updateInqStatus(id, 'kalkuliert');
      toast((en ? '✉️ Freight handed to Inside Sales — VK: ' : '✉️ Fracht an Innendienst — VK: ') + fc(vk));
    }
  });
}

// ── 5) Innendienst → Außendienst (Rückmeldung: VK + Warenwert + Gesamt) ──
function sendFeedbackToField(id) {
  const i = inquiries.find(x => String(x.id) === String(id));
  if (!i) return;
  const en = _lang === 'en';
  const goods = proformaGoods(i);
  const freight = i.sellPrice || 0;
  const total = goods + freight;
  const validUntil = i.offerValidUntil || '';
  const subject = (en ? 'Quote ' : 'Angebot ') + i.number + ' — ' + (i.incoterm || '') + (en ? ' to ' : ' nach ') + i.country + ': ' + fc(total);
  const body = [
    _greeting(),
    '',
    (en ? 'our quote for inquiry ' : 'unser Angebot zur Anfrage ') + i.number + ' (' + i.customer + ' → ' + i.country + '):',
    '',
    goods ? (en ? '  Goods value:  ' : '  Warenwert:    ') + fc(goods) : null,
    (en ? '  Freight (VK): ' : '  Fracht (VK):  ') + fc(freight),
    (en ? '  Total:        ' : '  Gesamt:       ') + fc(total),
    '  Incoterm:     ' + (i.incoterm || '—'),
    validUntil ? (en ? '  Valid until:  ' : '  Gültig bis:   ') + fd(validUntil) : null,
    '',
    validUntil ? (en ? 'This quote is valid until ' + fd(validUntil) + '.' : 'Dieses Angebot ist gültig bis ' + fd(validUntil) + '.') : null,
    '',
    _signature()
  ].filter(l => l !== null).join('\n');
  showMailPreviewWithHandoff(i, { status: 'beantwortet' }, {
    to: appSettings.aussendienstEmail, subject, body,
    note: en
      ? 'After sending, the status changes to "Answered" — everyone gets the price + validity.'
      : 'Nach dem Senden: Status „Beantwortet" — alle erhalten Preis + Gültigkeit.',
    onSend: () => {
      updateInqStatus(id, 'beantwortet');
      toast((en ? '✉️ Quote sent to Field Sales — total: ' : '✉️ Rückmeldung an Außendienst — Gesamt: ') + fc(total));
    }
  });
}

// ── 6) Außendienst → Innendienst (finale Rückmeldung: Kundenentscheidung) ──
function sendFinalFeedback(i, decision, reason, note) {
  const en = _lang === 'en';
  const angenommen = decision === 'angenommen';
  const subject = (angenommen ? (en ? '✅ Accepted: ' : '✅ Angenommen: ') : (en ? '❌ Rejected: ' : '❌ Abgelehnt: ')) + i.number + ' — ' + i.customer + ' → ' + i.country;
  const body = [
    _greeting(),
    '',
    (en ? 'final feedback on inquiry ' : 'finale Rückmeldung zur Anfrage ') + i.number + ' (' + i.customer + ' → ' + i.country + '):',
    '',
    angenommen
      ? (en ? 'The customer has ACCEPTED the quotation — ' : 'Der Kunde hat das Angebot ANGENOMMEN — ') + fc(i.sellPrice) + ' (' + (i.incoterm || '') + ').'
      : (en ? 'The customer has REJECTED the quotation.' : 'Der Kunde hat das Angebot ABGELEHNT.'),
    !angenommen && reason ? (en ? 'Reason: ' : 'Grund: ') + reason + (note ? ' — ' + note : '') : null,
    angenommen && i.wunschtermin ? (en ? 'Requested date: ' : 'Wunschtermin: ') + fd(i.wunschtermin) : null,
    '',
    angenommen
      ? (en ? 'Please proceed with order processing (initiate shipment/booking).' : 'Bitte Auftrag weiterverarbeiten (Sendung/Buchung anstoßen).')
      : (en ? 'The case can be closed.' : 'Vorgang kann geschlossen werden.'),
    '',
    _signature()
  ].filter(l => l !== null).join('\n');
  // Status (angenommen/abgelehnt) ist hier bereits gesetzt — kein Override nötig
  showMailPreviewWithHandoff(i, null, {
    to: appSettings.innendienstEmail, subject, body,
    note: en ? 'Final feedback of the customer decision to Inside Sales.' : 'Finale Rückmeldung der Kundenentscheidung an den Innendienst.'
  });
}
