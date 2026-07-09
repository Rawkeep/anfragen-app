// ============================================================
// PACKSTÜCKE & PALETTENBERECHNUNG — 1:1 aus Export Afrika Pro
// Layers-Struktur: {layerNr: {h: hoehe_cm, pcs: stueck}}
// Source of Truth: physisch verifizierte Lagendaten
// ============================================================
var INQ_PRODUCTS = {
  '015AA': {
    name: 'Kanister 10kg', emoji: '🫙',
    dim: { l: 235, w: 195, h: 433 }, emptyWt: 0.68, fillWt: 10.0,
    get bruttoWt() { return this.emptyWt + this.fillWt; },
    maxLoose: 9,
    layers: { 1: { h: 58, pcs: 20 }, 2: { h: 102, pcs: 40 }, 3: { h: 145, pcs: 50 } },
    maxLayers: 3
  },
  '030AA': {
    name: 'Kanister 25kg', emoji: '🫙',
    dim: { l: 376, w: 288, h: 400 }, emptyWt: 1.35, fillWt: 25.0,
    get bruttoWt() { return this.emptyWt + this.fillWt; },
    maxLoose: 4,
    layers: { 1: { h: 55, pcs: 8 }, 2: { h: 95, pcs: 16 }, 3: { h: 135, pcs: 20 } },
    maxLayers: 3
  },
  '027AA': {
    name: 'Karton Pulver 25kg', emoji: '📦',
    dim: { l: 300, w: 300, h: 300 }, emptyWt: 0.83, fillWt: 25.0,
    get bruttoWt() { return this.emptyWt + this.fillWt; },
    maxLoose: 5,
    layers: { 1: { h: 47, pcs: 6 }, 2: { h: 80, pcs: 12 }, 3: { h: 112, pcs: 18 }, 4: { h: 145, pcs: 24 }, 5: { h: 177, pcs: 30 } },
    maxLayers: 5
  },
  '064AA': {
    name: 'Karton gross 25kg', emoji: '📦',
    dim: { l: 390, w: 390, h: 430 }, emptyWt: 1.44, fillWt: 25.0,
    get bruttoWt() { return this.emptyWt + this.fillWt; },
    maxLoose: 4,
    layers: { 1: { h: 62, pcs: 6 }, 2: { h: 108, pcs: 12 }, 3: { h: 154, pcs: 18 }, 4: { h: 201, pcs: 20 } },
    maxLayers: 4
  },
  '033AA': {
    name: 'Fass 25kg', emoji: '🛢️',
    dim: { l: 398, w: 398, h: 396 }, emptyWt: 12.50, fillWt: 25.0,
    get bruttoWt() { return this.emptyWt + this.fillWt; },
    maxLoose: 4,
    layers: { 1: { h: 55, pcs: 6 }, 2: { h: 94, pcs: 12 }, 3: { h: 134, pcs: 18 } },
    maxLayers: 3
  },
  '020XX': {
    name: 'Kanister 20kg', emoji: '🫙',
    dim: { l: 376, w: 288, h: 400 }, emptyWt: 1.35, fillWt: 20.0,
    get bruttoWt() { return this.emptyWt + this.fillWt; },
    maxLoose: 4,
    layers: { 1: { h: 55, pcs: 8 }, 2: { h: 95, pcs: 16 }, 3: { h: 135, pcs: 20 } },
    maxLayers: 3
  }
};
var PALLET_WT = 22;      // kg pro Euro-Palette
var NETTO_LIMIT = 500;   // kg netto max pro Palette

// ── Packstücke-Customization (localStorage-Overlay über Defaults) ──
var DEFAULT_INQ_PRODUCTS_SNAPSHOT = (function () {
  var snap = {};
  Object.keys(INQ_PRODUCTS).forEach(function (k) {
    var p = INQ_PRODUCTS[k];
    snap[k] = {
      name: p.name, emoji: p.emoji,
      dim: { l: p.dim.l, w: p.dim.w, h: p.dim.h },
      emptyWt: p.emptyWt, fillWt: p.fillWt,
      maxLoose: p.maxLoose,
      layers: JSON.parse(JSON.stringify(p.layers)),
      maxLayers: p.maxLayers
    };
  });
  return snap;
})();

function _decoratePackstueck(p) {
  if (!Object.getOwnPropertyDescriptor(p, 'bruttoWt')) {
    Object.defineProperty(p, 'bruttoWt', {
      get: function () { return (this.emptyWt || 0) + (this.fillWt || 0); },
      enumerable: true, configurable: true
    });
  }
  return p;
}

