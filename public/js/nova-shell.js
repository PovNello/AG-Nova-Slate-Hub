/* AG NOVA SLATE HUB — shell helper.
   1. Releases the paused panel entrance animation (see 05-animations.css: .is-ready).
   2. Fills every [data-stardate] element using the same YY.DOY format as the Kindle dashboard. */
(function () {
  var root = document.documentElement;
  var pad = function (n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; };

  var now = new Date();
  var doy = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
    Date.UTC(now.getFullYear(), 0, 1)) / 864e5) + 1;
  var stardate = pad(now.getFullYear() % 100, 2) + '.' + pad(doy, 3);

  var nodes = document.querySelectorAll('[data-stardate]');
  for (var i = 0; i < nodes.length; i++) nodes[i].textContent = stardate;

  root.classList.add('is-ready');
})();
