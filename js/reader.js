(function () {
  "use strict";

  var META = window.STICKUP;
  var KEY = META.storageKey;
  var editionId;
  var edition;
  var page = 1;
  var thumbsBuilt = false;
  var thumbsOpen = false;
  var chromeVisible = true;
  var hideTimer = null;
  var preloadCache = {};
  var touch = { active: false, multi: false, x: 0, y: 0, t: 0, swiped: false };

  var els = {
    body: document.body,
    picture: document.getElementById("page-picture"),
    source: document.getElementById("page-webp"),
    img: document.getElementById("page-img"),
    meter: document.getElementById("page-meter"),
    btnSwitch: document.getElementById("btn-switch"),
    btnFull: document.getElementById("btn-full"),
    btnThumbs: document.getElementById("btn-thumbs"),
    btnThumbsClose: document.getElementById("btn-thumbs-close"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    hotPrev: document.getElementById("hot-prev"),
    hotNext: document.getElementById("hot-next"),
    hotToggle: document.getElementById("hot-toggle"),
    thumbs: document.getElementById("thumbs"),
    thumbsGrid: document.getElementById("thumbs-grid"),
    hint: document.getElementById("rotate-hint"),
    stage: document.getElementById("stage")
  };

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveState() {
    var s = loadState();
    s[editionId] = page;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) { /* private mode or full */ }
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function pageSrc(ed, n, ext) {
    return ed.dir + "/page-" + pad(n) + "." + ext;
  }

  function thumbSrc(ed, n) {
    return ed.dir + "/thumbs/page-" + pad(n) + ".jpg";
  }

  function altText(ed, n) {
    return "The Stick Up, " + ed.id + " page " + n;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function supportsWebp() {
    if (supportsWebp.v != null) return supportsWebp.v;
    try {
      supportsWebp.v = document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch (e) {
      supportsWebp.v = false;
    }
    return supportsWebp.v;
  }

  function go(n, opts) {
    opts = opts || {};
    n = clamp(n, 1, edition.pages);
    if (n === page && !opts.force) return;
    page = n;
    els.source.srcset = pageSrc(edition, page, "webp");
    els.img.src = pageSrc(edition, page, "jpg");
    els.img.width = edition.width;
    els.img.height = edition.height;
    els.img.alt = altText(edition, page);
    els.meter.textContent = "Page " + page + " of " + edition.pages;
    document.title = "The Stick Up — " + edition.label + ", page " + page;
    els.body.setAttribute("data-edition", editionId);

    els.btnPrev.disabled = page <= 1;
    els.hotPrev.disabled = page <= 1;
    els.btnNext.disabled = page >= edition.pages;
    els.hotNext.disabled = page >= edition.pages;

    saveState();

    if (!opts.skipUrl) {
      var url = "reader.html?edition=" + editionId + "&page=" + page;
      history.replaceState({ edition: editionId, page: page }, "", url);
    }

    if (thumbsBuilt) markCurrentThumb();
    preloadAround();
    maybeRotateHint();
  }

  function preload(n) {
    if (n < 1 || n > edition.pages) return;
    var key = editionId + "-" + n;
    if (preloadCache[key]) return;
    var img = new Image();
    img.decoding = "async";
    img.src = pageSrc(edition, n, supportsWebp() ? "webp" : "jpg");
    preloadCache[key] = img;
  }

  function preloadAround() {
    preload(page + 1);
    preload(page + 2);
    preload(page - 1);
  }

  function next() { if (page < edition.pages) go(page + 1); }
  function prev() { if (page > 1) go(page - 1); }

  function switchEdition() {
    var other = edition.other;
    var s = loadState();
    var target = Number(s[other]) || 1;
    window.location.href = "reader.html?edition=" + other + "&page=" + target;
  }

  function setChrome(on) {
    chromeVisible = on;
    els.body.classList.toggle("chrome-hidden", !on);
  }

  function toggleChrome() {
    if (thumbsOpen) {
      closeThumbs();
      return;
    }
    setChrome(!chromeVisible);
  }

  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!thumbsOpen) setChrome(false);
    }, 3500);
  }

  function pokeChrome() {
    setChrome(true);
    scheduleHide();
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    var root = document.documentElement;
    if (isFullscreen()) {
      var leave = document.exitFullscreen || document.webkitExitFullscreen;
      if (leave) leave.call(document);
    } else {
      var enter = root.requestFullscreen || root.webkitRequestFullscreen;
      if (enter) enter.call(root);
    }
  }

  function syncFullscreenLabel() {
    var on = isFullscreen();
    els.btnFull.setAttribute("aria-label", on ? "Exit fullscreen" : "Enter fullscreen");
  }

  function buildThumbs() {
    els.thumbsGrid.innerHTML = "";
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= edition.pages; i++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.page = String(i);
      btn.setAttribute("aria-label", "Go to page " + i);
      var img = document.createElement("img");
      img.src = thumbSrc(edition, i);
      img.alt = altText(edition, i);
      img.loading = "lazy";
      img.width = edition.id === "landscape" ? 320 : 200;
      img.height = edition.id === "landscape" ? 134 : 310;
      var num = document.createElement("span");
      num.className = "num";
      num.textContent = String(i);
      btn.appendChild(img);
      btn.appendChild(num);
      frag.appendChild(btn);
    }
    els.thumbsGrid.appendChild(frag);
    thumbsBuilt = true;
    markCurrentThumb();
  }

  function markCurrentThumb() {
    var buttons = els.thumbsGrid.querySelectorAll("button");
    buttons.forEach(function (btn) {
      var current = Number(btn.dataset.page) === page;
      if (current) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    var cur = els.thumbsGrid.querySelector('button[aria-current="true"]');
    if (cur && thumbsOpen) {
      cur.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function openThumbs() {
    if (!thumbsBuilt) buildThumbs();
    thumbsOpen = true;
    els.thumbs.hidden = false;
    requestAnimationFrame(function () {
      els.thumbs.classList.add("open");
      markCurrentThumb();
    });
    els.btnThumbs.setAttribute("aria-expanded", "true");
    setChrome(true);
  }

  function closeThumbs() {
    thumbsOpen = false;
    els.thumbs.classList.remove("open");
    els.btnThumbs.setAttribute("aria-expanded", "false");
    setTimeout(function () {
      if (!thumbsOpen) els.thumbs.hidden = true;
    }, 280);
  }

  function toggleThumbs() {
    if (thumbsOpen) closeThumbs();
    else openThumbs();
  }

  function maybeRotateHint() {
    var narrowPortrait =
      editionId === "landscape" &&
      window.matchMedia("(orientation: portrait) and (max-width: 700px)").matches;
    if (narrowPortrait) {
      els.hint.hidden = false;
      requestAnimationFrame(function () {
        els.hint.classList.add("visible");
      });
      setTimeout(function () {
        els.hint.classList.remove("visible");
      }, 4200);
    } else {
      els.hint.classList.remove("visible");
      els.hint.hidden = true;
    }
  }

  /* Pointer / swipe: ignore multi-touch so pinch-zoom stays native. */
  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (touch.active) {
      touch.multi = true;
      return;
    }
    touch.active = true;
    touch.multi = false;
    touch.x = e.clientX;
    touch.y = e.clientY;
    touch.t = Date.now();
  }

  function onPointerUp(e) {
    if (!touch.active) return;
    var dx = e.clientX - touch.x;
    var dy = e.clientY - touch.y;
    var dt = Date.now() - touch.t;
    var wasMulti = touch.multi;
    touch.active = false;
    touch.multi = false;
    if (wasMulti) return;
    if (dt > 700) return;
    if (Math.abs(dx) < 48) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.4) return;
    touch.swiped = true;
    if (dx < 0) next();
    else prev();
  }

  function ignoreClickIfSwiped(e) {
    if (!touch.swiped) return;
    e.preventDefault();
    e.stopPropagation();
    touch.swiped = false;
  }

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
      case "Backspace":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        go(1);
        break;
      case "End":
        e.preventDefault();
        go(edition.pages);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "t":
      case "T":
        toggleThumbs();
        break;
      case "Escape":
        if (thumbsOpen) closeThumbs();
        else if (isFullscreen()) toggleFullscreen();
        else setChrome(true);
        break;
      default:
        break;
    }
  }

  function init() {
    var q = params();
    var requested = (q.get("edition") || "portrait").toLowerCase();
    if (!META.editions[requested]) requested = "portrait";
    editionId = requested;
    edition = META.editions[editionId];

    var stayChrome = q.get("chrome") === "1";
    if (stayChrome) {
      scheduleHide = function () {};
    }

    var requestedPage = Number(q.get("page"));
    if (!requestedPage) requestedPage = Number(loadState()[editionId]) || 1;
    requestedPage = clamp(requestedPage, 1, edition.pages);

    els.btnSwitch.textContent = META.editions[edition.other].label;
    els.btnSwitch.setAttribute(
      "aria-label",
      "Switch to the " + META.editions[edition.other].label + " edition"
    );

    go(requestedPage, { force: true, skipUrl: false });

    els.btnPrev.addEventListener("click", prev);
    els.btnNext.addEventListener("click", next);
    els.hotPrev.addEventListener("click", function (e) {
      if (touch.swiped) { ignoreClickIfSwiped(e); return; }
      prev();
    });
    els.hotNext.addEventListener("click", function (e) {
      if (touch.swiped) { ignoreClickIfSwiped(e); return; }
      next();
    });
    els.hotToggle.addEventListener("click", function (e) {
      if (touch.swiped) { ignoreClickIfSwiped(e); return; }
      toggleChrome();
    });
    els.btnSwitch.addEventListener("click", switchEdition);
    els.btnFull.addEventListener("click", toggleFullscreen);
    els.btnThumbs.addEventListener("click", toggleThumbs);
    els.btnThumbsClose.addEventListener("click", closeThumbs);
    els.thumbsGrid.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-page]");
      if (!btn) return;
      go(Number(btn.dataset.page));
      closeThumbs();
    });

    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", syncFullscreenLabel);
    document.addEventListener("webkitfullscreenchange", syncFullscreenLabel);

    els.stage.addEventListener("pointerdown", onPointerDown);
    els.stage.addEventListener("pointerup", onPointerUp);
    els.stage.addEventListener("pointercancel", function () {
      touch.active = false;
      touch.multi = false;
    });

    window.addEventListener("orientationchange", maybeRotateHint);
    window.addEventListener("resize", maybeRotateHint);

    pokeChrome();
    ["mousemove", "keydown"].forEach(function (ev) {
      document.addEventListener(ev, function () {
        if (!thumbsOpen) pokeChrome();
      }, { passive: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
