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
