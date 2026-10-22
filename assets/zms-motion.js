/* ZMS motion layer — additive enhancements. No content is changed. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, w = window;
  if (de.classList.contains("zms-js-done")) return;
  de.classList.add("zms-js-done");

  var mm = function (q) { return w.matchMedia ? w.matchMedia(q).matches : false; };
  var RM = mm("(prefers-reduced-motion: reduce)");
  var FINE = mm("(pointer: fine)") && mm("(hover: hover)");
  var WIDE = w.innerWidth >= 768;
  var RICH = !RM && FINE && WIDE;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var safe = function (fn) { try { fn(); } catch (e) { if (w.console) console.warn("[zms-motion]", e); } };
  var pseudoFree = function (el, p) { try { var c = getComputedStyle(el, p).content; return !c || c === "none" || c === "normal"; } catch (e) { return false; } };

  var header = $("header.top") || $("header.nav") || $("header");
  var hero = $("section.hero");

  /* ---------- Hamburger for collapsed header nav (only where links get hidden) ---------- */
  safe(function () {
    if (!header || !header.matches("header.top")) return;
    var nav = $("nav", header);
    if (!nav) return;
    var links = $$("a", nav).filter(function (a) { return !a.classList.contains("btn"); });
    if (!links.length) return;
    nav.classList.add("zms-menu");
    if (!nav.id) nav.id = "zms-site-nav";
    var b = d.createElement("button");
    b.type = "button";
    b.className = "zms-burger";
    b.setAttribute("aria-label", "Open menu");
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", nav.id);
    b.innerHTML = '<span aria-hidden="true"></span>';
    nav.parentNode.insertBefore(b, nav.nextSibling);
    var open = false;
    function set(v, focusBack) {
      open = v;
      de.classList.toggle("zms-menu-open", v);
      b.setAttribute("aria-expanded", v ? "true" : "false");
      b.setAttribute("aria-label", v ? "Close menu" : "Open menu");
      if (w.__zmsLenis) { v ? w.__zmsLenis.stop() : w.__zmsLenis.start(); }
      if (v) { var f = nav.querySelector("a"); if (f) f.focus(); }
      else if (focusBack) b.focus();
    }
    b.addEventListener("click", function () { set(!open, true); });
    nav.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a && open) set(false, false);
    });
    d.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") { set(false, true); return; }
      if (e.key === "Tab") {
        var items = $$("a", nav).concat([b]);
        var i = items.indexOf(d.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    w.addEventListener("resize", function () { if (open && w.innerWidth > 980) set(false, false); });
  });

  /* ---------- Progress bar + header + back to top (all screens) ---------- */
  var bar = d.createElement("div"); bar.className = "zms-progress"; bar.setAttribute("aria-hidden", "true");
  d.body.appendChild(bar);
  if (header) {
    header.classList.add("zms-hdr");
    var setPad = function () { var cs = getComputedStyle(header); if (cs.position === "sticky" || cs.position === "fixed") de.style.setProperty("--zms-hdr-h", header.offsetHeight + "px"); };
    setPad(); w.addEventListener("resize", setPad, { passive: true });
  }
  var topBtn = d.createElement("button");
  topBtn.type = "button"; topBtn.className = "zms-top"; topBtn.setAttribute("aria-label", "Back to top"); topBtn.innerHTML = "&uarr;";
  topBtn.addEventListener("click", function () {
    if (w.__zmsLenis) w.__zmsLenis.scrollTo(0); else w.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
    var t = $("main") || d.body; if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
  });
  d.body.appendChild(topBtn);
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = w.scrollY || de.scrollTop, h = de.scrollHeight - w.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
      if (header) header.classList.toggle("zms-scrolled", y > 24);
      topBtn.classList.toggle("on", y > w.innerHeight * 0.9);
      if (pxItems.length) parallax();
    });
  }

  /* ---------- Marquee of the page's own service names ---------- */
  safe(function () {
    var box = $("[data-zms-marquee]");
    if (!box) {
      if (!hero) return;
      box = d.createElement("div"); box.className = "zms-marquee"; box.setAttribute("data-zms-marquee", "");
      hero.parentNode.insertBefore(box, hero.nextSibling);
    }
    var names = [];
    var src = $$(".svc-h h3");
    if (!src.length) src = $$("#services .cards h3");
    src.forEach(function (h) {
      var c = h.cloneNode(true);
      $$(".pill,.badge", c).forEach(function (p) { p.remove(); });
      var t = (c.textContent || "").replace(/\s+/g, " ").trim();
      if (t && names.indexOf(t) < 0) names.push(t);
    });
    if (!names.length) return;
    box.setAttribute("aria-hidden", "true");
    var track = d.createElement("div"); track.className = "zms-mq-track";
    var loops = RM ? 1 : 2;
    for (var k = 0; k < loops; k++) names.forEach(function (n) { var s = d.createElement("span"); s.textContent = n; track.appendChild(s); });
    track.style.setProperty("--zms-mq-dur", Math.max(25, names.length * 3.2) + "s");
    box.appendChild(track);
  });

  /* ---------- Reveals ---------- */
  var revealSel = [
    "main section h2", ".sub", ".head", ".head__sub", ".ovs > *", ".svc", ".cards > *", ".steps > *", ".step",
    ".gal > *", ".before figure", ".shop > *", "#faq details", ".brief > *", ".callout", ".pair > *",
    ".zms-xsell", "footer", ".hero__copy > p", ".hero .lead", ".hero .kick", ".hero .cta", ".hero .chips", ".hero-art", ".hero__img"
  ].join(",");
  var h1 = hero ? $("h1", hero) : null;
  if (!RM && "IntersectionObserver" in w) {
    de.classList.add("zms-js");
    safe(function () {
      if (h1) {
        var i = 0;
        (function walk(node) {
          Array.prototype.slice.call(node.childNodes).forEach(function (n) {
            if (n.nodeType === 3) {
              var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
              parts.forEach(function (p) {
                if (!p) return;
                if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
                var s = d.createElement("span"); s.className = "zms-w"; s.style.setProperty("--i", i++); s.textContent = p; frag.appendChild(s);
              });
              n.parentNode.replaceChild(frag, n);
            } else if (n.nodeType === 1) walk(n);
          });
        })(h1);
        h1.classList.add("zms-split");
        requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add("zms-in"); }); });
      }
    });
    var els = $$(revealSel).filter(function (el) { return !el.closest(".zms-marquee") && !(h1 && el.contains(h1)); });
    var groups = new Map();
    els.forEach(function (el) {
      el.classList.add("zms-r");
      var p = el.parentNode, n = groups.get(p) || 0; groups.set(p, n + 1);
      el.style.setProperty("--zms-d", Math.min(n, 6) * 80 + "ms");
    });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("zms-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    // Failsafe: anything targeted by an in-page jump or still hidden after 6s becomes visible.
    w.addEventListener("hashchange", function () { els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < w.innerHeight * 1.5) el.classList.add("zms-in"); }); });
    setTimeout(function () { els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < w.innerHeight) el.classList.add("zms-in"); }); }, 1500);
  }

  /* ---------- Counters (pure-integer step numbers only) ---------- */
  safe(function () {
    if (RM || !("IntersectionObserver" in w)) return;
    var nums = $$(".steps b, .step__num").filter(function (el) { return /^\d{1,4}$/.test(el.textContent.trim()); });
    var io2 = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return; io2.unobserve(e.target);
        var el = e.target, txt = el.textContent.trim(), end = parseInt(txt, 10), pad = txt.length, t0 = null;
        function f(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 900), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
          el.textContent = String(v).padStart(pad, "0"); if (k < 1) requestAnimationFrame(f); else el.textContent = txt; }
        requestAnimationFrame(f);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io2.observe(n); });
  });

  /* ---------- Aurora behind the hero (static under 768px) ---------- */
  safe(function () {
    if (!hero || RM) return;
    hero.classList.add("zms-hero-host");
    var a = d.createElement("div"); a.className = "zms-aurora"; a.setAttribute("aria-hidden", "true"); a.innerHTML = "<i></i><i></i><i></i>";
    hero.insertBefore(a, hero.firstChild);
  });

  /* ---------- Desktop-only rich effects ---------- */
  var pxItems = [];
  function parallax() {
    var vh = w.innerHeight;
    pxItems.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
      img.style.setProperty("--py", (p * -18).toFixed(1) + "px");
    });
  }
  if (RICH) {
    safe(function () {
      var g = d.createElement("div"); g.className = "zms-grain"; g.setAttribute("aria-hidden", "true"); d.body.appendChild(g);
      var c = d.createElement("div"); c.className = "zms-cursor"; c.setAttribute("aria-hidden", "true"); d.body.appendChild(c);
      var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
      function loop() { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; c.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
        raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(loop) : 0; }
      w.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; c.classList.add("on"); if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
      d.addEventListener("mouseleave", function () { c.classList.remove("on"); });
    });
    safe(function () {
      $$(".svc, .ov, .cards > div, .steps > div").forEach(function (card) {
        card.classList.add("zms-tilt");
        if (getComputedStyle(card).position === "static") card.classList.add("zms-rel");
        if (pseudoFree(card, "::after")) card.classList.add("zms-spot");
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          card.classList.add("zms-hov");
          card.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
          card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 6).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 6).toFixed(2) + "deg) translateZ(0)";
        });
        card.addEventListener("pointerleave", function () { card.classList.remove("zms-hov"); card.style.transform = ""; });
      });
    });
    safe(function () {
      $$("a.btn, button.btn").forEach(function (b) {
        if (pseudoFree(b, "::before")) b.classList.add("zms-shine");
        if (b.closest("header") || b.closest("form")) return;
        b.classList.add("zms-mag");
        b.addEventListener("pointermove", function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px)";
        });
        b.addEventListener("pointerleave", function () { b.style.transform = ""; });
      });
    });
    safe(function () {
      $$(".gal img, .cards__media img, .before img").forEach(function (img) {
        var p = img.parentNode, cs = getComputedStyle(p);
        if (cs.overflow === "hidden" || cs.overflow === "clip" || cs.overflowY === "hidden") { img.classList.add("zms-px"); pxItems.push(img); }
      });
    });
    // Smooth scroll via Lenis (optional, degrades to native).
    safe(function () {
      var s = d.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js";
      s.async = true;
      s.onload = function () {
        safe(function () {
          if (!w.Lenis) return;
          var l = new w.Lenis({ lerp: 0.11, anchors: true });
          w.__zmsLenis = l; l.on("scroll", onScroll);
          (function r(t) { l.raf(t); requestAnimationFrame(r); })(performance.now());
        });
      };
      d.head.appendChild(s);
    });
  }

  w.addEventListener("scroll", onScroll, { passive: true });
  w.addEventListener("resize", onScroll, { passive: true });
  onScroll();
})();
