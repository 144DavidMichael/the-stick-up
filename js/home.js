(function () {
  "use strict";
  var KEY = (window.STICKUP && window.STICKUP.storageKey) || "the-stick-up-reader";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  var state = load();
  ["portrait", "landscape"].forEach(function (id) {
    var ed = window.STICKUP.editions[id];
    var page = Number(state[id]) || 0;
    if (page < 1 || page > ed.pages) return;
    var cta = document.querySelector('[data-cta="' + id + '"]');
    var card = document.getElementById("card-" + id);
    if (!cta || !card) return;
    if (page > 1) {
      cta.textContent = "Continue · page " + page;
      card.href = "reader.html?edition=" + id + "&page=" + page;
    }
  });
})();

(function () {
  "use strict";
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var short = Math.min(screen.width, screen.height);
  var device = coarse ? (short < 600 ? "phone" : "tablet") : "desktop";
  var pick = device === "tablet" ? "portrait" : "landscape";
  var li = document.querySelector('.device-guide li[data-device="' + device + '"]');
  if (li) li.classList.add("is-you");
  var card = document.getElementById("card-" + pick);
  if (card) {
    var badge = document.createElement("span");
    badge.className = "rec-badge";
    badge.textContent = "Best for your screen";
    var body = card.querySelector(".body");
    if (body) body.insertBefore(badge, body.firstChild);
    card.classList.add("is-recommended");
  }
})();
