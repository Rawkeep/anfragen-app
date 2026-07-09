// ============================================================
// PROFORMA — Warenwert (Artikelpreise) + Proforma-Vorschau
// Der Innendienst ergänzt Einzelpreise je Artikel; Gesamt =
// Warenwert + Fracht (VK). Druckbare Proforma-Rechnung.
// ============================================================

// Effektive Menge eines Artikels (bei Netto-Modus aus der Berechnung)
function _proformaArticleQty(a) {
  const p = INQ_PRODUCTS[a.code];
  if (!p) return 0;
  if (a.mode === 'netto') {
    const r = calcFromNetWeight(a.code, parseFloat(a.netto) || 0);
    return r ? r.qty : 0;
  }
  return parseInt(a.qty) || 0;
}

// Warenwert einer gespeicherten Anfrage (Menge × Einzelpreis)
function proformaGoods(i) {
  return (i.articles || []).reduce((s, a) => s + ((parseInt(a.qty) || 0) * (parseFloat(a.unitPrice) || 0)), 0);
}

function _proformaGoodsLive() {
  return _inqArticles.reduce((s, a) => s + (a.code && INQ_PRODUCTS[a.code] ? _proformaArticleQty(a) * (parseFloat(a.unitPrice) || 0) : 0), 0);
}

function _proformaFreight() {
  return parseFloat(document.getElementById('fInqSell')?.value) || 0;
}

// ── Panel im Anfrage-Modal ──
function renderProformaPanel() {
  const wrap = document.getElementById('inqProformaList');
  if (!wrap) return;
  const editable = currentRole === 'innendienst';
  const arts = _inqArticles.filter(a => a.code && INQ_PRODUCTS[a.code]);
  if (!arts.length) {
    wrap.innerHTML = `<div style="color:var(--text-3);font-size:13px;padding:10px">${t('Erst Artikel erfassen (Tab „Artikel & Berechnung").')}</div>`;
    return;
  }
  const rows = arts.map(a => {
    const qty = _proformaArticleQty(a);
    const up = parseFloat(a.unitPrice) || 0;
    const name = [a.artNr, a.artName].filter(Boolean).join(' — ') || (INQ_PRODUCTS[a.code].name);
    return `<tr>
      <td>${escapeHtml(name)}</td>
      <td style="text-align:right">${qty}</td>
      <td style="text-align:right"><input type="number" min="0" step="0.01" class="form-input" style="width:120px;text-align:right;font-size:12px" value="${up || ''}" ${editable ? '' : 'readonly'} placeholder="0,00" data-input="proformaSetPrice('${a.id}','$value')"></td>
      <td style="text-align:right;font-weight:700" data-amount="${a.id}">${fc(qty * up)}</td>
    </tr>`;
  }).join('');
  const goods = _proformaGoodsLive();
  const freight = _proformaFreight();
  wrap.innerHTML = `
    <div class="sub" style="font-size:12px;color:var(--text-3);margin-bottom:10px">${t('Einzelpreise (Warenwert) ergänzen — Gesamt = Warenwert + Fracht (VK). Für die Proforma-Rechnung.')}</div>
    <div style="overflow-x:auto"><table class="pal-table" style="width:100%">
      <tr><th style="text-align:left">${t('Artikel')}</th><th style="text-align:right">${t('Menge')}</th><th style="text-align:right">${t('Einzelpreis (€)')}</th><th style="text-align:right">${t('Betrag')}</th></tr>
      ${rows}
    </table></div>
    <div class="proforma-sums">
      <div><span>${t('Warenwert')}</span><strong id="pfGoods">${fc(goods)}</strong></div>
      <div><span>${t('Fracht (VK)')}</span><strong id="pfFreight">${fc(freight)}</strong></div>
      <div class="pf-total"><span>${t('Gesamt')}</span><strong id="pfTotal">${fc(goods + freight)}</strong></div>
    </div>
    <div style="margin-top:12px;display:flex;justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" data-click="openProformaPreview()">${t('🧾 Proforma-Vorschau')}</button>
    </div>`;
}

// Einzelpreis live setzen (ohne Re-Render, Fokus bleibt)
function proformaSetPrice(aid, v) {
  const a = _inqArticles.find(x => x.id === aid);
  if (!a) return;
  a.unitPrice = v;
  const qty = _proformaArticleQty(a);
  const amtEl = document.querySelector('[data-amount="' + aid + '"]');
  if (amtEl) amtEl.textContent = fc(qty * (parseFloat(v) || 0));
  const goods = _proformaGoodsLive();
  const freight = _proformaFreight();
  const g = document.getElementById('pfGoods'), f = document.getElementById('pfFreight'), tt = document.getElementById('pfTotal');
  if (g) g.textContent = fc(goods);
  if (f) f.textContent = fc(freight);
  if (tt) tt.textContent = fc(goods + freight);
}

