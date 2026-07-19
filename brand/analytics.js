/* Everlight Digital — analytics loader.
   ONE place to set the measurement ID. Every page loads this file.

   To point the site at a different GA4 property, change MEASUREMENT_ID
   below and commit — nothing else needs editing. Set back to the
   G-XXXXXXXXXX placeholder to switch analytics off entirely, which makes
   this script a no-op: no requests, no cookies. */

(function () {
  var MEASUREMENT_ID = 'G-XE9KXLMT24';

  // Not configured yet → stay dark rather than firing bad hits.
  // Match the placeholder exactly: real IDs can contain "X" (ours does).
  if (!MEASUREMENT_ID || MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

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
