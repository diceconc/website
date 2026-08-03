/* ==========================================================================
   DICE CONCRETE SOLUTIONS — main.js
   Vanilla JS, no dependencies. Every feature degrades gracefully without JS.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     CONTACT CONFIG
     ------------------------------------------------------------------------ */
  var CONFIG = {
    quoteEmail: "sales@diceconcrete.com",
    contactEmail: "connect@diceconcrete.com"
  };

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------------
     1. Header shadow on scroll
     ------------------------------------------------------------------------ */
  (function header() {
    var el = $(".site-header");
    if (!el) return;
    var ticking = false;
    function update() {
      el.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------------
     2. Mobile drawer
     ------------------------------------------------------------------------ */
  (function drawer() {
    var toggle = $(".nav-toggle");
    var panel  = $("#mobile-drawer");
    if (!toggle || !panel) return;

    var closeBtn = $(".drawer__close", panel);
    var scrim    = $(".drawer__scrim", panel);
    var lastFocus = null;

    function focusables() {
      return $$('a[href], button:not([disabled]), input, select, textarea', panel)
        .filter(function (el) { return el.offsetParent !== null; });
    }

    function open() {
      lastFocus = document.activeElement;
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
      var f = focusables();
      if (f.length) f[0].focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    toggle.addEventListener("click", function () {
      panel.classList.contains("is-open") ? close() : open();
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (scrim) scrim.addEventListener("click", close);
    $$("a", panel).forEach(function (a) { a.addEventListener("click", close); });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && panel.classList.contains("is-open")) close();
    });
  })();

  /* ------------------------------------------------------------------------
     3. Carousel (scroll-snap + arrow controls)
     ------------------------------------------------------------------------ */
  $$("[data-carousel]").forEach(function (root) {
    var viewport = $("[data-carousel-viewport]", root);
    var prev = $("[data-carousel-prev]", root);
    var next = $("[data-carousel-next]", root);
    if (!viewport) return;

    function step() {
      var first = viewport.firstElementChild;
      if (!first) return viewport.clientWidth;
      var gap = parseFloat(getComputedStyle(viewport).columnGap || "0") || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function sync() {
      var max = viewport.scrollWidth - viewport.clientWidth - 2;
      if (prev) prev.disabled = viewport.scrollLeft <= 2;
      if (next) next.disabled = viewport.scrollLeft >= max;
    }
    function go(dir) {
      viewport.scrollBy({ left: dir * step(), behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    viewport.addEventListener("scroll", function () { window.requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });

  /* ------------------------------------------------------------------------
     4. Tabs
     ------------------------------------------------------------------------ */
  $$("[data-tabs]").forEach(function (root) {
    var btns = $$('[role="tab"]', root);
    if (!btns.length) return;

    function select(btn) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(b.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    }
    btns.forEach(function (btn, i) {
      btn.addEventListener("click", function () { select(btn); });
      btn.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var nextBtn = btns[(i + d + btns.length) % btns.length];
        nextBtn.focus();
        select(nextBtn);
      });
    });
    select(btns.filter(function (b) { return b.getAttribute("aria-selected") === "true"; })[0] || btns[0]);
  });

  /* ------------------------------------------------------------------------
     5. FAQ — keep one answer open at a time
     ------------------------------------------------------------------------ */
  $$("[data-faq]").forEach(function (group) {
    var items = $$("details", group);
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  });

  /* ------------------------------------------------------------------------
     6. Gallery lightbox
     ------------------------------------------------------------------------ */
  (function lightbox() {
    var triggers = $$("[data-lightbox]");
    if (!triggers.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Project photo viewer");
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close viewer">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous photo">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button>' +
      '<figure class="lightbox__figure"><img alt=""><figcaption class="lightbox__caption"></figcaption></figure>' +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next photo">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg></button>';
    document.body.appendChild(box);

    var img = $("img", box);
    var cap = $(".lightbox__caption", box);
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      var t = triggers[index];
      img.src = t.getAttribute("data-lightbox");
      img.alt = t.getAttribute("data-lightbox-alt") || "";
      cap.textContent = t.getAttribute("data-lightbox-caption") || "";
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      document.body.classList.add("is-locked");
      $(".lightbox__close", box).focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "ArrowLeft") show(index - 1);
    }

    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i); });
    });
    $(".lightbox__close", box).addEventListener("click", close);
    $(".lightbox__nav--prev", box).addEventListener("click", function () { show(index - 1); });
    $(".lightbox__nav--next", box).addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
  })();

  /* ------------------------------------------------------------------------
     7. Reveal on scroll
     ------------------------------------------------------------------------ */
  (function reveal() {
    var items = $$(".reveal");
    // Bail out entirely when we can't animate — the CSS hidden state is scoped
    // to `.reveal-on`, so doing nothing leaves everything visible.
    if (!items.length || reduceMotion || !("IntersectionObserver" in window)) return;

    document.documentElement.classList.add("reveal-on");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        window.setTimeout(function () { el.classList.add("is-in"); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });

    // Safety net: anything already within the viewport must be showing shortly
    // after load, whatever the observer did.
    window.setTimeout(function () {
      $$(".reveal:not(.is-in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) el.classList.add("is-in");
      });
    }, 2000);
  })();

  /* ------------------------------------------------------------------------
     8. Count-up numbers  (data-count-to)
     ------------------------------------------------------------------------ */
  (function counters() {
    var els = $$("[data-count-to]");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-count-to"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute("data-count-to"));
        var suffix = el.getAttribute("data-count-suffix") || "";
        var start = performance.now();
        var dur = 1100;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) window.requestAnimationFrame(tick);
        })(start);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------------
     9. Enquiry form
     ------------------------------------------------------------------------ */
  (function form() {
    var form = $("#enquiry-form");
    if (!form) return;
    var statusEl = $("#form-status");

    function setStatus(kind, message) {
      if (!statusEl) return;
      statusEl.className = "form__status is-visible form__status--" + kind;
      statusEl.textContent = message;
      statusEl.setAttribute("role", kind === "err" ? "alert" : "status");
    }

    function validate() {
      var ok = true;
      $$(".field", form).forEach(function (field) {
        var input = $("input, select, textarea", field);
        var errEl = $(".field__error", field);
        if (!input) return;
        var msg = "";
        var value = (input.value || "").trim();
        if (input.required && !value) msg = "This field is required.";
        else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) msg = "Enter a valid email address.";
        else if (input.type === "tel" && value && value.replace(/[^\d]/g, "").length < 8) msg = "Enter a valid phone number.";
        field.classList.toggle("has-error", !!msg);
        input.setAttribute("aria-invalid", msg ? "true" : "false");
        if (errEl) errEl.textContent = msg;
        if (msg && ok) { input.focus(); ok = false; }
      });
      return ok;
    }

    function payload() {
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      return data;
    }

    function openEmailDraft(data) {
      var isQuote = data.enquiry_type === "quote";
      var recipient = isQuote ? CONFIG.quoteEmail : CONFIG.contactEmail;
      var subject = isQuote
        ? "Quote request from " + (data.name || "website visitor")
        : "Website enquiry from " + (data.name || "website visitor");
      var lines = [
        isQuote ? "New quote request — Dice Concrete Solutions" : "New general enquiry — Dice Concrete Solutions",
        "",
        "Name: " + (data.name || "-"),
        "Company: " + (data.company || "-"),
        "Phone: " + (data.phone || "-"),
        "Email: " + (data.email || "-"),
        "Project location: " + (data.location || "-"),
        "Service required: " + (data.service || "-"),
        "",
        "Message:",
        data.message || "-"
      ];
      window.location.href = "mailto:" + recipient
        + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(lines.join("\n"));
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        setStatus("err", "Please check the highlighted fields and try again.");
        return;
      }
      var data = payload();
      openEmailDraft(data);
      setStatus("ok", "Your email app is opening with the enquiry ready to send.");
    });

    // clear an error as soon as the visitor starts fixing it
    $$("input, select, textarea", form).forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (!field || !field.classList.contains("has-error")) return;
        field.classList.remove("has-error");
        input.setAttribute("aria-invalid", "false");
        var errEl = $(".field__error", field);
        if (errEl) errEl.textContent = "";
      });
    });
  })();

  /* ------------------------------------------------------------------------
     10. Footer year
     ------------------------------------------------------------------------ */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
