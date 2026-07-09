// ============================================================
// APP — Router, Initialisierung. Standalone Anfragen-App.
// ============================================================

// Ansicht wechseln: 'anfragen' | 'paletten' | 'container'
function go(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  const view = document.getElementById('v-' + v);
  if (view) view.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === v);
  });
  if (v === 'anfragen') renderInq(document.getElementById('inqSearch')?.value || '');
  if (v === 'paletten') initPalletView();
  if (v === 'container') { calcContainerLoad(); renderContainerViz(); runContainerRecommend(); }
  try { history.replaceState(null, '', '#' + v); } catch (e) { /* file:// */ }
}

document.addEventListener('DOMContentLoaded', () => {
  // Sprache anwenden (DE/EN)
  const langSel = document.getElementById('langSelect');
  if (langSel) langSel.value = _lang;
  translatePage();

  // Rolle anwenden (Standard-Filter je Rolle)
  applyRoleUI();
  if (currentRole === 'transport') { fInq = 'transport'; }
  syncFilterTabs();

  // Startansicht aus URL-Hash
  const hash = (location.hash || '').replace('#', '');
  go(['anfragen', 'paletten', 'container'].includes(hash) ? hash : 'anfragen');

  // Container-Rechner mit Defaults initialisieren
  applyContainerPreset();

  // Service Worker (offline) — nur über http(s), nicht file://
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline-Cache optional */ });
  }
});
