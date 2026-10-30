/*! ZMS Store — Razorpay "Pay by card / UPI" layer (additive).
 * Finds elements with data-sku, and once Razorpay Checkout has loaded, adds a
 * "Pay by card / UPI" button next to them. If checkout.js fails to load, nothing
 * is added and the original buy link keeps working exactly as before.
 * Only the PUBLIC key id lives here. Fulfilment happens server-side after payment.
 */
(function () {
  "use strict";
  if (window.__zmsPay) return;
  window.__zmsPay = true;

  var KEY = "rzp_live_TqaUlGaFyOyw8S";
  var STORE_NAME = "ZMS Store";
  var FALLBACK_THEME = "#1d1d1f";
  var LOGO = "https://zmshub.github.io/zms/store/favicon.png";

  // sku -> [product name, amount in paise]. Prices mirror the store exactly.
  var P = {
    "midnight-manor": ["Midnight Manor Halloween Escape Room", 19900],
    "operation-raven": ["Operation Raven", 24900],
    "larkspur-case": ["The Larkspur Case", 24900],
    "game-night-pack": ["Game Night Party Pack", 9900],
    "brain-games": ["Brain Games Puzzle Pack", 9900],
    "toddler-busy-book": ["Toddler Busy Book", 19900],
    "montessori-cards": ["Montessori 3-Part Cards", 14900],
    "kids-routine-chore": ["Kids Routine & Chore Chart System", 19900],
    "colourfunn-critters": ["Colourfunn Cute Critters", 9900],
    "colourfunn-dino": ["Colourfunn Dino Pals", 9900],
    "wedding-planner": ["Wedding Budget, Guest List & Seating Planner", 24900],
    "debt-payoff": ["Debt Payoff Tracker", 14900],
    "spendwise": ["SpendWise Salary & Expense Tracker", 14900],
    "discipline-30": ["30-Day Discipline Tracker", 19900],
    "freelancer-kit": ["Freelancer Business Kit", 14900],
    "hr-resume-kit": ["HireReady Fresher Resume Kit", 9900],
    "hr-interview-kit": ["HireReady Fresher Interview Answer Kit", 9900],
    "hr-da-pack": ["HireReady Data Analyst Interview Pack", 9900],
    "hr-referral-kit": ["HireReady Referral & Cold Email Kit", 4900],
    "promptpop-insta": ["PromptPop Instagram & Reels", 9900],
    "promptpop-indian": ["PromptPop Indian Aesthetics", 9900],
    "promptpop-logos": ["PromptPop Logos, Thumbnails & Posters", 9900],
    "promptpop-bundle": ["PromptPop All 3 Bundle", 29900],
    "promptpop-product-photo": ["PromptPop Product Photo Prompts", 9900],
    "spendwise-subscription": ["SpendWise Subscription Tracker", 14900],
    "net-worth-tracker": ["SpendWise Net Worth Tracker", 14900],
    "gst-invoice": ["GST Invoice & Quotation Generator", 14900],
    "shop-bookkeeping": ["Small Shop Bookkeeping & Inventory Sheet", 19900],
    "freelancer-tracker": ["Freelancer Client, Project & Invoice Tracker", 14900],
    "job-tracker": ["Job Application Tracker", 9900],
    "study-planner": ["Study & Exam Planner System", 9900],
    "logic-grid-book": ["Logic Grid Puzzle Book", 14900],
    "nonogram-book": ["Nonogram Picture Logic Puzzles", 9900],
    "sudoku-book": ["Sudoku Brain Training Book", 9900]
  };

  function toHex(c) {
    var m = c && c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return "#" + [m[1], m[2], m[3]].map(function (n) {
      return ("0" + parseInt(n, 10).toString(16)).slice(-2);
    }).join("");
  }

  function themeFor(el) {
    var src = (el.querySelector && el.querySelector(".x-buy")) || el;
    var cs = getComputedStyle(src);
    return toHex(cs.backgroundColor) || toHex(cs.color) || FALLBACK_THEME;
  }

  function css() {
    if (document.getElementById("zms-pay-css")) return;
    var s = document.createElement("style");
    s.id = "zms-pay-css";
    s.textContent =
      ".zms-pay{-webkit-appearance:none;appearance:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;" +
      "min-height:44px;padding:0 18px;border-radius:12px;border:1.5px solid var(--zp-c,#1d1d1f);background:transparent;color:var(--zp-c,#1d1d1f);" +
      "font:inherit;font-weight:600;font-size:15px;line-height:1.2;margin:10px 0 0 10px;transition:background .15s,transform .15s;vertical-align:middle}" +
      ".zms-pay:hover{background:color-mix(in srgb,var(--zp-c,#1d1d1f) 10%,transparent)}" +
      ".zms-pay:active{transform:scale(.98)}.zms-pay:focus-visible{outline:2px solid var(--zp-c,#1d1d1f);outline-offset:2px}" +
      ".zms-pay[disabled]{opacity:.6;cursor:progress}" +
      ".x-card .zms-pay{display:flex;width:100%;margin:8px 0 0;border:1px solid var(--stroke-primary,#1d1d1f24);color:var(--text-primary,#1d1d1f);font:var(--type-body-strong,600 15px/1.3 system-ui)}" +
      ".x-card .zms-pay:hover{background:var(--stroke-secondary,#1d1d1f12)}" +
      ".zms-pay svg{width:16px;height:16px;flex:none}" +
      ".zms-pm{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;" +
      "background:rgba(10,10,12,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:zmsFade .2s ease}" +
      ".zms-pm__box{position:relative;width:100%;max-width:400px;background:#fff;color:#1d1d1f;border-radius:20px;padding:32px 26px 24px;text-align:center;" +
      "box-shadow:0 24px 70px rgba(0,0,0,.28);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;animation:zmsPop .28s cubic-bezier(.2,.9,.3,1.2)}" +
      ".zms-pm__tick{width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:#1f9d55;color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;line-height:1}" +
      ".zms-pm h2{margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-.01em}" +
      ".zms-pm p{margin:0 0 6px;font-size:15px;line-height:1.5;color:#3a3a3c}" +
      ".zms-pm__prod{font-weight:600;color:#1d1d1f}" +
      ".zms-pm__id{margin:16px 0 20px;padding:10px 12px;border-radius:12px;background:#f2f2f4;font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1d1d1f;word-break:break-all;user-select:all}" +
      ".zms-pm__small{font-size:13px!important;color:#6e6e73!important}" +
      ".zms-pm__ok{-webkit-appearance:none;appearance:none;cursor:pointer;width:100%;min-height:46px;border:0;border-radius:12px;background:#1d1d1f;color:#fff;font:600 16px/1 inherit}" +
      ".zms-pm__x{position:absolute;top:10px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#6e6e73;font-size:22px;cursor:pointer}" +
      "@keyframes zmsFade{from{opacity:0}to{opacity:1}}@keyframes zmsPop{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}" +
      "@media (prefers-reduced-motion:reduce){.zms-pm,.zms-pm__box{animation:none}}";
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function showSuccess(productName, paymentId) {
    var prev = document.activeElement;
    var wrap = el("div", "zms-pm");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "zms-pm-title");
    var box = el("div", "zms-pm__box");
    var x = el("button", "zms-pm__x", "\u00d7");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    var tick = el("div", "zms-pm__tick", "\u2713");
    tick.setAttribute("aria-hidden", "true");
    var h = el("h2", null, "Payment received \u2713");
    h.id = "zms-pm-title";
    var p1 = el("p");
    p1.appendChild(document.createTextNode("Thank you for buying "));
    p1.appendChild(el("span", "zms-pm__prod", productName));
    p1.appendChild(document.createTextNode("."));
    var p2 = el("p", null, "Your files will be emailed to you within the hour.");
    var pid = el("div", "zms-pm__id", "Payment ID: " + paymentId);
    var p3 = el("p", "zms-pm__small", "Keep this ID for your records. Check your spam folder if the email hasn't arrived.");
    var ok = el("button", "zms-pm__ok", "Done");
    ok.type = "button";
    box.appendChild(x); box.appendChild(tick); box.appendChild(h); box.appendChild(p1);
    box.appendChild(p2); box.appendChild(pid); box.appendChild(p3); box.appendChild(ok);
    wrap.appendChild(box);
    function close() {
      document.removeEventListener("keydown", onKey);
      wrap.remove();
      if (prev && prev.focus) prev.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    x.addEventListener("click", close);
    ok.addEventListener("click", close);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(wrap);
    ok.focus();
  }

  function open(sku, theme, btn) {
    var item = P[sku];
    if (!item || typeof window.Razorpay !== "function") return false;
    var opts = {
      key: KEY,
      amount: item[1],
      currency: "INR",
      name: STORE_NAME,
      description: item[0],
      image: LOGO,
      notes: { sku: sku },
      theme: { color: theme || FALLBACK_THEME },
      handler: function (resp) {
        if (btn) btn.disabled = false;
        showSuccess(item[0], (resp && resp.razorpay_payment_id) || "—");
      },
      modal: { ondismiss: function () { if (btn) btn.disabled = false; } }
    };
    try {
      var rzp = new window.Razorpay(opts);
      rzp.on("payment.failed", function () { if (btn) btn.disabled = false; });
      if (btn) btn.disabled = true;
      rzp.open();
      return true;
    } catch (e) {
      if (btn) btn.disabled = false;
      return false;
    }
  }

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>';

  function addButtons() {
    css();
    var nodes = document.querySelectorAll("[data-sku]");
    Array.prototype.forEach.call(nodes, function (host) {
      var sku = host.getAttribute("data-sku");
      if (!P[sku] || host.getAttribute("data-zms-pay") === "1") return;
      host.setAttribute("data-zms-pay", "1");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zms-pay";
      btn.setAttribute("data-zms-pay-sku", sku);
      btn.setAttribute("aria-label", "Pay by card or UPI for " + P[sku][0]);
      btn.innerHTML = ICON + "<span>Pay by card / UPI</span>";
      var isCard = host.classList.contains("x-card");
      if (host.getAttribute("data-direct") === "1") {
        var dTheme = themeFor(host);
        host.addEventListener("click", function (e) {
          if (open(sku, dTheme, null)) e.preventDefault();
        });
        return;
      }
      var theme = themeFor(host);
      if (!isCard) btn.style.setProperty("--zp-c", theme);
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!open(sku, theme, btn)) window.open(host.href, "_blank", "noopener");
      });
      if (isCard) {
        var body = host.querySelector(".x-card__body") || host;
        var buy = body.querySelector(".x-buy");
        if (buy && buy.parentNode) buy.parentNode.insertBefore(btn, buy.nextSibling);
        else body.appendChild(btn);
      } else if (host.parentNode) {
        host.parentNode.insertBefore(btn, host.nextSibling);
      }
    });
  }

  function load() {
    if (typeof window.Razorpay === "function") return addButtons();
    var s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = function () { if (typeof window.Razorpay === "function") addButtons(); };
    s.onerror = function () { /* keep original SuperProfile links only */ };
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
