(function () {
  // ===== Settings =====
  var WHATSAPP = "971507631217"; // 050 763 1217 in international format
  var COVER = { lobby: "lobby-curtain" }; // optional: which item's photo is the room tile (default: first item)

  var cats = window.CATEGORIES, prods = window.PRODUCTS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var catName = {}; cats.forEach(function (c) { catName[c.id] = c.name; });
  var state = { cat: "all", q: "", sort: "featured" };
  var fmt = function (n) { return n.toLocaleString("en-US"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var WA_ICON = '<svg class="ic fill" viewBox="0 0 24 24" aria-hidden="true"><use href="#wa"/></svg>';

  function waLink(p) {
    var msg = p
      ? "Hello! I'm interested in the \"" + p.name + "\"" + (p.price ? " (AED " + fmt(p.price) + ")" : "") + " from your furniture sale. Is it still available?"
      : "Hello! I saw your furniture sale website and I'd like to know more.";
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
  }
  ["headerWa", "heroWa", "ctaWa", "fab", "drawerWa", "footWa"].forEach(function (id) { $("#" + id).href = waLink(); });

  function priceHTML(p) {
    if (p.price == null) return '<span class="ask">Ask for price</span>';
    return '<strong><small>AED</small>' + fmt(p.price) + '</strong>' + (p.was ? '<s>AED ' + fmt(p.was) + '</s>' : '');
  }

  // ===== Top bar: solid on scroll, dismissible announcement =====
  var top = $("#top");
  function setTopH() { document.documentElement.style.setProperty("--top-h", top.offsetHeight + "px"); }
  function onScroll() {}
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", setTopH);
    onScroll(); setTopH();

  // ===== Drawer, footer nav =====
  function counts(id) { return prods.filter(function (p) { return p.category === id; }).length; }
  $("#drawerNav").innerHTML = cats.map(function (c) { return '<a href="#collection" data-cat="' + c.id + '">' + esc(c.name) + '<small>' + counts(c.id) + ' pieces</small></a>'; }).join("");
  $("#footNav").innerHTML = cats.map(function (c) { return '<a href="#collection" data-cat="' + c.id + '">' + esc(c.name) + '</a>'; }).join("");
  var drawer = $("#drawer");
  function openDrawer() { drawer.hidden = false; $("#menuBtn").setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
  function closeDrawer() { drawer.hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
  $("#menuBtn").addEventListener("click", openDrawer);
  drawer.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close-drawer")) closeDrawer(); });
  $("#mainNav").innerHTML = cats.map(function (c) { return '<a href="#collection" data-cat="' + c.id + '">' + esc(c.name) + '</a>'; }).join("");
  var priced = prods.filter(function (p) { return p.price != null; });
  var minP = Math.min.apply(null, priced.map(function (p) { return p.price; }));
  $("#stats").innerHTML = '<div><dt>Pieces</dt><dd>' + prods.length + '</dd></div><div><dt>Rooms</dt><dd>' + cats.length + '</dd></div><div><dt>Prices from</dt><dd>AED ' + minP + '</dd></div>';

  // ===== Tiles & chips =====
  $("#tiles").innerHTML = cats.map(function (c) {
    var items = prods.filter(function (p) { return p.category === c.id; });
    var pick = items.filter(function (p) { return p.id === COVER[c.id]; })[0] || items[0];
    var cover = pick.images[0];
    var from = Math.min.apply(null, items.filter(function (p) { return p.price != null; }).map(function (p) { return p.price; }));
    return '<button class="tile" data-cat="' + c.id + '"><img src="' + cover.src + '" alt="" loading="lazy" width="' + cover.w + '" height="' + cover.h + '">' +
      '<div class="tile-t"><h3>' + esc(c.name) + '</h3><span class="go"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><small>From AED ' + from + '</small></div></button>';
  }).join("");

  var chips = [{ id: "all", name: "All" }].concat(cats);
  $("#chips").innerHTML = chips.map(function (c) { return '<button class="chip" role="tab" data-cat="' + c.id + '">' + esc(c.name) + '</button>'; }).join("");

  // ===== Render =====
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -30px 0px" }) : null;

  function render() {
    var q = state.q.trim().toLowerCase();
    var html = "", total = 0;
    cats.forEach(function (c) {
      if (state.cat !== "all" && state.cat !== c.id) return;
      var items = prods.filter(function (p) { return p.category === c.id && (!q || p.name.toLowerCase().indexOf(q) > -1 || c.name.toLowerCase().indexOf(q) > -1); });
      if (!items.length) return;
      if (state.sort !== "featured") {
        items = items.slice().sort(function (a, b) {
          var x = a.price == null ? 1e9 : a.price, y = b.price == null ? 1e9 : b.price;
          return state.sort === "low" ? x - y : y - x;
        });
      }
      total += items.length;
      html += '<section class="group" id="g-' + c.id + '"><div class="group-head"><h3>' + esc(c.name) + '</h3><span>' + items.length + (items.length === 1 ? ' piece' : ' pieces') + '</span></div><div class="grid">' +
        items.map(card).join("") + '</div></section>';
    });
    $("#groups").innerHTML = html;
    $("#empty").hidden = total > 0;
    $("#count").textContent = total ? "Showing " + total + " of " + prods.length + " pieces" : "";
    document.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.cat === state.cat); });
    document.querySelectorAll(".card").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });
  }

  function isWide(im) { return (im.w / im.h) >= 1.15; }
  function pic(im, cls, alt, wide) {
    return '<img class="' + cls + '" src="' + (wide ? im.src : im.thumb) + '" width="' + im.w + '" height="' + im.h + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">';
  }
  function card(p) {
    var im = p.images[0], im2 = p.images[1], wide = isWide(im);
    return '<article class="card' + (wide ? ' wide' : '') + (p.sold ? ' sold' : '') + '">' +
      '<button class="card-img" data-id="' + p.id + '" aria-label="View ' + esc(p.name) + '">' +
      pic(im, "main", p.name, wide) + (im2 ? pic(im2, "alt", "", wide) : '') + '</button>' +
      (p.sold ? '<span class="badge">SOLD OUT</span>' : '') +
      '<div class="card-b"><div><h4>' + esc(p.name) + '</h4><div class="price">' + priceHTML(p) + '</div></div>' +
      '<a class="enq" target="_blank" rel="noopener" aria-label="Enquire about ' + esc(p.name) + ' on WhatsApp" href="' + waLink(p) + '">' + WA_ICON + '</a></div></article>';
  }

  function setCat(id, scroll) {
    state.cat = id; render();
    if (scroll) $("#collection").scrollIntoView({ behavior: "smooth" });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-cat]");
    if (t && !t.closest("#lb")) {
      e.preventDefault();
      if (drawer.hidden === false) closeDrawer();
      setCat(t.dataset.cat, !t.classList.contains("chip"));
      return;
    }
    var b = e.target.closest(".card-img");
    if (b) openLB(b.dataset.id);
  });
  $("#q").addEventListener("input", function (e) { state.q = e.target.value; render(); });
  $("#sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  $("#reset").addEventListener("click", function () { state = { cat: "all", q: "", sort: "featured" }; $("#q").value = ""; $("#sort").value = "featured"; render(); });

  // ===== Lightbox =====
  var cur = null, idx = 0, lastFocus = null, lb = $("#lb");
  function openLB(id) {
    cur = prods.filter(function (p) { return p.id === id; })[0]; idx = 0; lastFocus = document.activeElement;
    $("#lbName").textContent = cur.name;
    $("#lbCat").textContent = catName[cur.category];
    $("#lbPrice").innerHTML = cur.price == null ? '<span class="ask">Ask for price</span>' : "AED " + fmt(cur.price) + (cur.was ? "<s>AED " + fmt(cur.was) + "</s>" : "");
    $("#lbWa").href = waLink(cur);
    $("#lbSold").hidden = !cur.sold;
    $("#lbThumbs").innerHTML = cur.images.length > 1 ? cur.images.map(function (im, i) { return '<button data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + im.thumb + '" alt=""></button>'; }).join("") : "";
    show(0); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb-x").focus();
  }
  function show(i) {
    var n = cur.images.length; idx = (i + n) % n;
    var im = $("#lbImg"); im.src = cur.images[idx].src; im.alt = cur.name + (n > 1 ? " — photo " + (idx + 1) : "");
    $("#lbPrev").hidden = $("#lbNext").hidden = n < 2;
    document.querySelectorAll("#lbThumbs button").forEach(function (b, k) { b.setAttribute("aria-current", k === idx); });
  }
  function closeLB() { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  lb.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeLB();
    var t = e.target.closest("#lbThumbs button"); if (t) show(+t.dataset.i);
  });
  $("#lbPrev").onclick = function () { show(idx - 1); };
  $("#lbNext").onclick = function () { show(idx + 1); };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!lb.hidden) closeLB(); else if (!drawer.hidden) closeDrawer(); }
    if (lb.hidden) return;
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  render();
})();
