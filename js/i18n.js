// ============================================================
// I18N — Deutsch (Quelle) / Englisch
// t('deutscher Text') → englische Übersetzung bei _lang === 'en'.
// Statisches HTML: Elemente mit data-i18n werden per
// translatePage() übersetzt (textContent als Schlüssel).
// ============================================================

var _lang = lsGet('anfragenLang', 'de');
if (_lang !== 'de' && _lang !== 'en') _lang = 'de';

const I18N_EN = {
  // Navigation & Header
  '📋 Anfragen': '📋 Inquiries',
  '🔲 Palettenrechner': '🔲 Pallet Calculator',
  '🚢 Containerrechner': '🚢 Container Calculator',
  'Rolle': 'Role',
  '🧑‍💼 Außendienst': '🧑‍💼 Field Sales',
  '🏢 Innendienst': '🏢 Inside Sales',
  '🚚 Team Transport': '🚚 Transport Team',
  'Außendienst': 'Field Sales',
  'Innendienst': 'Inside Sales',
  'Team Transport': 'Transport Team',

  // Anfragen-Ansicht
  'Frachtanfragen': 'Freight Inquiries',
  '⬇ Export': '⬇ Export',
  '⬆ Import': '⬆ Import',
  '+ Neue Anfrage': '+ New Inquiry',
  'Alle': 'All',
  'Neu': 'New',
  'Bei Transport': 'With Transport',
  'Kalkuliert': 'Calculated',
  'Beantwortet': 'Answered',
  'Angenommen': 'Accepted',
  'Abgelehnt': 'Rejected',
  'Nr.': 'No.',
  'Datum': 'Date',
  'Kunde': 'Customer',
  'Land': 'Country',
  'Incoterm': 'Incoterm',
  'Transport': 'Transport',
  'Kalkulation / Spediteur': 'Calculation / Carrier',
  'Angebote': 'Quotes',
  'Aufschlag': 'Markup',
  'EK': 'Cost',
  'VK': 'Sell',
  'Status': 'Status',
  'Aktionen': 'Actions',
  'Übersicht': 'Overview',
  'Entwurf': 'Draft',

  // Staffel / Relay
  'Am Zug': 'Your turn',
  'Unterwegs (bei anderen Stationen)': 'In transit (at other stations)',
  'wartet auf': 'waiting for',
  'abgeschlossen': 'closed',
  'Kein Staffelstab bei dir — nichts zu tun. 🎉': 'No baton with you — nothing to do. 🎉',
  'beim Außendienst — senden': 'with Field Sales — send',
  'beim Innendienst — weiterleiten': 'with Inside Sales — forward',
  'zurück beim Innendienst — antworten': 'back with Inside Sales — reply',
  'beim Außendienst — Kundenentscheidung': 'with Field Sales — customer decision',
  'Lauf geschlossen': 'relay closed',
  'Frachtkosten-Ermittlung läuft': 'freight costing in progress',

  // Workspace (Mein Bereich)
  'Mein Bereich': 'My Workspace',
  'Keine offenen Aufgaben — alles erledigt. 🎉': 'No open tasks — all done. 🎉',
  'Neue Anfrage erstellen': 'Create new inquiry',
  'Artikel, Menge/Füllmenge und Packstück wählen — Paletten und Gewicht werden automatisch berechnet.': 'Select item, quantity/net weight and packaging — pallets and weight are calculated automatically.',
  'Entscheidung erfassen': 'Record decision',
  'Rückmeldung erhalten — Kundenentscheidung erfassen:': 'Feedback received — record the customer decision:',
  'An Transport weiterleiten': 'Forward to Transport',
  'Neue Anfrage vom Außendienst — Frachtkosten ermitteln lassen:': 'New inquiry from Field Sales — request freight costs:',
  'Rückmeldung senden': 'Send feedback',
  'Frachtkosten liegen vor — Rückmeldung an Außendienst:': 'Freight costs available — send feedback to Field Sales:',
  'Frachtkosten ermitteln': 'Determine freight costs',
  'Speditions-Anfrage generieren, Angebote erfassen, an Innendienst übergeben:': 'Generate carrier RFQ, record quotes, hand over to Inside Sales:',
  '✓ Angenommen': '✓ Accepted',
  '✕ Abgelehnt': '✕ Rejected',
  '→ An Transport': '→ To Transport',
  '✉️ Rückmeldung': '✉️ Feedback',
  '✉️ An Innendienst': '✉️ To Inside Sales',
  '🚚 Speditions-Anfrage': '🚚 Carrier RFQ',
  '💰 Angebote': '💰 Quotes',
  '→ An Innendienst': '→ To Inside Sales',
  '→ Fracht an Innendienst': '→ Freight to Inside Sales',
  '✉️ Rückmeldung an Außendienst': '✉️ Quote to Field Sales',
  '🧾 Warenwert / Proforma': '🧾 Goods value / Proforma',
  '🧾 Proforma-Vorschau': '🧾 Proforma preview',
  'Warenwert / Proforma': 'Goods value / Proforma',
  'Warenwert': 'Goods value',
  'Fracht (VK)': 'Freight (sell)',
  'Einzelpreis (€)': 'Unit price (€)',
  'Menge': 'Qty',
  'Betrag': 'Amount',
  'Erst Artikel erfassen (Tab „Artikel & Berechnung").': 'Add articles first (tab "Items & Calculation").',
  'Einzelpreise (Warenwert) ergänzen — Gesamt = Warenwert + Fracht (VK). Für die Proforma-Rechnung.': 'Add unit prices (goods value) — total = goods value + freight (sell). For the proforma invoice.',
  'Popup blockiert — bitte erlauben': 'Popup blocked — please allow',
  '✉️ Angebot an Außendienst': '✉️ Quote to Field Sales',
  'gültig bis': 'valid until',
  'Öffnen': 'Open',

  // KPI
  'Gesamt': 'Total',
  'neu': 'new',
  'In Bearbeitung': 'In progress',
  'warten auf Kunde': 'awaiting customer',
  'Conversion': 'Conversion',
  'angenommen': 'accepted',
  'Ø Tage bis Rückmeldung': 'Ø days to feedback',
  'Marge (gesamt)': 'Margin (total)',
  'Dringend': 'Urgent',
  'in Bearbeitung': 'in progress',
  'Verfallene Angebote': 'Expired quotes',
  'Offers abgelaufen': 'quotes expired',

  // Status-Hinweise
  'liegt beim Innendienst': 'with Inside Sales',
  'Frachtkosten-Ermittlung läuft': 'freight costing in progress',
  'zurück beim Innendienst': 'back with Inside Sales',
  'Rückmeldung an Außendienst erfolgt': 'feedback sent to Field Sales',
  'Frachtkosten ermittelt': 'Freight costs determined',

  // Rollen-Hinweise
  'Artikel & Menge wählen → Anfrage an Innendienst senden': 'Select items & quantity → send inquiry to Inside Sales',
  'Anfragen prüfen → an Team Transport weiterleiten': 'Review inquiries → forward to Transport Team',
  'Frachtkosten ermitteln → Angebot (VK + Gültigkeit) an Außendienst senden': 'Determine freight costs → send quote (VK + validity) to Field Sales',

  // Anfrage-Modal
  'Neue Frachtanfrage': 'New Freight Inquiry',
  'Anfrage bearbeiten': 'Edit inquiry',
  'Basisdaten': 'Basic data',
  'Artikel & Berechnung': 'Items & Calculation',
  'Verlauf': 'History',
  'Referenz-Nr.': 'Reference no.',
  'Zielland': 'Destination country',
  'Zielort / Hafen': 'Destination / port',
  'Priorität': 'Priority',
  'Wunschtermin (Abholung/Versand)': 'Requested date (pickup/dispatch)',
  'Gefahrgut': 'Dangerous goods',
  'Gefahrgut-Details (UN-Nr., Klasse, Verpackungsgruppe)': 'DG details (UN no., class, packing group)',
  'Einkaufspreis EK (€)': 'Cost price (€)',
  'Verkaufspreis VK (€)': 'Sell price (€)',
  'Spediteur': 'Carrier',
  'Gewicht brutto (kg)': 'Gross weight (kg)',
  'Volumen (m³)': 'Volume (m³)',
  'Notizen': 'Notes',
  'Abbrechen': 'Cancel',
  '💾 Anfrage speichern': '💾 Save inquiry',
  '+ Artikel hinzufügen': '+ Add item',
  'Alle entfernen': 'Remove all',
  '+ Angebot hinzufügen': '+ Add quote',
  'Artikel-Nr.': 'Article no.',
  'Bezeichnung': 'Description',
  'Entfernen': 'Remove',
  '— Gebinde / Packstück —': '— Packaging / package —',
  'Gebinde für Palettenberechnung': 'Packaging for pallet calculation',
  'Stückzahl': 'Quantity',
  'Netto kg': 'Net kg',
  'Noch kein Artikel — klicke „+ Artikel hinzufügen"': 'No article yet — click "+ Add item"',
  'Mehrere Artikel möglich — Paletten, Gewicht und Volumen werden automatisch berechnet.': 'Multiple items possible — pallets, weight and volume are calculated automatically.',

  // Artikel-Katalog (Verwaltung)
  'Artikel-Katalog': 'Article catalogue',
  'Standard-Gebinde': 'Default packaging',
  '— kein Standard-Gebinde —': '— no default packaging —',
  'Neuer Artikel': 'New article',
  '+ Neuer Artikel': '+ New article',
  'Artikel bearbeiten': 'Edit article',
  'Artikel importieren': 'Import articles',
  '⬆ Importieren': '⬆ Import',
  'Noch keine Artikel im Katalog — einzeln anlegen oder importieren.': 'No articles in the catalogue yet — add individually or import.',
  'Alle Artikel vorab hinterlegen — dann wählt der Außendienst die Artikel-Nr. nur noch aus, Bezeichnung und Gebinde füllen sich automatisch.': 'Pre-load all articles — Field Sales then only selects the article no.; description and packaging fill in automatically.',
  'Als JSON-Array oder als Zeilen „Artikel-Nr.; Bezeichnung; Gebinde-Code" (eine Zeile je Artikel; Trenner Semikolon, Komma oder Tab). Fehlt der Gebinde-Code, wird er aus dem Nummern-Suffix erkannt (z.B. …30A → 030AA).': 'As a JSON array or as lines "Article no.; Description; Packaging code" (one line per article; separator semicolon, comma or tab). If the packaging code is missing, it is detected from the number suffix (e.g. …30A → 030AA).',
  'Artikel-Nr. fehlt': 'Article no. missing',
  'Artikel gespeichert': 'Article saved',
  'Artikel aus Katalog löschen?': 'Delete article from catalogue?',
  'Export erstellt': 'Export created',
  'Artikel': 'articles',
  'Nichts zum Importieren': 'Nothing to import',
  'Import fehlgeschlagen': 'Import failed',
  'Keine gültigen Artikel erkannt': 'No valid articles detected',
  'Artikel importiert': 'articles imported',
  'Bearbeiten': 'Edit',
  'Löschen': 'Delete',

  // Palettenrechner
  'Palettenrechner': 'Pallet Calculator',
  'Packstück': 'Package type',
  'Eingabe-Modus': 'Input mode',
  'Stückzahl': 'Quantity',
  'Nettogewicht (kg)': 'Net weight (kg)',
  'Max. Palettenhöhe (cm)': 'Max. pallet height (cm)',
  'Packstück-Katalog': 'Package catalogue',
  '↺ Zurücksetzen': '↺ Reset',
  '+ Neues Packstück': '+ New package type',

  // Containerrechner
  'Containerrechner': 'Container Calculator',
  '🧮 Beladungsrechner': '🧮 Loading Calculator',
  'Container-Typ': 'Container type',
  'Produkt-Preset': 'Product preset',
  'Einheit': 'Unit',
  'Gewicht je Einheit (kg, optional)': 'Weight per unit (kg, optional)',
  'Paletten UNTEN': 'Pallets LOWER',
  'Lagen UNTEN': 'Layers LOWER',
  'Einheiten/Lage UNTEN': 'Units/layer LOWER',
  'Paletten OBEN (gestapelt)': 'Pallets UPPER (stacked)',
  'Lagen OBEN': 'Layers UPPER',
  'Einheiten/Lage OBEN': 'Units/layer UPPER',
  'Lückenfüllung': 'Gap fill',
  'Anzahl halbe Paletten': 'Number of half pallets',
  'Einheiten je ½-Palette': 'Units per ½ pallet',
  'Lose Einheiten (Lücken)': 'Loose units (gaps)',
  '📐 Stauplan-Referenz': '📐 Stowage Plan Reference',
  '🎯 Container-Empfehlung': '🎯 Container Recommendation',
  'Paletten': 'Pallets',
  'Gewicht (kg)': 'Weight (kg)',

  // Einstellungen
  '⚙️ Einstellungen': '⚙️ Settings',
  'Absender-Name (für generierte E-Mails)': 'Sender name (for generated emails)',
  'E-Mail Innendienst': 'Email Inside Sales',
  'E-Mail Team Transport': 'Email Transport Team',
  'E-Mail Außendienst (für Rückmeldungen)': 'Email Field Sales (for feedback)',
  'Abgangsort (für Speditions-Anfragen)': 'Place of departure (for carrier RFQs)',
  '💾 Speichern': '💾 Save',

  // E-Mail-Vorschau
  '✉️ E-Mail-Vorschau — prüfen & anpassen': '✉️ Email preview — review & adjust',
  'An': 'To',
  'Betreff': 'Subject',
  'Nachricht': 'Message',
  '✉️ An E-Mail-Client senden': '✉️ Send via email client',

  // Ablehnung
  'Anfrage ablehnen': 'Reject inquiry',
  'Ablehnungsgrund': 'Rejection reason',
  '— Wählen —': '— Select —',
  'Preis zu hoch': 'Price too high',
  'Transitzeit zu lang': 'Transit time too long',
  'Keine Kapazität': 'No capacity',
  'Kunde abgesprungen': 'Customer withdrew',
  'Konkurrenzangebot angenommen': 'Competitor quote accepted',
  'Sonstiges': 'Other',
  'Bemerkung (optional)': 'Note (optional)',
  'Ablehnen': 'Reject',

  'Nur-Lese-Ansicht der Ladungsdaten — Angebote im Tab „Angebote" erfassen und an den Innendienst übergeben.': 'Read-only view of the cargo data — record quotes in the "Quotes" tab and hand over to Inside Sales.',

  // Gefahrgut-Katalog
  'Gefahrgut-Positionen — aus Katalog wählen, Klasse/VG werden übernommen': 'Dangerous goods items — select from catalogue, class/PG are applied automatically',
  '+ Gefahrgut-Position': '+ DG item',
  'Noch keine Gefahrgut-Position — Eintrag aus dem Katalog wählen.': 'No DG item yet — select an entry from the catalogue.',
  'Eigene Angabe…': 'Custom entry…',
  'Bezeichnung (Proper Shipping Name)': 'Description (proper shipping name)',
  'Entfernen': 'Remove',
  'Gefahrgut: Bitte mindestens eine Position aus dem Katalog wählen!': 'Dangerous goods: please select at least one item from the catalogue!',

  // Sonstiges
  'Fracht · Paletten · Container': 'Freight · Pallets · Containers',
  'Außendienst → Innendienst → Transport → Außendienst': 'Field Sales → Inside Sales → Transport → Field Sales',
  'ab': 'from',
  'kalkuliert': 'calculated',
  'Einstellungen gespeichert': 'Settings saved',
  'Keine Treffer': 'No results',
  'Noch keine Anfragen': 'No inquiries yet',
  'Versuche einen anderen Suchbegriff': 'Try a different search term',
  'Erstelle deine erste Anfrage': 'Create your first inquiry',
  'Seefracht': 'Sea freight',
  'Luftfracht': 'Air freight',
  'Landtransport': 'Road transport'
};