// ── Druckbare Proforma-Rechnung ──
function buildProformaHtml() {
  const en = _lang === 'en';
  const editId = document.getElementById('editInqId').value;
  const inq = inquiries.find(x => String(x.id) === String(editId)) || {};
  const number = inq.number || 'NEU';
  const customer = document.getElementById('fInqCustomer').value || '';
  const country = document.getElementById('fInqCountry').value || '';
  const city = document.getElementById('fInqDestCity').value || '';
  const incoterm = document.getElementById('fInqIncoterm').value || '';
  const validUntil = inq.offerValidUntil || '';
  const arts = _inqArticles.filter(a => a.code && INQ_PRODUCTS[a.code]);
  const rows = arts.map((a, idx) => {
    const qty = _proformaArticleQty(a);
    const up = parseFloat(a.unitPrice) || 0;
    return `<tr><td>${idx + 1}</td><td>${escapeHtml(a.artNr || '')}</td><td>${escapeHtml(a.artName || INQ_PRODUCTS[a.code].name)}</td><td class="r">${qty}</td><td class="r">${fc(up)}</td><td class="r">${fc(qty * up)}</td></tr>`;
  }).join('');
  const goods = _proformaGoodsLive();
  const freight = _proformaFreight();
  const total = goods + freight;
  const senderLines = [appSettings.senderName, appSettings.abgangsort].filter(Boolean).map(escapeHtml).join('<br>') || '[Absender]';
  const L = en ? {
    title: 'PROFORMA INVOICE', no: 'Proforma no.', date: 'Date', from: 'From', to: 'To',
    pos: 'Pos', art: 'Article no.', desc: 'Description', qty: 'Qty', price: 'Unit price', amount: 'Amount',
    goods: 'Goods value', freight: 'Freight (sell)', total: 'Total', incoterm: 'Incoterm', dest: 'Destination',
    valid: 'Valid until', note: 'Proforma invoice — not a request for payment. For customs / offer purposes only.'
  } : {
    title: 'PROFORMA-RECHNUNG', no: 'Proforma-Nr.', date: 'Datum', from: 'Von', to: 'An',
    pos: 'Pos', art: 'Artikel-Nr.', desc: 'Bezeichnung', qty: 'Menge', price: 'Einzelpreis', amount: 'Betrag',
    goods: 'Warenwert', freight: 'Fracht (VK)', total: 'Gesamt', incoterm: 'Incoterm', dest: 'Ziel',
    valid: 'Gültig bis', note: 'Proforma-Rechnung — keine Zahlungsaufforderung. Nur für Zoll-/Angebotszwecke.'
  };
  const today = new Date();
  const dateStr = today.toLocaleDateString(en ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `<!doctype html><html lang="${_lang}"><head><meta charset="utf-8"><title>${L.title} ${escapeHtml(number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #16202e; margin: 32px; font-size: 13px; }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: .02em; }
  .meta { color: #46556a; font-size: 12px; margin-bottom: 20px; }
  .parties { display: flex; gap: 40px; margin-bottom: 24px; }
  .parties h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #8493a8; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #8493a8; border-bottom: 2px solid #dbe2ec; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eef2f7; }
  .r { text-align: right; }
  .sums { margin-left: auto; width: 300px; }
  .sums td { border: none; padding: 4px 8px; }
  .sums .tot td { border-top: 2px solid #16202e; font-weight: 800; font-size: 15px; }
  .note { margin-top: 28px; font-size: 11px; color: #8493a8; border-top: 1px solid #eef2f7; padding-top: 10px; }
  .btnbar { margin-bottom: 20px; }
  .btnbar button { padding: 8px 16px; border: none; border-radius: 8px; background: #1a56db; color: #fff; font-weight: 600; cursor: pointer; }
  @media print { .btnbar { display: none; } body { margin: 0; } }
</style></head><body>
  <div class="btnbar"><button onclick="window.print()">${en ? 'Print / Save as PDF' : 'Drucken / als PDF speichern'}</button></div>
  <h1>${L.title}</h1>
  <div class="meta">${L.no}: <strong>${escapeHtml(number)}</strong> &nbsp;·&nbsp; ${L.date}: ${dateStr}${validUntil ? ' &nbsp;·&nbsp; ' + L.valid + ': ' + fd(validUntil) : ''}</div>
  <div class="parties">
    <div><h3>${L.from}</h3>${senderLines}</div>
    <div><h3>${L.to}</h3>${escapeHtml(customer)}<br>${escapeHtml([city, country].filter(Boolean).join(', '))}</div>
    <div><h3>${L.incoterm} / ${L.dest}</h3>${escapeHtml(incoterm)}<br>${escapeHtml([city, country].filter(Boolean).join(', '))}</div>
  </div>
  <table>
    <thead><tr><th>${L.pos}</th><th>${L.art}</th><th>${L.desc}</th><th class="r">${L.qty}</th><th class="r">${L.price}</th><th class="r">${L.amount}</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="color:#8493a8">—</td></tr>'}</tbody>
  </table>
  <table class="sums"><tbody>
    <tr><td>${L.goods}</td><td class="r">${fc(goods)}</td></tr>
    <tr><td>${L.freight}</td><td class="r">${fc(freight)}</td></tr>
    <tr class="tot"><td>${L.total}</td><td class="r">${fc(total)}</td></tr>
  </tbody></table>
  <div class="note">${L.note}</div>
</body></html>`;
}

function openProformaPreview() {
  const html = buildProformaHtml();
  const w = window.open('', '_blank');
  if (w && w.document) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  } else {
    toast(t('Popup blockiert — bitte erlauben'), 'error');
  }
}
