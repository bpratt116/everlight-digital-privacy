/* Everlight Digital — analytics loader.
   ONE place to set the measurement ID. Every page loads this file.

   To turn analytics on: replace G-XXXXXXXXXX below with the real GA4
   Measurement ID, then commit. Until then this script does nothing —
   no requests, no cookies. */

(function () {
  var MEASUREMENT_ID = 'G-XXXXXXXXXX';

  // Placeholder still in place → stay dark rather than firing bad hits.
  if (MEASUREMENT_ID.indexOf('X') !== -1) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);
})();
