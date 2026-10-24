// Homepage phone mockups: the play button steps through that app's screenshots.
document.querySelectorAll('.phone .play').forEach(function (btn) {
  var imgs = btn.parentElement.querySelectorAll('.phone__screen > img');
  var i = 0, timer = null;
  function show(n) { imgs.forEach(function (im, k) { im.hidden = k !== n; }); }
  function stop() { clearInterval(timer); timer = null; btn.setAttribute('aria-pressed', 'false'); }
  btn.addEventListener('click', function () {
    if (timer) return stop();
    btn.setAttribute('aria-pressed', 'true');
    i = (i + 1) % imgs.length; show(i);
    timer = setInterval(function () { i = (i + 1) % imgs.length; show(i); }, 2200);
  });
});