function t(s) {
  return _lang === 'en' ? (I18N_EN[s] || s) : s;
}

function setLang(l) {
  _lang = l === 'en' ? 'en' : 'de';
  lsSet('anfragenLang', _lang);
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = _lang;
  translatePage();
  if (typeof applyRoleUI === 'function') applyRoleUI();
  if (typeof renderInq === 'function') renderInq(document.getElementById('inqSearch')?.value || '');
  if (typeof initPalletView === 'function' && !document.getElementById('v-paletten')?.classList.contains('hidden')) initPalletView();
}

// Statische HTML-Texte übersetzen (Original als Schlüssel merken)
function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (!el.dataset.orig) el.dataset.orig = el.textContent.trim();
    el.textContent = t(el.dataset.orig);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    if (!el.dataset.origPh) el.dataset.origPh = el.placeholder;
    el.placeholder = _lang === 'en' ? (I18N_EN_PLACEHOLDERS[el.dataset.origPh] || el.dataset.origPh) : el.dataset.origPh;
  });
}

const I18N_EN_PLACEHOLDERS = {
  'Suchen: Kunde, Land, Nr., Artikel…': 'Search: customer, country, no., item…',
  'Firmenname': 'Company name',
  'Kundenreferenz / Bestellnr.': 'Customer reference / order no.',
  'wird aus Land vorgeschlagen': 'suggested from country',
  'z.B. UN 1993, Klasse 3, VG III': 'e.g. UN 1993, class 3, PG III',
  'Name / Kürzel': 'Name / code',
  'aus Berechnung': 'from calculation',
  'Interne Bemerkungen…': 'Internal notes…',
  'kein Limit': 'no limit',
  'empfaenger@firma.de (leer = im Mail-Client wählen)': 'recipient@company.com (empty = choose in mail client)'
};
