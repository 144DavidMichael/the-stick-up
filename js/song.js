(function () {
  "use strict";
  var a = document.getElementById("song"), b = document.getElementById("btn-song");
  if (!a || !b) return;
  var K = "the-stick-up-song";
  var label = b.querySelector(".song-label");
  function ui() {
    var on = !a.paused;
    b.classList.toggle("is-playing", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    label.textContent = on ? "Pause song" : "Play song";
  }
  b.addEventListener("click", function () {
    if (a.paused) { a.play().catch(function () {}); } else { a.pause(); }
  });
  ["play", "pause", "ended"].forEach(function (e) { a.addEventListener(e, ui); });
  // Keep the song going across an edition switch (which reloads the page).
  window.addEventListener("pagehide", function () {
    try { sessionStorage.setItem(K, JSON.stringify({ t: a.currentTime, on: !a.paused })); } catch (e) {}
  });
  try {
    var st = JSON.parse(sessionStorage.getItem(K) || "null");
    sessionStorage.removeItem(K);
    if (st && st.on) {
      a.preload = "auto";
      a.addEventListener("loadedmetadata", function () { a.currentTime = st.t || 0; }, { once: true });
      a.play().catch(function () { ui(); });
    }
  } catch (e) {}
  ui();
})();
