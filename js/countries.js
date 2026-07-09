// ============================================================
// AFRIKA-LÄNDERDATEN — 1:1 aus Export Afrika Pro (data.js)
// Häfen, Airports, Transitzeiten, Risiko, Zertifikatspflichten
// ============================================================
var countries = [
{name:"Algerien",code:"DZ",port:"Algiers",airport:"ALG",transitSea:12,transitAir:5,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR/AR",specialCert:"COC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"Importlizenzen erforderlich. COC (Certificate of Conformity) Pflicht bei vielen Warengruppen",requiresCOC:true},
{name:"Angola",code:"AO",port:"Luanda",airport:"LAD",transitSea:25,transitAir:8,risk:"high",payRisk:"high",logistics:"low",language:"PT",specialCert:"CNCA/ARCCLA",recommended:"CFR,FOB",notRecommended:"DDP,DAP",notes:"CNCA/ARCCLA Zertifikat pflicht"},
{name:"Äquatorialguinea",code:"GQ",port:"Malabo",airport:"SSG",transitSea:28,transitAir:10,risk:"high",payRisk:"high",logistics:"low",language:"ES/FR",specialCert:"",recommended:"FOB,CFR",notRecommended:"DDP",notes:"Kleine Marktgröße"},
{name:"Äthiopien",code:"ET",port:"Djibouti (transit)",airport:"ADD",transitSea:30,transitAir:7,risk:"medium",payRisk:"medium",logistics:"medium",language:"AM/EN",specialCert:"CoC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"Binnenland, Transit über Djibouti"},
{name:"Benin",code:"BJ",port:"Cotonou",airport:"COO",transitSea:22,transitAir:8,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"ECTN pflicht"},
{name:"Botswana",code:"BW",port:"Durban (transit)",airport:"GBE",transitSea:32,transitAir:9,risk:"low",payRisk:"low",logistics:"medium",language:"EN",specialCert:"",recommended:"CFR,CPT",notRecommended:"",notes:"Binnenland"},
{name:"Burkina Faso",code:"BF",port:"Abidjan/Lomé (transit)",airport:"OUA",transitSea:28,transitAir:9,risk:"high",payRisk:"medium",logistics:"low",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR",notRecommended:"DDP",notes:"Binnenland, ECTN pflicht"},
{name:"Burundi",code:"BI",port:"Dar es Salaam (transit)",airport:"BJM",transitSea:35,transitAir:10,risk:"high",payRisk:"high",logistics:"low",language:"FR",specialCert:"",recommended:"FOB,CFR",notRecommended:"DDP",notes:"Binnenland"},
{name:"Djibouti",code:"DJ",port:"Djibouti",airport:"JIB",transitSea:18,transitAir:7,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR/AR",specialCert:"",recommended:"CFR,CIF",notRecommended:"DDP",notes:"Strategischer Transithafen"},
{name:"DR Kongo",code:"CD",port:"Matadi/Pointe-Noire",airport:"FIH",transitSea:28,transitAir:9,risk:"high",payRisk:"high",logistics:"low",language:"FR",specialCert:"FERI/ECTN",recommended:"FOB",notRecommended:"DDP,DAP",notes:"FERI erforderlich"},
{name:"Elfenbeinküste",code:"CI",port:"Abidjan",airport:"ABJ",transitSea:20,transitAir:7,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR",specialCert:"ECTN/BSC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"BSC pflicht, Hub Westafrika"},
{name:"Eritrea",code:"ER",port:"Massawa",airport:"ASM",transitSea:20,transitAir:8,risk:"high",payRisk:"high",logistics:"low",language:"TI/AR",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP,CIF",notes:"Sanktionen prüfen!"},
{name:"Eswatini",code:"SZ",port:"Durban (transit)",airport:"MTS",transitSea:32,transitAir:9,risk:"low",payRisk:"low",logistics:"medium",language:"EN",specialCert:"",recommended:"CFR,CPT",notRecommended:"",notes:"Binnenland"},
{name:"Gabun",code:"GA",port:"Libreville",airport:"LBV",transitSea:24,transitAir:8,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR",specialCert:"ECTN/BESC/BIETC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"ECTN/BIETC pflicht"},
{name:"Gambia",code:"GM",port:"Banjul",airport:"BJL",transitSea:20,transitAir:8,risk:"medium",payRisk:"medium",logistics:"low",language:"EN",specialCert:"",recommended:"CFR",notRecommended:"DDP",notes:"Kleiner Markt"},
{name:"Ghana",code:"GH",port:"Tema",airport:"ACC",transitSea:22,transitAir:7,risk:"low",payRisk:"low",logistics:"good",language:"EN",specialCert:"SPN",recommended:"CFR,CIF,FOB",notRecommended:"",notes:"SPN (Shipment Pre-arrival Notification) ab 2026 Pflicht"},
{name:"Guinea",code:"GN",port:"Conakry",airport:"CKY",transitSea:22,transitAir:8,risk:"high",payRisk:"high",logistics:"low",language:"FR",specialCert:"ECTN",recommended:"FOB,CFR",notRecommended:"DDP",notes:"ECTN pflicht"},
{name:"Guinea-Bissau",code:"GW",port:"Bissau",airport:"OXB",transitSea:24,transitAir:10,risk:"high",payRisk:"high",logistics:"low",language:"PT",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP",notes:"Sehr kleine Infrastruktur"},
{name:"Kamerun",code:"CM",port:"Douala",airport:"DLA",transitSea:22,transitAir:7,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR/EN",specialCert:"ECTN/BESC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"ECTN pflicht, Hub Zentralafrika"},
{name:"Kap Verde",code:"CV",port:"Praia",airport:"RAI",transitSea:18,transitAir:7,risk:"low",payRisk:"low",logistics:"medium",language:"PT",specialCert:"",recommended:"CFR,CIF",notRecommended:"",notes:"Inselstaat"},
{name:"Kenia",code:"KE",port:"Mombasa",airport:"NBO",transitSea:25,transitAir:7,risk:"low",payRisk:"low",logistics:"good",language:"EN/SW",specialCert:"PVOC",recommended:"CFR,CIF,FOB",notRecommended:"",notes:"PVOC pflicht, Hub Ostafrika"},
{name:"Komoren",code:"KM",port:"Moroni",airport:"HAH",transitSea:30,transitAir:10,risk:"high",payRisk:"high",logistics:"low",language:"FR/AR",specialCert:"",recommended:"CFR",notRecommended:"DDP",notes:"Inselstaat"},
{name:"Kongo (Rep.)",code:"CG",port:"Pointe-Noire",airport:"BZV",transitSea:25,transitAir:8,risk:"medium",payRisk:"medium",logistics:"low",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR",notRecommended:"DDP",notes:"ECTN pflicht"},
{name:"Lesotho",code:"LS",port:"Durban (transit)",airport:"MSU",transitSea:33,transitAir:10,risk:"medium",payRisk:"medium",logistics:"low",language:"EN",specialCert:"",recommended:"CPT",notRecommended:"DDP",notes:"Binnenland"},
{name:"Liberia",code:"LR",port:"Monrovia",airport:"ROB",transitSea:22,transitAir:9,risk:"high",payRisk:"high",logistics:"low",language:"EN",specialCert:"",recommended:"FOB,CFR",notRecommended:"DDP",notes:"Aufbauphase"},
{name:"Libyen",code:"LY",port:"Tripoli/Misrata",airport:"TIP",transitSea:10,transitAir:5,risk:"high",payRisk:"high",logistics:"low",language:"AR",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP",notes:"Instabil, Sanktionen prüfen!"},
{name:"Madagaskar",code:"MG",port:"Toamasina",airport:"TNR",transitSea:28,transitAir:9,risk:"medium",payRisk:"medium",logistics:"low",language:"FR/MG",specialCert:"ECTN/BSC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"BSC erforderlich"},
{name:"Malawi",code:"MW",port:"Beira/Nacala (transit)",airport:"LLW",transitSea:35,transitAir:10,risk:"medium",payRisk:"medium",logistics:"low",language:"EN",specialCert:"",recommended:"CFR,CPT",notRecommended:"DDP",notes:"Binnenland"},
{name:"Mali",code:"ML",port:"Dakar/Abidjan (transit)",airport:"BKO",transitSea:30,transitAir:9,risk:"high",payRisk:"high",logistics:"low",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR",notRecommended:"DDP",notes:"Binnenland, ECTN pflicht"},
{name:"Marokko",code:"MA",port:"Casablanca/Tanger Med",airport:"CMN",transitSea:8,transitAir:4,risk:"low",payRisk:"low",logistics:"good",language:"FR/AR",specialCert:"HC-extern",recommended:"CFR,CIF,FOB",notRecommended:"",notes:"HC extern rechtsseitig beantragen — Scan an Dachse — Original mit DPL-Fahrer",requiresHC:true,hcExternal:true},
{name:"Mauretanien",code:"MR",port:"Nouakchott",airport:"NKC",transitSea:18,transitAir:8,risk:"high",payRisk:"high",logistics:"low",language:"FR/AR",specialCert:"",recommended:"CFR",notRecommended:"DDP",notes:"Schwache Infrastruktur"},
{name:"Mauritius",code:"MU",port:"Port Louis",airport:"MRU",transitSea:28,transitAir:10,risk:"low",payRisk:"low",logistics:"good",language:"EN/FR",specialCert:"",recommended:"CFR,CIF",notRecommended:"",notes:"Inselstaat, gute Infrastruktur"},
{name:"Mosambik",code:"MZ",port:"Maputo/Beira",airport:"MPM",transitSea:28,transitAir:9,risk:"medium",payRisk:"medium",logistics:"medium",language:"PT",specialCert:"",recommended:"CFR,CIF",notRecommended:"DDP",notes:"Wachsender Markt"},
{name:"Namibia",code:"NA",port:"Walvis Bay",airport:"WDH",transitSea:25,transitAir:9,risk:"low",payRisk:"low",logistics:"medium",language:"EN",specialCert:"",recommended:"CFR,CIF",notRecommended:"",notes:"Gute Hafeninfrastruktur"},
{name:"Niger",code:"NE",port:"Cotonou/Lomé (transit)",airport:"NIM",transitSea:30,transitAir:9,risk:"high",payRisk:"high",logistics:"low",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR",notRecommended:"DDP",notes:"Binnenland, ECTN pflicht"},
{name:"Nigeria",code:"NG",port:"Lagos/Apapa/Tincan",airport:"LOS",transitSea:22,transitAir:7,risk:"medium",payRisk:"medium",logistics:"medium",language:"EN",specialCert:"SON/SONCAP",recommended:"CFR,CIF,FOB",notRecommended:"DDP",notes:"CI NIEMALS beim Fahrer mitgeben! SON/SONCAP pflicht. Form M (CBN) vor Verschiffung pflicht!",noCIWithGoods:true,inspectionRequired:true,formMRequired:true},
{name:"Ruanda",code:"RW",port:"Dar es Salaam (transit)",airport:"KGL",transitSea:35,transitAir:8,risk:"low",payRisk:"low",logistics:"medium",language:"EN/FR",specialCert:"",recommended:"CFR,CPT",notRecommended:"",notes:"Binnenland, gute Governance"},
{name:"Sambia",code:"ZM",port:"Dar es Salaam/Durban (transit)",airport:"LUN",transitSea:35,transitAir:9,risk:"medium",payRisk:"medium",logistics:"medium",language:"EN",specialCert:"",recommended:"CFR,CPT",notRecommended:"DDP",notes:"Binnenland"},
{name:"São Tomé",code:"ST",port:"São Tomé",airport:"TMS",transitSea:28,transitAir:10,risk:"medium",payRisk:"medium",logistics:"low",language:"PT",specialCert:"",recommended:"CFR",notRecommended:"DDP",notes:"Kleiner Inselstaat"},
{name:"Senegal",code:"SN",port:"Dakar",airport:"DSS",transitSea:18,transitAir:7,risk:"low",payRisk:"low",logistics:"good",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR,CIF",notRecommended:"",notes:"ECTN pflicht, Hub Westafrika"},
{name:"Seychellen",code:"SC",port:"Victoria",airport:"SEZ",transitSea:30,transitAir:10,risk:"low",payRisk:"low",logistics:"medium",language:"EN/FR",specialCert:"",recommended:"CIF",notRecommended:"",notes:"Inselstaat"},
{name:"Sierra Leone",code:"SL",port:"Freetown",airport:"FNA",transitSea:22,transitAir:9,risk:"high",payRisk:"high",logistics:"low",language:"EN",specialCert:"",recommended:"FOB,CFR",notRecommended:"DDP",notes:"Aufbauphase"},
{name:"Simbabwe",code:"ZW",port:"Durban/Beira (transit)",airport:"HRE",transitSea:35,transitAir:9,risk:"high",payRisk:"high",logistics:"low",language:"EN",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP",notes:"Devisenprobleme"},
{name:"Somalia",code:"SO",port:"Mogadishu",airport:"MGQ",transitSea:22,transitAir:8,risk:"high",payRisk:"high",logistics:"low",language:"SO/AR",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP,CIF",notes:"Hohes Sicherheitsrisiko"},
{name:"Südafrika",code:"ZA",port:"Durban/Cape Town",airport:"JNB",transitSea:22,transitAir:8,risk:"low",payRisk:"low",logistics:"good",language:"EN",specialCert:"",recommended:"CFR,CIF,FOB",notRecommended:"",notes:"Beste Infrastruktur"},
{name:"Sudan",code:"SD",port:"Port Sudan",airport:"KRT",transitSea:18,transitAir:7,risk:"high",payRisk:"high",logistics:"low",language:"AR",specialCert:"ACD",recommended:"FOB",notRecommended:"DDP,DAP",notes:"ACD (Advance Cargo Declaration) ab 2026 Pflicht. Sanktionslage pruefen!"},
{name:"Südsudan",code:"SS",port:"Mombasa (transit)",airport:"JUB",transitSea:40,transitAir:10,risk:"high",payRisk:"high",logistics:"low",language:"EN",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP",notes:"Jüngster Staat"},
{name:"Tansania",code:"TZ",port:"Dar es Salaam",airport:"DAR",transitSea:25,transitAir:8,risk:"medium",payRisk:"low",logistics:"medium",language:"EN/SW",specialCert:"PVOC/TBS",recommended:"CFR,CIF",notRecommended:"DDP",notes:"Hub Ostafrika, PVOC teils pflicht"},
{name:"Togo",code:"TG",port:"Lomé",airport:"LFW",transitSea:22,transitAir:8,risk:"medium",payRisk:"medium",logistics:"medium",language:"FR",specialCert:"ECTN/BESC",recommended:"CFR,CIF",notRecommended:"DDP",notes:"ECTN pflicht, Transithub"},
{name:"Tschad",code:"TD",port:"Douala (transit)",airport:"NDJ",transitSea:35,transitAir:10,risk:"high",payRisk:"high",logistics:"low",language:"FR/AR",specialCert:"ECTN/BESC",recommended:"CFR",notRecommended:"DDP",notes:"Binnenland, ECTN pflicht"},
{name:"Tunesien",code:"TN",port:"Tunis/Radès",airport:"TUN",transitSea:8,transitAir:4,risk:"low",payRisk:"low",logistics:"good",language:"FR/AR",specialCert:"HC",recommended:"CFR,CIF,FOB",notRecommended:"",notes:"Gute Infrastruktur. HC (Gesundheitszeugnis) für Lebensmittel/Tierprodukte erforderlich",requiresHC:true,hcExternal:false},
{name:"Uganda",code:"UG",port:"Mombasa (transit)",airport:"EBB",transitSea:32,transitAir:8,risk:"medium",payRisk:"medium",logistics:"medium",language:"EN",specialCert:"PVOC",recommended:"CFR,CPT",notRecommended:"DDP",notes:"Binnenland, PVOC pflicht"},
{name:"Zentralafrik. Rep.",code:"CF",port:"Douala (transit)",airport:"BGF",transitSea:38,transitAir:11,risk:"high",payRisk:"high",logistics:"low",language:"FR",specialCert:"",recommended:"FOB",notRecommended:"DDP,DAP",notes:"Instabil"},
{name:"Ägypten",code:"EG",port:"Alexandria/Port Said",airport:"CAI",transitSea:10,transitAir:5,risk:"low",payRisk:"low",logistics:"good",language:"AR",specialCert:"CargoX eBL, HC",recommended:"CFR,CIF,FOB",notRecommended:"",notes:"CargoX eBL Upload Pflicht für alle Importe seit 2024. HC (Health Certificate) für Lebensmittel/Tierprodukte",cargox:true,requiresHC:true,hcExternal:false}
];

// Helper: get country object by name

// Helper: Länderobjekt per Name
function gCountry(name) {
  return countries.find(c => c.name === name) || null;
}

// BSC/ECTN/Waiver-Pflichten je Land (1:1 aus EAP)
function checkBSCRequired(country) {
  const bscCountries = {
    'Senegal':'BSC/BESC',
    'Kamerun':'ECTN/BESC',
    'Benin':'BSC/ECTN/BESC',
    'Elfenbeinkueste':'BSC',
    'Gabun':'BESC/BIETC',
    'Guinea':'ECTN',
    'DR Kongo':'FERI',
    'Rep. Kongo':'ECTN',
    'Kongo (Rep.)':'ECTN',
    'Burkina Faso':'ECTN',
    'Togo':'ECTN/BESC',
    'Mali':'BSC/ECTN',
    'Niger':'ECTN/BESC',
    'Madagaskar':'BSC',
    'Tschad':'BESC',
    'Angola':'CNCA/ARCCLA',
    'Ghana':'SPN',
    'Sudan':'ACD'
  };
  return bscCountries[country] ? `${bscCountries[country]} erforderlich für ${country}` : null;
}

// Länder-Select befüllen (alphabetisch)
function populateCountrySelect(elId) {
  const sel = document.getElementById(elId);
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">— Land wählen —</option>' +
    [...countries].sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map(c => `<option value="${escapeAttr(c.name)}">${escapeHtml(c.name)}</option>`).join('');
  if (current) sel.value = current;
}