var Packstuecke = (function () {
  var SK_KEY = 'eapPackstueckeV11';

  function loadCustom() {
    return lsGet(SK_KEY, {});
  }
  function saveCustom(map) { lsSet(SK_KEY, map); }

  function hydrate() {
    var custom = loadCustom();
    Object.keys(custom).forEach(function (code) {
      var p = custom[code];
      if (p === null) {
        delete INQ_PRODUCTS[code];
      } else if (p && typeof p === 'object') {
        INQ_PRODUCTS[code] = _decoratePackstueck(p);
      }
    });
  }

  function upsert(code, fields) {
    code = (code || '').trim().toUpperCase();
    if (!code) throw new Error('Code fehlt');
    var p = {
      name: (fields.name || '').trim() || code,
      emoji: fields.emoji || '📦',
      dim: {
        l: parseFloat(fields.l) || 0,
        w: parseFloat(fields.w) || 0,
        h: parseFloat(fields.h) || 0
      },
      emptyWt: parseFloat(fields.emptyWt) || 0,
      fillWt: parseFloat(fields.fillWt) || 0,
      maxLoose: parseInt(fields.maxLoose, 10) || 0,
      layers: fields.layers || {},
      maxLayers: parseInt(fields.maxLayers, 10) || Object.keys(fields.layers || {}).length || 1
    };
    var custom = loadCustom();
    custom[code] = p;
    saveCustom(custom);
    INQ_PRODUCTS[code] = _decoratePackstueck(p);
    return p;
  }

  function remove(code) {
    var custom = loadCustom();
    if (DEFAULT_INQ_PRODUCTS_SNAPSHOT[code]) {
      custom[code] = null;
    } else {
      delete custom[code];
    }
    saveCustom(custom);
    delete INQ_PRODUCTS[code];
  }

  function reset() {
    saveCustom({});
    Object.keys(INQ_PRODUCTS).forEach(function (k) { delete INQ_PRODUCTS[k]; });
    Object.keys(DEFAULT_INQ_PRODUCTS_SNAPSHOT).forEach(function (k) {
      INQ_PRODUCTS[k] = _decoratePackstueck(JSON.parse(JSON.stringify(DEFAULT_INQ_PRODUCTS_SNAPSHOT[k])));
    });
  }

  function isCustom(code) {
    if (!DEFAULT_INQ_PRODUCTS_SNAPSHOT[code]) return true;
    var custom = loadCustom();
    return custom.hasOwnProperty(code) && custom[code] !== null;
  }

  return {
    loadCustom: loadCustom, hydrate: hydrate,
    upsert: upsert, remove: remove, reset: reset,
    isCustom: isCustom,
    DEFAULTS: DEFAULT_INQ_PRODUCTS_SNAPSHOT
  };
})();

Packstuecke.hydrate();

// ============================================================
// BERECHNUNGSLOGIK — 1:1 aus Export Afrika Pro
// 500kg netto = 1 Palette, 1000kg = 2, 1500kg = 3 usw.
// Restverteilung (letzte 2 Pal. gleichmaessig) NUR ab >=3 Paletten.
// ============================================================

// Kleinste Lagenzahl finden die pcs Stueck fasst (aufwaerts suchen)
function inqBestLayer(p, pcs) {
  for (let l = 1; l <= p.maxLayers; l++) {
    if (p.layers[l] && p.layers[l].pcs >= pcs) {
      return { layers: l, height: p.layers[l].h, capacity: p.layers[l].pcs };
    }
  }
  const ml = p.maxLayers;
  return { layers: ml, height: p.layers[ml].h, capacity: p.layers[ml].pcs };
}

function calcPalletsInline(productCode, qty, maxPalletHeight) {
  const p = INQ_PRODUCTS[productCode];
  if (!p) return null;
  const totalWtLoose = qty * p.bruttoWt;

  // Lose?
  if (qty <= p.maxLoose) {
    return { type: 'loose', pallets: 0, grossWeight: Math.round(totalWtLoose * 100) / 100, details: [], qty, product: p, maxHeight: 0 };
  }

  // Höhenlimit erzwingen (z.B. 160 cm Luftfracht): effektive Maximallagen kappen
  let effMaxLayers = p.maxLayers;
  let heightLimited = false;
  if (maxPalletHeight && maxPalletHeight > 0) {
    for (let l = p.maxLayers; l >= 1; l--) {
      if (p.layers[l] && p.layers[l].h > maxPalletHeight) {
        effMaxLayers = l - 1;
        heightLimited = true;
      } else {
        break;
      }
    }
    if (effMaxLayers < 1) effMaxLayers = 1;
  }

  // Effektives Maximum pro Palette (min aus Lagen-Kapazitaet und Gewichtslimit)
  const maxByLayers = p.layers[effMaxLayers].pcs;
  const maxByWeight = Math.floor(NETTO_LIMIT / p.fillWt);
  const effMax = Math.min(maxByLayers, maxByWeight);

  const full = Math.floor(qty / effMax);
  const rest = qty - full * effMax;
  let details = [];

  // Volle Paletten
  const fInfo = inqBestLayer(p, effMax);
  for (let i = 0; i < full; i++) {
    details.push({ pcs: effMax, layers: fInfo.layers, height: fInfo.height });
  }

  if (rest > 0) {
    const totalPal = full + 1;
    if (totalPal >= 3 && full > 0) {
      // >=3 Paletten gesamt: letzte volle + Rest gleichmaessig auf 2 verteilen
      const last = details.pop();
      const combined = last.pcs + rest;
      const h1 = Math.ceil(combined / 2);
      const h2 = combined - h1;
      const i1 = inqBestLayer(p, h1);
      const i2 = inqBestLayer(p, h2);
      details.push({ pcs: h1, layers: i1.layers, height: i1.height });
      details.push({ pcs: h2, layers: i2.layers, height: i2.height });
    } else {
      // <3 Paletten: einfach Restpalette
      const info = inqBestLayer(p, rest);
      details.push({ pcs: rest, layers: info.layers, height: info.height });
    }
  }

  const palCount = details.length;
  const grossWeight = Math.round((qty * p.bruttoWt + palCount * PALLET_WT) * 100) / 100;
  const maxHeight = details.length ? Math.max(...details.map(d => d.height)) : 0;

  return { type: 'palletized', pallets: palCount, grossWeight, details, qty, product: p, maxHeight, heightLimited };
}

function calcFromNetWeight(productCode, nettoKg, maxPalletHeight) {
  const p = INQ_PRODUCTS[productCode];
  if (!p) return null;
  const qty = Math.ceil(nettoKg / p.fillWt);
  return calcPalletsInline(productCode, qty, maxPalletHeight);
}
